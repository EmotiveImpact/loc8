# Result: floor-transition corpus contract

## Identification

- **Date:** 2026-07-22
- **Question IDs:** `FLOOR-01`, supporting `MAP-01`, `FLOOR-02`–`FLOOR-05`
- **Experiment ID/version:** `FLOOR-01 E03`, `floor-01.e03.v1`, schema
  `loc8.floor-corpus.v1`
- **Decision being unlocked:** whether the versioned data contract and
  platform-neutral logger/evaluator seam may enter product engineering for an
  Expo SDK 57 adapter and physical instrumentation pilot
- **Owner/reviewer:** Principal R&D Lead; specialist privacy/device/security
  review and physical reproduction still required

## Pre-registered hypothesis and gate

The [protocol was frozen](pre-registration.md) in commit `8cff81a` before the
prototype or synthetic results: a privacy-minimised replay stream should be able
to represent sensor/radio/device/time/semantic ground truth without consecutive
numeric-floor assumptions or wall-clock ordering.

Promotion required all eight pure gates: JSONL round trip, rejection of every
named adversarial fixture, ≤100 ms clock uncertainty, ≤5 ms/min drift, complete
semantic truth coverage, per-stream completeness, zero named direct/raw-radio
identifiers, 50,000+ events evaluated under five seconds, and identical summary
results on two immediate runs.

## Method

1. Read the complete current Loc8 floor math/tracker/service and tests.
2. Read relevant pinned source—not only READMEs—from Bermuda, Navigine,
   blelocpp, NavCogAndroid, BaroFloorHeight and Anyplace.
