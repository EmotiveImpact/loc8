# Result: minimum safe connected-relay prototype

## Identification

- **Date:** 2026-07-22
- **Question IDs:** `CONN-01`, `CONN-02`, `CONN-04`, `CONN-09`, `SEC-03`, `SEC-06`
- **Experiment:** secure relay prototype v1
- **Decision:** which relay controls, if any, are ready to promote into product
  engineering, and which security gaps remain outside this prototype?
- **Owner/reviewer:** Codex R&D; independent security review still required

## Baseline investigation

The current `tools/mesh-bridge/index.mjs` is correctly described as a deliberately
dumb field-demo relay. It:

- listens on `0.0.0.0` using plaintext WebSocket;
- accepts every client that can reach the port;
- has no device/operator authentication;
- has no role, tenant, site or shift context;
- forwards every 25-byte binary frame to every other client;
- has no rate limit, connection quota, audit trail or revocation;
- cannot distinguish Guard/gateway traffic from Command traffic; and
- carries application frames that are themselves plaintext and unsigned.

Therefore any reachable client can observe all frames and inject a valid-length
frame. A hostile client can cross site/role boundaries because those boundaries
do not exist. This is a demo property, not a defect against the file's stated
purpose, but it is disqualifying for an operational pilot.

Command's current audit is browser `localStorage`, bounded at 2,000 newest entries
and not hash-linked or externally anchored. This prototype will demonstrate an
audit-chain primitive, not solve durable storage/recovery.

## Threat model

### Protected assets

- staff/location/SOS/duress/muster/dispatch frame confidentiality;
- authenticity of Guard/gateway and Command actions;
- separation between customer sites;
- role direction: gateways upload field frames; Command sends operational frames;
- availability under malformed or excessive traffic;
- evidence that connections/frames were accepted or rejected; and
- operator confidence that “connected” means connected to the correct site.

### Adversaries and failures

- unauthenticated network client on venue LAN or exposed port;
- client holding an expired, replayed, modified or wrong-site capability;
- valid gateway trying to inject Command traffic to peers;
- valid Command client trying to observe another site;
- buggy/hostile client flooding frames or opening connections;
- malformed/non-binary/wrong-size messages;
- audit record deletion or mutation;
- reverse proxy or configuration accidentally exposing plaintext production WS;
- browser/proxy/server logs exposing a bearer capability carried in a WebSocket
  header;
- crafted Command URLs selecting an attacker-controlled bridge endpoint;
- slow receivers causing unbounded server-side send queues;
- stolen capability or device; and
- server restart, partition, clock failure or audit-storage loss.

### Explicitly outside this prototype

- end-to-end encryption/authentication of the 25-byte mesh payload;
- real operator login, SSO, device certificates or Gateway PKI;
- durable database/audit persistence, backup and restore;
- multi-Gateway event ownership/merge;
- site/shift key rotation and device revocation service;
- payload-semantic authorisation (the relay remains frame-format agnostic);
- browser/phone secure token storage;
- denial of service above the Node process/network layer; and
- production TLS certificate provisioning/rotation.

These are not optional production features. They remain separate P0/P1 gates.

## Prototype architecture

The isolated prototype will test:

1. short-lived HMAC-signed capability tokens containing version, site, subject,
   role, expiry and unique token ID;
2. token delivery in the WebSocket subprotocol list, which works with browser
   WebSocket without placing a secret in the URL; it remains a bearer credential
   that can appear in header logs and therefore requires short life, one use,
   in-memory handling and explicit edge/server redaction;
3. mandatory encrypted socket in production mode, with an explicit insecure
   switch allowed only by tests;
4. exact site partitioning;
5. directional role routing: `gateway -> command`, `command -> gateway`, never
   gateway-to-gateway or command-to-command;
6. one-time token IDs to reject replay, including after disconnect until expiry;
7. origin allowlisting for Command browser clients;
8. connection and per-client token-bucket limits;
9. parser-level maximum payload plus exact 25-byte binary-frame validation;
10. a bounded outbound queue decision that sheds a slow consumer; and
11. metadata-only hash-linked audit entries and chain verification.

HMAC capabilities are a dependency-free research mechanism, not the chosen
production identity architecture. Product engineering should replace token
issuance with Gateway/device/operator enrolment and reviewed key management.

## Pre-registered gates

These gates were written before implementation and final measurement.

### Security/function gates

- 100% rejection across automated missing, modified, expired, replayed and
  invalid-role token cases.
- Zero cross-site deliveries in at least 1,000 attempted valid-size messages.
- Zero gateway-to-gateway and command-to-command deliveries.
- Valid same-site gateway-to-command and command-to-gateway delivery succeeds.
- Wrong-size, text and malformed messages produce zero deliveries.
- A Command browser origin outside the allowlist is rejected.
- Production configuration rejects non-TLS sockets.
- Rate limiter demonstrably prevents a client exceeding its configured burst/
  sustained allowance from delivering all attempted frames.
