# R&D decision log

Record research decisions here in date order. Do not rewrite old decisions when
evidence changes; add a superseding entry with links to both evidence sets.

## Decision template

```text
Decision ID:
Date:
Question IDs:
Decision: PROMOTE / REPEAT / HOLD / STOP / BLOCKED
What was decided:
Evidence/result links:
Constraints and cohorts:
Product/specification/claim changes:
Owner and next action:
Review trigger/date:
Supersedes/superseded by:
```

## Initial portfolio decisions — 2026-07-22

### RDD-001 — repository discovery is no longer the primary activity

- **Questions:** `OSS-01` through `OSS-08`, `X-04`
- **Decision:** HOLD broad discovery; continue a capped quarterly watch.
- **Reason:** 36 active/historical repositories now cover the major candidate
  approaches. Physical and product evidence has higher decision value than more
  cloning.
- **Next:** work `MESH-01`, `CONN-01`, `FLOOR-01`.

### RDD-002 — retain clones as research source, adopt code narrowly

- **Questions:** `OSS-01` through `OSS-08`
- **Decision:** PROMOTE bounded permissive/public-domain adoption spikes; STOP
  indiscriminate bulk merges.
- **Reason:** the collection mixes public domain, MIT, Apache, BSD, MPL, GPL,
  AGPL, custom, conflicting, unlicensed and non-commercial material. Architectural
  and cryptographic suitability also vary independently of licence.
- **Next:** file-level provenance for every component promoted into product.

### RDD-003 — current BitChat v2 is the primary protocol-v2 reference

- **Questions:** `SEC-01` through `SEC-10`, `OSS-01`
- **Decision:** PROMOTE component-level public-domain BitChat iOS/v2 research.
- **Constraints:** measure current Loc8 physical baseline first; do not copy GPL
  BitChat Android; do not bundle identity, crypto, routing and couriers into one
  unmeasurable rewrite.
- **Next:** threat model/identity followed by independent component bake-offs.

### RDD-004 — floor detection uses anchor + assist + topology

- **Questions:** `FLOOR-01` through `FLOOR-10`
- **Decision:** PROMOTE this as the research architecture; current manual anchor
  remains authoritative until field data passes.
- **Reason:** independent research and implementations consistently show that
  barometer, radio and motion signals complement one another and all require
  calibration/context.
- **Next:** build corpus/logger, baseline current threshold, then test HMM/Viterbi.

### RDD-005 — start building mapping with semantics, not universal SLAM

- **Questions:** `MAP-01` through `MAP-05`
- **Decision:** PROMOTE manual/imported-plan semantic graph and guided commissioning
  baseline. HOLD advanced automatic reconstruction until this baseline works.
- **Next:** model one real multi-floor building and repeat with a second installer.

### RDD-006 — fixed hardware remains gated

- **Questions:** `HW-01` through `HW-10`, `RADIO-01`
- **Decision:** HOLD full Gateway/anchor product build and custom carrier work.
- **Allowed:** interface design, small pressure-sensor/logger prototype and a
  controlled radio bench trial when mesh/customer evidence justifies it.
- **Reason:** Gateway and Loc8OS are extensively specified but zero hardware is
  proven; physical phone and commercial evidence retire more risk first.

### RDD-007 — run connected product and resilience research in parallel

- **Questions:** `CONN-01` through `CONN-09`, `MESH-01` through `MESH-05`
- **Decision:** PROMOTE connected pilot hardening as an independent P0 lane.
- **Constraint:** current `ws://` bridge, static/demo identity and browser-local
  audit do not constitute a production deployment.
- **Next:** threat model and minimum pilot boundary while physical mesh tests run.

### RDD-008 — the product thesis is a coverage-aware operational digital twin

- **Questions:** `X-03`, `MAP-*`, `FLOOR-*`, `RADIO-06`, `OPS-*`
- **Decision:** PROMOTE as the unifying research thesis, not yet an external
  performance claim.
- **Proof required:** one commissioned building, calibrated floor/zone confidence,
  live coverage graph and an operational exercise showing reduced uncertainty or
  time.

### RDD-009 — promote secure-relay controls, not the research identity system

- **Questions:** `CONN-01`, `CONN-02`, `CONN-09`, `SEC-03`, `SEC-06`
- **Decision:** PROMOTE bounded connection-authentication, site/role isolation,
  origin/TLS enforcement, replay/rate/state/parser/receiver-queue bounds, audit
  anchoring interfaces and adversarial tests into product engineering. REPEAT
  CONN-01 at integration level.
- **Evidence:** 14/14 adversarial tests; zero leakage for 1,000 cross-site frames;
  10,000/10,000 benchmark frames delivered; authentication p95 0.0043 ms and
  local loopback relay p95 0.0615 ms on Node 22.22.3.
