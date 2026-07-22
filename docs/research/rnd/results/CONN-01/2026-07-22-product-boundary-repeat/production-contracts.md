# Production contracts for `loc8-relayd`

These contracts define the missing production implementations. The dependency-
free code in `services/loc8-relayd` consumes them but does not pretend to provide
PKI, persistence, TLS termination or deployment operations.

## Identity, issuer and enrolment

### Verifier port

`verify(opaqueCapability, { nowMs })` returns immutable claims:

```text
version = 1
issuerId
siteId
subjectId
role = gateway | command
tokenId = cryptographically random and unpredictable
issuedAtMs
expiresAtMs (after issue, at most 15 minutes; target 60 seconds)
```

The production verifier must use a reviewed asymmetric standard/library, pin
issuer algorithms and key IDs, reject unknown/retired issuers and avoid network
fetches during an upgrade unless bounded and fail-closed. The relay has public
verification material only. The research HMAC syntax and secret are forbidden.

### Enrolment and issuance boundary

`loc8-provisiond` or an isolated identity service owns:

1. organisation-admin authentication and Gateway claim;
2. operator login with a stable audit subject;
3. device enrolment bound to site, role and shift;
4. proof-of-possession/device binding where supported;
5. one-use connection capability issuance after current policy/revocation
   checks;
6. removal, stolen-device and shift-end revocation;
7. issuer-key rotation, overlap and emergency retirement; and
8. recovery that never exports a shared signing secret to Command, Guard or
   `relayd`.

The UI may use QR as the enrolment ceremony, but the QR is not itself permanent
identity. Human role changes require a fresh capability. An operator identity
and a Command device identity are separate audit facts.

### Fresh-capability client port

`issueFresh({ endpoint, role })` is called once per connection attempt, including
every reconnect. It returns an opaque bearer value held only in the JavaScript
call stack/protocol list until WebSocket construction. It must not enter query
strings, URLs, `localStorage`, AsyncStorage, `EXPO_PUBLIC_*`, crash reports,
analytics, Redux/Zustand state, screenshots or logs.

The client offers `loc8.v1` plus `loc8.auth.<opaque>`. The server selects and
echoes only `loc8.v1`. Edge, proxy, server and APM configurations redact the
entire `Sec-WebSocket-Protocol` header. A same-origin secure-cookie/one-time-
ticket upgrade remains a valid alternative after an ADR and browser/device
interop test; neither mechanism makes bearer headers secret by default.

## Revocation, replay and policy

- Replay consumption is an atomic compare/create keyed by issuer + site + token
  ID, retained until expiry. Every relay process for that namespace shares it.
- Revocation checks cover issuer, organisation/site, subject/device, operator,
  shift and individual token. Unknown/unavailable state rejects admission.
- Cached policy/revocation is allowed only under a separately reviewed short
  lease with an explicit maximum stale time; the default is fail closed.
- Policy versions are durable and auditable. An accepted connection captures
  its version; policy changes can force disconnect and fresh admission.
- Route policy permits only `gateway -> command` and `command -> gateway` within
  the identical stable site ID. A connection role does not authenticate the
  sender ID or semantic type inside today's unsigned 25-byte frame.

## TLS, proxy, endpoint and browser hosting

- Direct mode trusts only the TLS state reported by the socket created by the
  service's TLS listener.
- Proxy mode trusts forwarded scheme/client facts only from an exact
  deployment-provisioned immediate proxy address/interface. Multiple or
  unnormalised `X-Forwarded-Proto` values fail. The relay port is unreachable
  except from that proxy.
- Certificate issuance, renewal, expiry alarms, key permissions and emergency
  rotation are deployment gates. A test certificate is not a lifecycle.
- Command receives one exact provisioned `wss:` URL or a signed allowlist. No
  production query parameter, environment override or user input selects it.
- Command's CSP uses `default-src 'none'`, self-hosted scripts and an exact
  `connect-src` relay origin. `frame-ancestors 'none'`, no-referrer, nosniff,
  COOP/CORP and XSS/dependency review are required defence in depth.
