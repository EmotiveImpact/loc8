# Loc8 owner product status

This is the plain-English control page for the owner. Engineering detail remains
in `docs/CODEX-CLAUDE-HANDOFF.md`; this page answers what is real, what can be
opened, what is still experimental and what needs the owner.

**Last updated:** 2026-07-22

**Current product phase:** Offline Gateway package simulation complete; phone
sensor adapter and replay next

**Working branch:** `claude/recursing-montalcini-d59018`

**Remote status:** local work only; nothing is pushed or deployed

**Local integration:** verified product commit `3821bec` is fast-forwarded into
local `main`; the documentation receipt may be one commit newer on both local
branches. Root `.codex-audit/` and the canonical worktree's user launch setting
remain untouched.

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

## Being built next

- Expo 57 phone sensor adapter and synthetic/recorded journey replay surface.
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
- Product phone sensor adapter and replay screen.
- Calibrated anchor + barometer + topology floor estimator.
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

The current increment is successful only when Command refuses to install a
draft, can copy a valid local demo into a separately labelled Gateway simulator,
reload it offline, reconcile package lineage, remove it independently and make
the missing production dependencies visible. The provider/store contract must
fail closed under malformed input, provider failure, conflicts and forks.

## Latest result

**PROMOTE the Phase 2 distribution contract and simulation tool.** The frozen
local gates pass: 33/33 suites and 373/373 tests, TypeScript, lint, Command
production build, Expo Doctor 20/20, dependency audit with zero vulnerabilities,
install/reload/reconcile/remove browser workflow and desktop/mobile visual QA.
This does not promote signing, durable Gateway storage, radio distribution,
physical buildings or operational deployment. See
`docs/product/PHASE-02-GATEWAY-VENUE-DISTRIBUTION-RESULT.md`.

## Next three actions

1. Implement the exact Expo 57 phone sensor adapter and journey replay surface
   without collecting physical data.
2. Preregister a durable Gateway runtime/store and reviewed signing-provider
   repeat; do not substitute browser localStorage or fake cryptography.
3. Extend Commissioning with plan import/control-point registration, then run a
   second-operator repeat when an authorised user/plan is available.