- **Do not promote:** prototype HMAC issuer/secret, in-memory audit/replay state,
  plaintext test mode or any payload-security claim.
- **Stop:** query-string credentials, arbitrary query-selected production bridge
  endpoints, unredacted bearer-capability headers and operational exposure of the
  dumb broadcast relay.
- **Next:** complete the units in the linked
  [`promotion brief`](results/CONN-01/2026-07-22-secure-relay-prototype/promotion-brief.md),
  then obtain independent security review.

### RDD-010 — exclude research clones from the product toolchain

- **Questions:** `OSS-01` through `OSS-08`, `X-05`
- **Decision:** PROMOTE explicit Jest and TypeScript exclusions for the ignored
  `docs/research/rnd/repos/` source library.
- **Evidence:** without exclusions Jest discovered 719 suites and TypeScript
  compiled upstream Vue/Electron/Nest/Vitest files; with exclusions Jest found
  exactly 27 Loc8 test files, 274/274 tests passed, and all three Loc8 TypeScript
  checks passed.
- **Reason:** Git-ignore affects version control, not test discovery, module maps,
  compiler includes, IDE indexing or security scanners.
- **Next:** any future broad tool (lint, search index, packaging, licence/security
  scan) must consciously include or exclude the research library according to its
  purpose.

### RDD-011 — hold automatic dependency remediation; require an Expo-compatible fix

- **Questions:** `CONN-01`, `SEC-06`, product supply-chain gate
- **Decision:** HOLD production promotion on dependency hygiene. Do not run the
  offered force fix or downgrade Expo; assign targeted, SDK-57-compatible
  remediation and validation to product development.
- **Evidence:** live `npm audit --omit=dev` reported 12 advisories (1 high, 11
  moderate, 0 critical). The high path is `brace-expansion` 1.1.15 under Jest
  coverage tooling; `uuid` 7.0.3 is reached through Expo/Xcode configuration.
  The audit offered Expo 46.0.21 as part of a semver-major fix even though this
  repository mandates Expo 57.
- **Scope:** neither `ws` installation was reported by this audit. Passing relay
  tests do not make the wider workspace dependency-clean.
- **Next:** find compatible targeted upgrades/overrides, run Expo diagnostics,
  mobile/native builds and the full test/typecheck suite, then close or formally
  accept each residual advisory before an operational pilot.

### RDD-012 — promote the protocol-v2 boundary, not encryption code

- **Questions:** `SEC-01` through `SEC-07`, `MESH-06` through `MESH-10`,
  `OSS-01`
- **Decision:** PROMOTE the threat/identity/field-classification model and the
  corrected bounded non-cryptographic prototype contracts into the engineering
  specification. REPEAT the carrier, native, lossy and physical work. HOLD
  cryptographic implementation, outbox/courier/gossip product work, v2-required
  operational enablement and every security claim.
- **Evidence:** corrected dependency-free seam passes 11/11 tests. Across five
  deterministic connected 32-node cohorts, normal-traffic delivery was
  97.40625–100%; attempted sends at target degrees 8/16/31 fell
  57.38/73.47/83.38% versus that simulator's full-fanout baseline. See the
  [result](results/SEC-01/2026-07-22-protocol-v2-boundary/README.md).
- **Principal corrections:** fail closed on provider errors; reject same-epoch
  migration allowlist conflict and invalid restored state; reject topology
  rollback/conflict; and route around a recorded failed edge or fall back to
  controlled flood.
- **Upstream correction:** BitChat `733098bb633e` source implements one-time
  prekey courier sealing even though its whitepaper calls prekeys future work.
  Promote that public-domain design only as a reviewed bake-off candidate.
- **Limit:** no radio loss, native BLE, device, battery, building or independent
  cryptographic-review evidence exists.
- **Next:** select reviewed libraries; produce public logical-frame, credential,
  policy, session and prekey vectors; then fuzz/interoperate on both native
  platforms before physical density and migration tests.

### RDD-013 — promote the connected product boundary, not a runnable service

- **Questions:** `CONN-01` through `CONN-07`, `SEC-03`, `SEC-06`, `X-02`
- **Decision:** PROMOTE the corrected dependency-injected relay core/client/audit
  contracts and adversarial suite. REPEAT with real identity, durable stores,
  pinned TLS/proxy adapter and recovery. HOLD pilot integration/readiness and
  STOP production use of the demo relay or research HMAC issuer.
- **Evidence:** 24/24 tests across six suites; zero delivery across 1,000 fake
  cross-site frames; 10,000/10,000 sequential in-process routes; five local p95
  repeats from 0.0018 to 0.0025 ms. See the
  [result](results/CONN-01/2026-07-22-product-boundary-repeat/README.md).
