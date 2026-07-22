# FLOOR-01 preregistration — floor-transition corpus contract

**Frozen:** 2026-07-22, before prototype implementation or synthetic result
generation  
**Question:** `FLOOR-01`  
**Experiment:** `E03` contract and instrumentation phase  
**Decision unlocked:** whether the versioned data contract and platform-neutral
logger/evaluator seam may be promoted for an Expo SDK 57 device adapter and a
physical pilot recording

## Hypothesis

A privacy-minimised, replayable event stream can represent phone sensor data,
radio observations, device state, clock quality and human-labelled floor
transitions without assuming consecutive numeric floors or treating wall time as
a reliable ordering clock.

This cycle does **not** test floor-estimation accuracy. It tests whether Loc8 can
produce data capable of testing accuracy later.

## Evidence inspected before freezing this protocol

- Current Loc8 `floorMath`, `FloorTracker`, `floorService` and their tests: manual
  integer anchor, relative pressure, fixed `0.42 hPa` default, EMA/hysteresis and
  slow-drift absorption.
- Expo SDK 57 Barometer and sensor documentation: pressure is hPa, iOS may expose
  relative altitude, sensor timestamps are seconds, availability must be checked,
  and the web has no barometer.
- Bermuda `cd46d17e8469`: monotonic freshness, bounded history, calibration,
  velocity rejection, asymmetric RSSI smoothing and 30% immediate/15% historical
  receiver switching. MIT; used as a design reference only.
- Navigine `67e11c4d398a`: radio-level history followed by a two-window,
  100-sample barometer gate with a 2 m minimum; source still contains phone and
  vertical-speed TODOs. MIT; no source copied.
- blelocpp `72b4bd3b32af`: beacon floor votes/likelihoods, building movement
  constraints and a bounded altimeter queue whose simple default detects recent
  relative-altitude variance. MIT; no source copied.
- NavCogAndroid `87f6ed2b353e`: device-specific radio bias and a product lesson
  that unknown phone models may need altimeter gating disabled. MIT; no source
  copied.
- BaroFloorHeight `4158e69b1b3d`: manually delimited stable before/after windows,
  monotonic Android sensor timestamps and uncertainty from pressure variation.
  No licence; ideas only, independently reimplemented.
- Anyplace `722955182375`: persistent building/floor/radio identifiers and
  cross-floor connector concepts. MIT; the old numeric floor representation is
  deliberately not adopted.
- Primary studies: B-Loc, Microsoft *Barometric Phone Sensors—More Hype Than
  Hope!*, the 2021 accelerometer/barometer/Wi-Fi Viterbi study and MagneFi. They
  motivate raw pressure, sample time, device/building cohort, temperature/HVAC,
  transition interval/mode/direction, stable landing windows, radio/IMU fields,
  same-floor controls and held-out evaluation.

## Scope

### Included in this cycle

1. A versioned JSON corpus schema and human-readable data contract.
2. A dependency-free platform-neutral recorder/validator/evaluator.
3. Deterministic valid and adversarial synthetic sessions.
4. Clock-offset/drift, sequence, ground-truth coverage, sensor completeness and
   privacy-leak checks.
5. A benchmark proving that the pure validator is practical for offline replay.
6. An exact adapter contract for a later Expo SDK 57 logger.

### Excluded from this cycle

- application UI or integration with the existing production `floorService`;
- physical phone or building recordings;
- claims about sensor accuracy, sampling reliability, background operation,
  battery, transition classification or supported phone models;
- HMM/Viterbi or other floor estimator implementation;
- raw GPS, camera, microphone, names, email addresses or account identifiers;
- unredacted Wi-Fi SSIDs/BSSIDs or BLE MAC addresses; and
- copying code from the retained repositories.

## Contract to freeze

### Session manifest

Every session must state:

- schema, recorder and study protocol versions;
- random session ID plus study-scoped pseudonymous participant, building and
  device-profile IDs;
- building-map version and the stable level/connector IDs used by ground truth;
- platform, OS, app build, device model and declared carry position;
- sensor/radio capability and permission state, requested sample interval and
  unit for every stream;
- monotonic clock source, wall-clock source and at least two clock-sync points;
- explicit consent protocol/version/time, permitted uses and withdrawal token;
- retention class, delete-after time, raw-data location and encryption state;
- radio identifier transform/key epoch; and
- declared exclusions/deviations.

### Event envelope

Every event must contain `schemaVersion`, `sessionId`, contiguous `sequence`,
`kind`, integer `monotonicUs`, integer `wallTimeMs`, non-negative
`clockUncertaintyMs`, `source`, and a kind-specific `payload`.

Allowed v1 event kinds are:

- `session-start`, `session-end`, `clock-sync`, `sensor-status`;
- `pressure`, `motion`, `steps`, `magnetic-field`;
- `radio-observation`, `phone-state`;
- `ground-truth-segment`, `ground-truth-point`; and
- `operator-note` with an enumerated code rather than free personal text.

