# Loc8 R&D department

**Started:** 2026-07-22
**Branch:** `claude/recursing-montalcini-d59018`
**Owner:** Codex R&D review, designed for continuation by Claude Code

**Latest principal audit:**
[`PRINCIPAL-AUDIT-2026-07-22.md`](PRINCIPAL-AUDIT-2026-07-22.md) records the
temporary-worktree consolidation, corrections, retained commits, reproduced
evidence and open gates. Read it before continuing this branch.

## Mission

Find active and historical open-source projects that can accelerate Loc8's
software, radio mesh, venue infrastructure, indoor mapping and multi-floor
positioning. Separate reusable code from reusable ideas, respect licences, and
turn the best findings into measured experiments rather than speculative
architecture.

## Questions being answered

1. Which GitHub projects solve parts of Loc8's phone mesh, relay, discovery,
   gateway, anchor, offline communication or delay-tolerant networking problem?
2. Which are active, tested, deployable and legally reusable?
3. What should Loc8 adopt, adapt, learn from, or explicitly reject?
4. How should Loc8 detect floors and map multi-storey buildings without
   pretending phone barometers provide absolute floors?
5. Which combinations could create a defensible product edge rather than a
   collection of commodity components?
6. What experiments produce the highest information gain per pound and week?

## Method

- Search GitHub plus primary project documentation.
- Record repository URL, commit, last activity, licence, language, tests,
  architecture and relevant files.
- Clone only shortlisted candidates; inspect source and tests locally.
- Treat stars as discovery signals, never evidence of correctness.
- Prefer permissive licences for code reuse. GPL/AGPL projects may inform
  architecture, but no code is copied into proprietary Loc8 without a specific
  licensing decision.
- Validate radio, floor and battery claims through measurements. Documentation
  cannot replace the field protocol.
- Preserve refutations and dead ends so future agents do not repeat them.

## Clone policy and disk constraint

At the start of this work the volume had only about **246 MiB free**. To avoid
filling the user's disk:

- clones use `--depth 1 --filter=blob:none --single-branch` where supported;
- only the strongest candidates are retained under `repos/`;
- the broader catalogue is metadata-only;
- large binaries, histories, submodules and build artefacts are excluded;
- `repos/` and `tmp/` are intentionally gitignored.

If more disk becomes available, expand the retained clone set from the
shortlist in the final report.

## Evidence precedence

1. Inspected source and reproducible local tests.
2. Project-maintainer documentation and releases.
3. GitHub repository metadata and issue history.
4. Peer-reviewed papers and platform/vendor primary documentation.
5. Third-party summaries only as discovery leads.

## Read this package in order

1. [`PRINCIPAL-AUDIT-2026-07-22.md`](PRINCIPAL-AUDIT-2026-07-22.md) — latest
   Codex/Claude continuity, audit corrections and current evidence boundary.
2. [`catalogue.md`](catalogue.md) — all 36 cloned projects, pinned revisions,
   licences, inspected implementation value and adopt/adapt/learn/reject verdict.
3. [`floor-detection.md`](floor-detection.md) — the research synthesis and
   proposed absolute-floor/transition estimator.
4. [`building-mapping.md`](building-mapping.md) — whole-building capture,
   semantic graph, coordinate frames, commissioning and versioning.
5. [`mesh-and-resilience.md`](mesh-and-resilience.md) — current Loc8 truth,
   BitChat v2 opportunity, LoRa hardware paths and protocol-v2 gates.
6. [`innovation-opportunities.md`](innovation-opportunities.md) — defensible
   product/hardware/business synthesis and 12-month R&D sequence.
7. [`experiments.md`](experiments.md) — prioritised experiments with measurable
   pass/fail conditions.
8. [`research-program.md`](research-program.md) — autonomous workstreams,
   ownership contracts, portfolio allocation and 30/60/90-day execution.
9. [`research-questions.md`](research-questions.md) — full P0/P1/P2 question
   register and initial NOW/NEXT/LATER board.
10. [`decision-log.md`](decision-log.md) — durable PROMOTE/REPEAT/HOLD/STOP
   decisions and their evidence.
11. [`results/README.md`](results/README.md) and
    [`templates/result-template.md`](templates/result-template.md) — standard
    evidence/result structure.
12. [`repository-snapshot.tsv`](repository-snapshot.tsv) — exact clone provenance
   for automation and later refreshes.

`repos/` contains the ignored research clones. They are a source library, **not
vendored application dependencies**. Moving code into the product requires a
small reviewed change with attribution, tests and a third-party notices entry.

## Headline conclusions

### Code and ideas are different assets

