# Multi-storey floor detection

## Executive answer

Loc8 should not try to infer an absolute floor from phone pressure alone. The
reliable design is **anchor + assist + topology**:

1. obtain an absolute floor anchor at entry, a stair/lift landing, or a trusted
   map registration;
2. use relative barometer and motion signals to detect vertical transitions;
3. correct phone/weather drift from fixed venue sensors when available;
4. use radio observations as noisy floor/zone evidence;
5. prohibit physically impossible transitions with the building's connector
   graph; and
6. estimate a probability distribution over floors, expose confidence and
   freshness, and retain manual confirmation.

This is the recurring result across the strongest papers and codebases. Reported
single-study accuracies of 98-99% are encouraging, but they were achieved in
particular buildings, phones and protocols. They are targets to reproduce, not
product guarantees.

## What Loc8 has today

The shared engine already has a sensible safety baseline:

- `floorService.ts` treats a manual anchor as the source of truth;
- `floorTracker.ts` detects relative barometer transitions and absorbs slow
  weather drift;
- `floorMath.ts` smooths pressure and defaults to about **0.42 hPa / 3.5 m per
  floor**.

That implementation is deliberately relative and within-device. Its limits are:

- a fixed 3.5 m storey assumption;
- no cross-device pressure calibration;
- no fixed ambient-pressure reference;
- no lift/stair/escalator classifier;
- no radio-floor observation model;
- no constraint that a transition occurs at a real vertical connector;
- no probability distribution or evidence trace; and
- no learned venue-specific floor heights.

The next step is not another threshold. It is a floor-estimation service that
combines evidence while keeping manual truth available.

## What the research says

### Barometers are good transition sensors and weak absolute-floor sensors

- B-Loc reported over 98% in a ten-storey field study using crowdsourced
  barometric fingerprints.
- Microsoft's “More Hype Than Hope!” study found floor-change and transition-mode
  detection could approach 100% over three device types and seven buildings, but
  emphasised commodity-sensor and environmental variability.
- A 2021 Viterbi system combining accelerometer, barometer and modelled Wi-Fi RSS
  reported 99.1% real-time floor accuracy over 116 minutes, seven floors and 76
  floor changes, versus 91% for RSS alone.
- NavCog disables altimeter transition checking on phones outside a known model
  allowlist. That product choice matters more than an impressive aggregate paper
  number.

Pressure changes with weather, HVAC, doors, device offset and temperature. A
fixed venue sensor at known elevation can provide an ambient reference, while a
phone's short-term pressure delta remains useful for detecting movement.

### BLE/Wi-Fi RSS is categorical evidence, not a tape measure

Bermuda and room-assistant converge on “nearest calibrated receiver” after
filtering, staleness rules and hysteresis. Bermuda's asymmetric smoothing and
30% immediate/15% historical switching margins are especially useful patterns.
ESPresense adds robust percentile/IQR filtering and enter/exit hysteresis but is
AGPL, so Loc8 should independently implement the idea.

Radio fingerprints can initialise or correct a floor estimate. They should not
make an instant jump across several storeys because one scan was noisy.

### Building topology is a sensor

A person normally changes floors at a mapped stair, lift, escalator or ramp.
Navigine/blelocpp constrain particles with building geometry; multi-floor
S-Graphs explicitly represents floors and the transition keyframes connecting
them. A floor estimator should assign very low probability to a transition while
the 2D position is far from every connector, but retain an “unknown/unmapped
connector” path so bad maps do not lock the system into a false floor.

### Vertical trajectory shape identifies the transition

The active `feature/multi_floor` S-Graphs branch uses regression over recent SLAM
keyframe z values and an `ON_FLOOR`/`ASCENDING`/`DESCENDING` state machine. Phone
IMU/barometer data can use the same independent idea:

- stairs: oscillating steps plus gradual pressure change;
- escalator: smooth/near-constant vertical rate with a standing or stepping
  pattern;
- lift: characteristic acceleration/deceleration with rapid smooth pressure
  change; and
- ramp: slow vertical change while the horizontal route follows a mapped ramp.

Classification is useful evidence and operational context; it must not silently
override an absolute anchor.

## Proposed `FloorEstimate` contract

```ts
type FloorId = string; // semantic ID, not assumed to be a consecutive integer

interface FloorCandidate {
  floorId: FloorId;
  probability: number;
}

interface FloorEvidence {
  kind: 'manual' | 'signed-anchor' | 'barometer' | 'motion' |
        'ble-zone' | 'wifi-fingerprint' | 'wifi-rtt' | 'map-registration';
  observedAt: number;
  sourceId?: string;
  quality: number;
  detail?: Record<string, unknown>;
}

interface FloorEstimate {
  buildingId: string;
  bestFloorId: FloorId | null;
  candidates: FloorCandidate[];
  confidence: number;
  observedAt: number;
  lastAbsoluteAnchorAt: number | null;
  transition: 'none' | 'stairs' | 'lift' | 'escalator' | 'ramp' | 'unknown';
  evidence: FloorEvidence[];
  requiresConfirmation: boolean;
}
```

