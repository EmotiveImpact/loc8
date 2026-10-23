# Loc8 weekly offline BLE mesh research delta: 23 October 2026

**Research window:** 17–23 October 2026. Older sources included only if not previously represented in the 16 October brief and technically relevant.
**Previous brief:** [16 October](2026-10-16-offline-ble-mesh.md).
**Development context:** Draft [PR #5](https://github.com/EmotiveImpact/loc8/pull/5) (current/branch native candidate) and draft [PR #8](https://github.com/EmotiveImpact/loc8/pull/8) (research and R4 agent handoff). No independently verified real-phone RF result or R4 implementation at this checkpoint.
**Status:** Research intake and experiments proposed; this note does not change the production relay policy or prove field performance.

## Executive decision

Prioritise *bounded ingress/sync scheduling*, actual connected-degree telemetry, and physical MESH-01 verification. Add a **separately scoped BLE/LoRa optional Gateway feasibility experiment**, but do not treat the published 10 km / 250–562-node analytical estimates as field proof. Hold all transport and wire-protocol changes until evidence and platform support justify them.

Search outcome: no newly published (17–23 October) peer-reviewed smartphone BLE multihop field study was confirmed that replaces the existing Loc8 relay approach. The genuinely new source this week is an upstream **22 October 2026** engineering release; other worthwhile sources are newly surfaced older primary research.

## Ranked intake

### P0 · New this week: BitChat Android v2.0.3 upstream engineering release (22 October 2026)

- **Primary source:** https://github.com/permissionlesstech/bitchat-android/releases/tag/v2.0.3
- **Pinned source:** `dfc67dad41691128bc6e7425bd69f2f409cb5bbf`, release page includes signatures and evidence limitations.
- **Substance:** cap packet-processing queues, pace sync replies under heavy traffic, batch identity updates, preserve original compressed packet bytes while forwarding/verifying cross-client signatures, improve duplicate handling. Records 860 unit/contract tests passed and three skipped; **physical cross-client, endurance and delivery tests were not completed**.
- **Loc8 implication:** a practical counterpart to the Zephyr queue-lifecycle reports. First audit whether `MeshEgressQueue`, Android service and shared engine already bound ingress + fanout under density. Measure queue depth/high-water mark/admission/drop/expiry/destination receipt separately, under traffic bursts. Do not copy upstream implementation.
- **Licensing caution:** repository description/README calls it public domain, but `LICENSE.md` contains **GPL-3.0**. Treat reuse licensing as unresolved at pinned revision; learn from design, do not transplant source without legal review. See https://github.com/permissionlesstech/bitchat-android/blob/main/LICENSE.md .
- **Decision:** P0 engineering audit and bounded-queue test, not automatic adoption or proof of a better relay.

### P1 · Newly identified older preprint: dual-radio BLE–LoRa hierarchical mesh (16 April 2026)

- **Primary source:** https://arxiv.org/abs/2604.15532 ; Andrii Vakhnovskyi, *Dual-Radio BLE-LoRa Hierarchical Mesh for Infrastructure-Free Emergency Communication*.
- **Nature:** architectural prototype and **analytical** capacity/energy calculation; not a deployed smartphone/LoRa field validation. The manuscript explicitly says the LoRa radio is present on the board but **not activated in firmware**, so its 10 km+ diameter, 250–562 nodes, 79% energy savings and sub-50 ms BLE-cluster figures must be labelled **author estimates**. It relies on a strong local-traffic fraction (locality bias beta >= 0.76); security and smartphone integration remain future work.
- **Loc8 implication:** suggests optional dedicated BLE cluster heads with a narrow LoRa cross-site backbone, *not* a redesign of the default phone-to-phone consumer mesh. The current phone BLE GATT architecture is not the paper's advertising AODV/Coded PHY S8 implementation; do not import its claimed 800 m BLE hop range.
- **Test:** two or three dedicated Gateway prototypes in a controlled line-of-sight and obstructed field layout, with separate BLE phone-to-Gateway and LoRa Gateway-to-Gateway measurements. Vary cross-cluster traffic 5/15/30/50%, offered load and LoRa airtime; log true packet success, end-to-end latency including wake/connection, regulatory band/duty cycle, and energy. Baseline against BLE-only and simple point-to-point LoRa; no 10 km claim without proof.
- **Decision:** separate Gateway hardware architecture spike after phone MESH-01 baseline, not production commitment.

### P1 · Newly surfaced peer-reviewed technical study: predictive BLE Mesh digital twin (July 2026)

- **Publisher:** https://ieeexplore.ieee.org/document/11680713/ ; DOI 10.1109/MNC69143.2026.11680713; Ciabattini et al., *A Predictive Digital Twin for Online Decision Support in BLE Mesh Networks*.
- **Nature:** IEEE MNC 2026, BLE Mesh testbed; paper describes connectivity prediction, node-QoS prediction and an RL-based controller with **partial** QoS recovery, rather than guaranteed control.
- **Loc8 implication:** points to evidence-calibrated, uncertainty-aware reachability estimation as a future Command/Loc8OS feature. Do **not** label a heatmap as measured coverage where sparse field data or no real paths exist. A digital twin could compare alternative Relay/Gateway placement and produce *predictions* only.
- **Test:** start with a transparent held-out prediction baseline from time/OS-state/device/site link histories. Compare calibration and error versus simple last-observation/link-success heuristics. Defer transformers, RL and auto-placement until enough multi-site datasets exist.
- **Decision:** research/analytics experiment, not a reason to add model dependencies to phone mesh.

### P2 · Newly surfaced peer-reviewed simulation: layered multichannel + hybrid acknowledgements (30 June 2026)

- **Primary publisher:** https://www.iieta.org/journals/ts/paper/10.18280/ts.430323 ; Yu et al., *A Layered Multi-Channel Bluetooth Mesh Data Collection Protocol for Reliable and Energy-Efficient Transmission*.
- **Nature:** ns-3 simulations with grid and Monte Carlo topologies, many-to-one sensor collection, **not** physical smartphones or native Loc8 GATT.
- **Substance:** uses layer-based three-advertising-channel division, parent selection and overheard forwarding as implicit acknowledgement. Simulation improves delivery/energy in selected loads while showing worse age-of-information beyond 14 hops / very large extents.
- **Loc8 implication:** reinforces distinction between local retransmission, observed forward, destination delivery, and fresh source reports. We cannot assume iOS/Android apps can directly select advertiser channels or overhear GATT activity like these custom sensor nodes.
- **Test:** in model/native harness, compare bounded acknowledgement/expiry strategies under duplicate bursts and a collection hot spot, retaining age-of-information and queue-cost measures. Do not change v1 packet or relay algorithm on a simulated gain alone.

### P2 · Platform engineering: Android Wi-Fi Aware as optional *local* bearer

- **Primary API docs:** https://developer.android.com/develop/connectivity/wifi/wifi-aware and https://developer.android.com/reference/android/net/wifi/aware/package-summary .
- **Nature:** established Android capability, **not** new Bluetooth research. BitChat's repo now describes a Wi-Fi Aware mesh transport; that claim alone is not physical range evidence.
- **Loc8 implication:** compatible Android devices may create direct, infrastructure-independent peer connections and transfer more data than BLE, but support varies by device; it is not a universal cross-platform or screen-off relay substitute. Android explicitly cautions discovery-message delivery can fail, reorder or duplicate.
- **Test:** capability detection and *separate* two/three-Android-device Wi-Fi Aware feasibility harness; compare discovery/connection timing, packet loss, energy and phone-state restrictions against BLE. Do not create a silent required Wi-Fi dependency or alter the public UX. Apple MultipeerConnectivity has different APIs/background restrictions.
- **Decision:** bounded optional bearer exploration only after MESH-01, especially for Guard or Gateway transfers.

### P3 · Zephyr firmware release watch (as of 23 October 2026)

- **Primary:** https://docs.zephyrproject.org/latest/releases/index.html and https://github.com/zephyrproject-rtos/zephyr/releases .
- **Status:** Zephyr 4.5 is **planned for October** but is not listed as the latest stable release in the checked official documentation. Last week's three Bluetooth/L2CAP disclosures remain relevant. Do not assert that a 4.5 image is available, or that an unselected Loc8OS hardware stack is affected.
- **Loc8OS implication:** when hardware stack is selected, pin and audit exact firmware revision, queue ownership and security patchset. Reproduce teardown, malformed-message and recovery tests before freezing hardware firmware.
- **Decision:** keep an explicit version gate and scheduled source review; no hardware firmware upgrade claimed.

## What changes operationally after 16 October

1. **Queue capacity is now a P0 diagnostic, not just a generic robustness item.** A 22 October upstream change gives concrete independent evidence that busy offline mesh clients need bounded processing and paced responses. Validate our existing bounds before building something new.
2. **Large-area BLE–LoRa is worth a separate experiment but the attractive coverage figures are *not verified*.** The preprint's non-activated LoRa radio prevents using 10 km or 562 nodes as a deployment estimate.
3. **Coverage heatmaps must distinguish observed links from inferred probabilities.** A predictive digital twin may help Command eventually, but physical phone connectivity and calibration data must come first.
4. **Wi-Fi Aware is a platform-dependent branch, not a replacement for BLE.** It is optional and Android-specific; never silently break offline usage on unsupported phones.
5. **No change to production relay** until both current and branch satisfy frozen physical gates and congestion/power comparison.

## Agent-ready experiment order and acceptance boundaries

1. **P0 R4 implementation audit:** read [R4 handoff](../handoffs/2026-10-16-agent-implementation.md). Check native current/branch queue resource bounds on both platforms and report telemetry already present; add only missing bounded debug counters and deterministic burst/teardown tests. Record no unbounded memory, correct invalidation, controlled response pacing, unchanged wire/TTL/timers and no loss of destination evidence.
2. **P0 Real phones:** run unchanged MESH-01 with A–B–C and B-absent controls (190/200 each direction ≤10 s, zero duplicates, full clock/receipt criteria). Follow with separately preregistered 2/3/4 active-GATT-link long-duration and density/loss cohorts; include matched current-versus-branch.
3. **P1 Dual-radio bench:** write a one-page Gateway experiment protocol specifying exact SoC, BLE bearer, LoRa band/PHY, duties, payload, power, traffic mix, site and distance. Bench-test first; classify analysis versus observation.
4. **P1 Predictive reachability:** create a *read-only*, uncertainty-labelled Command experiment consuming field receipts (only once real field data exist). Evaluate held-out calibration against simple baselines before AI.
5. **P2 Wi-Fi Aware:** capability matrix and Android-only feasibility; no dependency in the consumer build.
6. **P2 Release/security check:** examine Zephyr tag availability and patch lineage when selecting hardware. Retain pending state until verified.

**Hard limits:** Do not merge PR #5/#8 automatically; no app-store release. Never alter the 25-byte payload, native framing, TTL, default `current`, or the no-server-required consumer design in this research intake. No phone tests, battery readings or real LoRa results have been generated by this brief. Evidence from RF instruments and devices stays in the approved private evidence store; redact/hash any receipts in Git.

## Source-quality accounting

- **New publication within window:** BitChat Android v2.0.3, 22 October 2026, engineering release with reproducibility/test notes; field evidence explicitly incomplete.
- **Newly shortlisted but older:** dual-radio BLE–LoRa arXiv preprint (16 April), predictive BLE Mesh digital twin IEEE conference (July), layered BLE data collection simulation (30 June).
- **Evergreen platform engineering / release status:** official Android Wi-Fi Aware API; Zephyr release roster as checked on 23 October.
- **Not found:** a high-confidence peer-reviewed 17–23 October smartphone multi-hop density/coverage field paper or new Bluetooth SIG release requiring a Loc8 protocol redesign.
