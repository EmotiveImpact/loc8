# Phase 3 preregistration — phone sensor adapter and floor-journey replay

**Frozen before implementation:** 2026-07-22

**Post-freeze correction:** implementation audit found that the earlier
FLOOR-01 note reused Expo's Euler-orientation axis description for
`rotationRate`. The SDK 57 installed type contract defines rate alpha/beta/gamma
as X/Y/Z. Acceptance gate A1 therefore uses alpha→x, beta→y, gamma→z before the
deg/s → rad/s conversion. The deviation is recorded rather than hidden; native
physical parity remains a repeat gate.

**Decision:** whether Loc8 can promote an exact Expo SDK 57 sensor-normalisation
adapter and a deterministic product replay path without collecting physical
data or implying that replay proves floor-detection accuracy

**Evidence class:** dependency-injected TypeScript, fake native sensor ports,
strict imported JSON, browser replay and a synthetic four-level venue; no phone,
permission prompt, background mode, real building or estimator-accuracy evidence

## Product boundary

The adapter normalises Expo SDK 57 Barometer, DeviceMotion and Magnetometer
callbacks into one privacy-minimised event contract. It performs no persistence,
upload, participant identification or floor claim. Starting collection remains
an explicit, future user/consent action; this increment must not silently start
the full evidence adapter at Guard boot.

The replay path accepts a strict `synthetic` or `recorded-unverified` journey.
It may run the existing anchored barometric `FloorTracker` against those samples
and compare it with declared truth labels, but the output is development
evidence only. Motion and magnetic samples are displayed/retained for future
fusion; they are not secretly treated as a validated estimator.

## Acceptance gates

### A. Expo SDK 57 phone adapter

1. The implementation follows the version-pinned SDK 57 contract: barometer
   pressure is hPa; relative altitude is optional/iOS-only; motion acceleration
   is m/s²; rotation rate is converted deg/s → rad/s with the frozen axis map;
   calibrated magnetometer values are μT; native timestamps remain seconds.
2. Every source checks availability and permission before listening, sets its
   requested interval before `addListener`, reports denied/unavailable/error
   state and removes every returned subscription on stop.
3. Permission requests occur only when a caller explicitly asks for them. A
   denied/undetermined source does not synthesize samples or silently downgrade.
4. Native timestamps are preserved and mapped exactly once onto a session
   monotonic-microsecond axis. Non-finite, negative or regressing samples fail
   closed and are reported without crashing other streams.
5. The adapter is dependency injected for deterministic testing and exports an
   Expo-backed factory. It performs no storage, network send or automatic boot.
6. Guard native configuration includes the Expo sensors plugin and a plain
   `NSMotionUsageDescription`; Expo Doctor/config validation passes.

### B. Deterministic replay contract

1. A strict schema-versioned replay bundle contains stable building/package/map
   identity, level/connector references, declared capabilities, contiguous
   sequence, monotonic elapsed time and exact kind-specific payloads.
2. Unknown fields/versions/kinds, invalid IDs/numbers/vectors/orientation,
   missing/unavailable sources, non-contiguous sequence, time regression,
   native timestamp regression, identity/topology mismatch, oversized JSON and
   excessive event counts fail closed.
3. The format has only `synthetic` and `recorded-unverified` evidence classes.
   Import never changes either class to physical/verified truth.
4. A deterministic synthetic multi-floor ramp journey is generated from the
   current venue package. Repeated generation and replay produce identical
   canonical output and frame summaries.
5. Replay drives the existing manual-anchor/barometer FloorTracker. It exposes
   declared truth, estimate, transition context, source counts and latest
   observations without claiming motion/magnetic fusion.
6. A bounded JSON parser supports future privacy-reviewed recorded imports. The
   research FLOOR-01 corpus still requires its own validator/governance lane;
   this product format does not replace it.

### C. Command product and verification

1. Commissioning gains a functional `Sensor replay` view using the current
   venue package and existing Command design system.
2. Play/pause, event step forward/back, reset, speed and timeline seeking work.
   The current truth/estimate, level stack, pressure/motion/magnetic readings,
   transition context and event counts update from replay state.
3. A local JSON file control accepts only a valid matching replay bundle and
   reports rejection without losing the last valid journey.
4. Visible copy always says synthetic replay or recorded-unverified; no sensor
   is described as live and no replay is described as field proof.
5. At least 25 named invalid/adversarial replay/adapter cases plus lifecycle,
   conversion, determinism and import tests pass.
6. Full Jest, root/engine/Guard/Command TypeScript, lint, Command build, Expo
   Doctor, dependency audit, Markdown links and Git whitespace gates pass.
7. Real-browser playback, seek, speed, reset, import rejection and responsive/
   console checks pass; all P0/P1/P2 visual findings are fixed.

## Automatic hold/failure conditions

- The full adapter begins collecting automatically during Guard boot.
- Permission denial/unavailability produces fake readings or an active status.
- Web/synthetic replay is presented as native, background, building or accuracy
  evidence.
- `relativeAltitude` is treated as absolute elevation/floor, or motion/magnetic
  values influence the estimator without an explicit validated fusion model.
- An imported journey can reference another building/map or add arbitrary data.
- Recorded files are persisted, uploaded or exported without a separately
  approved privacy/security workflow.

## Promotion rule

PROMOTE the normalisation/lifecycle contract and replay development tool only if
all local gates pass. REPEAT supported iOS/Android permission, sampling,
background and recorded-journey tests under the frozen FLOOR-01 protocol. HOLD
floor accuracy, automatic floor display and physical data collection until the
owner supplies authorised devices/site/participants/storage and the physical
cohorts pass. STOP replay-as-proof and silent sensor collection.