The user correctly asked to retain useful MIT code even when the initial value
was described as “an interesting idea”. The code is now present locally at exact
commits. This review distinguishes:

- code Loc8 can trial directly under permissive/public-domain terms;
- code that is permissively licensed but architecturally/security unsuitable;
- GPL/AGPL/MPL/custom-licensed source that informs design but has obligations;
- repositories with no licence, from which no code may be copied; and
- data with non-commercial or separate asset terms.

No upstream source was pasted into production in this research pass. That is
intentional: a blind bulk merge would import incompatible licences, stale stacks,
custom cryptography and unrelated frameworks. The complete code has still been
retained under `repos/` so implementation can lift the exact approved pieces.

### The biggest direct mesh opportunity

Loc8's native phone mesh is based on an older BitChat-style broadcast protocol.
Current public-domain BitChat v2 contains the missing generation of capabilities:
signed identity, standard Noise sessions, topology, source routing, controlled
fanout, encrypted persistent outboxes, privacy-limited couriers and gossip
reconciliation. It is the P0 code-adoption candidate, but should enter Loc8 as a
versioned, threat-modelled protocol rather than a monolithic merge.

Principal source review also found that BitChat's pinned whitepaper is behind its
source: it calls courier prekeys future work while the same public-domain tree
implements and tests one-time prekey bundles and prekey-targeted Noise X. That is
a high-value bake-off candidate, not an automatic cryptographic approval.

### The floor-detection answer

Use **anchor + assist + topology**:

- signed absolute BLE/QR/NFC anchors at entrances and vertical landings;
- relative phone barometer plus IMU transition/mode detection;
- a fixed ambient-pressure reference at the venue gateway;
- calibrated BLE/Wi-Fi categorical floor/zone evidence with staleness and
  hysteresis;
- a building graph that permits changes only through stairs/lifts/escalators/
  ramps while allowing a low-probability unmapped path; and
- an HMM/Viterbi probability distribution, confidence/freshness and manual
  confirmation.

The commissioning walk should learn each connector's actual height distribution
instead of applying a universal 3.5 m storey constant.

### The product edge

Build a **coverage-aware operational digital twin**: combine the semantic
building/floor/egress graph with live person confidence, incident state and mesh/
gateway reachability. During commissioning, learn geometry, floor transitions,
radio fingerprints and dead zones, then recommend anchors/repeaters. During an
incident, route and search using both physical safety and communications reach.

## Complete activity log

### Workspace and preservation

- Confirmed the requested newer worktree:
  `/Users/augustusedem/Loc8/.claude/worktrees/recursing-montalcini-d59018` on
  `claude/recursing-montalcini-d59018`.
- Read the repository `AGENTS.md`: exact Expo SDK 57 documentation must be read
  before changing app code. No Expo/app code was changed in this research pass.
- Preserved the user's pre-existing `.claude/launch.json` modification and the
  existing `docs/CODEX-CLAUDE-HANDOFF.md`; neither was reverted.
- Created `docs/research/rnd/` as the durable R&D department and added an ignore
  rule for large clone/temp material.

### Resource management

- Measured about 246 MiB free at the beginning, so clones were shallow,
  blob-filtered and single-branch.
- The user freed more space during the review; the retained source library is
  approximately 1.2 GiB and remains ignored from the product Git history.
- No files were deleted or relocated while the user cleaned in the background.

### Discovery and cloning

- Searched current GitHub projects, repository activity, releases, primary
  project documentation, official platform documentation and research papers.
- Searched the exact term “Meshaholics”. No relevant GitHub project/product was
  found; an unrelated personal use of “meshaholic” was the only literal lead.
  The likely intended family is MeshCore/Meshtastic, so the active CC0
  `awesome-meshcore` ecosystem catalogue was retained.
- Screened a broader set and cloned 36 strongest active/historical candidates.
- Recorded exact origin, branch, 12-character commit and commit date in
  `repository-snapshot.tsv`.

### Existing Loc8 implementation inspection

- Read the shared floor service, maths and tracker. Confirmed manual anchors are
  authoritative, the barometer is relative within one device, slow drift is
  absorbed, and the default assumes ~0.42 hPa/3.5 m per floor.
- Read iOS and Android native mesh implementations. Confirmed the 25-byte frame,
  TTL 7, duplicate suppression, forwarding jitter, split horizon, degree TTL
  clamp, full fanout, scan/advertise roles, Android foreground service and GATT
  backpressure.
- Carried forward previously verified gaps: plaintext/unsigned BLE, insecure
  `ws://` bridge, no stable peer/last-hop identity, browser-local audit without
  a hash chain, and missing third-phone/background/range/crowd/battery proof.