- **Principal corrections:** post-await concurrent-capacity enforcement; real
  binary frame validation; session expiry; monotonic queue age; allowlisted
  header logging; canonical/strict audit metadata and chain verification; and
  safe WebSocket-subprotocol capability syntax.
- **Not promoted:** identity/token format, persistence, WebSocket/TLS listener,
  certificate/proxy deployment, payload authentication/encryption, Command/Guard
  integration, venue capacity or operational availability.
- **Supply chain:** `RDD-011` still applies. Main selects unsupported Node
  22.12.0 while canonical R&D selects 22.22.3; Expo 57.0.2 is behind the current
  SDK-57 patch set; the 1-high/11-moderate audit remains open.
- **Next:** execute the real-adapter/store/identity repeat and recovery drills on
  a supported pinned Node after targeted Expo-57 dependency remediation.

### RDD-014 — promote the floor corpus contract, not floor detection

- **Questions:** `FLOOR-01`, supporting `MAP-01`, `FLOOR-02`–`FLOOR-05`
- **Decision:** PROMOTE the `loc8.floor-corpus.v1` schema, platform-neutral
  recorder/validator/evaluator seam, JSONL replay and regression gates. REPEAT
  the Expo/native adapter and physical iOS/Android instrumentation pilot. HOLD
  field collection until site/participant authority plus encrypted,
  access-logged and deletion-tested storage exist. STOP treating raw pressure as
  absolute floor or floor labels as consecutive integers.
- **Evidence:** preregistration commit `8cff81a`; artifact commit `fc2f536`;
  [result](results/FLOOR-01/2026-07-22-corpus-contract/README.md). Final contract
  suite 40/40; canonical truth gap/overlap 0/0 μs; two clock syncs at 20 ms
  maximum uncertainty and 1.363636 ms/min drift; 50,008-event captured replay
  119.912/108.169 ms with identical summary hashes on Node 22.22.3 arm64.
- **Constraints:** all observations are deterministic synthetic evidence. No
  phone, building, participant, radio, background, battery or floor-accuracy
  result exists. Self-declared consent/encryption/access fields are not runtime
  proof. The existing manual floor anchor remains authoritative.
- **Product/specification changes:** use stable building/map/level/connector/
  landing IDs shared with `MAP-01`; preserve native/monotonic timing and data
  quality; require same-floor controls and held-out physical cohorts before
  estimator work or support claims.
- **Next:** execute `MAP-01` against the frozen ID seam. Implement the exact SDK
  57 adapter only as a separately tested product increment, then repeat E03 on
  supported iOS and Android under the approved protocol.

### RDD-015 — promote the semantic graph contract, not synthetic routes

- **Questions:** `MAP-01`, with bounded evidence for `MAP-02` and `MAP-03`
- **Decision:** PROMOTE `loc8.building-graph.v1`, its semantic validator,
  physical-object/directed-route-graph separation, deterministic profile router,
  immutable closure overlay, publication egress audit, product projections and
  explicit semantic-level-to-legacy-wire-code adapter. REPEAT with a
  permissioned real plan/building, measured registration/corrections, a second
  operator, product adapters and competent accessibility/fire/venue review.
  HOLD real site-sensitive map storage/deployment and all safety, regulatory,
  accessibility, route-accuracy, commissioning or pilot claims. STOP
  display-label/consecutive-integer identity, geometry-as-connectivity,
  straight-line 2D cross-floor route truth, unknown-as-accessible, automatic
  lift/escalator evacuation use and missing/zero route-cost defaults.
- **Evidence:** preregistration commit `37e9eb1`; artifact commit `d023690`;
  [result](results/MAP-01/2026-07-22-semantic-graph/README.md). Final focused
  suite 123/123 with 71/71 named invalid mutations rejected; 8/8 general and 7/7
  step-free-required synthetic spaces reach eligible exits. Four 10,000-query
  runs over 1,002 nodes completed in 3,676.832–3,706.137 ms against 5,000 ms
  with identical result SHA-256.
- **Failures corrected:** canonical arrays originally used some referenced IDs
  before owned IDs; malformed landing arrays could throw; compiled state shared
  mutable caller objects. The implementation was fixed and gates retained.
- **Constraints:** all map, route, accessibility and egress observations are
  deterministic synthetic evidence. No real plan/building, survey, geometry,
  route safety, accessibility, compliance, positioning or operational result
  exists. Existing product code remains unchanged.
- **Product/specification changes:** use stable IDs across floor truth, maps,
  incidents, zones and assembly places; keep mutable labels as display/audit
  snapshots; route only through explicit portals/connector landings; represent
  unknown accessibility explicitly; isolate the six-bit floor field at a
  reversible map-version-scoped adapter.
- **Next:** execute `SEC-05`. Product development may adopt the pure graph
  contract separately; MAP-04/MAP-10 must preregister real plan and operator
  evidence before any building/commissioning claim.
