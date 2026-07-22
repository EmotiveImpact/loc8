# Phase 1 preregistration — production building foundation

**Frozen before product implementation:** 2026-07-22

**Decision:** whether the MAP-01 research contract is ready to become a shared
Loc8 product package and a runnable Command commissioning slice

**Evidence class:** deterministic product code, browser UI and synthetic venue;
no real-building, route-safety, accessibility, fire, deployment or pilot claim

Changing these gates requires a dated amendment before changing the implementation
to meet it. A later phase may add stronger gates without deleting this result.

## Product boundary

The implementation may promote the previously validated semantic identities,
validation, routing and projection seams. It must not import executable code from
`docs/research`, require Node-only APIs in `@loc8/engine`, silently make a phone
the building authority, or describe a local browser save as Gateway publication.

The production split is:

- immutable/versioned venue-package data and pure logic in `@loc8/engine`;
- editable commissioning draft and interaction state in Command;
- read-only operational projections for Guard and Command;
- legacy signed six-bit floor codes isolated at the existing packet boundary; and
- later Gateway/cloud persistence and signing behind explicit interfaces.

## Acceptance gates

### A. Shared engine

1. Strict TypeScript defines building, package, provenance, level, plan, space,
   zone, connector/landing, portal/exit, place, route-node and route-edge data.
2. Stable IDs are independent from mutable floor labels, display names and legacy
   wire codes.
3. Validation rejects malformed roots, duplicate/global IDs, duplicate level
   order/wire codes, unknown references, cross-level zone/portal/geometry errors,
   invalid connector landings, invalid plan bounds, non-finite geometry, orphan
   navigable spaces, missing portal/connector traversal, and unsafe unknown
   publication state.
4. A valid venue compiles to deeply immutable indexed state; caller mutations do
   not alter compiled state.
5. Deterministic routing supports walking, step-free, evacuation-walking and
   evacuation-step-free profiles with live edge/connector closures and explicit
   `ok`, `no-route` or `invalid-request` outcomes.
6. Projections return ordered levels, zones, places and floor-plan geometry with
   `buildingId` and `mapVersion` retained.
7. The legacy codec round-trips every demonstration level and rejects unknown
   semantic levels or wire values.
8. The package exposes explicit `draft`, `local-demo` and future `published`
   states. `local-demo` is never described as Gateway-signed/deployed.
9. The four-level demonstration venue includes Basement, Ground, Level 1 and
   Level 2, rooms/zones, two cross-floor connector types, two final exits, an
   assembly place, anchor/Gateway places, plan geometry and non-consecutive
   semantic IDs.

### B. Command commissioning experience

1. Command has a first-class `Commissioning` navigation destination matching its
   existing tactical visual system.
2. The operator can switch among all four floors, select a space, edit its name
   and kind, add a new room, and change geometry within plan bounds.
3. Validation errors are visible and block local-demo publication.
4. The operator can discard/reload the demonstration venue and persist/reload a
   browser-local draft without conflating it with published site truth.
5. A successful local-demo publication produces an immutable package version and
   visible audit entry; subsequent edits create a new draft rather than mutating
   the published snapshot.
6. The operator can preview at least one cross-floor route and one connector
   closure/no-route or reroute state.
7. Core controls work by keyboard and pointer, status is not conveyed by colour
   alone, and the layout remains usable at 1440×900 and 1024×768.

### C. Product integration and evidence

1. Guard and Command floor/zone projections consume the shared demonstration
   venue rather than maintaining an additional semantic fixture for this slice.
2. Existing packet floor-code tests and operational product behaviour continue to
   pass.
3. New engine and Command tests cover valid publication, at least 25 named invalid
   venue mutations, draft immutability, legacy round trips, floor/zone projection,
   routing/closure and commissioning state transitions.
4. Root Jest, root/Guard/Command TypeScript, lint, Expo Doctor and dependency audit
   pass.
5. A production Command build passes and the Commissioning workflow is exercised
   in a real browser with no console errors.
6. Reference-versus-implementation visual QA records the selected concept and
   Command design-system comparison; all P0/P1/P2 findings are corrected before
   handoff.
7. The result records changed files, exact test counts, browser states, failures,
   limitations and an explicit PROMOTE/REPEAT/HOLD/STOP decision.

## Automatic failure / hold conditions

- Any route or validation success produced from an invalid or unknown reference.
- Any UI wording implying a browser-local draft is signed, Gateway-distributed or
  field-validated.
- Replacement of stable semantic IDs with display labels or consecutive integers.
- Hidden mutation of a previously created local-demo package.
- Regression of existing packet, Guard, Command, mesh or product test gates.
- A UI screenshot presented as proof of a real commissioned building.

## Promotion rule

PROMOTE the shared package and commissioning slice only if every A/B/C gate that
does not require later Gateway or physical evidence passes. REPEAT browser and
operator studies with a second user. HOLD real plan publication, safety/
accessibility claims and Gateway authority until their dedicated phases. STOP any
shortcut that makes mutable labels, localStorage or synthetic geometry the
operational source of truth.