### Mesh source inspection

- Read current BitChat source, tests/docs and v2 whitepaper sections covering
  identity, transports, routing, dedup/fanout, fragmentation, Noise, offline
  outbox/couriers, gossip synchronisation, quotas and wipe behaviour.
- Verified BitChat iOS is public domain/Unlicense and the current Android project
  is GPL-3.0; documented the safe cross-platform adoption boundary.
- Inspected `expo-bitchat`'s Expo native module/API scaffolding and security
  caveat; classified it as scaffolding/reference, not approved crypto.
- Inspected MeshCore packet/routing/dedup and cryptographic implementation;
  recommended routing/hardware integration but explicitly rejected its custom
  crypto as Loc8's application-security layer.
- Inspected MeshCore Open, Colorado Mesh client, Home Assistant integration,
  packet capture and the current ecosystem catalogue.
- Inspected LoRaMesher route aging, link scoring/penalties, alternate routes,
  synchronisation and slot/network management.
- Inspected Meshtastic roles, routing/rebroadcast controls, airtime/channel
  accounting, bounded persistence and store-forward as a GPL maturity benchmark.
- Inspected Reticulum architecture and its unusual current code licence;
  separated its public-domain protocol specification from the reference code.
- Inspected Columba's central/peripheral BLE lifecycle, stable identity, duplicate
  connection collapse, GATT queue/timeouts, MTU, recovery and foreground design.
- Inspected Weshnet offline replicated group/message logs and transports.

### Floor and mapping source inspection

- Inspected Bermuda's receiver calibration, RSSI history, velocity rejection,
  asymmetric smoothing, staleness and switching hysteresis.
- Inspected room-assistant as a simpler nearest-receiver/Kalman baseline.
- Inspected ESPresense adaptive percentile/IQR filtering, variance and entry/exit
  hysteresis. Flagged a potential `resizeBuffer` full-index defect for upstream
  verification and documented AGPL boundaries.
- Inspected Navigine radio-level persistence, barometer two-window gate, PDR,
  particle filtering and geometry/barrier constraints; noted phone/vertical
  handling TODOs.
- Inspected blelocpp's floor vote/likelihood updater, strongest-floor beacon
  filtering and three-sample relative-altitude standard-deviation gate.
- Inspected NavCog's device-specific RSSI calibration and barometer phone-model
  allowlist.
- Inspected BaroFloorHeight's manually marked stable before/after transition
  capture and derived the venue-height-learning opportunity; no licence prevents
  code reuse.
- Inspected iNavigate, the simple two-floor MIT demonstration and unlicensed
  neural multi-cell classifier; separated teaching ideas from production code.
- Inspected Anyplace's building/floor/POI/connection/radiomap schema and cross-
  floor routing as an old but permissive product/data-model reference.
- Inspected Find3's sensor-agnostic fingerprints and classifier ensemble as an
  inactive MIT benchmark.
- Inspected PALMS's LiDAR/monocular-depth, Certainly Empty Space, orientation and
  particle-filter pipeline for previous-visit-free plan registration.
- Inspected hdl_graph_slam floor-plane RANSAC/graph constraints and dependency
  caveat.
- Inspected the active multi-floor S-Graphs branch: z-slope transition FSM,
  floor/room/wall graph and transition keyframes.
- Inspected HOV-SG's building→floor→room→object hierarchy, vertical-density floor
  segmentation, occupancy/Voronoi graphs and stair links; flagged its MIT file
  versus academic-only README conflict.
- Inspected NUFR-M3F, SLABIM and Hilti 2026 benchmark scopes and terms. Hilti is
  CC BY-NC-SA 3.0 and therefore non-commercial.

### Primary research and standards review

- Reviewed B-Loc, Microsoft's barometer study, the Viterbi accelerometer/
  barometer/Wi-Fi paper, MagneFi and related floor-fusion evidence.
- Reviewed Apple RoomPlan `CapturedStructure` and Apple's documented support for
  multiple rooms, different floors and varying floor heights.
- Reviewed Android Wi-Fi RTT requirements and the vendor's typical 1-2 m claim.
- Reviewed Bluetooth SIG AoA/AoD direction-finding claims and installed-hardware
  requirement.
- Reviewed OpenStreetMap Simple Indoor Tagging for levels, human-facing
  `level:ref`, stairs, lifts, connectors and nonstandard labels.

### Synthesis and documentation

