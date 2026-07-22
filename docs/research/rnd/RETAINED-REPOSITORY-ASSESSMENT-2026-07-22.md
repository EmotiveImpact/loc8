# Retained repository source assessment — 2026-07-22

This is the Principal R&D source-level adoption audit for the ignored research
library under `docs/research/rnd/repos/`. It answers three different questions
that must not be collapsed:

1. Is the code legally reusable?
2. Is the implementation technically suitable for a bounded Loc8 component?
3. Is the idea useful even when the code must not be copied?

The answer is not “copy every MIT repo.” A permissive licence permits reuse
subject to its terms; it does not make a stale stack, custom cryptography,
uncalibrated threshold or mismatched architecture safe or valuable.

## Outcome

- **48/48 retained repositories are inventoried.** The old 36-project catalogue
  omitted the 12 SEC-05 provider/vector clones added later.
- **48/48 have a pinned commit, branch, origin and source/evidence object.** The
  exact rows are in
  [`retained-repository-source-audit.tsv`](retained-repository-source-audit.tsv).
- **46/48 retained branch tips still matched GitHub on 2026-07-22.** Meshtastic
  `develop` advanced from `f90c1340de20` to `1804fd188626`; Tink C++ `main`
  advanced from `5bf527a8dc73` to `a50ffe32402d`. Their current research remains
  reproducibly pinned; a future experiment must refresh and review them in a
  new snapshot rather than silently changing old evidence.
- **The strongest direct code candidates are component-sized, not apps:**
  Bermuda filtering/hysteresis, selected Navigine/blelocpp algorithms, Anyplace
  model/route concepts, non-cryptographic BitChat components, MeshCore or
  LoRaMesher in a dedicated firmware bake-off, RadioLib only beneath selected
  custom firmware, COSE/CWT vectors, and bounded MeshCore lab tooling.
- **The strongest learn-only sources are equally valuable:** Columba BLE
  lifecycle, Meshtastic congestion/roles/queues, multi-floor S-Graphs, HOV-SG's
  hierarchy, Reticulum's carrier architecture, ESPresense filtering, Weshnet
  replicated logs, and Signal/OpenMLS lifecycle models.
- **No repository is approved for wholesale product import.** Every adoption is
  gated on file-level provenance, dependency and security review, isolated
  tests, architecture fit and a Loc8 experiment.

## Method actually used

The Principal pass:

1. counted the real clone directories and reconciled the snapshot from 36 to
   48 entries;
2. resolved each retained `HEAD`, commit date, branch and origin;
3. compared every retained branch tip with its live GitHub branch using
   `git ls-remote`, without mutating the clones;
4. inspected root licence material and documented absent, conflicting, copyleft,
   custom and non-commercial terms;
5. read implementation source for filters, floor transitions, particle state,
   graph construction, route selection, packet forwarding, BLE connection/GATT
   lifecycle, queues, replication and cryptographic-provider boundaries;
6. selected a canonical inspected source/evidence path per repository and froze
   its Git blob ID in the TSV;
7. re-resolved all 48 blob IDs from the local Git objects and found zero
   mismatches; and
8. separated reusable code, reusable ideas, benchmarks/radar and stopped paths,
   then assigned a concrete next gate.

For the highest-value sources, the canonical TSV path is only the anchor, not
the only file inspected. The audit also read, among others:

- Bermuda `bermuda_advert.py`, `bermuda_device.py` and `coordinator.py`;
- Navigine's radio level estimator, history and barometer window gate;
- blelocpp altitude manager, floor map and transition-aware particle filter;
- HOV-SG floor/room graph and navigation graph;
- hdl_graph_slam floor detection and plane constraints;
- multi-floor S-Graphs floor analyzer/mapper and transition structures;
- BitChat Noise, identity, prekey, BLE routing/fanout, outbox, courier and
  reconciliation paths already frozen by SEC-01/SEC-05;
- MeshCore packet/path and BaseChatMesh sources;
- LoRaMesher route table, network service, message queues and slot/superframe
  interfaces;
- Meshtastic flooding, airtime, persisted message and store-forward paths;
- Columba scanner, GATT client, operation queue, connection and lifecycle paths;
- Weshnet metadata/message stores, per-device queues, out-of-store and
  replication contracts; and
- the exact provider/vector paths in the SEC-05 evidence manifest.

