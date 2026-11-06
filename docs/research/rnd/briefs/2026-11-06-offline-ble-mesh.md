# Loc8 BLE mesh R9 research and product intake | 6 November 2026

**Window:** 31 October to 6 November 2026 (UTC). **Source of truth:** actual upstream PR metadata/patches checked on 6 November, plus earlier R0–R8 Loc8 branch evidence. **Disposition:** experimental, stacked on R8/PR #10, not merged. This work does not modify radio send/receive behaviour, existing 25-byte application payload, 47-byte native frame, sender timestamps, relay policy, or MESH-01's frozen 14-block trial matrix.

## What is genuinely new

No new peer-reviewed BLE *multi-hop range, crowded-device capacity or large-area* measurement dated within this window was confirmed. Do not reannounce the September clock-drift paper, DPCS, OEPB -01 or April BLE/LoRa preprint as new. The worthwhile current items are engineering changes in a real offline mesh implementation. Open proposals are **not** merged releases and do **not** validate physical Loc8 behaviour.

1. **5 November, open draft [BitChat iOS PR #1846](https://github.com/permissionlesstech/bitchat/pull/1846), commit `348e0b394f75d4ab2ba4759b5d4f8cdbb9eac0b6`: older announcements in sync replies or relays can overwrite newer peer/topology records.** The patch guards announcement ordering across gossip, peer registry and topology. It uses a sender wall-clock timestamp: the author explicitly identifies the failure mode when a sender clock moves backwards, and the draft has not run Xcode/Swift validation. Loc8 currently has no comparable announce/sync/topology protocol, so do not transplant code or add remote timestamp freshness gates. **Loc8 next test:** capture local connection-session order and distinguish out-of-order records from physical radio loss; later, if authenticated peer announcements are designed, require monotonic sequence/epoch semantics and replay handling rather than assuming globally aligned clocks.

2. **1 November, open [BitChat iOS PR #1836](https://github.com/permissionlesstech/bitchat/pull/1836), commit `6f7881851758d5ca8e19444f8f61b2784ab03d31`: directed REQUEST_SYNC can fan out and trigger multiple unnecessary replies.** The proposed fix rejects control packets not addressed to the receiver before duplicate admission. The PR reports passing SwiftPM/simulator tests, but remains unmerged as checked. Loc8 has no such REQUEST_SYNC; this is a future Gateway/courier control-plane design lesson, **not** evidence of a Loc8 defect. **Next test:** for any future targeted gateway control messages, compare exact-recipient, broadcast and wrong-recipient admission under shared packet IDs; ensure unrelated links never respond while legitimate data-plane multi-hop remains possible.

3. **5 November, open [BitChat iOS PR #1845](https://github.com/permissionlesstech/bitchat/pull/1845), commit `03861ed9ad5267612f4d7841f325b800b4c74347`: oversized private messages could remain falsely 'sending' after their one-byte TLV encoding failed.** BitChat's 255-byte limit is **not** Loc8's payload format. We already use an exact 25-byte payload and separate 47-byte native frame. **Next test:** retain strict max/min packet vector tests on iOS/Android; any future gateway outer envelope must fail closed with explicit send status and never requeue unencodable data.

4. **22–23 October, carry-forward for range, not a new-week publication:** open [BitChat Android PR #983](https://github.com/permissionlesstech/bitchat-android/pull/983), commit `eebfdac66bcecdcd98b090a0c438613e7b54a2f9`, proposes optional LE Coded PHY extended advertising, capability detection and fallback. It reports working on two phones but **no measured distance gain**, and remains a draft. Different platform API capabilities and iOS compatibility remain unproven. **Next test:** on explicit hardware-supported Android devices compare legacy vs Coded discovery, connection, throughput, background behaviour and battery at measured distances; use paired body/obstruction/interference controls. No production toggle in this R9 slice.

5. **Previously published BLE Mesh capacity guidance, not fresh research:** Bluetooth SIG's [Mesh Networking primer](https://www.bluetooth.com/bluetooth-mesh-networking-primer/) distinguishes node count from work/traffic capacity. Dedicated advertising-bearer mesh is not equivalent to Loc8's connected smartphone GATT overlay. **Next test:** keep reporting concurrently open GATT links, actual app observations, directed attempts, delivery and contention separately; never infer 10,000-phone performance from a node address-space limit.

### Large-area viability

There is **no new measured, end-to-end Loc8 multi-kilometre result** this week. The earlier optional Gateway/LoRa architecture remains a hardware hypothesis. The next decisive venue experiment is two physically separated BLE islands with two gateways, a scoped authenticated outer envelope carrying an unchanged canonical 47-byte Loc8 frame, loop/age limits, and an outage test. Count delivery on the *destination phone*, not gateway acceptance.

## Product implementation: link-epoch evidence, not remote replay prevention

R9 adds `src/research/meshLinkEpochEvidence.ts`: a bounded read-only interpreter over the native internal MESH-01 recorder. It tracks *local recorded* link-up/down sessions and which ingress, duplicate drops and application deliveries occur before the first observed link-up, while observed open, or after the last observed down. This makes the specific chronology uncertainty visible during real three-phone tests, rather than assuming a recorded message on a hashed handle proves that a peer remained connected.

- Integrated on the **existing internal Consumer and Guard** `app/mesh-field.tsx` field screen; regular production builds still hide this route.
- Counters are aggregate only. No hashed handle, sender identity or raw packet is emitted in the analyser's result. The original operator-exported JSONL remains unchanged.
- Bounded to 20,000 native events and 512 distinct handles. Context/index errors, regressed local monotonic clock, recorder overflow, missing start/stop, or identity cap mark evidence incomplete.
- Repeated link-ups or unmatched downs are *observations to review*, not proof of stale data or security compromise. A dual-role GATT peer may have two paths sharing a handle. Remote announcement ordering cannot be assessed by this event schema.
- No external implementation code, API dependency or firmware from the upstream repositories is imported. Our analysis/tests are independently written; BitChat Android is GPL-3.0, BitChat iOS reports Unlicense on its repository, with licence and test gates required before any future reuse.

**Tests:** source-based Node fixture tests plus Jest regressions for normal session, reuse, prior-up absence, after-down ingress, repeated lifecycle events, invalid monotonic data, bounded handles, no ID leakage and unavailable RF metrics. GitHub CI invokes the scoped tests on this branch and all PRs. No physical delivery, RF collision, background reliability or battery result follows from this code.

### Promotion and repeatable next experiment

Keep all current native relay defaults and packet formats unchanged. Run the documented MESH-01 near/isolation/three-phone relay matrix first, preserving closed exports; then add *a separate preregistered* churn experiment with links going down and up during known frame attempts. Test iOS-to-iOS, Android-to-Android and mixed platforms, radio off/on, background/locked states and deliberate clock offset. Compare this R9 chronology panel with actual receiver delivery logs. Use precise distances and repeated outdoor LOS/NLOS trials before any range claim.

Current work **does not** build or flash a Gateway; firmware sourcing and PHY selection are not silently bundled into the consumer apps.

## Source provenance

Primary upstream files inspected from GitHub PR patches on 6 November: BitChat iOS BLEAnnounceHandler, BLEPeerRegistry, MeshTopologyTracker, GossipSyncManager and tests in #1846; BLEIngressPacketGuard and tests in #1836; BitChat iOS send paths in #1845; BitChat Android LE Coded PHY classes and connection/advertising changes in #983. These are engineering proposals and code reviews, not scientific trials of Loc8. The branch is based on R8 `rnd/ble-evidence-pressure-2026-10-30`, with R0–R8 kept as stacked draft work.