Ground-truth segments use stable semantic `levelId`, `connectorId` and
`landingId` strings. Transition modes are `stairs`, `lift`, `escalator`, `ramp`,
`unknown`; direction is derived from ordered source/destination levels but also
recorded as `up`, `down` or `level`. A `same-floor-control` segment is a
first-class label, not an absence of labels.

### Time model

- `sequence` and `monotonicUs` establish ordering within a session.
- `wallTimeMs` is for human correlation and retention, never ordering.
- `clock-sync` events record local send/receive monotonic times, reference wall
  time, estimated offset, round-trip time and uncertainty.
- Sensor-native timestamps are retained in the payload with their declared
  source/unit and converted once into session `monotonicUs`.
- Clock discontinuity, process restart or source reset starts a new segment or
  session; it must never be silently repaired.

## Privacy, consent and retention gate

The prototype must fail closed if the manifest lacks explicit consent or a
future deletion time. Direct person identifiers and raw infrastructure
identifiers are forbidden fields. Radio observations may contain only a
study/site-keyed pseudonymous transmitter ID and key epoch; hashes must not be
unsalted global fingerprints.

The proposed physical protocol is restricted to consenting adult R&D
participants in an authorised building. Raw pseudonymised sensor/radio streams
are encrypted at rest, access logged, and deleted no later than 12 months after
collection unless an approved successor protocol shortens or extends that
period. The participant receives a random withdrawal token; mapping from that
token to sessions is kept separately. Published fixtures/metrics contain no raw
radio identifiers or precise site address.

No identifiable field data may be collected autonomously. Owner approval and an
approved participant/site protocol remain required.

## Pre-registered pure-prototype gates

All gates below must pass before the contract is promoted to an Expo adapter:

1. **Schema/round trip:** the canonical synthetic session serialises to JSONL,
   parses and reproduces the same ordered events with zero validation errors.
2. **Fail closed:** 100% of named adversarial fixtures are rejected, including
   missing consent, expired/missing retention, raw BSSID/MAC/SSID, free-text
   notes, unknown event kinds, invalid units/ranges, unknown level/connector,
   non-contiguous sequence, non-monotonic timestamps, excessive clock
   uncertainty, missing start/end, overlapping/gapped truth and undeclared
   sensor streams.
3. **Time sync:** the canonical fixture has at least two sync points; estimated
   uncertainty is at most 100 ms; absolute drift is at most 5 ms/minute. A
   fixture exceeding either value is rejected for transition-timing analysis.
4. **Ground truth:** every analysis interval is covered exactly once by a
   transition, landing/stationary or same-floor-control segment, with no gap or
   overlap greater than 100 ms. Every transition references known source and
   destination levels and a declared connector.
5. **Completeness:** the evaluator reports received/expected samples, dropout,
   median interval and p95 interval for every declared periodic stream. The
   canonical fixture has zero missing sequence entries and no undeclared stream.
6. **Data minimisation:** a recursive forbidden-field/value scan reports zero
   direct identifiers or raw radio identifiers in the canonical fixture.
7. **Replay practicality:** validate and evaluate at least 50,000 deterministic
   events in under 5 seconds on the recorded local Node runtime. This is an
   offline regression gate, not a mobile performance or battery claim.
8. **Determinism:** two immediate benchmark runs produce identical validity,
   event-count and cohort-summary results; timing may differ and is reported.

## Later physical-pilot gates

These gates remain **REPEAT** until suitable hardware/site authority exists:

1. At least one supported iOS phone and one supported Android phone each record
   a 15-minute pilot with pressure plus available motion streams.
2. Each pilot has zero schema/order errors and no unexplained recorder gap over
   two requested pressure intervals.
3. Two or more reference clock checks keep uncertainty at or below 100 ms; a
   worse session is retained with a quality flag but excluded from timing claims.
4. Manual ground-truth actions are confirmed at both landings, and a second
   observer checks the transition labels from the event timeline.
5. The exported bundle can be deleted using its withdrawal/session token and
   restored only from the documented encrypted research location during its
   retention window.
6. No direct identifier or raw BLE/Wi-Fi infrastructure identifier appears in
   the exported bundle.

These are instrumentation gates only. `E03`'s later corpus gate still requires
at least 30 transitions per mode/site cohort, same-floor controls, multiple
buildings and multiple device models before `FLOOR-02` accuracy work begins.

## Decision rule

- **PROMOTE contract/core:** every pure-prototype gate passes. Promote only the
  schema, recorder/validator interface and tests.
- **REPEAT adapter/pilot:** keep Expo/native adapters and all device/building
  support claims in research until the physical gates pass.
- **HOLD field collection:** consent/site authority, encryption/deletion or
  stable semantic building IDs are unavailable.
- **STOP/redesign:** the format cannot replay raw evidence, time-source resets
  cannot be represented, privacy checks require retaining direct identifiers,
  or the schema bakes floor meaning into consecutive integers.

No green result in this cycle can authorise automatic floor display, safety or
accuracy claims.
