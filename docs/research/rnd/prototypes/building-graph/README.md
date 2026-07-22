# MAP-01 semantic building graph prototype

This directory contains the dependency-free, platform-neutral experiment for
`MAP-01`. It separates a physical semantic model from a directed route graph,
then validates the relationship between them before answering route queries.

It is a synthetic contract experiment. It is **not** a surveyed building, an
evacuation plan, an accessibility assessment, a mobile implementation or proof
that a route is safe during a real incident.

The thresholds were frozen before implementation in
[`../../results/MAP-01/2026-07-22-semantic-graph/pre-registration.md`](../../results/MAP-01/2026-07-22-semantic-graph/pre-registration.md).

## Run

From the repository root:

```sh
node --test docs/research/rnd/prototypes/building-graph/building-graph.test.mjs
node docs/research/rnd/prototypes/building-graph/benchmark.mjs
```

Both commands use only the Node standard library. The benchmark compiles a
validated graph with 1,002 route nodes, executes 10,000 deterministic requests
twice across all four profiles and closure/no-route cases, and exits non-zero if
either run exceeds the frozen 5,000 ms local regression bound or the result
fingerprints differ.

## Files

- `schema-v1.json` — strict JSON Schema 2020-12 structural representation.
- `building-graph.mjs` — semantic validator, canonical fingerprints, compiled
  directed router, exit reachability audit, current-product projections and
  explicit legacy floor-code adapter.
- `fixture.mjs` — 39-node synthetic three-level building plus the deterministic
  1,002-node scale fixture.
- `building-graph.test.mjs` — contract, identity, 71 named invalid mutations,
  routing, accessibility, egress, closure, projection and wire-code tests.
- `benchmark.mjs` — scale/reproduction gate with machine-readable output.

The JavaScript validator enforces cross-record invariants that JSON Schema does
not conveniently express: global stable-ID uniqueness, level/space agreement,
single-level zones, connector/landing ownership, portal orientation, final
indoor-to-outdoor exits, connector-only vertical edges, no orphan landings or
navigable spaces, affirmative accessibility policy and injective wire codes.

## Model boundary

The root document is `loc8.building-graph.v1` and contains:

- building/map publication metadata, local metric coordinate frame and bounded
  provenance/review status;
- stable levels with separate mutable `levelRef`/name, ordinal and elevation;
- rooms, corridors, lobbies, service/outdoor/void spaces and single-level
  operational zones;
- stairs, lifts, escalators and ramps with explicit semantic landings;
- doors/openings/gates, final exits and stable operational places such as
  assembly points;
- route nodes and positive-cost directed/bidirectional edges; and
- an explicit map-version-scoped semantic-level-to-signed-wire-code table.

The model intentionally keeps semantic objects separate from route nodes/edges.
A door, connector or final exit describes what a transfer means; an edge
describes how the current map permits it to be traversed. The validator requires
the two layers to agree.

This is not the full digital twin. Raw capture immutability, plan transforms,
geometry/registration uncertainty, algorithm lineage, history/rollback, radio
coverage and live hazard/occupancy overlays remain later MAP questions. MAP-01
only includes enough publication provenance to prevent a synthetic/unreviewed
map from being mistaken for a real reviewed source.

## Routing policy

`compileBuildingGraph()` validates once and builds immutable lookup/adjacency
state. `route()` performs point-to-point routing; `routeToExit()` chooses the
best eligible final exit. Results contain ordered node/edge/level/connector IDs,
distance, nominal duration, map identity, closure context and a semantic route
fingerprint.

Profiles:

| Profile | Policy |
|---|---|
| `walking` | Any explicitly open edge/portal/connector allowed by direction |
| `step-free` | Reject stairs and require `stepFree=yes` plus `wheelchair=yes` on every edge and transfer object |
| `evacuation-walking` | Require emergency-use edges; reject lift and escalator; terminate through a final exit |
| `evacuation-step-free` | Combine the emergency and affirmative-accessibility constraints |

`unknown` accessibility never qualifies as step-free. `closed` or `unknown`
baseline availability never qualifies as open. Request-time closed edge and
connector IDs are an overlay; routing does not mutate the published graph.

The evacuation profiles are intentionally conservative routing semantics, not
regulatory truth. A competent venue/fire/accessibility review must determine
whether a real ramp, protected stair or evacuation lift is actually usable.

## FLOOR-01 and current-product seams

The canonical fixture preserves FLOOR-01's exact:

- `building-synthetic-a001` / `map-synthetic-v1`;
- `level-b1`, `level-ground`, `level-2a`;
- `connector-east-stairs`; and
- `landing-east-ground`, `landing-east-2a`.

It extends that seam with spaces, zones, portals, route topology and other
connectors. Labels `B1`, `G` and `2A` remain human metadata and the skipped
ordinal is valid.

Pure projection helpers show how later product adapters can replace today's
independent hard-coded Guard/Command models:

- `projectLevels()` returns stable IDs plus display metadata;
- `projectZones()` returns building/map/level/member-space identity and a local
  display centroid;
- `projectPlaces()` returns stable muster/assembly identity; and
- `createLegacyFloorCodec()` maps semantic level IDs to the existing signed
  six-bit floor field explicitly and reversibly.

No Guard, Command, engine, packet or Expo code is changed by this experiment.

## Provenance and licence

This prototype is an independent Loc8 implementation. No third-party source
file was copied.

Design inputs were the current Loc8 workflows and FLOOR-01 contract, the MIT
Anyplace model/router as a learn-only comparison, OpenStreetMap Simple Indoor
Tagging vocabulary, OGC IndoorGML's physical-space/dual-graph separation, and
learn-only multi-floor graph ideas from retained GPL/conflicting-terms sources.
The exact licence/copy boundary is frozen in the preregistration and result.

## Promotion limit

Passing tests may promote only the schema/validator/router/projection contract
into product development. Real plan import, operator commissioning, app
integration, secure map storage, accessibility/egress review and field routing
must be separately designed and measured. Synthetic route success must never be
presented as building, safety, regulatory, pilot or deployment evidence.
