# Phase 4 preregistration — floor-plan import and control-point registration

**Frozen before implementation:** 2026-07-22

**Decision:** whether Loc8 can promote a strict plan-import development contract,
fit source-plan pixels onto the existing building-metre frame, expose the fit to
the commissioning operator and apply an accepted result to a successor venue
draft without changing stable building semantics or claiming a physical survey

**Evidence class:** deterministic synthetic plan pixels and browser-local JSON;
no customer plan, surveyed control point, commissioning operator, building visit
or accuracy result

## Product boundary

This phase adds the missing registration step between an external plan drawing
and Loc8's semantic building package. The input is a bounded, schema-versioned
development bundle containing source-frame polygons, target level identity,
provenance and source-pixel to building-metre control-point observations. The
engine fits one two-dimensional similarity transform (uniform scale, rotation
and translation), reports residuals, then transforms the source polygons.

The import may replace geometry for existing spaces on one level. It must not
create, rename or delete spaces, nodes, portals, connectors, routes or zones.
The source image/binary is never stored or uploaded by this contract. A real
plan remains `operator-unverified` until a separately authorised survey and
review workflow supplies physical evidence.

## Frozen thresholds and acceptance gates

### A. Strict plan-import contract

1. Schema `loc8.plan-import.v1` has exact root/nested keys, stable IDs, exact
   venue package/building/map/level/frame identity and either `synthetic` or
   `operator-unverified` evidence.
2. JSON is at most 2 MiB. A bundle has 3–32 unique control points, 1–256 shapes,
   3–128 points per polygon and only finite bounded numeric values.
3. Source coordinates must stay inside a declared 1–100,000 pixel frame. Target
   observations must stay inside the current target floor-plan metre bounds.
4. Synthetic evidence requires synthetic provenance and may use a null digest.
   Operator-unverified evidence requires non-synthetic provenance and a
   lowercase 64-hex SHA-256 supplied by the future ingestion boundary. Neither
   class is upgraded to reviewed or physical evidence by import.
5. Every existing target-level plan shape is represented exactly once by stable
   `spaceId`; unknown, duplicate or missing spaces fail closed. This phase does
   not infer topology from pixels.

### B. Registration and application

1. At least three unique, non-collinear source observations fit a least-squares
   2D similarity transform. Degenerate geometry, reflection, non-positive scale
   or scale outside 0.001–10 metres/pixel fails closed.
2. Development promotion thresholds are RMS residual ≤0.25 m and maximum
   residual ≤0.50 m. These are software acceptance limits, not a physical
   accuracy claim.
3. Every transformed polygon point must remain inside the registered target
   floor-plan bounds and every transformed polygon must have non-zero area.
4. Applying registration produces a new editable successor draft when the
   current package is immutable, or edits a cloned draft. Input objects are
   never mutated.
5. Application replaces only target-level shapes/control points/source
   reference, appends non-conflicting provenance, clears prior review, preserves
   all semantic and routing object identities/counts and passes full venue
   validation.
6. The immutable receipt records schema/evidence, source and target frames,
   transform, RMS/max residual, per-point residuals, source/target package
   lineage and transformed shape count. It is not a survey certificate.

### C. Command operator workflow

1. Commissioning gains a functional `Plan registration` view in the existing
   design system, with a built-in synthetic fixture plus bounded file/paste JSON.
2. A valid import shows source/target identity, scale/rotation/translation,
   per-control-point residuals, fit gates and a transformed plan preview before
   apply.
3. Invalid or mismatched imports are rejected without losing the last valid
   preview or altering the current venue.
4. Apply is available only for a passing registration. It creates/updates an
   editable draft, stores the plan provenance and control points, and makes the
   registered geometry immediately visible in Map Builder.
5. Visible language says synthetic or operator-unverified and explicitly states
   that no source image, physical point or field accuracy was verified.
6. At least 25 named invalid/adversarial cases plus transform recovery,
   determinism, immutability, topology preservation and apply tests pass.
7. Full Jest, TypeScript, lint, Command build, dependency audit, Markdown links,
   Git whitespace and browser functional/responsive/console/design QA gates pass
   with no P0/P1/P2 findings.

## Automatic hold/failure conditions

- A plan import silently adds or removes semantic/topology objects.
- Unknown fields, venue identities, spaces or frames are tolerated.
- Registration applies despite residual/geometry gate failure.
- A caller-owned package or import object is mutated.
- Browser-local or synthetic output is described as surveyed, reviewed,
  production, signed or physically accurate.
- Customer plan pixels/binaries are persisted or uploaded without a separately
  approved privacy/security/storage workflow.

## Promotion rule

PROMOTE the strict contract, similarity-fit engine, receipt and Command preview/
apply workflow if every local gate passes. REPEAT with an authorised real plan,
measured control points and a second operator under MAP-04. HOLD customer plan
storage, automatic image tracing, physical-accuracy claims and published package
signing until those evidence, governance and provider dependencies exist.