Some SEC-05 repositories are intentionally tree-only research clones. Their
working-tree status can appear as mass deletion because blobs are retained as
Git evidence rather than checked-out product files. The audit reads those with
`git show HEAD:<path>` and does not “repair,” vendor or stage them.

## What is useful now

### Direct bounded adoption candidates

| Candidate | Reusable code boundary | Why it is valuable | Gate before product use |
|---|---|---|---|
| Bermuda | MIT receiver history, calibration, staleness, velocity rejection and area/floor switching logic, ported behind Loc8 contracts | Strongest production-shaped categorical BLE anchor in the collection | Deterministic port parity, privacy review, then held-out multi-phone/building corpus |
| Navigine algorithms | MIT radio-level scoring, history, PDR/particle/barrier seams and barometer-gate components | Gives Loc8 a practical baseline above a raw pressure threshold | Replace persistence counter with topology-constrained state estimator; calibrate devices |
| blelocpp | MIT building particle filter, floor evidence and transition-area mixing | Useful alternative estimator and replay benchmark | Modernise/test selected files; compare on the same frozen FLOOR corpus |
| Anyplace | MIT building/floor/POI/connection/radiomap schema and routing concepts | Mature cross-floor domain coverage despite an obsolete stack | Extract only stable model/fixtures/algorithms and map to `loc8.building-graph.v1` |
| BitChat iOS/v2 | Public-domain non-crypto source routing, controlled fanout, outbox, courier and reconciliation components | Closest source to Loc8's phone-mesh direction | One component per versioned spike; preserve Loc8 semantics; security/physical gates remain separate |
| MeshCore | MIT compact packets and flood/direct route firmware | Strong dedicated LoRa backbone candidate with active ecosystem | Bench on identical hardware/channel/traffic against LoRaMesher; reject custom crypto |
| LoRaMesher | MIT route ageing, EWMA quality, asymmetric-link handling, alternates and slotting | Stronger structured-routing counterpoint to MeshCore | Same physical radio bake-off and failure/recovery corpus |
| RadioLib | MIT chip drivers and low-power/interrupt/channel controls | Avoids low-level radio-driver reinvention | Adopt only after custom firmware and supported chip are selected |
| PALMS | MIT CES/plane alignment in an offline commissioning tool | Could shorten first-site map registration without tracking staff | Real-plan held-out start-pose benchmark; keep offline/installer scope |
| hdl_graph_slam | BSD floor-plane extraction and constraints | Can stabilise mapping pitch/drift | Audit optional GPL dependencies and keep geometry separate from semantic floor IDs |
| COSE Examples | Public-domain exact vectors | Standards-shaped reproducible credential/parser tests | Pin individual objects/hashes and add negative cases with reviewed provider |
| MeshCore lab tools | MIT HA adapter, protocol clients and packet capture | Gateway ingestion, interoperability and observability accelerators | Isolate from product; add auth, privacy/redaction, bounds and immutable evidence hashes |

“Direct” still means a reviewed adoption spike. Nothing above authorises copying
an entire repository into the app.

### Valuable implementation references, not direct product dependencies

| Reference | What Loc8 should learn | Why code is not directly adopted |
|---|---|---|
| Columba | Stable BLE transport identity, duplicate-connection collapse, adaptive scanning, MTU, queued GATT, timeout/backoff and foreground lifecycle | MPL-2.0 modified-file obligations and a different Reticulum/Android architecture |
| Meshtastic firmware | Airtime/channel metrics, node roles, rebroadcast policy, bounded persisted queues, store-forward and fuzzing | GPL-3.0 unless Loc8 deliberately operates a separated GPL firmware product |
| Multi-floor S-Graphs | Explicit keyframe/wall/room/floor graph and transition keyframes | GPL-3.0; reimplement the architecture against Loc8's semantic IDs |
| HOV-SG | Building→floor→room→object hierarchy, vertical floor bands, occupancy/Voronoi room graphs and stair trajectories | Root MIT file conflicts with academic-only/commercial wording; heavy offline pipeline |
| ESPresense | Adaptive percentile/IQR RSSI filtering, variance and hysteresis | AGPL-3.0; one suspected buffer-resize edge requires independent validation |
| Reticulum | Heterogeneous carriers, announces, route/path tables, proofs, links and resources | Reference-code licence is restrictive; use the public-domain protocol specification |
| Weshnet | Signed append-only metadata/message logs, per-device ordering, replication and out-of-store delivery | Full Go/IPFS stack is too heavy for the 47-byte phone BLE plane |
| NavCogAndroid | Device RSSI bias and model-capability gating | Old application stack; retain the device-profile lesson |
| OpenMLS | Group proposals/commits, fork/reboot recovery and known-answer discipline | Group security is premature until pairwise identity/delivery/recovery works |
| Signal/libsignal | Signed/one-time/PQ prekey, ratchet and recovery architecture | AGPL-3.0 and unsupported external-client API block direct adoption |
| Snow/noise-c/libsodium | Differential/vector oracles and provider alternatives | None clears Loc8's complete mobile lifecycle/review gate; primitive composition would recreate custom crypto |
| HOV/SLABIM/Hilti/NUFR datasets | Mapping hierarchy and repeat-floor/elevator/as-built failure cases | Licence, commercial-use or separate asset-term restrictions require benchmark isolation |

