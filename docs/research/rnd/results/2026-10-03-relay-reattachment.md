# Relay reattachment review fix

Date: 3 October 2026. Branch: `rnd/ble-density-2026-10-03`.
Draft [PR #5](https://github.com/EmotiveImpact/loc8/pull/5) still targets R1.
The reviewed checkpoint `f7a600bea9d90b3fd96b371c9b59204ddba98760` was
confirmed pushed before this fix. No other branch or worktree was changed.

## Problem and resulting behavior

An explicit `EXPO_PUBLIC_MESH_RELAY_MODE=current` or `branch` caused a newly
created `BleMeshTransport` to configure the shared native service before its
idempotent start. Both native services rejected all configuration while running,
even a request for their existing mode. Reattachment therefore detached the
app's listeners and reported disconnected while BLE continued running. The
failure also unlatched the JS transport so its subsequent stop was a no-op.
Returning from an active field harness to the normal app can take this path.

Both native queues now accept an identical selection, report actual status and
resolve without clearing links, pending relay work, witnesses, dedup or sender
identity. Invalid values still reject; switching to a different mode while
running still requires stopping first. Selection stays atomic with native
start/stop. JS retains configuration-before-start and its generation guard.
The default remains `current`; packet25/frame47, relay algorithm, timers, TTL,
benchmarks, dependencies and licensing are unchanged. All added code is Loc8
implementation/test code, with no third-party implementation copied.

## Fresh checks

| Check | Result and boundary |
| --- | --- |
| `npm test -- --runInBand` | 36 suites, 490 tests pass; two new JS cases cover reception/status and effective stop after reattachment in both modes. Native calls are mocked here. |
| Documented scoped Node command | 335 tests pass. |
| Frozen MESH-01 field-kit tests | 100 tests pass; event contract unchanged. |
| `./node_modules/.bin/tsc --noEmit` | Pass with installed TypeScript6.0.3. |
| `npm run lint` | Pass after granting access to the existing local lint cache; first sandbox attempt failed with EPERM. |
| iOS host runner with `--typecheck-ios` | 22 tests pass; actual queued service APIs exercise running same-mode requests, rejection of different/invalid modes, status, retained token/witness/TTL/dedup/own-sender state and actual stop cleanup. Separate untouched production source files typecheck against iOS Simulator18.2. |
| iOS negative control | The original `f7a600b` service body passes the previous20 tests and fails both new active-reattachment cases. |
| Android native harness | 171 assertions and11 source integration contracts pass; actual full service source compiles against API36 with Kotlin2.1.20/Java17. The mode matrix covers both modes, stopped/running state and invalid selections. |
| Diff and evidence verification | `git diff --check` and `node tools/mesh-rnd/verify-branch-integration.cjs` pass. |

The Swift host runner concatenates unchanged production helper/service bytes
with `ios-service-host-access.swift` in a temporary compilation unit. The
host-only fixture can seed/inspect private state without adding a production
setter, mocking CoreBluetooth, constructing BLE managers or starting radio.
It seeds pending work and dedup; live GATT link collections remain empty.
This tests the configuration/lifecycle regression, not a physical callback run.
Android checks execute the exact extracted pure policy/state and compile the
service; they do not execute an Android Handler or Bluetooth callbacks.

## Evidence and next step

[The new receipt](evidence/2026-10-03-branch-relay/reattachment/manifest.json)
binds current source hashes to compressed fresh logs. The original
[integration receipt](evidence/2026-10-03-branch-relay/integration-manifest.json)
and its logs are unchanged. The verifier checks their sources against exact
`f7a600b` Git objects, then verifies the current receipt. Prior CI receipts still
refer to their original commits; they do not attest this fix. Both simulation
models and recorded artifacts are unchanged and hash-checked; their full
matrices were not rerun because this fix changes configuration only.

Reproduce with the same documented commands in the
[combined branch handoff](2026-10-03-branch-relay.md). The negative control used
the same new Swift tests/access fixture with only the service body reverted in
a temporary tree. Node22.22.3/npm10.9.8 and the installed locked dependencies
were reused; no dependency reinstall or toolchain download was needed.

No full Expo app build/install or physical phone attempt was made for this
fix. Next: rebuild supported development clients, start a field session, return
to the normal app with the same selected mode, verify reception/status and stop
on iOS and Android, then resume the planned three-phone forwarding comparison.
Production promotion remains held. Main is not merged.