3. Read the primary barometer/fusion work used by the programme: Microsoft
   [*Barometric Phone Sensors—More Hype Than Hope?*](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/hotmobile14b.pdf),
   [B-Loc](https://taogu.site/pub/paper/B-Loc-%20Scalable%20Floor%20Localization%20using%20Barometer%20on%20Smartphone%20MASS2014.pdf),
   the 2021 [accelerometer/barometer/Wi-Fi Viterbi study](https://biblio.ugent.be/publication/8740689)
   and [MagneFi](https://www.sciencedirect.com/org/science/article/pii/S1546221822016915).
4. Read version-pinned Expo SDK 57 Barometer, DeviceMotion and Magnetometer API
   documentation before specifying the later adapter.
5. Freeze the protocol and thresholds in Git.
6. Independently implement the JSON Schema, dependency-free recorder/validator,
   deterministic fixtures, JSONL codec, evaluator, adversarial tests and replay
   benchmark.
7. Audit the first run, harden uncovered seams, rerun tests and execute the
   benchmark twice during development and once for the captured measurement.

No phone, participant, building or radio was used. The fixture is generated and
explicitly labelled synthetic.

## Version manifest

| Item | Version/identifier |
|---|---|
| Loc8 base | `10b9bfd`; preregistration `8cff81a`; final artifact commit recorded in Git history after verification |
| Branch/worktree | `claude/recursing-montalcini-d59018`; canonical R&D worktree |
| Protocol/schema | `floor-01.e03.v1`; `loc8.floor-corpus.v1`; JSON Schema draft 2020-12 |
| Runtime | Node `v22.22.3`, Darwin arm64 |
| Device models / OS | none; deterministic synthetic profile only |
| Building/map | `building-synthetic-a001` / `map-synthetic-v1`; labels `B1`, `G`, `2A` |
| Bermuda | `cd46d17e8469` (MIT) |
| Navigine indoor positioning | `67e11c4d398a` (MIT) |
| blelocpp | `72b4bd3b32af` (MIT) |
| NavCogAndroid | `87f6ed2b353e` (MIT) |
| BaroFloorHeight | `4158e69b1b3d` (no licence; ideas only) |
| Anyplace | `722955182375` (MIT) |
| Expo API reference | version path `v57.0.0`; docs recommended `expo-sensors ~57.0.2` |

## 2026-07-22 adapter erratum

Phase 3 product implementation found one semantic error in the later-adapter
note: it had applied Expo's Euler `rotation` description to `rotationRate`.
The installed Expo SDK 57 type contract documents rotation-rate alpha, beta and
gamma as X, Y and Z. The implemented adapter therefore maps alpha→x, beta→y and
gamma→z before converting deg/s to rad/s. The corpus shape and captured pure
result do not change; the field semantics in the prototype README are corrected.
Native physical parity remains a repeat gate.

## Licence, privacy and consent

- **Upstream code/data:** no upstream file or dataset was copied. The retained
  implementations and papers informed requirements/negative cases only. MIT
  status did not substitute for engineering evaluation. Unlicensed
  BaroFloorHeight remained ideas-only.
- **Participant/site permission:** not applicable; no collection occurred.
- **Personal/sensitive data:** none. Synthetic IDs, readings and topology only.
- **Access/minimisation/retention/deletion:** the contract rejects named direct
  identifiers, raw infrastructure fields/values, arbitrary payload extensions,
  absent consent, unencrypted/unlogged declarations, non-`research://` storage
  and raw retention over 366 days. Runtime proof remains a later physical gate.
  See [privacy and retention](privacy-and-retention.md).

## Raw evidence

- **Durable location:** all non-sensitive deterministic evidence is committed
  in this result directory and the
  [prototype](../../../prototypes/floor-corpus/README.md).
- **Content manifest:** [evidence manifest](evidence-manifest.json)
- **Measurements:** [measurements.json](measurements.json)
- **Physical/raw bundle:** none exists.
- **Access restrictions:** repository access only; never place later physical
  raw bundles in Git.

## Results

| Preregistered gate | Evidence | Result |
|---|---|---|
| 1. Schema/round trip | canonical 129-event session serialises/parses; identical report | PASS |
| 2. Fail closed | 40/40 total tests pass, including every named adversarial class plus audit-added cases | PASS |
| 3. Time sync | 2 syncs; 20 ms maximum uncertainty; 1.363636 ms/min maximum drift; over-threshold fixtures rejected | PASS |
| 4. Ground truth | 3 unique segments; 1 transition; 1 same-floor control; 0 μs gap; 0 μs overlap; topology/landing/direction adversaries rejected | PASS |
| 5. Completeness | pressure/motion expected=received; zero missing; interval/dropout summaries present; undeclared stream rejected | PASS |
| 6. Data minimisation | canonical zero errors; BSSID/MAC/SSID/free-text/arbitrary-field adversaries rejected | PASS |
| 7. Replay practicality | 50,008 events evaluated in 119.912 ms and 108.169 ms on captured runtime; limit 5,000 ms | PASS |
| 8. Determinism | both benchmark validity/event/summary fingerprints identical (`3fe4c2…d7b1`) | PASS |

The benchmark was more than 41× below the ceiling in the slower captured run.
This is a local offline regression margin, not a phone-performance result.

## Adverse observations and limitations

- The first execution passed 24/25 tests. Its single failure exposed an incorrect
  expected drift in the test (`1.485149`); recomputation from the fixture's two
  offsets and 11-second separation yields `1.363636`. The assertion was
  corrected, not the evaluator.
- That audit also found requirements the initial implementation had failed to
  encode: app build, access logging, transition landing topology, native units
  for non-pressure streams, strict payload fields, malformed-manifest
  fail-closed behaviour and recorder start atomicity. They were added before
  the captured 40-test result.
- JSON Schema expresses record shape; cross-record policy is enforced by the
  reference validator. Consumers must run both rather than treating schema
  parsing as sufficient validation.
- Synthetic label correctness, clocks, storage controls and consent cannot be
  proven by self-declared fields.
- There is no mobile write-through, process-kill recovery, background sampling,
  energy, thermal, dropout, real-radio, cross-device or building evidence.
- There is no estimator and no floor-accuracy result. The existing manual anchor
  remains authoritative.
- A privacy allowlist cannot detect every identifying secret placed inside an
  otherwise allowed catalogue string; collection still requires governance and
  review.

## Decision

- **State:** **PROMOTE** the `loc8.floor-corpus.v1` schema, reference
  recorder/validator/evaluator seam, JSONL codec, fixtures and regression gates
  into bounded product development.
- **Reason:** every frozen pure-prototype threshold passed after an explicit
  audit and reproducible measurement.
- **Scope:** only the platform-neutral contract/core on Node `v22.22.3` with
  deterministic synthetic events. It is suitable as the target contract for an
  SDK 57 adapter, not as evidence that the adapter or floor detection works.
- **Dependent decisions:** **REPEAT** the Expo/native adapter and iOS/Android
  pilot; **HOLD** physical field collection until site/participant authority,
  encrypted/access-logged storage and deletion are available; **STOP** any
  attempt to infer absolute floor from raw pressure or to represent floors as
  consecutive integers.
- **Product/specification changes:** use stable semantic floor/connector/landing
  IDs shared with `MAP-01`; preserve raw timing/quality evidence; keep manual
  truth authoritative; make confidence, supported-device and physical-pilot
  claims contingent on later results.
- **Next action and owner:** Principal R&D proceeds to `MAP-01`. Product/mobile
  may later implement the adapter exactly as specified in the prototype README,
  then R&D repeats E03 on at least one supported iOS and Android phone under the
  approved protocol.
- **Review trigger:** any schema meaning change; first native adapter; first
  physical bundle; privacy/security review; or Expo/native sensor behaviour
  change.