- `Authorization`, `Cookie`, `Proxy-Authorization` and
  `Sec-WebSocket-Protocol` are always redacted. Structured logs use allowlisted
  fields, never a blacklist alone. The core helper drops unknown headers and
  redacts the entire value of every known bearer-bearing header.

## Parser, connection, rate and queue bounds

The first deployment must set and monitor finite per-process and per-site
limits. Current core defaults are local starting points, not capacity claims:

| Bound | Initial core value | Production owner |
|---|---:|---|
| WebSocket parser payload | 25 bytes | network adapter |
| Compression | disabled | network adapter |
| Connections/process | 128 | relay + proxy |
| Connections/site/process | 64 | relay |
| Sustained frames/client | 20/s | relay/policy |
| Burst frames/client | 40 | relay/policy |
| Receiver queued bytes | 64 KiB | adapter + core |
| Oldest receiver queue item | 5 s | adapter + core |
| Maximum admitted session | 15 min, additionally capped by capability expiry | relay + identity policy |

The proxy also owns handshake/body/header/time/rate bounds. Replay, revocation,
policy, audit/spool and metrics stores need explicit byte/row/age quotas. SOS or
control priority cannot trust unsigned payload type; it is deferred until
protocol-v2 sender/message authentication.

## Durable audit, external anchor and retention

### Repository port

Per site, the audit repository provides:

- `loadHead(siteId) -> { count, head }`;
- `appendAtomic(siteId, { expectedCount, expectedHead, entry }) -> committed`;
- `exportBundle(siteId) -> versioned backup bundle`;
- transaction/disk error classification; and
- separately implemented segment seal/archive/prune operations.

Each entry includes site, sequence, trusted wall time, monotonic time, event,
allowlisted scalar metadata, previous hash and a canonical-encoding hash. Relay payloads, locations,
credentials and sensitive headers are excluded by default. Admission and frame
acceptance are appended before the external action. Any append failure latches
the core unavailable and closes sessions.

### External anchor port

`publish({ siteId, count, head, wallMs })` crosses a failure boundary: a signed
append-only cloud/object/WORM record, or a second independently administered
system. Keeping an anchor beside the database does not detect box loss or tail
rollback. Receipts are retained with the backup manifest. Alert when anchor age
or count lag breaches site policy.

### Retention

Retention is configured per site/data class and contract. Default relay audit is
metadata-only. Before expiry pruning:

1. seal a contiguous segment with start/end count and hashes;
2. export it and obtain an external anchor/receipt;
3. verify the archived copy independently;
4. append a continuity/retention event in the active chain; and
5. prune only the sealed local segment.

Legal hold blocks pruning. Retention changes are privileged and audited. No
fixed code default is represented as a completed DPA/DPIA decision.

## Backup and restore

Backups contain encrypted database snapshots, schema/runtime versions, site ID,
policy and revocation versions, audit base/head/count, latest external anchor
receipt and hashes of every component. Keys are backed up separately with role
separation.

Restore is never in-place first:

1. restore to an isolated candidate store;
2. verify manifest hashes, schema compatibility, audit chain, external site/
   head/count anchor and monotonic non-rollback;
3. verify replay/revocation/policy namespaces and issuer material;
4. reject another site's or an older anchored snapshot;
5. atomically activate while ingress remains closed;
6. revoke pre-failure one-use capabilities and issue fresh ones; and
7. record/anchor the restore before reopening.

Required drills cover disk full, torn/power-loss write, corrupt WAL/snapshot,
clock rollback, identity/policy partition, process death between replay consume
and admission, proxy loss, DNS/fixed-endpoint failure, stale anchor, box swap and
multi-process concurrent append. Recovery time and data-loss observations are
recorded; merely having a backup command does not pass `CONN-07`.

## Deterministic runtime

- Runtime image pins Node 22 at a patch >=22.13.x and exactly `ws` 8.21.1 for
  the initial adapter review.
- Adapter startup asserts both versions and rejects drift.
- The adapter has its own lockfile/image/SBOM; root hoisting is not a runtime
  strategy.
- `ws` is configured with `maxPayload: 25` and compression disabled.
- The image is rebuilt deliberately after dependency/security review, then
  exercised through real direct TLS and the selected proxy.
