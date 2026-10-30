# Loc8 offline BLE mesh engineering intake | Friday 30 October 2026

**Review window:** 24–30 October 2026. **Scope:** consumer/Guard directed GATT multi-hop forwarding, local range and discovery, dense joins, churn, security/age evidence, and optional large-site Gateway hardware. **Baseline:** draft PR #9 `rnd/ble-load-metrics-2026-10-23`, stacked on R6/R3 work. No change to 25-byte application payload, 47-byte native frame, TTL, wire compatibility, default current relay mode or frozen MESH-01 acceptance.

## Ranked genuinely consequential additions

### 1. Real-phone clock skew causes false offline receive failures

**Verified upstream engineering:** [BitChat Android PR #998](https://github.com/permissionlesstech/bitchat-android/pull/998), opened 24 October and **merged 27 October**. Their debug Mesh Lab receive hooks compared **sender wall-clock timestamps** with the receiver's command start, silently discarding an arrived message when two phones were approximately **140 seconds apart**. The merged change instead records message IDs already present when the command starts and accepts newly observed IDs. They report **11/12** Mesh Lab physical scenarios passing after the fix. The remaining voice-broadcast case uses a separate ±30 s product freshness rule and still failed under skew.

**Why Loc8 cares:** do not confuse a stale-looking sender timestamp, a native monotonic receive time, an application's freshness policy, and radio delivery. An incorrectly chosen clock domain can turn successful multi-hop arrival into a false loss. Loc8's existing MESH-01 offline evaluator has explicit cross-device sync/uncertainty gates; the local Consumer/Guard recorder only contains single-device monotonic rows. Keep them distinct.

**Test next:** two-phone and three-phone captures with phone clocks offset by +140 s and -140 s, same frozen 25-byte packet vectors and packet sequence IDs; keep freshness/security acceptance independently tested rather than silently widening replay windows. Confirm receive event recording cannot be filtered by sender wall time; use measured clock offsets only in the authorised multi-device evaluator. Include app restart, locked state and background recovery.

**Built in R8:** a read-only **per-device** BigInt monotonic integrity and churn/schedule-pressure view. It never compares clocks from different phones or claims cross-device latency. This is diagnostic correctness, not a change in native acceptance/security policy.

### 2. Concurrent relay snapshots and security-cache clean-up races

**Verified upstream engineering:** [BitChat Android PR #1006](https://github.com/permissionlesstech/bitchat-android/pull/1006), opened and **merged 26 October**. Upstream fixed concurrent security-cache traversal and a race when snapshotting **Nostr relay WebSocket connections** while the last relay connection disappears. This is NOT a finding about BLE GATT links. They report 742 JVM phone tests passing and no physical paired-device lab run for the change.

**Why Loc8 cares:** a dense or moving crowd repeatedly joins and leaves. An analogous disappearing **BLE link** must not crash or corrupt a Loc8 field session, confuse queue accounting, or permit stale peer state. This is a hypothesis for Loc8's distinct transport, not a bug imported from the Nostr implementation. This is an implementation-race signal, not proof Loc8 has the same defect.

**Test next:** inject disconnects during send/snapshot/stop; run Android native Handler and iOS role-state tests plus physical repeated connects at 2/3/5 links. Verify no double completion or stale queue ownership. Maintain immutable snapshot/export semantics.

**Built in R8:** record-only peak link transitions in a rolling one-second window; simultaneous outstanding **scheduled event records**, unresolved schedules and completions without preceding schedules. These are *not* actual controller collisions or native GATT queue occupancy. No locking/scheduler change is justified without reproducing a Loc8 race.

### 3. Density: join-triggered announce amplification

**Promising but NOT merged:** [BitChat iOS PR #1811](https://github.com/permissionlesstech/bitchat/pull/1811), **opened as a draft 25 October**. Its in-process simulated BLE service model reports 16,860–17,251 announce frames during a 6×6-grid join before its proposed change versus **896** after, with similar simulated reach. The proposal re-announces when the node's own neighbour set grows, not on every verified received announcement; it explicitly trades immediate population awareness for learning during a later periodic interval (roughly 10–40 s).

**Why Loc8 cares:** relaying in a dense crowd can be overwhelmed by discovery/control traffic even when payload fanout is bounded. BitChat's signed ANNOUNCE design is **not** Loc8's native GATT discovery/packet semantics. Do not transplant the suppression rule or quoted savings to Loc8.

**Test next:** profile native BLE discovery/connection churn and repeated status events on 7-node chain, single-bridge, 5×5 crowd and moving/joining groups. Distinguish locally originated discovery signals from application-level relay-forward actions. Verify whether a change in *Loc8* discovery frequency improves airtime without delaying new link establishment or stranding sparse branches.

**R8 contribution:** link-transition peak and unmatched schedule evidence become visible in the internal field screen, alongside prior ingress/duplicate/relay peaks. The design is a measurement starting point, not proof of announce storms or RF capacity.

### 4. Cross-platform byte-exact forwarding and message integrity

**Open reviews, not merged:** [BitChat iOS PR #1805](https://github.com/permissionlesstech/bitchat/pull/1805) and [Android PR #994](https://github.com/permissionlesstech/bitchat-android/pull/994), both opened 24 October. Their cross-platform test-vector work exposes a signed-packet interoperability case: different DEFLATE compressors yield different bytes for the same decoded message, making a reconstruct-and-sign/verify strategy unsafe. The proposals preserve received compressed wire payloads and add exact shared vectors; both remain review proposals, not accepted release behaviour.

**Why Loc8 cares:** Loc8 currently uses a smaller fixed payload, not BitChat's signed compressed protocol. The transferable principle is to keep canonical original bytes through a forwarding hop and replay the same golden vectors on iOS and Android. This protects the 25-byte/47-byte contract and avoids introducing a codec-dependent relay regression.

**Test next:** run frozen `wire-v1-golden.json` and actual native iOS/Android framing across forwarding, TTL decrement, dedup and reconnect, then compare exported bytes. No BitChat serializer or wire signing code is imported.

### 5. Foreground-service and Wi-Fi Aware lifecycle, an open lead

**Not yet merged:** [BitChat Android PR #1007](https://github.com/permissionlesstech/bitchat-android/pull/1007), opened 26 October. Its proposed recovery changes cover denied foreground-service promotion, permission withdrawal and stale asynchronous cleanup. Upstream reports JVM tests but physical Mesh Lab was blocked. Wi-Fi Aware is optional and is not evidence of BLE range.

**Next test:** Android 12–16 permissions denial/regrant, phone restart, background/foreground transition, scan-only state, and a forced disconnect. Validate Loc8's exact native integration separately; do not copy lifecycle logic from an unmerged competitor PR.

## Publication freshness and large-area coverage

No newly verified peer-reviewed **BLE multi-hop** radio/range paper published during **24–30 October** demonstrated an improvement that supersedes Loc8's already logged September/October sources. Do not rename the older clock-drift model, DPCS hardware study or BLE–LoRa analytical preprint as this week's new findings. A public GitHub PR and its simulation are engineering signals, not peer-reviewed radio measurements.

For **large-area viability**, the previous two-island Gateway + optional LoRa/long-range bearer protocol remains the relevant controlled experiment: preserve the 47-byte native frame inside a separately authenticated, age- and hop-bounded Gateway envelope, test outage/loop behaviour, and collect actual geometry and battery/current evidence. There is **no new measured kilometre-scale Loc8 result this week**.

## Product change set, rights and verification

- `src/research/meshFieldPressure.ts`: separate bounded, independently authored device-local analysis of native MESH-01 event rows. Detects local monotonic regressions, invalid rows/contexts and overflow; measures 1 s link-transition bursts, pending *recorder* schedule counts and unpaired schedule completions. Uses BigInt for uptime precision; produces counts only, no raw frame IDs/peer handles.
- `app/mesh-field.tsx`: surfaces this analysis in the already gated internal Consumer/Guard field kit. The native recorder, exported JSONL, actual packet listeners and relay engine are untouched. Normal production screens remain excluded.
- `src/research/meshFieldPressure.test.ts`, `tools/mesh-rnd/mesh-field-pressure.node.cjs`: device-clock skew/large uptime, lifecycle, burst bounds, duplicate schedule and incomplete-export regressions.
- R&D CI added to the new branch and runs the host checks alongside the existing stack. **Distinguish local isolated checks from GitHub CI, native builds and physical results** in the delivery receipt.
- Original third-party implementation code, GPL repositories, schemas and source distributions were **not imported or copied**. This source-intake uses summaries and links only. Existing licence screen still applies.

### Reproduction and promotion gates

Run from the exact R8 branch:

```sh
npm ci
node --test tools/mesh-rnd/mesh-field-pressure.node.cjs tools/mesh-rnd/field-telemetry.node.cjs
npm test -- --runInBand
npx tsc --noEmit
npx tsc --noEmit -p apps/guard/tsconfig.json
npm run lint
node tools/mesh-rnd/verify-branch-integration.cjs --rerun
```

**Hold** current relay as production default. Require the frozen MESH-01 controls, real Android/iOS phones, isolated branches, skewed clocks, rapid churn, native queue/HCI instrumentation and 10 s arrival/200-attempt reliability evidence before adopting any forwarding/discovery changes. Gateway firmware/range still needs its own physical test, never inferred from simulated spans.
