# Phase 4 result — floor-plan import and control-point registration

**Measured:** 2026-07-22

**Decision:** **PROMOTE** the strict plan-import contract, deterministic
similarity-fit engine, immutable receipt and Command preview/apply workflow.
**REPEAT** with an authorised current plan, physically measured control points
and a second operator. **HOLD** customer-plan storage, automatic image tracing,
survey/accuracy claims and published package signing. **STOP** loose imports,
topology inference from pixels and browser-local output being described as
physical evidence.

## What now works

- `loc8.plan-import.v1` strictly validates exact fields, stable package/building/
  map/level/frame identity, source provenance, bounded source pixels, target
  metre observations, control-point uniqueness and complete one-to-one geometry
  for the existing spaces on a target level.
- Imports are capped at 2 MiB, 3–32 control points, 1–256 shapes and 3–128
  points per polygon. Synthetic and operator-unverified are the only evidence
  classes; the latter requires declared non-synthetic provenance and a SHA-256.
- The engine fits a least-squares 2D similarity transform: uniform scale,
  rotation and X/Y translation. It rejects collinear control points, scale
  outside 0.001–10 m/pixel, RMS residual above 0.25 m, maximum residual above
  0.50 m, out-of-bounds transformed points and zero-area geometry.
- A deterministic synthetic Ground Floor bundle starts from a rotated/scaled
  pixel frame and recovers a 0.05 m/pixel, 4° transform with effectively zero
  residual. It contains no customer drawing or physical measurement.
- Applying a passing registration clones an editable draft or requires explicit
  successor identity for an immutable package. It replaces only the target
  plan's geometry, source and control points; stable level, space, zone, portal,
  connector, route-node and route-edge identities/counts remain unchanged.
- Provenance is appended without conflict, review returns to `unreviewed`, the
  resulting venue passes full validation and an immutable receipt records input/
  output lineage, frames, transform, residuals and shape count.
- Command Commissioning now has a functional **Plan registration** view. It can
  load the built-in fixture, read or paste strict JSON, keep the last valid
  preview after rejection, show source/registered geometry, fit gates and
  per-point residuals, apply to a draft and open the resulting Map Builder.

## Measured evidence

| Gate | Result |
|---|---:|
| Focused plan-registration suite | 47/47 passed |
| Full product regression | 36/36 suites, 479/479 tests |
| Root, engine, Guard and Command TypeScript | passed |
| Command production build | passed, 79 modules transformed |
| Expo lint | passed |
| Expo Doctor | 20/20 checks passed |
| Guard Expo config introspection | sensors plugin + `NSMotionUsageDescription` present |
| Dependency audit | 0 vulnerabilities |
| Git whitespace check | passed |

The full Jest run emits the existing Expo Go remote-notification warning from
the Guard projection import. It is not a test failure and Phase 4 changes no
notification behaviour.

## Browser and design verification

The Codex in-app browser exercised the actual operator flow:

1. the synthetic import rendered source pixels and registered metres;
2. fit cards showed the recovered 0.05 m/pixel, 4° transform and passing RMS/
   maximum gates;
3. apply forked the existing immutable local demo into
   `map.synthetic.draft.003` and produced an `APPLIED LOCALLY` receipt;
4. **Open registered map** selected Ground Floor in Map Builder with validation
   `READY` and all nine stable plan objects;
5. pasted `{}` was rejected while the prior valid preview and venue remained;
   and
6. 1280, 900 and 390 CSS-pixel layout checks had no document-level horizontal
   overflow. Final logs contained development info/debug only, with no warning
   or error.

The source concept and implementation were inspected together at 900×900. The
new screen preserves the established Command visual system and the concept's
venue-state, floor-plan, adjacent-inspector and explicit publish-state hierarchy.
Plan pixels are domain data, not a substituted image asset. No actionable P0,
P1 or P2 finding remains. Evidence:

- `evidence/phase-04-plan-registration.png`
- `evidence/phase-04-visual-comparison.png`
- root `design-qa.md`

## What this does not prove

- No customer plan image/PDF, permission record, physical building or measured
  control point was used.
- A software residual is not a building-survey accuracy result.
- The source JSON digest is declared by a future ingestion boundary; this phase
  does not implement source-file hashing, storage, access control or upload.
- The workflow does not trace rooms automatically or infer doors, connectors,
  accessibility, egress or routes from pixels.
- A second operator has not repeated the task and no competent survey,
  fire/accessibility, privacy or security reviewer has approved the result.
- The resulting draft is unsigned and browser-local. It is not a Gateway
  publication or operational site truth.

## Product consequence

Loc8 now has the complete local software path from a bounded source-plan model
to a measured building-coordinate transform, then into the same venue package
used by Map Builder, Guard projection, route checks and Gateway distribution.
This closes the missing software seam in the field-operator onboarding model:
the remaining MAP-04 work is now evidence collection and repeatability, not an
undefined import architecture.

## Exact next repeat

1. With explicit authority, hash and ingest one current floor plan without
   persisting the source binary, measure at least four well-separated control
   points, record residuals and repeat with a second operator.
2. Select and independently review the signing provider and durable Gateway
   runtime/store before restart, concurrency and power-loss implementation.
3. Run supported iOS/Android FLOOR-01 and physical MESH-01 cohorts only with
   approved devices, site/participant authority and evidence storage/deletion.
4. Keep automatic tracing, floor-accuracy and operational/safety claims held
   until multi-building and competent-review cohorts pass.

## Reproduction

```text
npm test -- --runInBand --no-cache
npx tsc --noEmit --pretty false
npx tsc -p packages/engine/tsconfig.json --noEmit --pretty false
npx tsc -p apps/guard/tsconfig.json --noEmit --pretty false
npm run build --workspace @loc8/command
npm run lint -- --no-cache
npx expo-doctor
(cd apps/guard && npx expo config --type introspect --json)
npm audit --audit-level=low
git diff --check
```
