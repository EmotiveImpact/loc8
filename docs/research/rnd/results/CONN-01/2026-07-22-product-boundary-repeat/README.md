# Result: CONN-01–07 product-boundary repeat

## Identification

- **Date:** 2026-07-22
- **Questions:** `CONN-01` through `CONN-07`, `SEC-03`, `SEC-06`, `X-02`
- **Baseline:** `2026-07-22-secure-relay-prototype`
- **Decision:** **PROMOTE contracts/core; REPEAT integration; HOLD pilot; STOP
  prototype/demo promotion**
- **Scope:** local product-boundary code and dependency-free tests; no service
  deployment, real credentials, customer data or pilot-readiness claim

The sprint records its experiment protocol in
[pre-registration.md](pre-registration.md). It arrived in the same uncommitted
worktree change set as the implementation, so principal review cannot
independently prove its creation order. Treat it as the reported protocol and
sequence, not commit-time-verified preregistration. The complete missing
production interfaces are in [production-contracts.md](production-contracts.md).

## What changed

A separate `services/loc8-relayd` boundary now contains:

- a relay core that cannot construct without verifier, revocation, shared replay,
  policy, audit and trustworthy-clock ports;
- exact site/opposite-role routing and finite parser-adjacent, connection, rate
  and slow-consumer byte/monotonic-age bounds, including post-await capacity
  rechecks and a maximum live-session age;
- direct-TLS/trusted-proxy admission, exact Command Origin and fixed-`wss:`
  endpoint contracts;
- allowlisted request-header logging with bearer redaction and restrictive
  Command security headers/CSP;
- a fresh-capability client controller that reacquires on every reconnect,
  stores no capability property and rejects an echoed bearer protocol;
- canonical hash-linked audit with allowlisted scalar metadata, strict chain
  metadata, atomic append, external `{head,count}` checkpoint and anchored
  backup/restore verification interfaces; and
- deterministic startup assertions for Node >=22.13 within major 22 and exact
  future-adapter `ws` 8.21.1.

There is no signer, HMAC, credential fixture in product source, database, TLS
listener, WebSocket dependency or runnable daemon. That absence is intentional:
the required production implementations do not exist yet.

`tools/mesh-bridge`, `BridgedTransport`, Command live mode and Command's
browser-local audit were not changed or integrated.

## Adversarial and configuration evidence

Command:

```text
npm --prefix services/loc8-relayd test
```

Result after principal correction: **24/24 tests passed** across six suites. The adapted prototype cases and
new product cases cover:

- missing, verifier-rejected, expired, invalid-role, revoked and replayed
  capabilities;
- replay reuse after disconnect and across two service-core processes sharing
  one atomic replay store;
- direct TLS, explicitly trusted proxy and forged forwarded-protocol rejection;
- exact Command Origin, fixed endpoint and query/plaintext endpoint rejection;
- exact site/opposite-role delivery and **0/1,000 cross-site deliveries**;
- real binary/exact-25-byte validation and configured burst limiting;
- receiver queue byte and monotonic-age shedding;
- concurrent admission capacity and live-session expiry;
- untrusted clock, replay-store partition and audit-disk failure;
- admission rollback plus service-wide disconnect/unavailable latch on audit
  failure;
- allowlisted header logging, redaction of bearer-bearing headers and no bearer
  in client state events;
- CSP/hosting headers and non-secret `loc8.v1` protocol selection;
- canonical audit encoding, atomic head conflicts, malformed chain metadata,
  mutation/middle-deletion/anchored-tail-truncation detection, and site-
  mismatched/rolled-back restore rejection;
- startup rejection for Node 22.12.0 and observed `ws` 7.5.11/8.21.0 drift.

An early sprint run failed 3/20. Two were error-code assertion mistakes. The material
failure showed an accepted connection remained in memory if its admission audit
append failed. The core now burns the one-use token, rolls admission back,
closes all sessions and latches unavailable on any audit failure. A second review
also moved durable `frame_accepted` append before any external send so a routed
frame cannot be entirely absent from the audit if the later delivery-count append
fails.

Principal review found additional gaps despite the then-green 21-case suite:
concurrent asynchronous admissions could cross a configured limit; shape-only
objects could pass the frame-length check; accepted sessions had no maximum
lifetime; queue age used rollback-prone wall time; unknown request headers were
retained; audit hashing was property-order-dependent and accepted weak metadata;
and capability strings were not checked for safe WebSocket-subprotocol encoding.
Those defects are corrected and covered by the 24-case suite. This is why the
earlier green count is retained as history, not treated as proof of completion.

## Performance and resource measurement

Command:

```text
npm --prefix services/loc8-relayd run benchmark
```

Principal audit on Node 22.22.3, dependency-free in-process core, 10,000
sequential routes:

| Measure | Result |
|---|---:|
| Delivered | 10,000 / 10,000 |
| Median route | 0.0013 ms |
| p95 route | 0.0021 ms |
| Maximum route | 0.4242 ms |
| Connections retained | 2 |
| Replay entries retained | 2 |
| Audit entries retained by bounded fixture | 128 |
| Heap used before / after | 4,895,656 / 10,242,592 bytes |
| Observed heap delta | 5,346,936 bytes |
| RSS after | 61,030,400 bytes |

All recorded local performance/state gates passed. The heap delta includes
10,000 received-frame copies retained by the test Command sink, so it is not a
steady-state server-memory claim. None of these figures are network, venue,
multi-process or capacity evidence.

Five immediate principal repeats produced p95 values from 0.0018 to 0.0025 ms
for the same 10,000-operation fixture. The table is one captured run; the range
is the more honest local baseline and is still not network or capacity evidence.

