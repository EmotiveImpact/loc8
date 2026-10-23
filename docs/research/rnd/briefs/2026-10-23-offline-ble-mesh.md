# Loc8 BLE mesh engineering intake | Friday 23 October 2026

**Review window:** 17–23 October 2026. **Scope:** offline, seven-hop directed GATT relays; discovery/range, density/scaling, large-area gateways, and reproducible product experiments. **Evidence discipline:** no newly verified peer-reviewed BLE multi-hop study in this seven-day period displaces the previously integrated September/early October work. The high-value new inputs this week are independently merged engineering changes, not new BLE radio-range measurements.

## Ranked consequential developments

### 1. BitChat Android: bounded chat/mesh load and paced synchronisation (22 October 2026)

Primary source: [permissionlesstech/bitchat-android PR #979](https://github.com/permissionlesstech/bitchat-android/pull/979), opened 22 October 15:42 UTC and merged 17:06 UTC. [Upstream performance review](https://github.com/permissionlesstech/bitchat-android/blob/main/docs/PERFORMANCE_BOTTLENECKS.md).

**What changed.** The upstream team found repeated cache writes, unbounded public/channel histories, redundant gossip sync, eager participant rendering, duplicate queue work, and oversized packet admission. Their implementation now uses 16 workers with 64 queued packets each and an 8 MiB pending byte budget, rejects newest overload ingress, and paces one recent-window sync batch at a time at 20 ms between callbacks. Its documented synthetic 1,000-packet identical-cache probe dropped from 639 redundant response sends to zero; this is not an RF traffic measurement. Upstream reports 635 passing app JVM tests, three skips, 225 Wear tests, successful debug builds and an emulator UI case. Their **physical mesh lab was not run**.

**Loc8 significance.** Our dense-mesh bottleneck may occur in admission, queue scheduling, memory copies and UI work before the radio itself saturates. The precise upstream queue limits are product-specific and must not be copied as Loc8 defaults. Our branch-preserving native mode is already bounded; the missing evidence is observed load at native ingress/egress and controller level.

**Test next.** With the unchanged 25-byte payload and 47-byte native envelope, run controlled 1/5/10+ message-per-second origin loads, two to five live connections, duplicate storms, disconnections/reconnections, mixed OS and foreground/background states. Export unchanged MESH-01 raw events and add explicit native queue-depth, byte-budget, overflow and send-completion counters on a separate reviewed R&D slice. Record p50/p95, drops and peak RSS memory. Distinguish `relay-forwarded` callback from confirmed over-air delivery. Repeat on gateway hardware after phone evidence.

**Reuse/rights.** BitChat Android code carries GPL-3.0 obligations. This intake reads upstream source/review as engineering evidence only: **no implementation code, dependency, worker constants, or protocol code was imported**.

### 2. BitChat Android: 100 ms participant publication coalescing (22 October 2026)

Primary source: [PR #977](https://github.com/permissionlesstech/bitchat-android/pull/977), opened 22 October 12:17 UTC, merged 15:21 UTC.

**What changed.** An event-by-event composition path rebuilt and sorted dense presence lists on Android's main thread. Upstream batches publications over 100 ms, cancels pending work on reset and keeps immediate refreshes where necessary. Its stated 50-event fixture went from 100 list publications to at most one; an emulator-only 2,000-signed-participant case reported largest main-thread pause reduced from 4.77 seconds to 161 ms. This is a UI responsiveness result, not a wireless range or relay throughput result.

**Loc8 significance.** The internal Consumer/Guard MESH-01 screen receives high-frequency native status callbacks. A render bottleneck can hide a radio/data-path problem and compromise the field operator experience even if native recording continues correctly.

**Product integration here.** The existing independently written `src/research/meshStatusCoalescer.ts` was previously imported but not wired into the screen. Wire its 100 ms lifecycle-safe batching to **status presentation only**, preserving transient degraded warnings and the latest relay-mode report. **Never coalesce native packet delivery, diagnostics recording, MESH-01 JSONL export, or relay decisions.** Add screen-wiring and burst/load regression tests. This improvement is a hypothesis for Loc8 UI responsiveness until physically profiled.

**Test next.** Compare render commits and UI stalls before/after 100/1,000/2,000 status events, verify unmount/reset and interrupted field sessions, then prove bit-for-bit unchanged native recorder exports and packet delivery. Record whether real phones produce such bursts; avoid claiming a benefit from a synthetic one if they do not.

### 3. Silicon Labs Bluetooth Mesh SDK 11.0.2: segmented transport/replay fix (14 October, newly useful vendor source)

Primary: [official release notes](https://docs.silabs.com/sisdk-release-notes/latest/sisdk-bt-mesh-release-notes/), published 14 October 2026. This is *outside* the seven-day window, included solely because the October vendor change is consequential for the separate fixed-Gateway firmware lane.

**What changed.** Version 11.0.2 fixes a replay-protection-list update inconsistency when segmented and unsegmented packets from the same source interleave. The documented feature matrix marks Mesh 1.1 **Directed Forwarding and Subnet Bridging unsupported** in that SDK.

**Loc8 significance.** This does **not** indicate a defect in the custom phone GATT relay or prove compatibility. It is a reminder not to assume a standards-based Mesh SDK will supply our proprietary 47-byte Gateway transport, long-range bridge or replay semantics automatically.

**Test next.** On a dedicated firmware bench, interleave segmented/unsegmented sample traffic with the same origin, verify replay and stale-data handling, power-cycle relay nodes and confirm the exact SDK build/version/terms. For large-area coverage, retain the separate two-BLE-island, two-Gateway plus optional LoRa-backbone trial, with identity, authenticity, expiry, loop and hop-budget controls.

### 4. Density-related comparator only: DECT NR+ topology construction (8 October preprint)

Primary: [Samuylov et al., arXiv:2610.12671](https://arxiv.org/abs/2610.12671), submitted 8 October; **not a BLE study and not peer reviewed at this point**. Its simulation examines load-dependent relay selection, association hysteresis, blacklists and beacon placement in dense DECT NR+. The paper reports stabilisation of its own simulated topology and fewer relay nodes in that different radio system. None of its counts or probabilities can be transferred to Loc8.

**Why keep it on the watchlist?** It sharpens a falsifiable Loc8 question: under crowd movement and overlapping links, does a stable relay group beat rapid promotion/reassignment? Before changing native routing, run synthetic graph churn vs hysteresis with sparse-bridge and partition controls, then test physical reassociation frequencies. Avoid calling a static link count actual unique-device density.

## What is implemented in this continuation

- `src/research/meshFieldTelemetry.ts` now computes bounded sliding-window peaks for **recorded** ingress, relay-forward and duplicate-drop actions over one-second windows, alongside the existing link/pending-delay measurements. The label explicitly excludes GATT controller throughput and RF interpretation. The native recorder remains authoritative.
- `app/mesh-field.tsx` now actually uses the independent status coalescer and shows recorded per-second load peaks on the internal Consumer/Guard field panel. Screen teardown cancels pending status publication. Guard reuses that screen.
- Deterministic host tests cover burst counting, missing/invalid timestamps, 2,000-status collapse, event-warning preservation, screen wiring and cleanup. R&D CI is extended to execute the new tests.
- No native radio scheduler, TTL, 25-byte payload, 47-byte framing, branch/current default, production Consumer/Guard UI, encrypted identity, Gateway firmware, app dependencies or lockfiles are modified.

**Provenance and limits:** original upstream implementation code was not copied, adapted or linked. Research sources are included as links and paraphrases. No phone, RF spectrum, battery, large-area, native queue-depth or physical MESH-01 evidence has been collected by this continuation. Host tests and CI must be separately verified against the exact branch SHA; do not interpret an unchecked test as passed. Keeping an R&D draft separate from main is intentional.

## Next acceptance sequence

1. Run the new host contracts, root/Guard TypeScript, Jest, lint and the existing frozen MESH-01 protocol evaluator; label any baseline failures.
2. Build labelled internal Android/iOS field applications from the combined stack and run current-versus-branch MESH-01 on three phones, including B-absent isolation and sparse-bridge topologies.
3. Under controlled offered load, collect native queue occupancy and BLE/HCI event timing independently of JS status/UI. Include long sessions, OS background restrictions, body obstruction and battery/thermal state.
4. Test a dedicated periodic-advertising relay and two separated BLE clusters through optional authenticated Gateway backhaul. Do not claim >7-hop or kilometre-scale coverage from the standalone BLE simulation.
5. Review the resulting physical evidence before any release-default, Gateway or venue-coverage decision.
