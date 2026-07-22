# Autonomous R&D programme

**Started:** 2026-07-22
**Horizon:** 90-day execution plan with a 12-month research portfolio
**Purpose:** convert Loc8's repository collection and existing product into
evidence-backed product, protocol, hardware and business decisions.

## R&D's job now

The discovery phase is complete enough to stop collecting repositories as the
main activity. R&D now has five jobs:

1. **Prove or kill load-bearing assumptions** before the company spends around
   them.
2. **Turn permissive upstream code into bounded Loc8 experiments**, with licence,
   security, performance and maintenance evidence.
3. **Create proprietary learning assets**: field data, test fixtures, building
   graphs, calibration models and deployment knowledge.
4. **Translate results into product decisions** rather than leaving prototypes
   alive indefinitely.
5. **Maintain product truth** so sales, documentation and engineering claims
   change when the evidence changes.

The team is not rewarded for the number of papers read, repositories cloned or
features prototyped. It is rewarded for reducing uncertainty around decisions.

## The three parallel lanes

### Lane A — prove resilience

Answer whether phone BLE genuinely meshes under real device, crowd and operating
system conditions; determine whether dedicated anchors/LoRa are amplifiers or the
actual backbone; and design authenticated protocol v2.

This lane contains the current technical gate. It must begin with the physical
three-phone relay, not protocol redesign or radio purchases.

### Lane B — make the connected product deployable

Guard + Command over venue networking can create customer evidence before mesh is
ready. R&D must identify the minimum production boundary: authenticated WSS,
site isolation, operator identity, durable audit, recovery, observability,
privacy controls and honest operational limitations.

This is partly engineering research: threat models, failure injection, deployment
architecture and pilot measurements. It should run in parallel with Lane A.

### Lane C — create the mapping/floor advantage

Develop the coverage-aware operational digital twin: semantic building graph,
connector topology, confidence-native floor/zone estimation, radio coverage and
deployment recommendations. Start with a data logger and one real building, not
a universal SLAM engine.

## Portfolio allocation

Until the first three-phone and connected-security decisions are made:

| Portfolio | Share of R&D effort | Reason |
|---|---:|---|
| Mesh truth and device behaviour | 30% | Determines whether phone mesh is a moat, an assist or a dead end |
| Connected production readiness | 25% | Fastest route to a safe pilot and customer evidence |
| Floor, building and coverage intelligence | 25% | Strongest differentiating technical/product thesis |
| Gateway/anchor/LoRa | 10% | Prepare interfaces and experiments; avoid premature hardware build |
| Commercial, human-factors and standards research | 10% | Ensures technical work maps to adoption, procurement and measurable value |

After the physical mesh decision, reallocate its 30%:

- if **GO**, put 20% into protocol v2 and 10% into deployment density;
- if **LIMITED**, put 20% into anchors/LoRa backbone and 10% into phone-edge
  participation; or
- if **NO-GO**, stop phone-relay research and move 25% to fixed infrastructure
  plus 5% to graceful phone client operation.

## Programme outcomes

Within 90 days R&D should be able to answer:

1. Does a physical Loc8 packet relay through a third phone, on which OS/state
   combinations, at what latency/reliability and battery cost?
2. What connected architecture is safe enough for a bounded operational pilot,
   and what remains explicitly out of scope?
3. Can Loc8 collect a high-quality multi-sensor floor-transition corpus across
   real phones/buildings?
4. Does anchor + pressure + topology outperform the current fixed barometer
   threshold on held-out data?
5. What is the minimum semantic building model that supports floors, muster,
   assisted search, coverage and later RoomPlan/BIM imports?
6. Is MeshCore or LoRaMesher the better experimental carrier for the venue
   backbone, or should that decision remain deferred?
7. Which workflows save measurable operator time or reduce uncertainty enough
   for a buyer to pay?

Within 12 months it should produce:

