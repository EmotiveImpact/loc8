# Open-source research catalogue

**Snapshot date:** 2026-07-22
**Scope:** 48 pinned research repositories under ignored `repos/` (36 original
discovery clones plus 12 SEC-05 provider/vector sources)
**Rule:** a useful idea is not automatically reusable code. The licence, dependency
tree, security properties, maintenance state and architectural fit all matter.

This is an engineering screen, not legal advice. Before shipping copied code,
record the exact files and copyright notices in a third-party notices manifest.
The complete source-object, code-versus-idea and next-gate ledger is the
[Principal retained-repository assessment](RETAINED-REPOSITORY-ASSESSMENT-2026-07-22.md)
and its [48-row TSV](retained-repository-source-audit.tsv).

## Verdict key

- **Adopt:** permissive/public-domain code is a close fit and deserves a bounded
  integration spike.
- **Adapt:** reuse selected code or patterns after tests and architecture review.
- **Learn:** reproduce the idea independently; do not copy into proprietary Loc8.
- **Benchmark:** use data or software to measure Loc8, subject to its terms.
- **Reject for product:** no licence, incompatible terms, stale design, or poor fit.

## Priority adoption matrix

| Priority | Project | What Loc8 should do | Why |
|---|---|---|---|
| P0 | BitChat iOS/v2 | Adopt protocol components into a versioned Loc8 mesh-v2 spike | Public domain; current implementation adds signed identity, Noise sessions, topology, source routing, controlled fanout, encrypted outbox, courier delivery and gossip sync. Loc8's native mesh is derived from an older broadcast design. |
| P0 | Bermuda | Adapt categorical floor/zone anchor logic | MIT; production-shaped RSSI history, calibration, outlier rejection, asymmetric smoothing, staleness and hysteresis. It correctly treats BLE as nearest-area evidence, not precise trilateration. |
| P0 | Navigine algorithms | Adapt floor-fusion test harness and particle/topology concepts | MIT; fuses radio-level evidence, a persistence counter, barometer change gating, PDR and building barriers. Its floor implementation still needs stronger state estimation and device calibration. |
| P0 | Anyplace | Adapt the indoor data model and cross-floor graph concepts | MIT; complete building/floor/POI/connection/radiomap APIs and routing model. The stack is old, so extract schema and tested algorithms rather than reviving the whole platform. |
| P0 | PALMS | Benchmark installer-side relocalisation | MIT; recent previous-visit-free smartphone localisation using floor plans plus LiDAR or monocular depth and Certainly Empty Space constraints. Best suited to mapping/commissioning, not passive staff tracking. |
| P1 | MeshCore + MeshCore Open | Adopt in a dedicated LoRa gateway/repeater experiment | MIT, active ecosystem, companion/repeater/room-server roles, compact hybrid routing and mobile BLE clients. Keep it a radio adapter behind Loc8's transport interface. Do not reuse its custom crypto as Loc8's application security. |
| P1 | LoRaMesher | Adapt for experimental dedicated relay firmware | MIT; route aging, link-quality penalties, alternate next hops, synchronisation and slotting are stronger than a naive flood. Compare it directly with MeshCore before selecting hardware firmware. |
| P1 | blelocpp/NavCog | Adapt floor-change and particle-filter components | MIT; beacon-aware particle filter, building constraints and altimeter change gating. NavCog's phone-model allowlist is a warning that barometer reliability is device-specific. |
| P1 | hdl_graph_slam | Adapt plane constraints in the mapping pipeline | BSD-2-Clause; RANSAC floor-plane extraction can stabilise tilt/drift. Audit the optional GPL dependencies before redistribution. A plane is geometry, not a semantic floor number. |
| P1 | NUFR-M3F | Benchmark multi-floor SLAM failure modes | Apache-2.0 repository; sequences include elevators, repeated/symmetric floors, reflective surfaces and dynamic obstruction. Confirm separate dataset-download terms before ingesting large data. |
| P2 | RadioLib | Adopt only if Loc8 writes custom LoRa firmware | MIT and very active; broad transceiver support removes low-level driver work. It is not a routing stack. |
| P2 | Weshnet | Adapt offline replicated-event-log concepts | MIT/Apache-2.0; useful group metadata/message logs, replication and multi-transport architecture. Too heavy for the phone BLE frame path. |
| P2 | Find3 | Benchmark a small offline room/floor classifier | MIT but inactive since 2020. Sensor-agnostic fingerprints and classifier ensembles are useful baselines, not a production dependency. |

