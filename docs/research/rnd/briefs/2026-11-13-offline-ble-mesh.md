# Loc8 BLE mesh weekly engineering intake: 13 November 2026

**Window:** 7–13 November 2026 (Europe/London). **Evidence classes:** upstream proposed changes, source/test descriptions, and Loc8 code. No verified newly published peer-reviewed paper this week establishes a stronger phone-to-phone multi-hop range, dense-crowd throughput, or kilometre-scale coverage result. Earlier OEPB/DPCS/clock-drift/LoRa research remains in the previous intake; do not relabel it as new.

## Shortlist and why these changes matter

1. **Android scan-registration recovery, 8 November.** [BitChat Android PR #1037](https://github.com/permissionlesstech/bitchat-android/pull/1037), open and unmerged when reviewed. Their scan-error recovery cleared its own scanning flag before requesting stop. The stop routine then declined to stop the scanner; creating a new callback on every start further broke identity-based registration cleanup. The proposed fix reuses the ScanCallback and forces an actual stop before back-off/restart. The author reports three before/after Robolectric tests and a passing unit/lint suite, but explicitly no physical Mesh Lab run. **Loc8:** scan initiation, recovery and live link delivery need independent instrumentation. The existing frozen native JSONL contains only GATT link-up/down and ingress, *not* scanner registrations or Android scan failure codes. **Next:** reproduce Android adapter OFF/ON, app resume, SCAN_FAILED_ALREADY_STARTED, callback lifecycle, and discovery re-entry with real devices. Only after a native logging schema change has been separately reviewed may a scan-recovery rate be claimed.

2. **Prevent system events from repeatedly initialising the mesh, 8 November.** [BitChat Android PR #1046](https://github.com/permissionlesstech/bitchat-android/pull/1046), open and unmerged when reviewed. Bluetooth/location broadcasts were reported to trigger repeat initialisation and replay intents. An independently defined state policy and single-flight initialisation are proposed. Its author reported a test suite and an *uncommitted* ten-case activity harness, with physical testing still missing. **Loc8:** duplicate native starts and reconnect ownership can distort density and latency numbers, and re-attachment was a previously identified risk. **Next:** toggle radios, lock/unlock and navigate in/out of Consumer and Guard while a mesh session is active, verifying one state transition and no duplicate scan registration or receive listeners. Do not transplant another app's onboarding code.

3. **BLE advertiser identity can stop rotating during concurrent scanning, 12 November.** [Zephyr PR #125574](https://github.com/zephyrproject-rtos/zephyr/pull/125574), open, reports RPA rotation and address-update issues with concurrent scanner/initiator/advertiser roles. The proposal includes host tests, though some extended-advertising cases lack a targeted regression. **Loc8:** this is a *fixed Gateway/Zephyr firmware* concern, not evidence of an Android/iOS fault. **Next:** in dedicated Nordic/Zephyr relays, run passive scan plus connect plus advertising across privacy-address expiry, controller command failures and radio restart. Confirm actual address rotation and reacquisition; record the exact Zephyr commit, board, controller and SDK.

4. **Periodic advertising sync can race Bluetooth disable, tests added 12 November.** [Zephyr change #124595](https://github.com/zephyrproject-rtos/zephyr/pull/124595) was proposed 4 November; its dedicated [native_sim regression tests #125614](https://github.com/zephyrproject-rtos/zephyr/pull/125614) arrived 12 November. Both remain unmerged at review. In-flight periodic-sync calls may act on objects deleted/reused during host shutdown; a generation guard is proposed. **Loc8:** relevant to the separate DPCS fixed-relay low-power track, not current phone GATT. **Next:** run create/delete/disable/re-enable/PAwR sync races under pinned firmware on Nordic hardware, plus whole-path throughput and idle-to-discovery current. Do not promote periodic hardware on native_sim alone.

5. **Bridge must stop location-based forwarding after permission revocation, 11 November.** [BitChat iOS PR #1851](https://github.com/permissionlesstech/bitchat/pull/1851), open. Proposed tests show cached location cells could continue publishing location-based presence and bridge traffic after a permission change until explicit guards and cache clearing. **Loc8:** a future location-scoped Gateway and Guard should not confuse stale cached position with authority to publish. **Next:** permission revoke during scheduled gateway forwarding and delayed location callbacks; verify no new location-derived forwarding, while preserving separately authorised offline operation. Do not infer BitChat and Loc8 have the same bug.

**Large-area conclusion:** none of the above provides a new empirically measured Loc8 range or crowd-capacity limit. Keep separate measurements for (a) discovery and usable connections, (b) delivery through 1/2/3+ hops, (c) density versus traffic/queue contention, and (d) Gateway backhaul. An unchanged 25-byte payload can traverse a gateway only after a separately authenticated, scoped and loop-bounded envelope is designed and tested. The April BLE/LoRa estimates and DPCS per-hop figures are older research, not field acceptance.

## Code/source intake and licence boundary

Read the upstream PR problem statements, implementation descriptions, testing limits and original URLs at the dates above. These are **proposals** rather than released components. Their source repositories include BitChat's public-domain/Unlicense iOS tree, the Android repository's GPL-3.0 licence context, and Zephyr's predominantly Apache-2.0 file-specific terms. File-level and transitive clearance would be needed before copying code into proprietary Loc8. **No upstream source was copied or added as a dependency.** New work is independently authored. The observer only analyses Loc8's existing local diagnostic records; the Android scan recovery is a separate native R&D candidate.

## Implementation (R10)

On `rnd/ble-recovery-2026-11-13`, stacked on the R9/PR #11 branch:

- `src/research/meshRecoveryEvidence.ts`: bounded (20,000 events, 512 local link handles) read-only same-handle disconnect/reopen evidence, local monotonic down-to-up and reopen-to-first-incoming intervals, conservative completeness flags; no raw handles returned.
- `src/research/meshRecoveryEvidence.test.ts` and `tools/mesh-rnd/mesh-recovery.node.cjs`: same-handle and changed-handle controls, no payload/peer ID leaks, invalid capture and clock controls, bounded capacity.
- `app/mesh-field.tsx`: read-only display inside the existing internal Consumer/Guard MESH-01 screen; frozen native JSONL unchanged.
- `modules/loc8-mesh/android/src/main/java/expo/modules/loc8mesh/MeshBleService.kt`: an **Android-native experimental reliability fix**, after inspecting current Loc8 code and finding that `onScanFailed` logged an error without clearing `scanning`, stopping a still-registered callback, or restarting discovery. The callback was already stable, unlike the BitChat defect. R10 now dispatches failure to its owning handler, forcibly stops the registered callback, clears the flag, schedules 2/4/8/16/30-second bounded attempts, cancels retries during radio teardown, and treats unsupported scanner hardware as a stop condition. Actual scan results reset backoff. This is not an imported BitChat patch or a promise of reliable discovery.
- `tools/mesh-rnd/android-scan-recovery.node.cjs`: source-level wiring/ordering contracts. These are **not Android execution tests**. Rebuild and exercise the exact Android module against the SDK and run physical scan recovery before considering any merge.
- R&D CI scopes source execution tests and this branch.

**Careful semantics:** a down-to-up interval on the *same local link handle* is not scan discovery latency or confirmed recovery of a particular peer. Privacy rotation can change handles; incoming native events are not acknowledgements; a blank/no-traffic interval need not be a failure. Incomplete recorder boundaries and overflowing collections cannot support a performance verdict. The 25-byte payload, 47-byte native frame, TTL, relay default and existing runbook are unchanged. Android scanner lifecycle **does change on this unmerged R&D branch only**, and must be validated for callback races, adapter shutdown and background radio limits before production.

## Next experimental protocol and release gate

1. **MESH-01 unchanged**: A–B–C near/isolation/relay blocks, 200 synthetic attempts and the registered delivery threshold (at least 95% within 10 seconds) with B-absent controls, matched iOS and Android physical devices and frozen exports.
2. **Discovery/restart study**, separate from the frozen block: Android scan callback registration, scan error codes, adapter toggle, restart, navigation reattach, background/locked operation and same- vs changed-handle returns. Add scanner/controller events only in a separately registered native instrumentation change, not by rewriting old evidence.
3. **Density and scaling**: controlled 3, 5, 10, 25+ devices with fixed offered load and movement, count end-to-end unique deliveries, p50/p95 latency, physical radio/current measurements where available, discovered peers versus usable GATT links, actual queue depth and retransmissions. Include directed bridge/star/line topologies, bottlenecks, burst and asymmetric loss. No 10,000-person capacity extrapolation without measured RF data.
4. **Large area**: two physically separated BLE islands and two independently powered Gateways with a local LoRa or comparable backhaul. Test no-backhaul isolation, authenticated frame pass-through, duplicate loops, replay and inherited age, disconnect and restart, privacy revoke and recovery. Record range/obstructions and energy.
5. **Decision**: do not change default forwarding or deploy a Gateway merely because recorded same-handle intervals look healthy. Require physical results, native builds and SDK compatibility, source/CI checks and explicit merge/deployment approval.

## Reproduction

```sh
npm ci
node --test tools/mesh-rnd/mesh-recovery.node.cjs tools/mesh-rnd/android-scan-recovery.node.cjs
npm test -- --runInBand
npx tsc --noEmit
npm run lint
```

These commands are a reproducibility prescription. Passing CI must be checked at this branch's exact commit separately. There is no claim that physical phones, RF or Gateway firmware were exercised by this research change.