- a reproducible mesh/device/background dataset;
- an externally reviewed authenticated application protocol;
- a production-shaped connected pilot architecture;
- a versioned building/connector schema and commissioning workflow;
- a cross-device, multi-building floor/zone estimator with calibrated confidence;
- a comparative BLE/LoRa coverage corpus and placement recommender baseline;
- a repeatable customer evidence pack; and
- explicit kills for approaches that did not justify their complexity.

## Workstreams and ownership contracts

Ownership means responsibility for the decision record and evidence, not a
permanent team silo.

### WS1 — Mesh truth and transport behaviour

**Decision:** phone mesh, phone-assisted mesh or infrastructure backbone?

Deliver:

- three-phone proof and raw traces;
- iOS/Android/background/battery support matrix;
- range, wall/body/crowd and density distributions;
- congestion/fanout simulation and packet-capture replay;
- transport conformance suite shared by BLE, bridge, simulator and LoRa adapter;
- documented go/limited/no-go decision.

Use from the collection:

- BitChat public-domain routing, topology and delivery mechanisms;
- Columba BLE lifecycle ideas, independently implemented where needed;
- Meshtastic congestion/airtime behaviour as a benchmark;
- MeshCore packet capture and ecosystem diagnostic tools; and
- existing Loc8 native modules and field-test protocol as the baseline.

Do not begin full BitChat-v2 integration before the legacy physical baseline is
measured. Otherwise a failed test will not reveal whether the radio lifecycle or
the new protocol caused it.

### WS2 — Protocol v2, identity and privacy

**Decision:** what application envelope can be trusted across BLE, venue IP and
untrusted LoRa carriers?

Deliver:

- threat model and protected metadata/payload inventory;
- identity, membership, site/shift key, revocation and device-loss model;
- signed announcement and replay rules;
- live and offline encryption design;
- rotating/pseudonymous radio identifiers;
- bounded fragments, queues, couriers and hostile-input limits;
- cross-platform test vectors, fuzz tests and downgrade/migration rules;
- external cryptographic review before marketing claims.

Use current public-domain BitChat v2 as the primary code/reference source. Do not
copy GPL BitChat Android or reuse MeshCore custom crypto as the Loc8 security
boundary.

### WS3 — Connected pilot readiness

**Decision:** what is the minimum safe, supportable paid deployment?

Deliver:

- authenticated WSS/relay architecture;
- operator/device authentication and role/site authorisation;
- tenant isolation tests and rate/replay limits;
- durable hash-linked server audit and signed external chain heads;
- monitoring, backup, restore, revocation and deployment runbook;
- pilot privacy/data-retention configuration;
- explicit non-emergency-system/failure boundaries;
- red-team and failure-injection result.

This work should inform product engineering immediately. The present plain
WebSocket bridge and browser-local audit are research/demo infrastructure only.

### WS4 — Floor and vertical-motion intelligence

**Decision:** can Loc8 provide trustworthy operational floor estimates, on which
devices and deployments?

Deliver:

- versioned logger and labelled corpus;
- phone capability and calibration profiles;
- stair/lift/escalator/ramp transition classifier;
- venue pressure-reference design;
- learned per-connector height distributions;
- HMM/Viterbi estimator with confidence, freshness and evidence trace;
- manual/operator correction and audit semantics;
- held-out building/device evaluation and failure taxonomy.

Use Bermuda, Navigine, blelocpp/NavCog and the S-Graphs transition model as the
principal references. Use the unlicensed barometer projects only for independently
reimplemented ideas.

### WS5 — Building mapping and commissioning

**Decision:** what minimum map creates operational value and can be commissioned
reliably by someone other than the developer?

Deliver:

- `Building/Level/Space/Boundary/Connector/Landing/Asset` schema;
- plan import and explicit coordinate-frame transforms;
- trace/review tools for rooms, exits and vertical connectors;
- guided transition and coverage walk;
- source/provenance, uncertainty, version and rollback model;
- repeat-installer usability test;
- RoomPlan/PALMS/plane extraction comparison after the manual baseline works;
- OSM indoor export/import mapping.

Anyplace provides useful old schema/routing ideas; RoomPlan and PALMS are capture
accelerators; hdl_graph_slam and multi-floor S-Graphs inform geometry/topology.

