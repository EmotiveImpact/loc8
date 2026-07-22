# Result: three-phone relay physical-evidence kit

**Question:** `MESH-01`, with later evidence hooks for `MESH-02`, `MESH-04`,
`MESH-05`, `MESH-07` and `X-01`

**Experiment:** `E01`, protocol `mesh-01.e01.v1`

**Evidence date:** 2026-07-22

**Pre-registration:** commits `29938c4` and amendment `88b7182`

**Evidence class:** source audit, deterministic synthetic evaluator fixtures,
pure native-recorder harnesses and Android module compile/package evidence. No
physical phone, Bluetooth path or radio-isolation evidence was collected.

## Outcome

The complete evidence kit is ready for a controlled three-phone field run, but
the mesh claim is not proven. The top-level evaluator decision remains
`HOLD-PHYSICAL` by construction for synthetic evidence.

| Decision | Scope |
|---|---|
| **PROMOTE** | The versioned manifest/event contracts, strict evaluator, clock-bound derivation, bounded privacy-preserving diagnostics, 14-block operator UI, runbook and Android module packaging into bounded R&D/product-development use. |
| **REPEAT** | Full native development-client builds and installs, then the preregistered three-phone iOS foreground cohort; evaluate Android and mixed-platform cohorts separately. Have a second operator reproduce raw hashes and evaluator results. |
| **HOLD** | MESH-01 relay capability, phone-mesh architecture selection, and every range/background/battery/building/capacity/venue/pilot/security claim until physical evidence passes its frozen gates. |
| **STOP** | Simulations, counters, `relayVia` labels or software recipient filters as path/isolation proof; restarted or discarded blocks under the same run ID; unapproved exports; production exposure of the field route; and pooling failed directions/platforms into a pass. |

Kit promotion does **not** promote relay behaviour. If the physical cohort fails,
the kit is still useful because it produces a defensible `LIMITED`, `NO-GO`,
`CONFOUNDED` or `INCOMPLETE` result instead of an attractive but ambiguous demo.

## What was investigated

- iOS and Android BLE service, frame codec, deduplication, relay, native-module
  bridge and lifecycle source;
- the TypeScript transport/service, packet codec, trust seam and debug surfaces;
- Expo SDK 57's native event and development-build requirements;
- what evidence distinguishes A→B→C relay from direct A→C reception;
- frame identity across a TTL-decrementing relay, duplicate/loop evidence,
  bounded diagnostics and privacy-preserving link identity;
- fixed-geometry near, isolation, relay and post-isolation controls;
- conservative pairwise monotonic-clock bounds for cross-device latency; and
- native source/build feasibility on the available workstation.

## What was built

The [prototype](../../../prototypes/mesh-field-kit/README.md) contains:

- strict manifest and JSONL event contracts with reject-unknown validation;
- a deterministic evaluator for path joins, TTL, delivery, duplicates,
  isolation, latency and explicit decisions;
- labelled synthetic fixtures for `GO`, `LIMITED`, `NO-GO`, `CONFOUNDED` and
  `INCOMPLETE` evaluator testing only;
- a fail-closed physical-manifest generator and measured clock-bound tool;
- bounded iOS/Android diagnostic recorders with run-scoped link handles and a
  stable SHA-256 logical-frame identity that excludes only mutable TTL;
- a development-only BLE route with the exact 14 blocks and 660 attempts,
  synthetic zero-coordinate payloads, role enforcement and guarded export;
- pure Swift/Kotlin recorder harnesses and an Android API 36/Kotlin 2.1.20
  source gate; and
- a detailed field runbook covering authority, privacy, storage, geometry,
  hashing, reproduction and stop conditions.

The diagnostic seam observes the research path without changing TTL, carrier
bytes, jitter, fanout, deduplication or delivery. It exports no payload, name,
coordinate, MAC address, advertising ID or persistent platform link ID.

## Measurements

Machine-readable results are in [measurements.json](measurements.json), and
artifact/command provenance is in [evidence-manifest.json](evidence-manifest.json).

| Measure | Result |
|---|---:|
| Strict evaluator tests | 100/100 passed |
| TypeScript field-protocol tests | 5/5 passed |
| Canonical synthetic bundle | 2,444 events |
| Benchmark work | 25 × 2,444 = 61,100 evaluations per run |
| Benchmark duration | 334.859 ms / 240.196 ms |
| Unique deterministic fingerprints | 1 in each run |
| Result fingerprint | `b445abe6269e49fa9887d7aa100d94e78c7fb6ad62ce8879867e85424d55fdfe` |
| Deterministic benchmark hash | `5304e3ef65f5e80e1e5a7eec71b65f4080b979a0d80839da0cae14677822d4a3` |
| Pure iOS recorder harness | PASS |
| Android Kotlin/API 36 source + recorder gate | PASS |
| Actual generated Expo Android module compile/package | PASS |
| Android debug AAR | 94,067 bytes; SHA-256 `a580b4e8dabcccbabc88829fd72ef5d0a8c0711cc84a740db2ae4e8c9bc36b4f` |
| Physical phones / relay attempts | 0 / 0 |
| Top-level MESH-01 decision | `HOLD-PHYSICAL` |