The captured numeric output and evidence hashes are in
[`measurements.json`](measurements.json) and [`manifest.json`](manifest.json).

## Existing regression

Using the main checkout dependency directory read-only through explicit
`NODE_PATH` (no link/install/mutation):

```text
Jest discovery                    27 product test files
Jest --runInBand --forceExit      27/27 suites, 274/274 tests PASS
```

The known Jest open handle remains. TypeScript checks could not resolve
`expo/tsconfig.base` or local `@types` from this worktree because TypeScript does
not use `NODE_PATH` for those config/type lookups. No `node_modules` link or
install was created on the critically constrained disk; this is an environment
limitation, not a TypeScript pass.

## Dependency and Expo 57 investigation

The exact Expo 57 reference was read before code. It states SDK 57 targets React
Native 0.86, React 19.2.3 and a minimum Node 22.13.x. The main checkout selects
Node 22.12.0 and is below that minimum; the canonical R&D worktree and principal
reruns select Node 22.22.3 and satisfy it. The repository therefore has an
environment-pinning inconsistency, not one universal current runtime.

`npm audit --omit=dev --json` reproduced **12 findings: 1 high, 11 moderate, 0
critical**. The high path is `test-exclude -> brace-expansion 1.1.15`; 1.1.16 is
available. The `uuid` 7.0.3 moderate path is `@expo/config-plugins -> xcode`.
Direct source inspection shows `xcode` 3.0.1 calls `uuid.v4()`; the cited advisory
concerns other UUID APIs, but the dependency remains in the reported vulnerable
range and is not declared fixed. Neither `ws` copy was reported by audit.

Read-only `expo install --check` found the repository behind SDK-57-compatible
patch expectations: Expo 57.0.7, `@expo/ui` 57.0.7, 21 Expo modules at their
listed 57.x patches, `@types/jest` 29.5.14 and `jest-expo` 57.0.2. It made no
changes.

Targeted remediation, in a worktree with adequate disk and the supported Node:

1. pin Node 22 >=22.13 and update Expo/Expo modules only with the SDK 57-aware
   `npx expo install --fix`; review the lock diff and rerun `expo install --check`
   plus Expo diagnostics;
2. if still present, apply a narrow `test-exclude -> brace-expansion 1.1.16`
   override and run all Jest/coverage paths;
3. prefer an Expo/config-plugins/xcode update that removes the UUID range; if no
   compatible upstream fix exists, trial a **nested** `xcode -> uuid 11.1.1`
   override only on a review branch, then compare generated native projects and
   run clean iOS prebuild/build tests before accepting it;
4. re-audit prod and full dependency sets, produce a scoped risk record for any
   residual advisory, and test Android/iOS/Command; and
5. never run `npm audit fix --force`, accept the suggested Expo 46 downgrade or
   claim the audit is clean from this investigation.

Separately, the lock contains root `ws` 7.5.11 and tool-local `ws` 8.21.0. The
future relay adapter must own a lock/image, pin exact 8.21.1, assert it at startup
and run the real adapter tests. The core suite's passing fake sockets do not
resolve runtime drift.

## CONN-01 through CONN-07 disposition

| Question | Decision from this repeat | Remaining evidence |
|---|---|---|
| CONN-01 minimum architecture | PROMOTE boundary/contracts; REPEAT product adapter | real identity, durable stores, TLS/certs, deployment and review |
| CONN-02 isolation/impersonation | PROMOTE local policy tests | reviewed verifier, authenticated payload, real multi-process load/red team |
| CONN-03 reconstructable audit | PROMOTE atomic chain/anchor/restore interfaces | durable DB, signed off-box anchor, incident reconstruction and recovery drill |
| CONN-04 independent failures | REPEAT contracts/fakes | venue IP/DNS/proxy/Command/Gateway/uplink failure injection and recovery times |
| CONN-05 login/enrolment | HOLD implementation | operator IdP choice, Gateway/device enrolment, temporary-team usability and revocation |
| CONN-06 reconnect/authority | REPEAT shared replay and fresh token seam | authoritative event store, duplicate Gateway, clock skew and partition merge |
| CONN-07 deploy/operate/restore | HOLD | fresh-machine build, monitoring, backup/restore/box-swap runbook by another operator |

## Final decision and exact pilot blockers

- **PROMOTE:** dependency-injected verifier/revocation/replay/policy/audit/clock
  ports; site/role, session-lifetime and limit logic; fixed endpoint; fresh reconnect capability;
  direct/trusted-proxy TLS contract; Origin/CSP/redaction controls; atomic audit,
  external anchor and restore-verification interfaces; the 21-test suite and
  local benchmark.
- **REPEAT:** implement a pinned `ws` adapter through real direct TLS and the
  selected proxy; connect reviewed identity and durable stores; run browser and
  Expo 57 device reconnects; add genuine multi-process load, disk/power/clock/
  partition and backup/restore drills.
- **HOLD:** all operational pilot integration and readiness claims until the
  verifier/issuer/enrolment, revocation/replay/policy DBs, durable audit and
  signed off-box anchoring, retention/DPA decisions, deployment monitoring,
  certificate lifecycle, dependency closure, external security review and
  separate payload authentication/encryption gates pass.
- **STOP:** production use of `tools/mesh-bridge`; research HMAC promotion;
  arbitrary `?bridge=` endpoint; query/persistent credentials; arbitrary trusted
  forwarded headers; bearer-header logging; silent audit truncation; unsigned
  payload priority/identity claims; and Command/Guard production integration
  before real fresh-token reconnect tests.

This is a credible product boundary, not an operational service and not pilot
readiness.
