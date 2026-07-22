# Loc8 owner product status

This is the plain-English control page for the owner. Engineering detail remains
in `docs/CODEX-CLAUDE-HANDOFF.md`; this page answers what is real, what can be
opened, what is still experimental and what needs the owner.

**Last updated:** 2026-07-22

**Current product phase:** Building foundation and Command commissioning

**Working branch:** `claude/recursing-montalcini-d59018`

**Remote status:** local work only; nothing is pushed or deployed

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

## Being built next

- Gateway authority, signed/versioned offline venue-package distribution and
  reconciliation adapters.
- Expo 57 phone sensor adapter and synthetic/recorded journey replay surface.
- Installer plan import/control-point registration and second-operator workflow.

## Built but experimental

- Multi-floor routing and egress validation: synthetic evidence only.
- Floor sensor recording/evaluation contract: no real building accuracy result.
- Mesh evidence kit: no physical three-phone relay result yet.
- Connected relay and security contracts: not a deployed or independently
  reviewed production security system.

## Not yet built

- Gateway venue-package storage/distribution.
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

The current increment is successful only when a field operator can open Command,
edit a four-level venue draft, validate it, create a clearly labelled local demo
publication, switch operational floors, preview a cross-floor route, reload the
draft, and see the same stable building/floor/zone identities projected through
the shared engine. Product and focused tests, types, lint and browser interaction
verification must pass.

## Latest result

**PROMOTE the Phase 1 product foundation.** The frozen non-physical gates pass:
31/31 suites and 326/326 tests, TypeScript, lint, Command production build, Expo
Doctor 20/20, dependency audit with zero vulnerabilities, real browser workflow
at desktop/tablet/mobile sizes with no final console errors, and passed visual
QA after correcting four P1/P2 findings. This does not promote Gateway, physical
building, positioning, safety or pilot claims. See
`docs/product/PHASE-01-BUILDING-FOUNDATION-RESULT.md`.

## Next three actions

1. Build a local fake Gateway authority/distribution adapter and freeze its
   signed package/reconciliation contract before any network deployment.
2. Implement the exact Expo 57 phone sensor adapter and journey replay surface
   without collecting physical data.
3. Extend Commissioning with plan import/control-point registration, then run a
   second-operator repeat when an authorised user/plan is available.