The synthetic counterfactual produced 200/200 deliveries within 10 seconds in
each direction, 200/200 full B-relay proofs, zero duplicates, exactly one B
forward per delivered frame and p95 90 ms. Those numbers validate evaluator
arithmetic and decision logic; they are **not measurements of Bluetooth, phones
or a building**.

## Kit-gate audit

| Gate | Evidence | Result |
|---|---|---|
| Strict contract | canonical 14-block manifest and 2,444 events pass; 78 named malformed/privacy/lifecycle cases reject | PASS |
| Evaluator truth | all five decision classes plus the physical-evidence veto are exercised | PASS |
| Path joining | same frame ID, ordered source/B/destination events and TTL decrement required | PASS |
| Metrics | exact attempts, deadline, duplicates, relay proof, forwarding and nearest-rank latency reproduced | PASS |
| Bounded diagnostics | 20,000-event bound, visible overflow, run-scoped link handles, no raw payload/identifier export | PASS |
| Operational completeness | metadata, 14 blocks, clock gate, export/hash, two-command evaluation and claim boundary documented | PASS |

## Native/build boundary

- The pure iOS recorder compiled and ran on macOS and passed identity, privacy,
  sequence, TTL-stability, lifecycle and bound checks. This does not exercise
  CoreBluetooth, the Expo ABI, an iOS app or a phone.
- Xcode is 16.2; Expo SDK 57 requires a newer supported Xcode toolchain. No iOS
  native app was built.
- OpenJDK 17, Android API/target 36, Kotlin 2.1.20 and NDK 27.1.12297006 were
  used. An isolated generated Expo/Gradle project passed
  `:loc8-mesh:compileDebugKotlin` and `:loc8-mesh:assembleDebug`; the only
  warnings were in upstream Expo Modules Core.
- The AAR was hashed and then removed with the isolated build/cache to recover
  storage. Its terminal output is not retained as a raw log, so a fresh full
  app build remains part of the physical repeat even though the module compile
  was genuinely observed.
- No complete APK/AAB, installation, permission flow, Bluetooth session or
  Android phone was tested.

## Corrective findings

The preparation exposed and corrected several ways the experiment could have
produced false confidence:

- pairwise clock uncertainty is now bounded across endpoints rather than
  accepting two individually sub-100 ms uncertainties whose sum exceeds the
  gate;
- a one-direction relay result now classifies `LIMITED`, not `GO`;
- the earlier weak diagnostic identity was replaced by SHA-256 over the full
  immutable logical frame, preserving identity through TTL changes;
- resend/recovery, export replacement and stale-timer paths can no longer
  silently create or erase attempts;
- B is permitted as an origin only in its required near-control blocks; the
  preregistration amendment records that type correction without moving any
  threshold;
- the development field route requires both the explicit field-kit flag and BLE
  transport, and release builds cannot expose it;
- all 91 previously surfaced ESLint findings were resolved; Expo Doctor reports
  20/20 and `npm audit` reports zero advisories after a narrowly smoke-tested
  `xcode` → `uuid` override; and
- actual Android module compilation replaced the earlier source-stub-only
  confidence, while still stopping short of a phone claim.

## Physical unblock checklist

Run E01 only when all are available:

1. three permissioned supported phones with the same labelled native build;
2. a genuinely isolated, fixed and measured A/C layout with B independently
   able to reach both endpoints;
3. site/operator authority and an approved encrypted evidence store with owner,
   access controls and deletion date;
4. a supported iOS toolchain for the first cohort, then separately labelled
   Android/mixed cohorts;
5. all six 10/10 near controls and the measured ≤100 ms pairwise clock gate;
6. 0/50 direct deliveries and no A-C link both before and after relay, per
   direction;
7. two independent 100-attempt relay blocks per direction, 100% joined B path
   proof, at least 190/200 within 10 seconds, zero duplicates and exactly one B
   forward per counted frame; and
8. immutable raw hashes plus two independently matching evaluator outputs.

Until that checklist is executed, MESH-01 remains a prepared experiment and a
promoted measurement capability—not a proven phone-mesh capability.

## Reproduce the current non-physical result

From the canonical worktree:

```sh
node --test docs/research/rnd/prototypes/mesh-field-kit/mesh-field-kit.test.mjs
node docs/research/rnd/prototypes/mesh-field-kit/benchmark.mjs
node docs/research/rnd/prototypes/mesh-field-kit/benchmark.mjs
npx jest src/research/__tests__/meshFieldProtocol.test.ts --runInBand
```

Then follow the prototype README for the pure native-recorder and Android source
gates. Follow the runbook, without threshold or block changes, for physical
evidence.
