# MESH-01 physical evidence kit

This directory turns the frozen MESH-01 E01 preregistration into an executable
three-phone experiment. It does **not** claim that physical relay works. The
only full-run data in this directory is deterministic synthetic evaluator test
data, and the evaluator hard-codes the top-level decision `HOLD-PHYSICAL` for
that evidence class.

The physical operator procedure is in [runbook.md](runbook.md).

## What the kit contains

| Artifact | Purpose |
|---|---|
| `mesh-field-kit.mjs` | strict manifest/event validator, path join, metrics and decision engine |
| `manifest.schema.json` / `event.schema.json` | frozen strict JSON Schema contracts |
| `fixtures.mjs` | labelled synthetic pass/fail/confounded evidence only |
| `mesh-field-kit.test.mjs` | gates malformed evidence, thresholds, clock bounds and false physical promotion |
| `benchmark.mjs` | repeated deterministic 61,100-event evaluator measurement |
| `evaluate.mjs` | read-only physical/synthetic bundle evaluator |
| `derive-clock-sync.mjs` | near-control gate and conservative pairwise monotonic-clock bound estimator |
| `create-physical-manifest.mjs` | fail-closed generator for the frozen 14-block physical manifest |
| `run-metadata.template.json` | deliberately invalid-until-completed run metadata template |
| `ios-diagnostics-harness.swift` | executable semantic test of the privacy/bound/identity recorder core |

The research-build product seam is deliberately narrow:

- `modules/loc8-mesh/*/MeshDiagnostics.*` records a maximum 20,000 events;
- link identifiers are exported only as `SHA-256(runId || NUL || rawLinkId)`
  truncated to 16 lowercase hex characters;
- frame IDs are domain-separated SHA-256 over the complete immutable logical
  frame (protocol/type/flags, timestamp, origin ID, payload length and full
  payload), excluding only TTL so identity is stable across a relay;
- payload bytes, coordinates, names, MAC addresses and platform UUIDs are not
  exported;
- TTL, relay timing, deduplication, fanout and wire bytes are unmodified;
- `app/mesh-field.tsx` pins the exact 14-block matrix, allows only the declared
  source to originate, emits zero-coordinate synthetic packets, and refuses to
  replace an export until the operator confirms it is secured and hashed; and
- ordinary builds cannot use the route because it requires both
  `EXPO_PUBLIC_MESH_FIELD_KIT=1` and `EXPO_PUBLIC_TRANSPORT=ble` in a development
  build.

## Reproduce the non-physical checks

From the canonical worktree on Node 22.22.3:

```sh
node --test docs/research/rnd/prototypes/mesh-field-kit/mesh-field-kit.test.mjs
node docs/research/rnd/prototypes/mesh-field-kit/benchmark.mjs
npx jest src/research/__tests__/meshFieldProtocol.test.ts --runInBand
npx tsc --noEmit -p tsconfig.json
npx expo-doctor
```

The root package deliberately excludes `react-native-worklets` from Expo's
version check. SDK 57 currently recommends 0.10.0, but that published package
exports `src/debug/slowAnimations` without shipping either implementation.
The signed 0.10.2 package supplies those files, supports React Native 0.83–0.86,
and makes the iOS JavaScript export complete. This is a narrowly pinned build
repair, not evidence that either native client compiles or runs on a phone.

The iOS recorder core can be compiled and executed on macOS without Expo or a
phone:

```sh
mesh_harness_tmp=$(mktemp -d)
xcrun swiftc -O -target arm64-apple-macosx14.0 \
  -o "$mesh_harness_tmp/mesh-diagnostics-harness" \
  modules/loc8-mesh/ios/MeshConstants.swift \
  modules/loc8-mesh/ios/MeshFrameCodec.swift \
  modules/loc8-mesh/ios/MeshDeduplicator.swift \
  modules/loc8-mesh/ios/MeshDiagnostics.swift \
  docs/research/rnd/prototypes/mesh-field-kit/ios-diagnostics-harness.swift
"$mesh_harness_tmp/mesh-diagnostics-harness"
```

This validates the pure Swift recorder and serializer, not CoreBluetooth, the
Expo bridge, an iOS build or a phone.

## Evidence boundary

Passing these checks proves only that the evidence contract and research-build
instrumentation are internally consistent under deterministic fixtures. It
does not prove:

- that three phones relay a frame;
- iOS or Android native build compatibility;
- radio isolation, range, background behavior, battery, crowds or buildings;
- encryption, authentication or authorised membership; or
- operational, venue, safety or pilot readiness.

Those claims remain unavailable until the physical runbook is executed on a
supported native toolchain and its raw evidence independently reproduced.
