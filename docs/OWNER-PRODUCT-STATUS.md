# Loc8 owner product status

This is the plain-English control page for the owner. Engineering detail remains
in `docs/CODEX-CLAUDE-HANDOFF.md`; this page answers what is real, what can be
opened, what is still experimental and what needs the owner.

**Last updated:** 2026-07-22

**Current product phase:** Phone sensor adapter and deterministic replay
complete; installer plan import/control points next

**Working branch:** `claude/recursing-montalcini-d59018`

**Remote status:** local work only; nothing is pushed or deployed

**Local integration:** Phase 3 preregistration `12ed233` and verified product
commit `3a7f72e` are fast-forwarded into local `main`; this documentation receipt
may be one commit newer on both local branches. Root `.codex-audit/` and the
canonical worktree's user launch setting remain untouched.

## Working now

- Existing Loc8 consumer, Guard and Command applications.
- Shared mesh, packet, floor-code and operations engine.
- Development-only three-phone mesh evidence screen and native diagnostics.
- Tested research implementations for a semantic multi-floor building graph,
  floor-data contract, connected-service boundary and security-provider boundary.
- Production shared venue-package validation, immutable local-demo publication,
  four-profile routing, projections and legacy floor-code boundary.
- Command → Commissioning / Map Builder with a four-level synthetic venue,
  editable rooms/zones/geometry, validation, route/closure preview and durable
  browser-local draft/demo state.
- Guard floor and zone projections from the same semantic venue package.
- A fail-closed production distribution contract with injected digest,
  signature, trusted-clock and atomic-store boundaries.
- Command → Commissioning → Gateway simulation: an explicitly browser-local,
  offline copy that can install, reload, reconcile versions and be removed
  without changing the Command venue package.
- Dependency-injected Expo 57 Barometer/DeviceMotion/Magnetometer adapter with
  explicit permission start, source isolation, monotonic timestamps and no
  automatic storage/network/boot behaviour.
- Command → Commissioning → Sensor replay: deterministic Ground → Level 1 →
  Level 2 playback, truth-versus-estimate display, speed/seek/step/reset and
  strict local JSON validation, always labelled synthetic or unverified.

## Being built next

- Installer plan import/control-point registration and second-operator workflow.
- A durable Gateway process/store repeat and reviewed signing-provider bake-off.

## Built but experimental

- Multi-floor routing and egress validation: synthetic evidence only.
- Floor sensor recording/evaluation contract: no real building accuracy result.
- Mesh evidence kit: no physical three-phone relay result yet.
- Connected relay and security contracts: not a deployed or independently
  reviewed production security system.

## Not yet built

- Durable on-hardware Gateway venue-package storage/distribution and real
  signing-provider integration.
- Optional cloud backup and multi-site management.
- Consented Guard collection workflow and physically calibrated
  anchor/barometer/topology floor estimator.
- Installer-ready plan import, control-point registration and survey workflow.
- Manufactured Gateway/anchor/LoRa hardware.

## Waiting for the owner later

- Three supported phones and an isolated layout for physical relay evidence.
- Permissioned multi-storey building, plan and controlled participant walks.
- Substantially more free disk space and a supported Xcode toolchain for iOS 57
  native builds.
- Authority before purchases, deployment, customer contact or physical data
  collection.
- Specialist security, cryptography, fire/accessibility and privacy review before
  corresponding product claims.

## Current definition of success

The current increment is successful only when the exact Expo 57 adapter can be
tested without a phone, never starts or requests permission implicitly, rejects
bad/regressing samples and removes listeners; the replay format fails closed;
and Command can visibly replay a multi-floor journey without claiming a live
sensor, building or accuracy result.

## Latest result

**PROMOTE the Phase 3 sensor-normalisation contract and replay development
tool.** The frozen local gates pass: 35/35 suites and 432/432 tests, 59/59
focused sensing/replay tests, TypeScript, lint, a 78-module Command production
build, Expo Doctor 20/20, Guard config introspection, dependency audit with zero
vulnerabilities and real-browser playback/rejection/responsive QA. This does
not promote phone collection, background operation, floor accuracy, real
buildings or automatic floor display. See
`docs/product/PHASE-03-PHONE-SENSOR-REPLAY-RESULT.md`.

## Next three actions

1. Extend Commissioning with synthetic plan import and control-point
   registration; run the real-plan/second-operator repeat only when authorised.
2. Preregister a durable Gateway runtime/store and reviewed signing-provider
   repeat; do not substitute browser localStorage or fake cryptography.
3. Run the frozen FLOOR-01 native cohort when supported phones, toolchains,
   building/participant authority and approved evidence storage exist.
