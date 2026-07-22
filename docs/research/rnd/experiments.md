# R&D experiment backlog

## Operating rule

Run experiments in order of risk retired per week. Preserve raw data, scripts,
phone/OS/app versions, floor-map version and failures. A demo video is supporting
evidence; a timestamped data set and repeatable protocol are the result.

Experiment numbers are question-scoped, not globally unique. Always write the
question and experiment together (for example `MESH-01 E01`, `FLOOR-01 E03`,
`RADIO-01 E07` or `SEC-05 E07`). This lets the historical radio trial and the
frozen native HPKE repeat retain their original identifiers without ambiguity.

## P0 gates

### MESH-01 E01 — physical three-phone BLE relay

**Question:** does Loc8 currently form a mesh rather than a two-peer link?
**Method:** isolate A and C beyond direct BLE reception; place B between them;
send unique sequenced packets in both directions across iOS/iOS/iOS and then the
available mixed-OS combinations. Capture native and application logs.
**Pass:** at least 95% of 200 small control packets arrive within 10 seconds over
one relay in a static, uncrowded baseline; no duplicate application delivery;
the logs prove B forwarded and A/C could not hear each other directly.
**Then:** walls, bodies, movement, locked/background state and two relays.
**Output:** raw logs, topology, packet-success/latency distribution and honest
device/OS support matrix.

### MESH-02/MESH-03 E02 — mesh background and shift-battery matrix

**Question:** when do iOS/Android suspend scanning, advertising or GATT?
**Method:** foreground, screen-off, locked, low-power and background combinations
on every supported model/OS; 8-12 hour runs at realistic traffic plus incident
bursts.
**Pass:** per-state discovery/relay recovery and battery budgets are agreed before
claiming coverage. Report unsupported states explicitly; do not average them away.

### FLOOR-01 E03 — floor-transition corpus

**Question:** how well does current barometer logic work across actual sites and
phones?
**Method:** build a logger for pressure, relative altitude, accelerometer,
gyroscope, steps, BLE/Wi-Fi observations, timestamps, phone state and manually
marked landing/connector truth. Record stairs, lifts, escalators and no-transition
controls in at least three structurally different buildings and five phone models
where possible.
**Pass:** a versioned data schema, at least 30 transitions per mode/site cohort,
false-transition controls and no unlabelled gaps. This is a data gate, not an
accuracy gate.

### FLOOR-05 E04 — anchor + barometer + topology estimator

**Question:** does fusion outperform Loc8's fixed threshold?
**Method:** compare (A) current engine, (B) barometer only, (C) radio anchor only,
(D) barometer + anchor, and (E) HMM/Viterbi with connector graph. Split evaluation
by building and phone so the same site/device does not leak into train and test.
**Initial pass:** ≥97% floor classification after a 10-second settling window,
≥95% transition detection, <1% false transitions during same-floor movement,
median correction after landing <8 seconds, and graceful `unknown` on unsupported
devices. No cohort may be hidden by aggregate accuracy.
**Safety pass:** 100% of deliberately contradictory high-risk cases expose low
confidence/confirmation rather than a confident wrong floor.

### CONN-01 E05 — secure connected bridge threat-model spike

**Question:** what is the smallest production-safe connected pilot architecture?
**Scope:** WSS/TLS, authenticated devices/operators, tenant/site isolation,
authorisation, replay/rate limits, durable hash-linked server audit, key rotation,
monitoring/backup and loss/revocation.
**Pass:** hostile client cannot inject into another site, impersonate a role,
replay accepted control frames or mutate audit history undetected; restore and
revocation drills pass. Obtain an independent security review before operational
claims.

## P1 differentiators

### SEC-01 E06 — BitChat-v2 component bake-off

Implement separately feature-flagged spikes for:

1. signed identity/announcements;
2. Noise live/offline envelopes;
3. stable peer topology and source routes;
4. controlled fanout;
5. persistent encrypted outbox/couriers; and
6. GCS reconciliation.

For each, compare delivery, airtime, CPU, battery, memory, hostile-input behaviour
and cross-platform compatibility against legacy Loc8. Do not bundle all changes
before their individual value and failure modes are visible.

### RADIO-01 E07 — MeshCore versus LoRaMesher venue trial

**Hardware:** same legal regional band, antenna class, placement and power where
possible; at least two repeaters and one BLE companion/gateway.
**Scenarios:** concrete stairwell, basement, plant room, crowded concourse, outdoor
campus link and IP outage.
**Metrics:** packet success, p50/p95 latency, hops, airtime/channel utilisation,
energy, congestion, recovery after repeater loss, admin security and integration
effort.
**Pass:** select a carrier only after both produce comparable raw traces. Loc8
application encryption/identity must remain independent of either carrier.

### MAP-10 E08 — guided building commissioning

Import a plan; map rooms/exits/connectors; record control points and transitions;
place test anchors; walk coverage; publish a version. Have a second installer
repeat from instructions.
**Pass:** topology completeness 100% for agreed critical spaces/connectors;
registration residual and review conflicts are reported; repeat installer can
produce a usable model without developer intervention; every derived object has
source/provenance.

### FLOOR-08 E09 — learned storey/connector height

Compare fixed 3.5 m against learned per-building and per-connector distributions
over held-out walks and weather periods.
**Pass:** learned model materially reduces wrong-floor/settling error without
increasing same-floor false transitions; report sample count and uncertainty.

### RADIO-06 E10 — RF-aware placement recommender

Hide 20% of survey observations, recommend anchors/repeaters from the remainder,
then physically validate.
**Pass:** predicted dead zones and delivery probability are calibrated; the
recommendation achieves a pre-agreed coverage target with fewer installer trials
than a manual baseline.

## P2 exploration

### MAP-06/MAP-07 E11 — RoomPlan/PALMS assisted registration

Compare manual plan alignment, Apple multi-room `CapturedStructure`, smartphone
LiDAR PALMS and monocular PALMS on the same floors. Measure setup time, pose error,
failure cases, supported devices and reviewer correction time.

### FLOOR-12 E12 — Wi-Fi RTT premium tier

On supported Android phones and at least three surveyed FTM APs, measure horizontal
and floor-disambiguation value, foreground limits and battery. Treat Android's
typical 1-2 m documentation as a hypothesis to reproduce at the venue.

### FLOOR-13 E13 — BLE AoA/UWB feasibility

Obtain a small installed evaluation kit and compare cost, calibration effort and
incident value with ordinary signed landing anchors. Continue only where the
business outcome justifies specialist hardware.

### MAP-08/MAP-09 E14 — multi-floor SLAM benchmark

Use permissibly licensed/approved subsets of NUFR-M3F and internally captured
phone data. Test repeated-floor aliasing, lifts, reflective areas, dynamic crowds,
featureless corridors and relocalisation. Hilti 2026 is non-commercial and must
remain outside commercial product/training assets.

## Standard result template

Every experiment report must contain:

```text
Experiment/version:
Decision being made:
Hypothesis and pre-registered pass/fail gate:
Hardware/OS/app/protocol/building-map versions:
Raw-data location and hash:
Method and deviations:
Results with distributions and cohort breakdown:
Failures/adverse observations:
Licence/privacy/consent status:
Decision: adopt / adapt / repeat / stop
Owner and next action:
```

## Stop conditions

Stop or redesign when:

- a result depends on one phone/building but is marketed generally;
- a licence prevents the intended commercial use;
- raw observations cannot reproduce the chart;
- the system hides uncertainty in a safety-relevant UI;
- battery/background behaviour makes the use case implausible; or
- complexity does not improve an operational/customer outcome.