Never encode floor as only an integer. Real sites contain `B2`, `B1`, `G`, `M`,
`1`, `2A`, plant levels, skipped 13, and split levels. Internally use a stable
ID, an ordered elevation, and a venue-facing `levelRef` label.

## Estimator design

Use a hidden Markov model/Viterbi estimator for the first implementation; a
particle filter becomes worthwhile when 2D position and route are estimated in
the same process.

For each time window:

1. **Predict:** use vertical delta, transition mode, elapsed time and the
   connector graph to assign probability to staying or moving to adjacent
   reachable levels.
2. **Observe:** score signed anchors, radio-floor fingerprints, calibrated
   nearest-zone evidence, map registration and optional RTT/UWB/AoA.
3. **Normalise:** retain the top candidates rather than collapsing immediately.
4. **Hysteresis:** require posterior confidence and persistence before changing
   the displayed operational floor.
5. **Correct history:** Viterbi can revise a just-completed transition when the
   next landing anchor arrives.
6. **Fail safely:** if evidence conflicts or grows stale, report `unknown` or ask
   for a tap instead of manufacturing confidence.

Evidence trust order should normally be:

1. user-confirmed or operator-confirmed assignment;
2. signed, commissioned fixed anchor at a known floor;
3. high-quality map registration/visual marker;
4. topology-consistent multi-sensor transition;
5. persistent calibrated radio fingerprint/zone;
6. raw nearest BLE receiver; and
7. barometer-only extrapolation.

## Fixed anchor and gateway hardware

### Basic deployment

- QR/NFC visual anchor at entrances and landings;
- BLE anchor at each stair/lift landing, signed at the application layer;
- known `buildingId`, `floorId`, `anchorId`, install position and key epoch;
- battery/health telemetry and a tamper/relocation workflow.

### Recommended deployment

Add one mains-powered pressure reference per pressure zone/building, preferably
at a gateway with a stable calibrated sensor. Broadcast timestamped pressure,
temperature, known elevation and sensor health. Phones compute relative elevation
against this reference rather than comparing raw pressures across devices.

### Premium deployment

- Android Wi-Fi RTT with three or more FTM-capable APs; Android documents typical
  1-2 m results but requires supported phones/APs, permissions and foreground
  operation;
- UWB for controlled high-value zones;
- BLE AoA/AoD antenna arrays for centimetre-class installed systems, not normal
  phone-only deployments; and
- visual fiducials/RoomPlan registration for commissioning.

## Learning a building during mapping

The commissioning walk should learn rather than assume:

1. operator confirms the starting floor;
2. the app records pressure, IMU, radio observations, AR/SLAM z and connector
   selection through several known transitions;
3. stable before/after windows estimate the physical elevation delta;
4. repeated samples create a distribution per connector edge, not one global
   `metresPerFloor` constant;
5. landing observations build BLE/Wi-Fi fingerprints and ambient pressure
   offsets; and
6. outliers are reviewed in a commissioning report.

Store `{medianHeight, mad, sampleCount, deviceModels, lastValidatedAt}` for each
vertical edge. The graph can represent half levels and a lift that skips floors.

## Edge cases that must be in tests

- ground floor labels that are `G`, `0` or `1`;
- basements and negative internal elevations;
- skipped/non-consecutive public floor labels;
- mezzanines, split levels and unusually tall atria;
- lift express service and inaccessible intermediate floors;
- a stairwell open to several floors causing radio leakage;
- HVAC pressure zones and opening external doors;
- phone in pocket/bag/hand, case vents blocked, and different phone models;
- no barometer or permission denied;
- stale, moved, spoofed or dead anchors;
- connector missing from the map;
- two buildings close enough to hear each other's anchors; and
- incident mode where a manual responder correction must take precedence.

## Product truth

Until field results satisfy the gates in `experiments.md`, UI language should be
“estimated floor” with confidence/freshness. Do not claim emergency-grade
personnel tracking or guaranteed absolute-floor accuracy. A responder or control
room must be able to correct a floor, and the audit log must retain both the
machine estimate and the correction.

## Primary reading

- [B-Loc: scalable floor localisation using a smartphone barometer](https://researchers.mq.edu.au/en/publications/scalable-floor-localization-using-barometer-on-smartphone/)
- [Barometric Phone Sensors—More Hype Than Hope!](https://www.microsoft.com/en-us/research/publication/barometric-phone-sensors-more-hype-than-hope/)
- [Viterbi floor detection with accelerometer, barometer and Wi-Fi](https://biblio.ugent.be/publication/8740689)
- [MagneFi multi-device, multi-building, multi-floor dataset](https://doi.org/10.32604/cmc.2022.020610)
- [Android Wi-Fi RTT documentation](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- [Bluetooth Direction Finding](https://www.bluetooth.com/learn-about-bluetooth/feature-enhancements/direction-finding/)