### WS6 — Gateway, anchors and long-range backbone

**Decision:** which fixed infrastructure is necessary at each venue tier?

Deliver:

- carrier-neutral gateway/anchor radio interface;
- Linux BLE `loc8-meshd` proof after phone field evidence;
- MeshCore vs LoRaMesher controlled comparison;
- signed floor/zone anchor and fixed pressure-reference prototype;
- RTC/offline-time design;
- power/battery/thermal measurements;
- gateway recovery, backup and box-swap procedure;
- multi-gateway ownership/dedup/partition model before stadium scale;
- fleet expected-heartbeat model.

Do not build a full Loc8OS appliance, custom carrier board or certified enclosure
until the bench and customer gates justify it.

### WS7 — Coverage intelligence and placement

**Decision:** can commissioning data predict where anchors/repeaters are needed
and whether critical routes remain reachable?

Deliver:

- shared RF observation schema across BLE, Wi-Fi and LoRa;
- packet success/latency/SNR/RSSI and phone-state coverage cells;
- graph edges with delivery probability and freshness;
- holdout-calibrated dead-zone prediction;
- placement recommender baseline compared with an experienced installer;
- physical + communications route scoring in Command.

This is a likely proprietary data advantage. The reusable repo value is mainly
diagnostic tooling and algorithms; the defensibility comes from Loc8's own
labelled venue corpus and operational outcomes.

### WS8 — Human factors and operational outcome

**Decision:** does Loc8 improve real work with volunteer/temporary staff under
stress?

Deliver:

- five-minute/no-account onboarding study;
- alert comprehension, acknowledgement and correction tests;
- screen-off/noisy/gloved/low-light accessibility matrix;
- muster truth protocol: who counts as expected, present, exempt or unknown;
- assisted-search workflow and confidence-language test;
- incident exercise measures: acknowledgement time, muster completion, search
  uncertainty and operator workload;
- abandonment/failure reasons.

This work prevents technically impressive features from failing because a show
briefs hundreds of temporary staff on the morning of an event.

### WS9 — Commercial and procurement evidence

**Decision:** who pays, for which outcome, at what deployment burden?

Deliver:

- buyer/problem interviews tied to current workflows and incident volumes;
- pilot design with one department and pre-agreed outcome measures;
- willingness-to-pay and hardware/service tier tests;
- site networking/infrastructure survey;
- competitor trial/mystery-shop evidence where lawful;
- procurement, insurance, compliance and data-protection blockers;
- implementation/support cost and gross-margin reality;
- reference/case-study permission model.

Do not let commercial research turn into unsourced TAM expansion. The questions
must change a product, segment, price or go/no-go decision.

### WS10 — Open-source and standards watch

**Decision:** what should Loc8 adopt upstream, interoperate with or stop
maintaining itself?

Deliver quarterly:

- refreshed pinned commits/activity/licence changes;
- relevant releases/security notices in BitChat, MeshCore, LoRaMesher,
  Meshtastic, Navigine, PALMS, RoomPlan and platform BLE APIs;
- upstream test cases Loc8 should import;
- contribution/fork-versus-vendor decisions;
- third-party notices and dependency provenance;
- standards changes affecting BLE direction/channel sounding, Wi-Fi RTT, OSM
  indoor schemas and radio regulation.

Repository watching is capped at 5% of R&D capacity unless a release changes an
active decision.

## 30/60/90-day execution

### Days 0-14 — establish truth and instruments

1. Freeze a labelled build and run `MESH-01 E01` three-phone relay.
2. Begin `MESH-02/MESH-03 E02` background matrix on available iOS/Android
   hardware.
3. Write the connected bridge threat model and minimum pilot boundary.
4. Specify `FLOOR-01 E03`'s sensor/event schema, consent and ground-truth capture
   flow.
5. Define the first semantic building schema and select one accessible test
   building with at least three floors and two connector types if possible.
6. Create the experiment registry/result folder and publish the first decision
   records, including failures.

Exit decisions:

- provisional phone-mesh GO/LIMITED/NO-GO;
- connected-hardening engineering scope;
- approved floor corpus protocol;
- approved first building and data permissions.

### Days 15-30 — baseline and first field corpus

1. Complete available device/background/battery matrix.
2. Measure body/wall/interference baselines without crowds.
3. Implement the floor-transition logger after reading exact Expo SDK 57 docs.
4. Collect first labelled transitions and same-floor negative controls.
5. Import/trace the first building's floors, spaces and connectors.
6. Implement a Bermuda-style categorical anchor baseline.
7. Prototype authenticated relay/tenant-isolation tests separately from the demo
   bridge.
8. Conduct five workflow interviews/usability sessions around current Guard and
   Command, not imagined future hardware.

Exit decisions:

- whether protocol-v2 work targets phone relay or phone-to-backbone;
- whether the data quality supports estimator work;
- minimum connected pilot hardening backlog;
- map schema revision 1.

### Days 31-60 — compare alternatives

1. Run current threshold, barometer-only, radio-only and fused floor baselines.
2. Add topology-constrained HMM/Viterbi and evaluate held-out transitions.
3. Add pressure-reference and learned connector-height experiments.
4. Implement BitChat-derived components one at a time in a simulation/conformance
   harness: identity first, then encryption, topology/routing, outbox/couriers.
5. If phone/bench gates justify it, run Linux BLE and MeshCore/LoRaMesher bench
   comparisons.
6. Have a second person commission the same building from the instructions.
7. Define pilot outcome measures with at least one real prospective operator.

Exit decisions:

- floor estimator PROMOTE/REPEAT/STOP;
- mapping workflow PROMOTE/REWORK;
- MeshCore/LoRaMesher field-trial shortlist or defer;
- protocol-v2 component adoption sequence;
- connected pilot readiness gap list with owners.

### Days 61-90 — field validation and product transfer

1. Repeat mesh/floor/coverage work in a structurally different building and new
   device cohort.
2. Run failure injection: IP loss, anchor loss/move, gateway loss, stale clocks,
   conflicting floor evidence and overloaded message queues.
3. Produce first coverage/repeater-placement prediction and physically validate
   withheld areas.
4. Run an operational exercise measuring acknowledgement, muster and search
   uncertainty.
5. Complete security review of the connected pilot scope; schedule independent
   review for cryptographic protocol work.
6. Transfer only passed components into product roadmaps with third-party notices,
   maintainers and rollback plans.

Exit decisions:

- which product can be piloted safely;
- which mesh/backbone architecture proceeds;
- which mapping/floor claims have earned cohort-specific wording;
- what hardware, if any, is worth purchasing/building next;
- which research lines are killed for the next quarter.

## Autonomous operating cadence

### Daily

- Work the highest-value unblocked question in `research-questions.md`.
- Append evidence and deviations to its experiment record.
- Preserve raw data before interpretation.
- Raise a decision/blocker immediately; do not hide it in a weekly report.

### Weekly

- Monday: select no more than three active decision questions.
- Midweek: adversarial review—what would falsify each hypothesis?
- Friday: publish evidence, decision and next action; update product-truth docs if
  a claim changed.
- Refresh the NOW/NEXT/LATER board and stop work whose decision value collapsed.

### Monthly

- Portfolio review: PROMOTE, CONTINUE, HOLD or KILL every workstream.
- Review licences, data consent/retention and security risks.
- Compare research cost with the commercial/operational decision unlocked.
- Reserve at least 20% of the following month for replication and failure cases.

### Quarterly

- Refresh upstream project/activity/licence snapshot.
- Reproduce the most important claimed result on a new building/device/team.
- Publish a negative-results register.
- Reallocate the portfolio; no project continues merely because code exists.

## Decision states

Every question ends in one of five states:

- **PROMOTE:** evidence passes; move a bounded item into product engineering.
- **REPEAT:** promising but replication, another cohort or a corrected protocol is
  required.
- **HOLD:** valid research, but another dependency must decide first.
- **STOP:** hypothesis failed or value does not justify complexity.
- **BLOCKED:** requires user authority, hardware, site access, legal advice or
  external coordination; document the exact unblock request.