## Complete portfolio decision

The machine-readable TSV is the authoritative 48-row ledger. This human index
shows that every retained repository has a place and no project is silently
ignored.

### Mesh, carrier, Gateway and observability — 16

| Repository | Principal use | Decision |
|---|---|---|
| bitchat | Versioned non-crypto protocol components | ADOPT SPIKES; STOP crypto copy |
| bitchat-android | Behavioural oracle | LEARN/TEST only (GPL) |
| expo-bitchat | SDK bridge/lifecycle comparison | ADAPT scaffolding only |
| MeshCore | Dedicated radio firmware candidate | ADOPT SPIKE |
| LoRaMesher | Structured radio firmware candidate | ADAPT SPIKE |
| RadioLib | Radio driver layer | HOLD until firmware decision |
| meshtastic-firmware | Mature congestion/role/store-forward reference | BENCHMARK/LEARN (GPL) |
| Reticulum | Carrier/network architecture | LEARN public-domain spec only |
| columba | Android BLE lifecycle/GATT engineering | LEARN or isolate MPL files |
| weshnet | Replicated operational log concepts | ADAPT concepts outside BLE plane |
| colorado-mesh-client | BLE/interop/UX oracle | BENCHMARK/ADAPT fixtures |
| meshcore-open | BLE/USB/TCP protocol and persistence fixtures | ADAPT interoperability fixtures |
| meshcore-ha | Gateway/event/rate/backoff patterns | ADAPT isolated Gateway spike |
| meshcore-packet-capture | Lab packet observability | ADOPT lab spike with privacy controls |
| awesome-meshcore | Ecosystem radar; closest “Meshaholics” match | RADAR |
| awesome-reticulum | Ecosystem radar | RADAR |

No relevant GitHub project actually named “Meshaholics” was identified in the
original discovery. The likely intended concept is the curated MeshCore
community/ecosystem represented by `awesome-meshcore`; its value is discovery,
hardware/client interoperability and community signal, not runtime code.

### Floor, positioning, semantic map and commissioning — 20

| Repository | Principal use | Decision |
|---|---|---|
| BaroFloorHeight | Venue-specific storey-height lesson | LEARN only; no licence |
| ESPresense | RSSI filter/hysteresis reference | LEARN/reimplement (AGPL) |
| HOV-SG | Hierarchical scene-graph architecture | HOLD/LEARN; conflicting terms |
| NUFR-M3F | Multi-floor SLAM failure corpus | BENCHMARK after asset terms |
| NavCogAndroid | Device capability/profile lessons | ADAPT selective tests/patterns |
| PALMS | Installer relocalisation | BENCHMARK then ADAPT offline |
| SLABIM | BIM-linked semantic evaluation | BENCHMARK/LEARN (GPL) |
| anyplace | Building graph/model/routing source | ADAPT selective model/algorithms |
| bermuda | Receiver calibration and floor/zone hysteresis | ADOPT SPIKE |
| blelocpp | Particle/floor/transition estimator | ADAPT SPIKE |
| find3 | Fingerprint classifier control | BENCHMARK only |
| hdl_graph_slam | Floor-plane constraints | ADAPT with dependency audit |
| hilti-slam-2026 | As-built/as-planned challenge | NON-COMMERCIAL BENCHMARK |
| iNavigate | Weak altimeter threshold baseline | LEARN only; no licence |
| indoor-positioning | Wi-Fi/pressure teaching baseline | BENCHMARK only |
| lidar_situational_graphs | Multi-floor transition graph | LEARN/reimplement (GPL) |
| mCELindoorLoc | Overlapping classification targets | LEARN only; no licence |
| navigine-algorithms | Multi-signal floor estimator components | ADAPT SPIKE |
| openindoor6 | OSM indoor model/viewer ideas | LEARN or separated AGPL service |
| room-assistant | Simple nearest-receiver baseline | BENCHMARK only |

