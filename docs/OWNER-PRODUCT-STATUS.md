# Loc8 owner product status

This is the plain-English control page for the owner. Engineering detail remains
in `docs/CODEX-CLAUDE-HANDOFF.md`; this page answers what is real, what can be
opened, what is still experimental and what needs the owner.

**Last updated:** 2026-07-22

**Current product phase:** Shared building engine, commissioning, offline
Gateway simulation, phone-sensor replay and plan registration are complete in
local software; physical and provider-backed repeats are next

**Working branch:** `claude/recursing-montalcini-d59018`

**Remote status:** local work only; nothing is pushed or deployed

**Local integration:** Phase 3 is fast-forwarded into local `main`. Phase 4 was
preregistered in `3df0db0`; its verified product and documentation commits are
integrated only after the final receipt. Root `.codex-audit/` and the canonical
worktree's user launch setting remain untouched.

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
- Command → Commissioning → Plan registration: strict bounded source-plan JSON,
  source-pixel to building-metre control points, measured similarity fit,
  residual gates, source/registered previews, safe draft apply and Map Builder
  handoff. The engine preserves every stable semantic/routing identity and
  records an immutable software receipt.

## Next promotion work

- Select and independently review the real Gateway signing provider and durable
  runtime/store; then run restart, concurrency and power-loss tests on target
  hardware.
- Run real-plan/second-operator MAP-04 and supported native FLOOR/MESH cohorts
  only after the owner supplies the authorised equipment, site and evidence
  controls.

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
- Customer-plan file hashing/ingestion/storage, field capture and competent
  survey/review workflow. The strict software registration seam is built.
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

The current increment is successful only when a plan bundle fails closed on
unknown identity/geometry, at least three non-collinear points recover one
bounded similarity transform, residual and target-bound gates are enforced,
apply preserves semantic/routing IDs, and Command visibly distinguishes a
software registration from a physical survey.

## Latest result

**PROMOTE the Phase 4 strict plan-import, control-point registration and local
operator workflow.** The frozen local gates pass: 36/36 suites and 479/479
tests, 47/47 focused registration tests, all TypeScript, lint, a 79-module
Command production build, Expo Doctor 20/20, dependency audit with zero
vulnerabilities and real-browser preview/apply/handoff/rejection/responsive QA.
This does not promote customer-plan storage, physical control points, survey
accuracy, competent review or published site truth. See
`docs/product/PHASE-04-PLAN-REGISTRATION-RESULT.md`.

## Next three actions

1. Select and preregister a durable Gateway runtime/store plus reviewed signing
   provider; do not substitute browser localStorage or fake cryptography.
2. Run MAP-04 with one authorised current plan, measured control points and a
   second operator; keep the source binary outside this development contract.
3. Run frozen FLOOR-01 and MESH-01 native cohorts when supported phones,
   toolchains, building/participant authority and approved evidence storage
   exist.
