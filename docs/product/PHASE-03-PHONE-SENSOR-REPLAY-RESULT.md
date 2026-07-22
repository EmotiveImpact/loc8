# Phase 3 result — phone sensor adapter and floor-journey replay

**Measured:** 2026-07-22

**Decision:** **PROMOTE** the dependency-injected Expo SDK 57 normalisation
contract, strict replay format and explicitly non-live Command development tool.
**REPEAT** permissions, delivered rates, background behaviour, recorded-file
handling and estimator output on supported iOS and Android hardware. **HOLD**
physical collection, automatic floor display, accuracy, building and deployment
claims. **STOP** silent collection, replay-as-proof and the incorrect historical
rotation-rate axis note.

## What now works

- The shared engine exports a lifecycle-controlled phone sensor adapter for
  Barometer, DeviceMotion and Magnetometer. It checks availability and
  permission, sets requested intervals before listening, isolates source
  failures and removes every subscription on stop.
- Permission requests occur only when a caller passes
  `requestPermissions: true`. Construction performs no collection, storage,
  network send or boot-time side effect.
- Native timestamps remain seconds and are mapped once to a session-relative
  monotonic-microsecond axis. Invalid payloads cannot advance the accepted
  timestamp; negative, non-finite and regressing samples fail closed.
- The Expo-backed factory is native-only and not bundled into Command. Guard's
  Expo config now has the sensors plugin and a plain iOS motion usage message.
- `loc8.floor-replay.v1` strictly validates evidence class, venue identity,
  levels, connectors, capabilities, exact event shapes, sequence/time order,
  units, sensor bounds and a 2 MB / 20,000-event import ceiling.
- A deterministic 30-second Ground → Level 1 → Level 2 synthetic journey drives
  the existing anchored barometer tracker. Motion and magnetic readings are
  retained and displayed but do not influence the estimate.
- Command Commissioning has a functional **Sensor replay** view with play/pause,
  1×/2×/4× speed, forward/back event steps, range seeking, reset, strict file
  input and a paste validator. It shows truth, estimate, difference, source
  counts, recent events and native-repeat holds.
- Invalid pasted JSON is rejected without replacing the valid journey. Every
  state remains visibly `SYNTHETIC REPLAY` or `RECORDED · UNVERIFIED`; no live
  phone, building or accuracy result is implied.

## SDK 57 correction found during implementation

The frozen FLOOR-01 adapter note had reused Expo's Euler-orientation description
(alpha around Z, beta around X, gamma around Y) for `rotationRate`. The installed
SDK 57 `DeviceMotion.d.ts` instead defines rotation-rate alpha, beta and gamma as
X, Y and Z. The production adapter and named conversion test now use
alpha→x, beta→y and gamma→z before deg/s → rad/s conversion.

This is recorded as an erratum in the FLOOR-01 prototype README and Phase 3
preregistration. The JSON schema did not change; the semantic mapping into its
existing X/Y/Z fields was corrected. Native platform parity remains a physical
repeat, not an assumption.

## Measured evidence

| Gate | Result |
|---|---:|
| Focused sensing/replay suite | 59/59 passed |
| Full product regression | 35/35 suites, 432/432 tests |
| Root, engine, Guard and Command TypeScript | passed |
| Command production build | passed, 78 modules transformed |
| Expo lint | passed |
| Expo Doctor | 20/20 checks passed |
| Guard Expo config introspection | sensors plugin + `NSMotionUsageDescription` present |
| Dependency audit | 0 vulnerabilities |
| Git whitespace check | passed |

The full Jest run emits the existing Expo Go remote-notification warning from
the Guard projection import. It is not a test failure and Phase 3 does not
change notification behaviour.

## Browser and design verification

The Codex in-app browser exercised the real Command UI:

1. play/pause advanced the deterministic journey;
2. 4× playback completed at 0:30 with truth and estimate both at Level 2 and a
   zero-floor difference;
3. previous/next event controls and reset returned deterministic states;
4. range seeking reached the final same-floor control;
5. invalid pasted JSON was rejected while the existing synthetic journey and
   evidence class remained intact; and
6. the final 1280×720, 900×900 and 390×844 views had document widths equal to
   their viewports.

Final browser logs contained development info/debug output only and no warning
or error. No P0/P1/P2 visual finding remains. Evidence:

- `evidence/phase-03-source-sensor-replay.png`
- `evidence/phase-03-sensor-replay-desktop.png`
- `evidence/phase-03-sensor-replay-tablet.png`
- `evidence/phase-03-sensor-replay-mobile.png`
- `evidence/phase-03-visual-comparison.png`
- root `design-qa.md`

The preserved concept's alternate Sensor replay state no longer has its styled
visualisation host, so the same-state source capture is intentionally unstyled.
It still preserves the original controls, data hierarchy and copy for the
900×900 structural comparison; the saved Phase 1 concept remains the visual-
system reference.

## What this does not prove

- No phone sensor, OS permission prompt, delivered interval, native bridge,
  background/suspended execution or application binary was exercised.
- No participant, real building, plan, floor transition or recorded research
  file was collected.
- The Level 2 result is deterministic synthetic replay, not an accuracy metric.
- Motion and magnetic evidence are not fused into the estimator.
- The new native factory is not automatically started by Guard and there is no
  approved collection/export workflow.
- Supported Xcode, physical devices, site/participant authority and approved
  evidence storage are still external requirements.

## Product consequence

Loc8 can now develop and regression-test the complete phone-evidence → replay →
floor-estimator seam without waiting for a venue on every code change. The same
strict venue IDs connect mapping, Gateway distribution and replay. Physical
evidence is deliberately the next class of proof, not something synthetic data
can manufacture.

## Exact next repeat

1. Extend Commissioning with permissioned plan import and control-point
   registration using synthetic fixtures first; repeat with a second operator
   and real plan only when authorised.
2. Select and preregister a supported durable Gateway runtime/store before
   restart, concurrency and power-loss implementation.
3. On supported iOS and Android devices, run the frozen FLOOR-01 permission,
   timestamp, delivered-rate, background and recorded-journey cohort under
   approved consent/storage/deletion controls.
4. Keep automatic floor display and floor-accuracy claims held until multiple
   buildings, device models, transition modes and same-floor controls pass.

## Reproduction

```text
npm test -- --runInBand --no-cache
npx tsc --noEmit --pretty false
npx tsc -p packages/engine/tsconfig.json --noEmit --pretty false
npx tsc -p apps/guard/tsconfig.json --noEmit --pretty false
npm run build --workspace @loc8/command
npm run lint
npx expo-doctor
(cd apps/guard && npx expo config --type introspect --json)
npm audit --audit-level=low
git diff --check
```