### Security, credentials and reviewed-provider research — 12

| Repository | Principal use | Decision |
|---|---|---|
| cose-examples | Exact public vectors | ADOPT test fixtures |
| go-cose | Differential COSE/CWT oracle | HOLD as oracle (MPL) |
| libsignal | Prekey/ratchet architecture | STOP direct; learn specs |
| libsodium | Primitive/provider oracle | HOLD; no custom composition |
| noise-c | Older Noise oracle | HOLD provider |
| openmls | Future group-security provider/reference | HOLD |
| snow | Active Noise differential oracle | HOLD provider |
| swift-crypto | HPKE source/vectors/shared-provider candidate | REPEAT SEC-05 E07 |
| tink | Historical monorepo | STOP legacy adoption |
| tink-cc | Shared HPKE provider candidate | REPEAT after refresh/pin |
| tink-java | Android HPKE provider candidate | REPEAT SEC-05 E07 |
| tink-objc | Non-HPKE Objective-C hybrid evidence | HOLD; not selected HPKE path |

The full security interpretation and ten-gate evidence are in the
[SEC-05 provider assessment](results/SEC-05/2026-07-22-crypto-provider-bakeoff/provider-assessment.md).
No provider is selected and no cryptography was promoted.

## Source-derived technical conclusions

### Floor detection is a topology-constrained evidence problem

The collection converges on a stronger architecture than Loc8's current
pressure divided by nominal storey height:

```text
stable manual/receiver floor anchor
        + relative pressure change and learned venue storey heights
        + radio-floor likelihood and receiver calibration
        + motion/vertical-speed and device capability profile
        + only legal transitions in the semantic connector graph
        -> confidence-bearing floor state with hysteresis and UNKNOWN
```

Important consequences:

- a barometer measures relative change, not an absolute floor;
- pressure must be paired with same-floor controls and drift/weather/HVAC
  context;
- lift, stair and escalator transitions are different motion cohorts;
- transition evidence should attach to explicit connector landings from
  `loc8.building-graph.v1` rather than integer-adjacent floors;
- receiver evidence is categorical with calibration and staleness, not precise
  RSSI trilateration;
- unknown phone/barometer capability is explicit, as NavCog's allowlist lesson
  shows; and
- plane extraction stabilises geometry but cannot name a semantic floor.

The next estimator should compare manual-anchor, barometer-only,
receiver-only, simple fused hysteresis and topology-constrained HMM/Viterbi
baselines on the same frozen physical corpus. It should not jump directly to a
neural model.

### The mapping advantage is commissioning plus semantics, not universal SLAM

Anyplace, PALMS, hdl_graph_slam, multi-floor S-Graphs and HOV-SG support a
layered approach:

1. import/manual semantic graph as operational truth;
2. guided installer registration of floors, rooms, zones, exits and connector
   landings;
3. PALMS-style plan relocalisation to reduce commissioning time;
4. plane/SLAM constraints to improve geometry confidence; and
5. explicit human review before publishing operational connectivity.

This is compatible with the promoted MAP-01 contract. Automatic geometry must
produce proposals with provenance/confidence, never silently replace exits,
accessibility or incident-routing truth.

### Phone mesh and dedicated radio are different products

BitChat/Columba improve the phone edge: BLE lifecycle, controlled fanout,
outboxes and opportunistic courier delivery. MeshCore/LoRaMesher/RadioLib improve
a dedicated long-range backbone. They should share Loc8's logical envelope and
semantic event model behind separate carrier adapters; they should not be forced
into one protocol implementation or one evidence claim.

MESH-01 still requires the physical three-phone test. A dedicated-radio bake-off
does not prove phone relay, and a phone relay pass would not choose Gateway
firmware.

### The defensible security boundary is replaceability and evidence

The provider collection reinforces SEC-05: Loc8 should own a small strict
logical frame, credential/policy and lifecycle contract while reviewed
providers own cryptographic operations. Public-domain BitChat cryptography,
permissive primitives and vector passes do not replace specialist composition,
storage/recovery and adversarial mobile evidence.