- Audit verification passes before mutation and fails after mutation/deletion of
  a non-tail entry.
- Chain state includes an exported head plus entry count so tail truncation can
  be detected by an external anchor; the in-memory prototype does not provide
  that external anchor.

### Performance gates

- Authentication verification median below 1 ms and p95 below 2 ms on the local
  development machine over at least 10,000 tokens.
- Relay processing p95 below 2 ms per accepted frame in an in-process benchmark
  over at least 10,000 frames, excluding network scheduling.
- The prototype remains bounded by configured client, token-cache, audit and rate
  limits; parser payload and receiver queue bytes are bounded; no unbounded
  per-frame collection.

These local performance figures are regression gates, not venue latency claims.

## Promotion rules

- **PROMOTE:** site partitioning, role routing, connection authentication seam,
  rate-limit interfaces, audit-entry schema and their adversarial tests if all
  relevant gates pass.
- **REPEAT:** implementation passes locally but requires real reverse proxy,
  phone/browser reconnect and multi-process persistence tests.
- **STOP:** any design that requires secrets in query URLs, treats payload length
  as authentication, allows cross-site traffic or presents the prototype token
  signer as production PKI.
- **BLOCKED:** external cryptographic review, production identity provider,
  operational TLS/PKI and durable storage decisions require product/owner scope.

## Version manifest

| Item | Version/identifier |
|---|---|
| Loc8 branch | `claude/recursing-montalcini-d59018` |
| Baseline relay | `tools/mesh-bridge/index.mjs` as inspected 2026-07-22 |
| Node | 22.22.3 |
| `ws` used by prototype | 7.5.11 resolved from the workspace root; `tools/mesh-bridge/package.json` requests `^8.18.0` and its workspace reports 8.21.0, so dependency resolution must be reconciled before promotion |
| Expo instruction | exact SDK 57 reference read before code changes |
| Prototype | `docs/research/rnd/prototypes/secure-relay/` |

## Results

### Implementation/test history

The failed runs were retained because they exposed a genuine dependency/API
compatibility risk:

1. named `WebSocketServer` ESM import failed because the root `ws` is CommonJS;
2. the v8 `WebSocketServer` property was absent; root `ws` 7.5.11 exports
   `Server`;
3. v7 passes an array, not a `Set`, to `handleProtocols`;
4. v7 emits only message data rather than the v8 `(data, isBinary)` signature,
   initially causing all binary frames to be dropped; and
5. the compatibility implementation then passed, after which invalid-role,
   client/token bound and audit-deletion cases were added and also passed.

A final secure-defaults review then identified two resource-exhaustion gaps: the
application rejected oversized frames only after WebSocket buffering, and
outbound sends had no slow-consumer queue budget. The prototype now configures a
25-byte parser maximum, disables WebSocket compression, bounds each receiver's
queued bytes and records dropped deliveries. The review also added invalid
token-lifetime ordering and documented header-log, arbitrary-endpoint, proxy-
trust, browser-storage/XSS and cryptographically random token-ID requirements.

Final syntax and adversarial run:

```text
node --check secure-relay.mjs                       PASS
node --check secure-relay.test.mjs                  PASS
node --check benchmark.mjs                          PASS
node --test secure-relay.test.mjs                   14/14 tests PASS
```

Validated behaviours:

- missing, modified, expired, invalid-role and replayed capabilities rejected;
- Command origin allowlist enforced;
- plaintext connection rejected in production TLS mode;
- configured client and used-token bounds enforced;
- gateway frames delivered only to Command peers in the same site;
- Command frames delivered only to gateway peers in the same site;
- gateway-to-gateway and command-to-command delivery remained zero;
- **0 of 1,000** valid-size site-A frames leaked to site B;
- text and wrong-size frames delivered zero messages;
- a 26-byte frame was rejected by the WebSocket parser with close code 1009;
- a simulated slow receiver received zero frames and incremented the bounded
  delivery-drop metric instead of growing its send queue;
- a burst allowance of 2 delivered 2/10 attempts and dropped 8/10;
- a capability whose expiry did not follow its issue time was rejected;
- bounded audit verified before tampering and rejected mutated/deleted entries;
  rewriting a truncated bundle can only be detected against the previously
  exported `{head,count}` anchor, which passed as designed.

### Local performance measurement

Command:

```text
node docs/research/rnd/prototypes/secure-relay/benchmark.mjs
```

Node 22.22.3, local development machine:

| Measure | Runs | Median | p95 | Maximum | Gate |
|---|---:|---:|---:|---:|---|
| Capability verification | 10,000 | 0.0030 ms | 0.0043 ms | 1.6229 ms | PASS: median <1 ms, p95 <2 ms |
| Sequential loopback relay | 10,000 | 0.0273 ms | 0.0615 ms | 2.0796 ms | PASS: p95 <2 ms |

The relay accepted and delivered 10,000/10,000 benchmark frames with zero drops.
State remained bounded at two clients, two used token IDs and 128 retained audit
entries. The loopback measure includes local WebSocket scheduling and is not a
venue or internet latency claim.

A clean final verification repeat produced authentication p95 0.0042 ms and
relay p95 0.0647 ms with the same 10,000/10,000 delivery, zero-drop and bounded-
state result. Both hardened runs remain well inside the pre-registered gates.

### Dependency/advisory check

`npm audit --omit=dev --json` was run after hardening. It returned non-zero and
reported **12 advisories: 1 high, 11 moderate, 0 critical**. This means the
workspace is not dependency-clean and no production-readiness conclusion may be
drawn from the passing relay tests.

- The high finding is
  [`brace-expansion` CVE-2026-13149](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp):
  installed 1.1.15 under `test-exclude`/Jest coverage tooling; patched 1.1.16.
- The direct installed `uuid` is 7.0.3 and the audit reports
  [CVE-2026-41907](https://github.com/advisories/GHSA-w5hq-g745-h8pq), reached
  through Expo/Xcode configuration plugins. The advisory concerns v3/v5/v6 APIs
  with external output buffers; it is not used by this relay prototype.
- Remaining moderate entries are aggregate effects through the Expo 57 toolchain.
- Neither installed `ws` 7.5.11 nor bridge-local `ws` 8.21.0 was reported by this
  audit, but their resolution drift remains a product defect.

No automatic fix was applied. The audit's offered fix includes a semver-major
downgrade to Expo 46.0.21, which conflicts with this repository's exact Expo 57
requirement and is not an acceptable unattended remediation. Product engineering
must identify compatible targeted upgrades/overrides, rerun Expo diagnostics and
the full mobile/build suite, then explicitly accept or close every remaining
advisory before pilot deployment.

### Loc8 regression and research-library boundary

The first full Jest/TypeScript regression attempted to crawl/compile the ignored
repository clones. Git-ignore did not protect Jest's haste map or the root
TypeScript `**/*.ts` include. This produced hundreds of upstream Vitest/Nest/Vue/
Electron dependency errors, not Loc8 failures.

The product toolchain was corrected to exclude `docs/research/rnd/repos/` in:

- root `package.json` Jest `testPathIgnorePatterns` and
  `modulePathIgnorePatterns`; and
- root `tsconfig.json` `exclude`.

After that boundary fix:

```text
Jest test discovery                 27 Loc8 files; zero research-repo files
npm test -- --runInBand --forceExit 27/27 suites, 274/274 tests PASS
root TypeScript                     PASS
Guard TypeScript                    PASS
Command TypeScript                  PASS
```

Jest still requires `--forceExit` because of the previously known asynchronous
open handle; this experiment neither introduced nor resolved that issue.

### Gate result

All pre-registered local security/function and performance gates passed. This
does not close the explicitly excluded production identity, payload-security,
durability, recovery or external-review gates.

## Decision

- **State:** **PROMOTE bounded primitives; REPEAT CONN-01 at integration level**
- **Promote into product engineering:** authenticated connection seam; short-lived
  site/subject/role capability contract; reviewed browser-compatible credential
  transport with redaction/storage controls;
  exact site partition; directional role routing; one-use token/replay interface;
  Command origin and TLS enforcement; connection/token/rate/audit bounds;
  parser payload and receiver-queue bounds; metadata audit schema and
  `{head,count}` external anchoring; adversarial tests.
- **Do not promote:** the research HMAC secret/token issuer as production PKI;
  in-memory token/audit state; plaintext test mode; any claim that relay controls
  authenticate or encrypt the existing mesh payload; or `tools/mesh-bridge` as a
  production relay.
- **STOP:** query-string secrets; arbitrary query-selected bridge endpoints in a
  production build; unredacted capability headers; frame-length-as-authentication;
  and exposing the dumb broadcast relay to an operational network.
- **Repeat before pilot:** resolve actual `ws` version; integrate a fresh-token
  provider with Command/Guard reconnect; run through a real TLS reverse proxy;
  replace signer with operator/device enrolment; persist audit and replay/revocation
  state; backup/restore and clock-failure tests; multi-process/site partition
  tests; browser/React Native interoperability; dependency/advisory remediation;
  external security review.
- **Scope:** local in-process research evidence only; no production/pilot security
  claim is authorised by this result.
- **Next owner:** product security/connected-platform engineering, with R&D
  retaining adversarial and performance regression tests.