No prototype is “basically done”. It either has evidence and an owner or it is
stopped/held.

## Evidence and result structure

Create future results under:

```text
docs/research/rnd/results/<question-id>/<yyyy-mm-dd>-<short-name>/
  README.md               # hypothesis, protocol, results, decision
  manifest.json           # app/OS/device/map/protocol versions and data hashes
  analysis/               # reproducible scripts and derived tables
  raw/                    # ignored if sensitive/large; durable location recorded
  media/                  # selected redacted evidence
```

Each result links:

- research question ID;
- experiment ID from `experiments.md`;
- decision being unlocked;
- source repo/files and licence where upstream code was used;
- pre-registered pass/fail gate;
- cohorts and exclusions;
- privacy/consent basis and retention;
- raw data location/hash;
- deviations and adverse observations;
- PROMOTE/REPEAT/HOLD/STOP decision;
- product documents/claims changed.

## Autonomy boundaries

R&D may autonomously:

- inspect repository code and current primary sources;
- write research documentation, schemas, simulations and offline prototypes;
- run tests/fuzzers/benchmarks that do not affect external systems;
- update evidence and decision records;
- prepare field protocols, bills of materials and data-capture tooling; and
- stop a research line when its pre-agreed condition is met.

R&D must ask the owner before:

- purchasing hardware/services or accepting licence/commercial terms;
- contacting customers, researchers or suppliers as Loc8;
- deploying into an operational venue or involving members of the public;
- collecting identifiable person/location data without an approved protocol;
- making product/security/safety claims externally;
- copying code with unresolved or reciprocal licence obligations into shipped
  product; or
- committing to a certification, legal position, pilot or delivery date.

These boundaries preserve autonomy without allowing research to create commercial,
privacy or safety obligations silently.

## Research anti-patterns

- Cloning more repositories instead of running `MESH-01 E01`/`FLOOR-01 E03`.
- Tuning algorithms on the same building/device used to report accuracy.
- Averaging away an unsupported phone model or background state.
- Treating RSSI distance, one paper's accuracy or a simulator as field truth.
- Building the full Gateway because its specification is interesting.
- Integrating encryption without identity, revocation, replay and migration.
- Collecting raw person trails before defining consent, minimisation and deletion.
- Adding “AI” where a transparent probabilistic baseline has not been beaten.
- Leaving negative results undocumented.
- Allowing a prototype to become a dependency without provenance and ownership.

## The immediate autonomous queue

After the completed pure `CONN-01`, `SEC-01`, `FLOOR-01`, `MAP-01`, `SEC-05`
and MESH-01 kit cycles plus the 48-repository source audit, continue in this
order:

1. Run physical `MESH-01 E01` immediately when three authorised phones, real
   A↔C radio isolation, approved evidence storage and a supported native build
   are available. The kit is ready; no simulation may close the decision.
2. Extend the product Commissioning workflow with synthetic plan import and
   control-point registration. The `FLOOR-01` SDK 57 adapter/replay preparation
   is complete; physical collection remains gated by supported devices/toolchain
   plus site/participant/storage/deletion authority.
3. Execute `CONN-01` product development with reviewed real identity, durable
   replay/revocation/policy/audit stores, a pinned TLS/proxy adapter and recovery
   drills. Pilot readiness remains HOLD.
4. Prefreeze and implement the isolated Android half of `SEC-05 E07`; hold the
   cross-platform/provider decision for supported Xcode/iOS, phones and
   specialist review.
5. Run `MAP-04`/`MAP-10` with a permissioned real plan/building and second
   operator as soon as governance/access exists.
6. Run `FLOOR-02` through `FLOOR-05` manual/receiver/barometer/fused/topology
   baselines only after an approved physical corpus exists.
7. Run `MESH-02`/`MESH-03` background/device/battery cohorts after `MESH-01 E01`
   and device access.
8. Run `OPS-01` through `OPS-03` only with authorised representative users and
   a named pilot outcome.