## Mesh, relay and offline communications

| Repository and pinned revision | Activity/licence | Inspected value | Verdict |
|---|---|---|---|
| [permissionlesstech/bitchat](https://github.com/permissionlesstech/bitchat) `733098bb633e` | 2026-07-10; Unlicense/public domain | Transport abstraction, signed long-term identity with ephemeral session IDs, Noise XX/X, source routing, dedup, degree-aware TTL, controlled fanout, fragmentation, encrypted outbox, spray-and-wait couriers, GCS gossip sync and panic wipe. The source and v2 whitepaper are the most direct upgrade path. | **Adopt P0**, component by component, behind a new protocol version. Preserve Loc8's operational packet semantics and independently threat-model the result. |
| [permissionlesstech/bitchat-android](https://github.com/permissionlesstech/bitchat-android) `b7f0b33d3a26` | 2026-06-25; GPL-3.0 | Current Android counterpart and useful behavioural oracle. | **Learn/test only** for a closed product. Implement Android from the public-domain protocol/iOS sources or negotiate a commercial licence. |
| [quiint/expo-bitchat](https://github.com/quiint/expo-bitchat) `38df0c9f40a6` | 2025-07-14; MIT | Expo native-module scaffolding for iOS/Android, an older custom encrypted flood mesh, Bloom filtering and store-forward. Its README says it has not had an external security review. | **Adapt scaffolding only** after reading Expo SDK 57 docs; do not adopt the crypto or protocol claims. |
| [meshcore-dev/MeshCore](https://github.com/meshcore-dev/MeshCore) `a3a1aa5e3be3` | 2026-07-19; MIT | Compact packets, flood and direct paths, node roles, truncated-hash dedup, airtime jitter, companion/repeater/server firmware. Its direct-message crypto uses bespoke AES/HMAC construction rather than a modern reviewed AEAD session protocol. | **Adopt routing/radio adapter P1; reject crypto reuse.** |
| [zjs81/meshcore-open](https://github.com/zjs81/meshcore-open) `0fe250230905` | 2026-07-09 `dev`; MIT | Cross-platform Flutter companion: BLE/USB/TCP, SQLite, maps, routes, signal data and repeater administration. | **Adapt protocol/client test fixtures**; Loc8 remains Expo/React Native. |
| [Colorado-Mesh/mesh-client](https://github.com/Colorado-Mesh/mesh-client) `d44d55eb07d0` | 2026-07-21; MIT | Another active MeshCore client and source of UX/protocol interoperability cases. | **Benchmark/interoperate.** |
| [meshcore-dev/meshcore-ha](https://github.com/meshcore-dev/meshcore-ha) `1ee608a3f065` | 2026-07-21; MIT | Home Assistant integration demonstrates gateway/event ingestion. | **Adapt gateway event patterns**, not a core dependency. |
| [agessaman/meshcore-packet-capture](https://github.com/agessaman/meshcore-packet-capture) `4ef2f4cca25f` | 2026-07-15; MIT | Packet capture and diagnostics for MeshCore. | **Adapt into lab observability.** |
| [samuk/awesome-meshcore](https://github.com/samuk/awesome-meshcore) `fa193b7395ca` | 2026-07-12; CC0 | Current clients, firmware, hardware, maps, simulators and analyzers. This is the best match found for the user's “meshaholics or something like this”. No relevant GitHub project named Meshaholics was found. | **Keep as ecosystem radar.** |
| [LoRaMesher/LoRaMesher](https://github.com/LoRaMesher/LoRaMesher) `cba4e4d135e6` | 2026-06-11; MIT | Distance-vector routes with expiry, quality/unidirectional penalties, alternates, sync messages and slot/network management. | **Adapt P1** in a radio bake-off. |
| [jgromes/RadioLib](https://github.com/jgromes/RadioLib) `0795caa41c63` | 2026-07-20; MIT | Well-maintained drivers across LoRa/radio chipsets. | **Adopt P2** beneath custom firmware only. |
| [meshtastic/firmware](https://github.com/meshtastic/firmware) `f90c1340de20` | 2026-07-22 `develop`; GPL-3.0 | Mature device roles, airtime/channel-utilisation tracking, routing/rebroadcast policies, bounded persisted queues, store-and-forward and hardware support. | **Benchmark/learn**, unless Loc8 intentionally ships a GPL-separated firmware product. |
| [markqvist/Reticulum](https://github.com/markqvist/Reticulum) `122f17fad69a` | 2026-07-20; custom Reticulum licence | Strong heterogeneous-carrier architecture, cryptographic identities, proofs, links/resources and forward secrecy. The current code licence includes unusual restrictions; the protocol specification is separately dedicated to the public domain. | **Learn from protocol; do not copy reference code** without legal clearance. |
| [torlando-tech/columba](https://github.com/torlando-tech/columba) `a19b2c2a1a7c` | 2026-07-16; MPL-2.0 | Excellent Android BLE engineering: central+peripheral roles, stable transport ID across MAC rotation, deterministic duplicate-connection collapse, adaptive scans, MTU negotiation, GATT queue/timeouts/backoff and foreground lifecycle. | **Learn or isolate modified files under MPL.** Independently implement the patterns in Loc8's module if product-source disclosure is undesirable. |
| [berty/weshnet](https://github.com/berty/weshnet) `d735e1d4f723` | 2026-06-05; MIT/Apache-2.0 | Offline-first group logs, chain keys, sealed messages, replication and BLE/Wi-Fi/mDNS/relay transports. | **Adapt concepts P2**, not the constrained BLE packet plane. |
| [lorien/awesome-reticulum](https://github.com/lorien/awesome-reticulum) `a7e938147871` | 2026-07-19; BSD-3-Clause list | Ecosystem discovery only. | **Radar.** |

## Floor detection, indoor positioning and mapping

| Repository and pinned revision | Activity/licence | Inspected value | Verdict |
|---|---|---|---|
| [agittins/bermuda](https://github.com/agittins/bermuda) `cd46d17e8469` | 2026-07-22; MIT | Receiver-calibrated RSSI, per-scanner history, velocity rejection, asymmetric smoothing, stale timeouts, immediate/historical hysteresis; floor inherited from the winning scanner's assigned area. | **Adapt P0.** Use it as categorical anchor evidence with confidence, never metre-level positioning. |
| [ESPresense/ESPresense](https://github.com/ESPresense/ESPresense) `bd11f5391338` | 2026-07-21; AGPL-3.0 | Broad fingerprint parsing, calibration, adaptive percentile/IQR filtering, variance and enter/exit hysteresis. A potential full-buffer index error was observed in `AdaptivePercentileRSSI::resizeBuffer`; verify upstream before copying anything. | **Learn/reimplement**, no direct proprietary integration without AGPL decision. |
| [mKeRix/room-assistant](https://github.com/mKeRix/room-assistant) `ed9a860e8ca2` | 2022-03-20; MIT | Kalman-filtered RSSI and nearest receiver with staleness. | **Adapt only as a simple baseline**; Bermuda is stronger/current. |
| [Navigine algorithms](https://github.com/Navigine/Indoor-Positioning-And-Navigation-Algorithms) `67e11c4d398a` | 2025-07-22; MIT | BLE/Wi-Fi/Wi-Fi RTT inputs, particle filtering, PDR, geometry/barriers. Radio-level estimates require repeated observations; a barometer gate compares two 100-sample windows and requires >2 m before a changed radio floor is accepted. Phone calibration and vertical-speed handling remain TODOs. | **Adapt P0/P1**, then replace the counter with a topology-constrained probabilistic estimator. |
| [hulop/blelocpp](https://github.com/hulop/blelocpp) `72b4bd3b32af` | 2024-01-05; MIT | Particle filtering in a building, beacon-floor votes/likelihoods, strongest-floor beacon filtering and altimeter variance gating. The simple altimeter manager detects a change from the standard deviation of the last three relative-altitude samples (>0.15 by default), not an absolute floor. | **Adapt P1** with modern tests and calibrated thresholds. |
| [hulop/NavCogAndroid](https://github.com/hulop/NavCogAndroid) `87f6ed2b353e` | 2024-01-05; MIT | Production lessons: per-device RSSI bias and an allowlist that disables altimeter transition validation on unknown phone models. | **Learn and preserve device capability profiles.** |
| [dmsl/anyplace](https://github.com/dmsl/anyplace) `722955182375` | 2022-08-06; MIT | Building, floor, floor-plan/tiles, POI, connection, radiomap and cross-floor route concepts spanning server, architect, viewer and clients. | **Extract model/algorithms P0**, not the obsolete application stack. |
| [Head-inthe-Cloud/PALMS](https://github.com/Head-inthe-Cloud/PALMS-Plane-based-Accessible-Indoor-Localization-Using-Mobile-Smartphones) `65c7525cd949` | 2026-02-23; MIT | WACV 2026 implementation. Aligns LiDAR planes or monocular-depth “certainly empty” space to a known floor plan with orientation estimation and particle filtering; supports sequential ARKit/RoNIN. | **Benchmark P0/P1** for commissioning/relocalisation. |
| [koide3/hdl_graph_slam](https://github.com/koide3/hdl_graph_slam) `95b8dce41c10` | 2024-07-16; BSD-2-Clause | RANSAC horizontal-floor plane extraction using normal, sensor-height, distance and inlier constraints; adds plane graph constraints to stabilise the map. | **Adapt P1**, dependency audit required. |
| [snt-arg/lidar_situational_graphs](https://github.com/snt-arg/lidar_situational_graphs) `35dd3561730a` | 2026-07-06 `feature/multi_floor`; GPL-3.0 | Four-layer keyframe/wall/room/floor graph. A z-slope regression drives `ON_FLOOR`/`ASCENDING`/`DESCENDING`; transition keyframes connect floors and new floors associate by vertical position. | **Learn/reimplement as a major architecture input.** Do not copy into proprietary Loc8. |
| [hovsg/HOV-SG](https://github.com/hovsg/HOV-SG) `d6e65a53c8be` | 2026-01-19; conflicting terms | Hierarchical building→floor→room→object scene graph, vertical-density floor segmentation, occupancy/Voronoi room graphs and stair-trajectory floor links. Root `LICENSE` says MIT; README says academic use only/contact for commercial use. | **Learn only until written commercial clearance.** Heavy offline pipeline, not phone runtime. |
| [oseiskar/BaroFloorHeight](https://github.com/oseiskar/BaroFloorHeight) `4158e69b1b3d` | 2024-06-09; **no licence** | Captures stable before/after pressure around a manually marked transition and estimates physical storey height. Good idea: learn venue-specific height instead of assuming Loc8's current 3.5 m. | **Learn/reimplement; no code reuse.** |
| [Coughlan-Lab/iNavigate](https://github.com/Coughlan-Lab/iNavigate) `feb4418fce80` | 2021-03-19 `multi_floor`; **no licence** | Basic CoreMotion altimeter thresholding; lacks weather/device calibration. | **Reject code; learn only.** |
| [Montvydas/indoor-positioning](https://github.com/Montvydas/indoor-positioning) `4fb94fc17606` | 2021-04-05; MIT | Simple pressure EMA/altitude change plus Wi-Fi KNN, hard-coded for a two-floor example. | **Reuse as a teaching/test baseline only.** |
| [laskama/mCELindoorLoc](https://github.com/laskama/mCELindoorLoc) `ea17e54fdfad` | 2022-07-06; **no licence** | Neural building/floor/grid-cell classifier; overlapping multi-cell targets reduce boundary errors in its evaluation. | **Learn/reimplement; no code reuse.** |
| [schollz/find3](https://github.com/schollz/find3) `5964026678a3` | 2020-07-15; MIT | Sensor-agnostic Wi-Fi/BLE/magnetic fingerprints and a classifier ensemble weighted by informedness. | **Benchmark P2**, not a production dependency. |
| [open-indoor/openindoor6](https://github.com/open-indoor/openindoor6) `5b776e1d9c2c` | 2022-05-27; AGPL-3.0 | OSM indoor data/viewer concepts. | **Learn or use as a separately operated AGPL service** only after a licensing decision. |
| [neufieldrobotics/NUFR-M3F](https://github.com/neufieldrobotics/NUFR-M3F) `e23b8e44f63b` | 2023-12-22; Apache-2.0 repo | Multi-modal multi-floor SLAM sequences deliberately exposing perceptual aliasing, elevators, reflective surfaces, repeated layouts, dynamics and drift. | **Benchmark.** Confirm large dataset asset terms separately. |
| [HKUST-Aerial-Robotics/SLABIM](https://github.com/HKUST-Aerial-Robotics/SLABIM) `d4cfc0b527e9` | 2025-03-26; GPL-3.0 | Multi-session/multi-sensor data and BIM-linked semantic floor/wall/door maps. | **Learn/benchmark under GPL terms.** |
| [Hilti 2026 SLAM challenge](https://github.com/Hilti-Research/hilti-trimble-slam-challenge-2026) `79b70b6d3623` | 2026-07-08; CC BY-NC-SA 3.0 | Current 360 visual-inertial SLAM/localisation against imperfect construction floor plans; useful as-as-built versus as-planned stress case. | **Non-commercial benchmark only.** Do not use its dataset or derived assets in commercial training/product work. |

## Security provider and vector sources added by SEC-05

These 12 repositories were added after the original 36-project discovery. Their
source-level gate results are in the
[SEC-05 provider assessment](results/SEC-05/2026-07-22-crypto-provider-bakeoff/provider-assessment.md).
No provider was selected.

| Repository and pinned revision | Licence | Bounded use | Verdict |
|---|---|---|---|
| cose-wg/Examples `53c9d634333b` | Unlicense | Exact COSE/CWT valid fixtures | **Adopt pinned test vectors**, paired with negative cases. |
| veraison/go-cose `022cb5419154` | MPL-2.0 | Fuzzed/audited differential COSE/CWT oracle | **Hold as oracle**, not mobile product code. |
| signalapp/libsignal `8e49f09bbcde` | AGPL-3.0 | Prekey/ratchet/recovery architecture | **Stop direct adoption; learn public specs.** |
| jedisct1/libsodium `7014b204b6fb` | ISC | Maintained primitive/provider oracle | **Hold**; do not create custom composition. |
| rweather/noise-c `cfe25410979a` | MIT | Older Noise handshake/cipher-state oracle | **Hold provider; use differential evidence.** |
| openmls/openmls `65396d8ed312` | MIT | Future MLS group provider/reference | **Hold** until pairwise identity/delivery/recovery. |
| mcginty/snow `8ac60f51cfe3` | MIT or Apache-2.0 | Active Noise/vector/fuzz oracle | **Hold provider** pending review/mobile gates. |
| apple/swift-crypto `47d3869a7291` | Apache-2.0 | HPKE source, RFC vectors and shared-provider candidate | **Repeat** isolated native E07. |
| tink-crypto/tink `1f4cd38874ec` | Apache-2.0 | Historical monorepo comparison | **Stop legacy adoption**; use split sources. |
| tink-crypto/tink-cc `5bf527a8dc73` | Apache-2.0 | Shared BoringSSL HPKE candidate | **Repeat after refresh/pin**; upstream advanced after snapshot. |
| tink-crypto/tink-java `1423887709cd` | Apache-2.0 | Android HPKE Base candidate | **Repeat** isolated native E07. |
| tink-crypto/tink-objc `04e43ef89f8c` | Apache-2.0 | Evidence for Objective-C Hybrid surface, not selected HPKE | **Hold; not the HPKE path.** |

## Explicitly rejected shortcuts

- **BLE RSSI trilateration as truth:** multipath, bodies, phone orientation and
  receiver variation make it unreliable. Use calibrated RSSI as categorical
  zone/floor evidence with hysteresis.
- **Barometer pressure divided by 0.42 hPa/floor as an absolute floor:** it
  drifts with weather, HVAC and devices and fails when storey heights vary.
- **A detected horizontal plane equals “Floor 3”:** plane extraction stabilises
  geometry; semantic level assignment needs anchors, topology or registration.
- **Copy every MIT repository into the app:** compatible licensing does not make
  an old stack, custom crypto or unrelated framework a good dependency.
- **Treating repository clones as vendored product code:** `repos/` is an ignored
  research library. Production adoption must happen as reviewed, attributed,
  tested commits with a provenance record.

## Clone provenance

The original 36 discovery clones used `--depth 1 --filter=blob:none
--single-branch` where supported. The 12 SEC-05 sources were retained as
filtered/object-oriented evidence clones; several deliberately have no normal
working-tree checkout and are read with `git show`. The complete 48-repository
name/commit/date/branch/origin snapshot is in
[`repository-snapshot.tsv`](repository-snapshot.tsv). Live branch tips were
checked on 2026-07-22; Meshtastic `develop` and Tink C++ `main` had advanced.
Re-run metadata and licence checks in a new snapshot before adoption because
activity, code, dependencies and terms can change.
