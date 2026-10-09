# Loc8 BLE mesh R&D shortlist | 9 October 2026

**Baseline:** draft PR #5 `rnd/ble-density-2026-10-03` at `09932ccb49a2deb67db924ee54c622b7a6302b3f`. Research-only continuation. Do not reclassify the October 3 OEPB/Trickle, DPCS, BitChat, MeshCore and LoRaMesher intake as new work. No source implementation or licence from the papers below is asserted.

## 1. New and most actionable: connection timing drift in multi-hop BLE

Pang, Alamos, Schmidt and Wählisch, **Deconstructing BLE Multi-hop: a Model-based Approach to Quantifying the Challenges**, submitted 28 September, updated 29 September 2026. Primary record: https://arxiv.org/abs/2609.34483.

**Changed:** the authors analyse recurring connection scheduling conflicts caused by relative clock drift among BLE links handled by one node, and report physical validation of their mathematical analysis. This highlights a risk not represented by the existing R3 simulation, which uses ideal static directed GATT links and independent packet-erasure probabilities.

**Loc8 relevance:** a Consumer or Guard handset relaying to multiple central/peripheral peers may be limited by a single controller and its schedule, irrespective of theoretical hop reach and successful JS/native queue admission. Software attempt counts do not establish radio throughput. This does not demonstrate that collisions always become dropped Loc8 packets or that every mobile OS/controller behaves identically.

**Source and rights:** arXiv abstract and metadata checked. The full paper/PDF was unavailable to this review. Two GitHub repository-discovery searches returned no matching author code; no usable implementation, project revision or software licence has been verified. This branch independently implements a *timing-overlap opportunity* proxy, not the authors' collision-probability model or equations. No paper/code copied.

**Test:** measure multi-link connection intervals, active connection lifetimes, controller busy outcomes, GATT queue wait and end-to-end application delivery where phone tooling permits; do not infer HCI timing from an application timestamp. Compare two/four/six simultaneous links, mixed iPhone/Android relay roles, screen-off/resume, reconnect, busy 2.4 GHz environments and GATT offered load. Use observable Nordic boards for controlled drift/interval configurations. Pair actual observations with this R5 model before treating any overlap threshold as useful.

## 2. Newer practical synthesis: connectionless advertisements and mobile limits

Issa, Couderc and Bonnin, **WiFi and BLE advertisement based communication for ephemeral interactions: A survey**, *Peer-to-Peer Networking and Applications* 19, article 136, published **12 September 2026**, open access: https://link.springer.com/article/10.1007/s12083-026-02295-7.

**Changed:** its comparative synthesis covers connectionless discovery, mobility, OS restrictions, interference, dense advertiser populations and concrete deployment examples. It is not new this week, but is a strong control for interpreting the previous broadcast-mesh research.

**Loc8 relevance:** BLE advertisements in current Loc8 discover peers; the 25-byte application payload is carried over *connected GATT*, within the existing 47-byte native frame. Advertiser performance and nominal range cannot be treated as multi-hop message delivery or locked-phone reliability. Connected-component size, not install count or metres multiplied by seven, governs reach.

**Test:** from the existing MESH-01 field kit, report discovery-to-ready-link delay separately from sender-to-receiver application delivery and p50/p95 age. Distinguish percentage installed, BLE-nearby, GATT-connected, reachable-within-TTL and actually delivered. Repeat stationary, moving, obstructed, foreground and background cases with Wi-Fi idle/active. Record device models and OS versions. Literature only; no code import.

## 3. Consequential empirical long-range complement: BLE + LoRa gateway

Del-Valle-Soto et al., **Hybrid BLE–LoRa architectures for energy-efficient and resilient wireless sensor networks: Experimental validation and adaptive clustering strategies**, *Peer-to-Peer Networking and Applications* 19, article 97, published **3 June 2026**, open article https://link.springer.com/article/10.1007/s12083-026-02251-5.

**Changed compared with earlier analytical BLE-LoRa preprints:** a real heterogeneous sensor-network experiment with controlled interference and adaptive clustering. Under the paper's BLE-LoRa configuration, the authors report standard-deviation reductions of **20% in energy consumption** and **43% in retransmissions**, not 20% lower mean energy or 43% fewer actual retransmissions. BLE-only mitigation has its own control-overhead cost. The study is not a verified 10-km phone mesh.

**Loc8 relevance:** optional fixed venue/Gateway transport is a distinct, plausible route to large-site reach, whereas the consumer phone must retain its no-infrastructure operation. Forward the canonical native frame through an authenticated, rate-limited, age-bounded outer bearer, not a re-originated packet or an implicit security upgrade.

**Test:** two gateway prototypes and BLE-only control; measure split and rejoin, scope, dedup/loops, queue expiry, gateway-offline fallback, mean/variance of energy and retransmits, delivery by hop and local mesh delivery independent of the long-range connection. Reconcile with existing MeshCore/LoRaMesher intake, provenance and notices before selecting firmware. This R5 increment does **not** build a gateway, provision LoRa, or copy the paper's source.

## The new code that can safely enter Loc8 now

- `packages/engine/src/experimental/gattScheduleRisk.ts`: bounded, independently written shared-engine analyser for **synthetic** BLE connection-event time-window intersection across 1 to 16 links. Controls: nominal event period, initial phase, relative oscillator drift, assumed duration, link availability, analysis horizon and event count. Returns per-link/pair and time-bucket overlap opportunities. **No packet loss, energy, range, or real-controller inference.**
- `tools/mesh-rnd/gatt-schedule.cjs`: four reproducible JSON scenarios: separated, drift, dense and churn.
- `tools/mesh-rnd/gatt-schedule.node.cjs`: ten deterministic host assertions including exact event counts, drift, co-phase, touching endpoints, churn, bounded input, reproducibility and no phantom packet-loss field.
- `packages/engine/src/experimental/gattScheduleRisk.test.ts`: additional root-Jest regression coverage.

All code is research-only, not exported from `@loc8/engine`, and is not connected to Consumer, Guard, Command or firmware at runtime. No dependency, native permission, wire-format, relay-mode, TTL, data-retention, security or production-default change. Prior R0/R1/R3 source hashes and 5,400-run benchmark evidence remain untouched.

### Synthetic comparison (NOT RF measurements)

Two links at 100-ms nominal intervals, each with an artificial 4-ms occupied window and a 10-ms initial offset. Across 240 seconds, the zero-drift case has **0 overlaps among 4,800 modelled events**. With +50/-50 ppm relative drift it has **1,600 overlapping events among 4,801**, representing **800 event pairs**. This *illustrates* recurring overlap as phases drift, not observed Bluetooth collisions or Loc8 lost messages.

Reproduce after locked repository dependency installation:

```sh
node --test tools/mesh-rnd/gatt-schedule.node.cjs
node tools/mesh-rnd/gatt-schedule.cjs separated
node tools/mesh-rnd/gatt-schedule.cjs drift
node tools/mesh-rnd/gatt-schedule.cjs dense
node tools/mesh-rnd/gatt-schedule.cjs churn
```

**Decision:** RESEARCH_ONLY; maintain `current` as the production relay and keep the opt-in `branch` policy. Next build gate is real supported-device MESH-01 with multi-link load/timing, then a separate Nordic periodic-advertising hardware power bench and optional BLE-to-long-range Gateway prototype. No seven-hop venue-area claims without physical evidence.
