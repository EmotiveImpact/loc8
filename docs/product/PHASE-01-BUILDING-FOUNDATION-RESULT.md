# Phase 1 result — building foundation and Command commissioning

**Date:** 2026-07-22

**Frozen gates:** [PHASE-01-BUILDING-FOUNDATION.md](PHASE-01-BUILDING-FOUNDATION.md)

**Decision:** **PROMOTE** the shared semantic venue package, browser-local
Command commissioning slice and Guard/Command projection seam into product
development. **REPEAT** with a second operator and permissioned real plan.
**HOLD** Gateway authority/distribution, real-building publication, physical
floor accuracy and every safety/accessibility/compliance claim. **STOP** any
path that treats labels, localStorage, synthetic geometry or legacy floor bytes
as site truth.

## What now works

- A dependency-free strict TypeScript venue package in `@loc8/engine` with
  stable building/map/level/space/zone/connector/portal/place/route IDs.
- Exact validation of roots, provenance/publication, plan geometry, references,
  connector landings, portal traversal, route nodes/edges and legacy floor-code
  mappings.
- Detached deep-immutable compilation and deterministic canonical JSON.
- Explicit draft → immutable browser-local demo → successor-draft lineage.
- Deterministic walking, step-free, evacuation-walking and
  evacuation-step-free routing with edge/connector closures and typed no-route/
  invalid outcomes.
- Shared floor-plan, level, zone and place projections retaining `buildingId`
  and `mapVersion`.
- A synthetic four-level venue: Basement, Ground, Level 1 and Level 2; three
  connector types; two final exits; room/zone geometry; assembly, Gateway, AED
  and anchor places; and explicit `-1/0/1/2` legacy compatibility codes.
- Command → Commissioning with floor switching, selectable data-rendered plan,
  name/kind editing, bounded geometry movement, room/zone creation, validation
  gate, cross-floor route/closure preview, durable browser-local state, local
  demo creation, visible publication record and successor draft.
- Guard derives its visible level names and zone projection from the same
  package; conversion to the old signed floor byte occurs only through the
  explicit legacy codec.

## Measured evidence

### Automated

```text
npm test -- --runInBand
31/31 suites passed
326/326 tests passed
```

The new focused surface is 47/47 tests: 44 engine/package tests (including 34
named invalid venue mutations), two Command publication-policy tests and one
Guard projection test.

```text
npx tsc --noEmit -p tsconfig.json                  PASS
npx tsc --noEmit -p packages/engine/tsconfig.json PASS
npx tsc --noEmit -p apps/guard/tsconfig.json      PASS
npm --prefix apps/command run build               PASS
npm run lint                                      PASS
npx expo-doctor                                   20/20 PASS
npm audit --omit=dev --audit-level=high           0 vulnerabilities
git diff --check                                  PASS
113 Markdown files / relative-link targets       0 missing
```

Jest prints Expo's known development warning that Android remote push is not
available in Expo Go; it does not fail or affect this venue-package result.

### Real browser

The Codex in-app browser exercised:

1. open Command → Commissioning;
2. switch/select the Ground Floor and a stable space;
3. add a room, rename it, change its kind and move its geometry while retaining
   its stable ID and a green validation gate;
4. calculate a 50-second, three-level evacuation-step-free route through
   `connector.east-ramp`;
5. close that ramp and receive the typed `no-eligible-route` outcome;
6. create an unsigned browser-local demo, see its actor/time/authority record
   and disabled editors;
7. reload Command and recover that local demo;
8. fork a new editable draft with `parentMapVersion` lineage; and
9. reset the synthetic fixture.

The final 1440×1000 and 1024×768 passes produced zero browser warnings/errors
and no document-level horizontal overflow. A 390×844 pass also measured no
horizontal overflow. Visual evidence and the corrected two-iteration comparison
are recorded in [design-qa.md](../../design-qa.md).

## Changed product surface

- `packages/engine/src/building/`: production types, validation, immutable
  package lifecycle, routing, projections, fixture and tests.
- `packages/engine/src/index.ts`: public building-engine export.
- `apps/command/src/dashboards/Commissioning.tsx`: runnable Map Builder.
- `apps/command/src/domain/commissioning.ts` and test: Command-local publication
  policy and state transitions.
- `apps/command/src/App.tsx`, `engine.ts`, `ui/theme.css`: navigation, explicit
  pure-engine seam and responsive visual system.
- `apps/guard/src/state/guardTeam.ts` and test: shared venue projection and
  legacy floor boundary.
- `docs/product/evidence/`, root `design-qa.md`, owner/handoff/decision records:
  reproducible evidence and claim boundaries.

## Failures corrected during the increment

- The first tablet render stacked full-width navigation rows and pushed the
  product below the fold.
- Long plan labels collided in connector/exit geometry.
- The first mobile top bar wrapped into unusable narrow columns.
- The 900px inspector initially dropped below the map instead of remaining
  adjacent.
- The first immutability test expected all JavaScript runtimes to throw on a
  frozen write; it was corrected to prove the value remains unchanged in strict
  and non-strict execution.

None of these were hidden or accepted; their pre/post-fix evidence remains in
`docs/product/evidence/`.

## Honest limitations

- The venue, paths, timings, accessibility evidence and floor codes are
  synthetic product-development data.
- Browser localStorage is not Gateway storage, a signature, a deployment or
  multi-operator authority.
- No CAD/PDF import, plan registration, control-point survey, conflict merge,
  tenant store or Gateway delivery exists yet.
- No physical building, phone sensor, anchor, participant or field route was
  measured.
- Route output is a software graph result, not fire/accessibility/safety advice.
- A second operator and competent specialist review remain required before the
  corresponding product claims.

## Next product increments

1. Gateway venue-package authority, signed/versioned offline distribution and
   Guard/Command reconciliation behind a local fake adapter first.
2. Exact Expo 57 phone-sensor adapter plus recorded/synthetic replay screen;
   maintain manual anchor authority until physical evidence exists.
3. Commissioning import/control-point registration and second-operator workflow,
   then repeat against a permissioned real plan/building when available.