- Built the full licence-aware catalogue and adoption priorities.
- Designed the probabilistic floor-estimation contract and evidence hierarchy.
- Designed the raw→geometry→semantic graph→operational overlay mapping model.
- Defined phone BLE + venue IP + LoRa + courier resilience layers.
- Formulated the coverage-aware operational digital twin and capability tiers.
- Created 14 experiments with pre-defined acceptance gates and stop conditions.

### Autonomous R&D programme extension — 2026-07-22

- Re-read the Master Checklist, system truth, Loc8OS build order, connected-first
  business plan, GTM open questions, field protocol and current code stubs/gaps.
- Split the next phase into three parallel lanes: resilience proof, connected
  pilot readiness and mapping/floor differentiation.
- Defined ten owned workstreams spanning mesh, protocol security, connected
  operations, floor intelligence, mapping, hardware, coverage, human factors,
  commercial evidence and upstream watch.
- Created a 30/60/90-day execution programme with explicit exit decisions.
- Created the complete P0/P1/P2 research-question register, evidence required,
  decisions unlocked and repository value for each question.
- Established the first NOW queue: `MESH-01`, `CONN-01`, `FLOOR-01`.
- Created the durable decision log with eight initial portfolio decisions.
- Created the result directory rules and reproducible result template.
- Defined autonomous actions and the owner-approval boundary for purchases,
  external contact, operational deployment, personal data and licence/legal
  commitments.

### First executed R&D cycle: CONN-01 — 2026-07-22

- Investigated the complete current connected path: dumb relay, engine
  `BridgedTransport`, Command live bridge and browser-local bounded audit.
- Confirmed every reachable relay client can currently observe/inject any
  valid-length frame; there is no site, role, identity, TLS, rate or audit
  boundary in the demo relay.
- Read the exact Expo SDK 57 reference as required by `AGENTS.md` before code.
- Pre-registered the threat model, exclusions, security gates, performance gates
  and promotion rules before implementation.
- Built an isolated secure-relay research prototype; production behaviour and the
  field-demo bridge were not changed.
- Implemented short-lived signed capabilities, WebSocket-subprotocol credential
  transport, TLS enforcement seam, site/role routing, one-use replay rejection,
  Command origin allowlist, parser/connection/token/rate/receiver-queue/audit
  bounds and hash-linked metadata audit with external `{head,count}` anchoring
  semantics.
- Preserved four failed development runs that exposed `ws` dependency/API drift:
  the prototype resolves root `ws` 7.5.11 even though the bridge workspace
  requests/reports an 8.x release; imports, protocol collections and message
  callback signatures differ.
- Final adversarial suite passed **14/14**, including **0/1,000 cross-site frame
  leaks**, zero same-role delivery, invalid/replayed token rejection, TLS/origin
  enforcement, parser-level oversize rejection, slow-consumer shedding,
  malformed-frame drops, configured rate limits and audit tamper/deletion
  detection.
- Applied a secure-defaults review and recorded the production consequences:
  subprotocol tokens remain bearer credentials and require header redaction,
  one-use short life and memory-only storage; production Command must not accept
  an arbitrary `?bridge=` endpoint; proxy TLS trust must be explicit; Origin is
  defence in depth; production token IDs must be cryptographically random.
- Measured the final hardened build over 10,000 capability verifications: median
  0.0030 ms, p95 0.0043 ms.
- Measured 10,000 sequential loopback relays: median 0.0273 ms, p95 0.0615 ms;
  10,000/10,000 delivered and audit state bounded at 128 entries.
- Decision `RDD-009`: PROMOTE the bounded security/control interfaces and tests;
  REPEAT real product integration. Do not promote the HMAC research issuer,
  in-memory state, plaintext test mode or any payload-security claim.
- Added the result and product
  [promotion brief](results/CONN-01/2026-07-22-secure-relay-prototype/promotion-brief.md).
- Full regression initially exposed a tooling-boundary defect: Jest and root
  TypeScript traversed the ignored upstream repositories. Added explicit research
  clone exclusions to root `package.json` and `tsconfig.json`.
- Reverified Jest discovery contains 27 Loc8 test files and zero clone tests;
  **27/27 suites and 274/274 tests passed** with the existing force-exit/open-
  handle caveat. Root, Guard and Command TypeScript checks all passed.
- Decision `RDD-010`: every future tool must explicitly decide whether the
  research source library is in or out; Git-ignore alone is not isolation.
- Ran a live production dependency audit. It reported 12 advisories (1 high, 11
  moderate, 0 critical), led by `brace-expansion` 1.1.15 under Jest coverage
  tooling and `uuid` 7.0.3 through Expo/Xcode configuration. Neither `ws` version
  was reported. Decision `RDD-011`: HOLD automatic remediation because the
  offered fix includes an invalid Expo 46 downgrade; product must find and fully
  validate targeted Expo-57-compatible fixes before pilot deployment.

