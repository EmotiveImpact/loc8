# FLOOR-01 floor-transition corpus prototype

This directory is the dependency-free, platform-neutral contract/core produced
by `FLOOR-01 E03`. It records evidence needed to evaluate floor-transition
algorithms later. It does **not** estimate a floor and is not evidence that a
phone, building, background mode or estimator works.

The frozen experiment protocol and measured decision are in
[`../../results/FLOOR-01/2026-07-22-corpus-contract/`](../../results/FLOOR-01/2026-07-22-corpus-contract/README.md).

## Run

From the repository root:

```sh
node --test docs/research/rnd/prototypes/floor-corpus/floor-corpus.test.mjs
node docs/research/rnd/prototypes/floor-corpus/benchmark.mjs
```

Both commands need only the Node standard library. The benchmark evaluates the
same 50,008-event fixture twice, prints its runtime and SHA-256 summary
fingerprints, and exits non-zero unless every preregistered replay gate passes.

## Files

- `schema-v1.json` — JSON Schema 2020-12 structural contract, including strict
  kind-specific payloads.
- `floor-corpus.mjs` — fail-closed semantic validator, recorder, JSONL codec and
  evaluator. It adds cross-record invariants a JSON Schema cannot conveniently
  express: topology, capability/unit agreement, time quality, privacy scanning,
  truth coverage and stream completeness.
- `fixture.mjs` — deterministic synthetic building/session with semantic labels
  `B1`, `G` and `2A`, one stairs transition and one same-floor control.
- `floor-corpus.test.mjs` — valid, round-trip and named adversarial cases.
- `benchmark.mjs` — reproducible offline replay/practicality gate.

## Contract boundary

`FloorCorpusRecorder` accepts a validated session manifest and a synchronous
sink callback. A platform adapter must:

1. create one immutable manifest before collection;
2. call `start()` once;
3. translate each platform observation into a strict event;
4. use session monotonic microseconds for ordering and preserve the sensor's
   native timestamp/unit in the payload;
5. emit at least two clock-sync observations that bracket the analysis window;
6. record semantic ground truth against stable level/connector/landing IDs;
7. call `end()` once; and
8. persist/export JSONL without adding arbitrary or identifying fields.

The sink is called with a cloned event before the in-memory recorder advances.
A failing sink therefore fails the append rather than silently claiming the
sample was durably recorded. The evaluator must still be run over the exported
bundle; successful appends alone do not prove session completeness.

## SDK 57 adapter mapping (not implemented here)

The application adapter must be implemented and physically tested in a later
repeat. The version-pinned sources are the Expo SDK 57
[Barometer](https://docs.expo.dev/versions/v57.0.0/sdk/barometer/),
[DeviceMotion](https://docs.expo.dev/versions/v57.0.0/sdk/devicemotion/) and
[Magnetometer](https://docs.expo.dev/versions/v57.0.0/sdk/magnetometer/) pages.

Required mapping:

| Expo SDK 57 source | Corpus payload | Conversion/constraint |
|---|---|---|
| `Barometer.pressure` | `pressureHpa` | no unit conversion; hPa |
| `Barometer.relativeAltitude` | `relativeAltitudeM` | optional and iOS-only; never treat as absolute altitude |
| `Barometer.timestamp` | `nativeTimestamp` | seconds; retain before converting once to `monotonicUs` |
| `DeviceMotion.accelerationIncludingGravity` | `accelerationIncludingGravityMps2` | x/y/z, m/s² |
| nullable `DeviceMotion.acceleration` | `userAccelerationMps2` | omit if unavailable; x/y/z, m/s² |
| `DeviceMotion.rotationRate` | `rotationRateRps` | Expo reports deg/s; the SDK 57 installed type contract defines alpha→x, beta→y, gamma→z; multiply by `π/180` |
| `DeviceMotion.orientation` | `screenOrientationDeg` | only `0`, `90`, `180`, `-90` |
| motion component timestamp | `nativeTimestamp` | choose and document the acceleration-including-gravity timestamp; seconds |
| `Magnetometer.x/y/z` | `microtesla` | calibrated values, μT |
| `Magnetometer.timestamp` | `nativeTimestamp` | seconds |

For every source the adapter must call `isAvailableAsync()` before use, record
availability/permission and the requested interval in the manifest, use
`setUpdateInterval()` before `addListener()`, and remove the returned
subscription on stop. Actual delivered intervals—not requested intervals—are
measured by the evaluator. Web barometer is unavailable and is outside the
physical pilot.

The DeviceMotion iOS usage description and permission flow are app/native build
work, not part of this pure prototype. An adapter must record denied/unavailable
states; it must not synthesize readings or silently switch timestamp sources.

### 2026-07-22 rotation-rate erratum

The first frozen note incorrectly reused the `rotation` Euler-angle mapping
(alpha around Z, beta around X, gamma around Y) for `rotationRate`. Expo SDK
57's installed `DeviceMotion.d.ts` instead documents rotation-rate alpha, beta
and gamma as X, Y and Z. The production adapter and tests use the installed
SDK 57 rate contract. This correction does not change the corpus JSON shape;
it corrects the semantic mapping into its existing `rotationRateRps.x/y/z`
fields. Native physical repeats must still confirm platform parity.

## What the evaluator proves

- manifest/event structural and semantic validity;
- contiguous sequence and nondecreasing monotonic time;
- one recorder-owned start/end boundary containing the analysis window;
- clock-sync coverage, uncertainty and drift against declared policy;
- exact aggregate ground-truth gap/overlap and connector/landing topology;
- received/expected sample counts, dropout, median/p95/max interval and gaps
  longer than two requested intervals for each available stream;
- rejection of undeclared periodic sources; and
- recursive/direct-identifier checks plus strict payload allowlists.

It does not prove clock correctness, honest consent, durable encryption/access
logging, successful deletion, device sampling behaviour or label correctness.
Those require the preregistered physical and governance checks.

## Provenance and licence

This prototype is an independent Loc8 implementation. No source file from the
retained repositories was copied.

Design evidence was drawn from permissive implementations pinned in the R&D
catalogue (Bermuda, Navigine, blelocpp, NavCogAndroid and Anyplace), the
unlicensed BaroFloorHeight project as ideas only, Expo's SDK 57 documentation,
and the primary studies named in the result. Upstream algorithms remain research
references. Any later code adoption requires a file-level provenance entry,
licence review, tests and third-party notice before product integration.

## Promotion limit

The decision is `PROMOTE` for this schema/core and its tests; `REPEAT` for the
Expo/native adapter and physical pilot; `HOLD` for field collection until site,
participant, encrypted-storage and deletion authority exist. Nothing here
authorises automatic floor display, safety claims or a floor-accuracy claim.