## Innovation opportunities that survive the evidence audit

These are promising product hypotheses, not proven external claims:

1. **Transition-aware operational twin.** Treat stairs/lifts/landings as live
   state transitions joining floor confidence, route availability, crowd/closure
   state and radio coverage. Competitors often keep mapping, positioning and
   communications as separate products.
2. **Coverage-aware routing.** Route people and messages across the same semantic
   graph, but with different cost layers: accessibility/closure for people,
   carrier availability/airtime/store-forward for data. Neither layer invents
   the other's safety claims.
3. **Commissioning flywheel.** Each authorised deployment produces versioned
   receiver calibration, venue storey-height priors, connector transition
   traces, map corrections and coverage observations. Those assets can shorten
   later commissioning while remaining building-scoped and privacy governed.
4. **Evidence as a service feature.** Ship a commissioning/health report that
   says which floors, zones, paths, carriers and recovery drills are measured,
   stale, unknown or failed. This is more defensible than a generic “mesh works
   offline” claim.
5. **Replaceable carrier moat.** Keep BLE, connected IP, MeshCore/LoRaMesher and
   later radios behind one logical envelope and audit seam. Loc8 can change a
   carrier or crypto provider without replacing building semantics or incident
   workflows.

## Autonomous next experiments

The retained library is sufficient. Broad cloning is now lower value than
executing the following preregistered work:

| Order | Experiment | Repositories used | Decision it can unlock |
|---:|---|---|---|
| 1 | Physical FLOOR corpus + SDK 57 sensor adapter | Bermuda, Navigine, blelocpp, BaroFloorHeight/NavCog lessons | Which floor baseline advances to product estimator work |
| 2 | Same-corpus floor estimator bake-off | Bermuda, Navigine, blelocpp, room-assistant/find3 controls | Manual/receiver/barometer/fused/HMM performance by phone/transition/building |
| 3 | MESH-01 three-phone physical `E01` | Current Loc8 plus BitChat/Columba lessons only after baseline | Whether foreground phone relay is GO/LIMITED/NO-GO |
| 4 | Real-building MAP commissioning repeat | Anyplace model, PALMS, hdl constraints, S-Graphs/HOV ideas | Commissioning time, correction rate and graph completeness—not universal SLAM |
| 5 | RADIO-01 identical-hardware bake-off | MeshCore vs LoRaMesher; Meshtastic benchmark; RadioLib conditional | Dedicated Gateway/repeater firmware direction |
| 6 | SEC-05 E07 native interoperability | CryptoKit, Tink Java, Swift Crypto/Tink C++ fallbacks, public vectors | Provider adapter worthy of specialist review |
| 7 | Minimal replicated operations log | Weshnet ideas plus Loc8 audit contracts | Whether offline event convergence is small/reliable enough for product use |

Physical phones, a permissioned multi-storey building, approved evidence
storage, supported Xcode and representative radio hardware remain genuine
dependencies. The protocols and software can be made ready; their evidence must
not be fabricated.

## STOP list

- Stop broad repository accumulation until a named experiment exposes a missing
  comparator or the quarterly watch fires.
- Stop wholesale MIT/public-domain imports.
- Stop treating README architecture or licence as implementation/security proof.
- Stop copying custom BitChat, MeshCore or primitive-level cryptography.
- Stop direct GPL/AGPL/custom/conflicting/unlicensed product code without an
  explicit legal/product architecture decision.
- Stop absolute barometer-floor and precise BLE-RSSI-position claims.
- Stop equating a horizontal plane with a named operational floor.
- Stop treating dataset challenge performance as real Loc8 commissioning,
  accessibility, safety or customer evidence.
- Stop refreshing a pinned source inside an already interpreted evidence set;
  use a new snapshot and compare.

## Handoff rules

Claude Code or a future Codex task should begin with this document, the TSV and
`repository-snapshot.tsv`. Before copying a file:

1. identify the exact pinned source object and licence/notice;
2. record whether the work is copied, translated, independently reimplemented
   or used only as a test oracle;
3. review dependencies, security boundary and architecture fit;
4. place it in a bounded experiment or product increment with acceptance and
   STOP gates;
5. run Loc8 regressions plus the component-specific evidence suite; and
6. append a decision and third-party notice/provenance record.

The ignored clone library remains research source, not vendored product code.