9. Run `RADIO-01` MeshCore-versus-LoRaMesher on identical representative
   hardware only when hardware is available or a signed pilot need justifies it;
   select RadioLib only after the firmware/chip decision.
10. Refresh/adopt retained repositories only for a named experiment or at the
    capped quarterly watch; do not restart broad discovery.

This queue deliberately combines proof, pilot readiness and differentiating IP.
It prevents either the mesh experiment or connected sales path from monopolising
the company while the other remains unproven.

## Execution update — 2026-07-22

- `CONN-01` completed its first investigate→prototype→measure→decide cycle.
- Original result: **PROMOTE bounded relay security primitives; REPEAT at product
  integration level**. Fourteen adversarial tests and both 10,000-operation
  local performance gates passed. See the
  [prototype](results/CONN-01/2026-07-22-secure-relay-prototype/README.md).
- Principal repeat: the corrected dependency-injected product boundary passes
  24/24 tests, but real identity, durable stores, TLS/proxy, recovery and external
  review remain open. Pilot readiness is HOLD. See the
  [repeat](results/CONN-01/2026-07-22-product-boundary-repeat/README.md).
- `SEC-01` through `SEC-07` now have a corrected threat/identity/field model and
  bounded non-cryptographic protocol seam. PROMOTE the candidate contracts,
  REPEAT native/physical work and HOLD cryptographic implementation. See the
  [protocol result](results/SEC-01/2026-07-22-protocol-v2-boundary/README.md).
- `MESH-01` now has a complete, promoted physical-evidence kit. The strict
  evaluator passes 100/100, its TypeScript operator protocol passes 5/5, pure
  native recorder harnesses pass and an actual generated Expo Android project
  compiles/packages the module. The relay decision remains **HOLD-PHYSICAL**:
  zero physical attempts exist and the three-phone/isolation/storage/toolchain
  dependencies remain.
- `FLOOR-01` completed its preregistered pure contract cycle. PROMOTE the schema,
  platform-neutral recorder/validator/evaluator and replay gates; REPEAT the
  native adapter/physical pilot; HOLD collection authority and all accuracy or
  phone/building claims. The 40/40 suite and 50,008-event two-run replay are in
  the [result](results/FLOOR-01/2026-07-22-corpus-contract/README.md) and artifact
  commit `fc2f536`.
- `MAP-01` completed its preregistered pure contract cycle. PROMOTE the strict
  semantic/route graph, deterministic profile router, egress audit, projections
  and wire-code seam; REPEAT a real plan/building, second operator, product
  adapters and specialist route review; HOLD every real-building/safety claim.
  The 123/123 focused suite, 71 invalid mutations and four reproducible
  10,000-query runs are in the
  [result](results/MAP-01/2026-07-22-semantic-graph/README.md), artifact commit
  `d023690`.
- `SEC-05` completed its pure provider/credential/prekey contract cycle. Promote
  only the strict logical-frame/provider/policy/lifecycle contracts. The suite
  passed 88/88 and rejected 67 parser adversaries; none of ten provider
  candidates cleared all ten gates. Run isolated `SEC-05 E07`; hold all
  cryptography and security claims.
- The retained collection is now a verified 48-repository source-object ledger,
  not the earlier 36-project catalogue. Forty-six retained branch tips matched
  GitHub; Meshtastic and Tink C++ advanced and remain pinned until a new
  experiment snapshot. Broad discovery stays held.
- SDK-57 dependency/tooling remediation is complete at this checkpoint: lint
  zero, `npm audit` zero, Expo Doctor 20/20, all product tests/types pass and the
  Android module packages. Complete native app builds/installs/phone evidence
  remain open; Xcode 16.2 cannot close the iOS gate.
- The next local work is FLOOR native adapter preparation, the connected product
  repeat and the bounded `SEC-05 E07` Android harness. Physical MESH/MAP/FLOOR
  work preempts them when its real dependencies become available.
- Product security/connected-platform engineering may take the promoted units in
  the [promotion brief](results/CONN-01/2026-07-22-secure-relay-prototype/promotion-brief.md),
  but no pilot-security claim is authorised yet.
