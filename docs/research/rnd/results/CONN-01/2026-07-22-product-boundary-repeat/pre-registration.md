# CONN-01 product-boundary repeat: pre-registration

**Date:** 2026-07-22
**Questions:** `CONN-01` through `CONN-07`, `SEC-03`, `SEC-06`, `X-02`
**State at registration:** protocol frozen before product-seam implementation or
final measurement

## Decision being unlocked

Determine whether the control interfaces promoted by the secure-relay research
prototype can form a small product-shaped `loc8-relayd` core and reconnecting
client seam without promoting its HMAC capability format, in-memory security
state, plaintext test mode or demo relay.

This repeat cannot close connected-pilot readiness. It can only decide whether
the product boundary and its deterministic local tests are credible enough to
PROMOTE for implementation behind reviewed production identity and durable
persistence adapters.

## Product boundary

- `tools/mesh-bridge` remains a plaintext, unauthenticated, local field-demo
  broadcast relay. It is not imported, extended or exposed by this repeat.
- `services/loc8-relayd` is a separate product source boundary. Its core owns
  admission, site/role policy, limits, routing decisions and metadata audit.
- The core does not issue identities, verify a particular token format, persist
  replay/revocation/audit state, terminate TLS or host Command. Those are
  dependency-injected ports that must fail construction when absent.
- The client seam receives an exact provisioned `wss:` endpoint and an
  asynchronous one-use capability provider. It never reads an endpoint or
  credential from a URL query, `EXPO_PUBLIC_*`, browser storage or a log.
- The current unsigned/plaintext 25-byte payload remains outside this boundary.
  Connection identity cannot prove a frame's claimed sender or make the payload
  confidential.

## Threat model

Protected assets are site separation, role direction, connection identity,
capability freshness/revocation, bounded availability, sensitive request
headers and a reconstructable metadata audit record.

The test adversary may present missing/invalid/expired/revoked/replayed
capabilities; forge `Origin` or forwarded TLS headers; choose another endpoint;
cross site or role boundaries; send text, malformed or oversized payloads;
flood frames/connections; stall a receiver; delete or mutate audit records;
truncate an audit tail; reuse a capability across processes; or operate during
untrusted clock, persistence, disk or partition states.

The network adapter must support either direct TLS or TLS termination at an
explicitly allowlisted proxy address. `X-Forwarded-Proto` from any other peer is
ignored. Browser `Origin` is defence in depth for Command and never identity.
`Sec-WebSocket-Protocol`, `Authorization` and `Cookie` are always redacted.

## Required production contracts

1. A reviewed asymmetric verifier returns immutable version, issuer, site,
   subject, role, issue/expiry and unpredictable token-ID claims. The core has
   no signing API.
2. Enrolment/issuance is a separate `provisiond`/identity-provider concern with
   operator login, device binding, one-use issuance, renewal, loss and removal
   workflows. No shared HMAC secret reaches clients or `relayd`.
3. Replay consumption and revocation lookup are atomic and shared by every
   process serving a site. A partition or unavailable store fails admission.
4. Site/role policy is authoritative and versioned. Routing is only
   `gateway -> command` or `command -> gateway` within one site.
5. The client capability provider is called for every initial connection and
   reconnect. The bearer value is memory-only and is not echoed as the selected
   subprotocol; only `loc8.v1` is selected.
6. Command uses a provisioned fixed endpoint/allowlist and a restrictive CSP:
   `connect-src` contains only its exact relay origin; scripts are self-hosted.
7. Direct TLS or an explicitly trusted proxy is mandatory. Certificate
   lifecycle and proxy address provenance are deployment responsibilities.
8. Durable audit uses an atomic hash-linked append repository. Both head and
   count are periodically signed/exported off-box. Activation after restore
   requires chain and external-anchor verification.
9. Audit retention is explicit per site; no relay payload/location is retained
   by default. Pruning requires a sealed/exported segment and a continuity
   record, never silent truncation.
10. All configured parser, connection, site, session, rate, replay, audit and
    slow-consumer byte/monotonic-age bounds are finite positive values.

## Failure and recovery contract

- Audit/replay/revocation/policy persistence unavailable or disk full: reject
  new admission; stop accepting frames when required audit append fails; expose
  an unavailable reason without logging secrets.
- Untrusted/rolled-back wall clock: reject admission and fresh capability use;
  retain monotonic timing for diagnostics; require operator/time-source repair.
- Identity or policy partition: fail closed, not cached-open beyond a separately
  reviewed bounded lease.
- Process loss: replay/revocation/audit correctness comes from shared durable
  adapters, not process memory.
- Backup: snapshot plus manifest, chain head/count and external anchor receipt.
- Restore: isolated verification first; reject missing, mutated, rolled-back or
  site-mismatched state; then atomically activate and issue fresh capabilities.
- Multi-site restore or multi-process operation may not share token namespaces,
  policy state or audit chains accidentally.

## Pre-registered acceptance gates

- Construction fails without every identity/persistence/policy dependency or
  with non-finite/unsafe bounds.
- Product client rejects non-`wss:`, credential-bearing and non-provisioned
  endpoints. Every reconnect obtains a distinct fresh capability.
- Missing, verifier-rejected, revoked and replayed capabilities are rejected.
- Direct TLS succeeds only on an encrypted socket. Proxy TLS succeeds only when
  both the immediate peer is allowlisted and its normalized forwarded scheme is
  `https`/`wss`.
- Wrong Command Origin is rejected. Non-browser Gateway clients are not
  authenticated by Origin.
- Zero cross-site and same-role deliveries, including 1,000 attempted
  cross-site frames and two service processes sharing replay/policy fixtures.
- Text/wrong-size/oversize frames deliver zero messages. Rate, concurrent
  connection, session age, replay, audit and receiver queue byte/monotonic-age
  bounds remain within configuration.
- Audit verification detects middle mutation/deletion and anchored tail
  truncation. Backup/restore verification rejects site or anchor rollback.
- Redaction tests prove sensitive headers and bearer values do not appear in
  structured request metadata. Security-header tests pin the CSP and related
  browser headers.
- At least 10,000 verifier/admission-or-routing operations are measured. The
  performance result is a local regression measure, never a venue latency
  claim. Heap/state counts must remain within declared bounds.
- Existing Loc8 tests/typechecks are attempted only through the known dependency
  tree without installing or mutating it; inability to run them in this
  worktree is reported, not hidden.

## Stop conditions

STOP any path that adds a signer/shared secret to product core, accepts query
credentials or arbitrary endpoints, trusts arbitrary forwarded headers, treats
Origin or frame length as identity, logs bearer headers, silently drops audit
history, uses unbounded queues/state, or integrates Command/Guard behavior before
fresh-token reconnect tests pass.

HOLD operational promotion if real issuer/enrolment, durable stores, TLS and
certificate lifecycle, backup/restore drill, external security review, payload
authentication/encryption or dependency acceptance remain absent.

## Deterministic runtime/dependency plan

- Core and contract tests use only Node built-ins and are runnable without an
  install in this disk-constrained worktree.
- Production runtime target: a pinned Node 22 patch at or above 22.13.x, matching
  Expo SDK 57's documented minimum for the shared repository toolchain.
- The future network adapter must pin one reviewed `ws` 8.x patch in its own
  lockfile/image and reject runtime drift at startup. It must not resolve the
  root Jest/jsdom `ws` 7.5.11 by hoisting accident.
- Container/image lock, dependency SBOM/hash and startup version assertions are
  required before deployment. No dependency installation or image build is part
  of this repeat.