### Principal protocol and product-boundary audit — 2026-07-22

- Audited every file from the temporary protocol-v2 and connected-product tasks
  before consolidation; neither task's green count was accepted on trust.
- Corrected four fail-closed/migration/topology gaps and the missing failed-edge
  assertion in the protocol spike. Final standalone result remains 11/11 tests,
  with deterministic fanout evidence explicitly limited to its simulator.
- Corrected seven connected-core gaps involving concurrent admission, frame
  type validation, session expiry, monotonic queue age, log allowlisting,
  canonical/strict audit metadata and subprotocol-safe capability encoding.
  Final result is 24/24 tests across six suites.
- Added captured evidence manifests/hashes and five repeated relay timing runs;
  fake-port timings remain local regressions, not capacity evidence.
- Preserved the two reviewed commits in this canonical branch without importing
  either sprint's conflicting shared-document edits.
- Full details, adverse findings, runtime/dependency truth and Claude Code
  continuation instructions are in the
  [principal audit](PRINCIPAL-AUDIT-2026-07-22.md).

### FLOOR-01 corpus-contract result — 2026-07-22

- Preregistered `FLOOR-01 E03` in commit `8cff81a` before implementation or
  synthetic results; sealed the result in artifact commit `fc2f536`.
- Added a strict JSON Schema 2020-12 bundle plus dependency-free recorder,
  semantic/topology/privacy validator, JSONL codec, evaluator, deterministic
  fixtures, adversarial tests and replay benchmark.
- The first run exposed one incorrect expected drift assertion. The audit then
  found and fixed missing app-build/access-log fields, landing topology,
  non-pressure native-time checks, arbitrary manifest/event/payload fields,
  malformed-manifest handling and recorder lifecycle atomicity.
- Final result: 40/40 tests; canonical 129-event session with two syncs, 20 ms
  maximum uncertainty, 1.363636 ms/min drift, zero truth gap/overlap and zero
  missing pressure/motion observations. A captured 50,008-event replay ran in
  119.912 and 108.169 ms with identical SHA-256 summary fingerprints on Node
  22.22.3 arm64.
- Decision `RDD-014`: PROMOTE the contract/core only; REPEAT Expo/native and
  physical iOS/Android instrumentation; HOLD field collection; STOP pressure-as-
  absolute-floor and consecutive-integer floor assumptions.
- This is synthetic instrumentation evidence only. It proves no sensor,
  background, battery, building, estimator, accuracy or pilot claim. Read the
  [result](results/FLOOR-01/2026-07-22-corpus-contract/README.md) and
  [prototype README](prototypes/floor-corpus/README.md).

## What Claude Code should do next

1. Freeze `MAP-01`'s stable `Building/Level/Space/Connector/Landing/Zone` IDs and
   import one real site plan aligned to the floor corpus.
2. Run `SEC-05` as a reviewed-library and public-vector bake-off, including the
   BitChat prekey candidate. Do not implement local cryptographic primitives.
3. Prepare the FLOOR-01 SDK 57 adapter and physical protocol from the promoted
   contract, but do not collect until site/participant/storage/deletion authority
   exists. Device/building claims require the iOS/Android repeat.
4. Do **E01 physical three-phone relay** immediately when suitable devices and a
   radio-isolated layout are available; simulation cannot close `MESH-01`.
5. Repeat the connected boundary with real identity, durable stores, pinned
   TLS/proxy adapter and recovery drills; do not wire the demo relay into a pilot.
6. After floor data exists, implement a pure dataset-driven HMM/Viterbi baseline
   behind the current manual truth and compare it with Bermuda/Navigine/blelocpp.
7. Keep MeshCore-vs-LoRaMesher hardware work gated until physical mesh/bench
   evidence or a signed pilot need justifies it.
8. Create `THIRD_PARTY_NOTICES`/file provenance for every upstream file actually
   moved from `repos/` into shipped code.

## Guardrails for future agents

- Do not call every clone “MIT”; several are GPL, AGPL, MPL, custom, conflicting,
  unlicensed or non-commercial.
- Do not copy current BitChat Android GPL code into a closed app.
- Do not copy HOV-SG commercially until its contradictory terms are cleared.
- Do not use Hilti 2026 material for commercial training/product assets.
- Do not market BLE RSSI as metre-level positioning or raw pressure as an
  absolute floor.
- Do not replace explicit uncertainty/manual correction with an opaque model.
- Do not change app code without first reading the exact Expo SDK 57 docs.
- Do not commit `repos/`; adopt narrowly with tests and attribution.
