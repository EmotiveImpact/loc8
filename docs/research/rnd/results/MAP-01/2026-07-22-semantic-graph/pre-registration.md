# MAP-01 pre-registration: minimum semantic building graph

**Frozen before prototype implementation:** 2026-07-22

**Question IDs:** `MAP-01`, with bounded evidence for `MAP-02` and `MAP-03`

**Owner:** Principal R&D

**Planned prototype:** `docs/research/rnd/prototypes/building-graph/`

**Evidence class:** pure data-contract, validator, routing and adapter experiment

**Decision to make:** whether the minimum semantic graph and pure routing seam
should be promoted into product development

## Research question

What is the smallest versioned building model that can represent Loc8's current
Guard/Command workflows, preserve the stable identity seam frozen by FLOOR-01,
describe rooms and operational zones, represent vertical transitions and final
exits, and compute deterministic multi-floor routes that fail closed when
accessibility or live availability is unknown?

## Claim boundary

This experiment can establish only that a platform-neutral model, validator and
router satisfy deterministic synthetic scenarios. It cannot establish:

- that any real building has been mapped correctly;
- accessibility, fire-safety, evacuation or building-regulation compliance;
- safe operational navigation during an incident;
- geometry, plan-import, positioning or floor-estimation accuracy;
- installer usability, commissioning time or repeatability;
- product/app integration, mobile runtime performance or radio reachability; or
- that a route remains safe when unmodelled hazards, crowds, smoke, locks,
  structural changes or human instructions intervene.

The generated fixture will be explicitly synthetic. A route result is decision
support over a reviewed model, never an instruction to override emergency
services, venue procedures, signage or direct observation.

## Prior evidence and provenance

No third-party source will be copied into the prototype. The implementation will
be an independent, dependency-free Loc8 experiment.

| Source | Version/licence | Use in this experiment | Copy status |
|---|---|---|---|
| Loc8 Guard, Command and engine source | branch baseline `51bbbb7`; in-house | Current floor, zone, muster, incident and responder seams | No cross-project copying |
| FLOOR-01 corpus contract | artifact `fc2f536`; in-house | Preserve `buildingId`, `mapVersion`, `levelId`, `connectorId` and `landingId` identity semantics | Reuse Loc8 contract concepts |
| Anyplace | `722955182375`; MIT | Building/floor/POI/connection and cross-floor routing comparison | Learn only; no source copied |
| OpenStreetMap Simple Indoor Tagging and `level` guidance | wiki content CC BY-SA 2.0 | Interoperability vocabulary; separate machine order from signposted `level:ref`; doors and multi-level features | Concepts cited; no text, code or OSM data copied |
| OGC IndoorGML 2.0, OGC 22-045r5 | OGC standard; published 2025 | Separate physical cell spaces from a dual connectivity graph; distinguish general and transfer spaces; route as ordered nodes/edges | Conceptual alignment only; no conformance claim |
| Multi-floor S-Graphs | audited retained commit `35dd3561730a`; GPL-3.0 | Transition/landing objects as graph architecture input | Learn/reimplement only; no source copied |
| HOV-SG | retained source with conflicting commercial terms | Building/floor/room hierarchy comparison | Learn only; no source copied or model bundled |

If later work imports OpenStreetMap data rather than merely mapping Loc8 fields
to OSM concepts, the ODbL database obligations require a separate licence and
distribution review.

## Current product findings to test against

The baseline product model has useful operational workflows but no shared
building source of truth:

- Command `Zone` has an ID, mutable name, latitude/longitude centroid and a 2D
  display rectangle, but no building, level, space, connector or exit identity.
- Guard levels are signed integers with hard-coded display names; TeamMap has an
  independent hard-coded zone layout.
- incident, SOS and muster messages carry mutable floor/zone/assembly strings.
- nearest-responder ranking is straight-line 2D distance and cannot account for
  walls, floors, doors, closures or accessible routes.
- the v1 packet wire floor remains a signed six-bit value (`-64..63`), so a
  deliberate mapping seam is needed; stable semantic IDs must not be replaced by
  or derived from that wire value.

MAP-01 will not change those product seams. It will test whether one pure model
can project the data they need without making display labels or wire ordinals
canonical identity.

## Hypotheses

1. A physical semantic model plus an explicit directed route graph can cover the
   minimum Guard/Command/floor-fusion scenarios without embedding topology in
   names, geometry or consecutive floor numbers.
2. Stable identifiers remain unchanged when public floor labels, room names and
   zone names change; canonical route results remain semantically identical.
3. Connector landings and final-exit portals provide enough validation context
   to reject impossible cross-floor and indoor/outdoor edges.
4. Accessibility represented as explicit affirmative, negative or unknown
   evidence can fail closed: an unknown path is never silently considered
   step-free or wheelchair-usable.
5. A separate request overlay for closures can reroute or produce an explicit
   no-route result without mutating the published baseline map.
6. Explicit semantic-ID-to-wire-code configuration can bridge the current
   signed floor field without making the wire code a global floor identity.

## Frozen minimum model

The prototype will accept one JSON-compatible document with
`schemaVersion = "loc8.building-graph.v1"` and these required collections.
Unknown fields at contract-owned levels will be rejected rather than silently
ignored.

### Building and publication metadata

- stable `buildingId` and immutable `mapVersion`;
- mutable building `name` kept separate from identity;
- `status` (`draft`, `reviewed` or `retired`) and temporal validity;
- a declared building-local coordinate frame using metres, named axes and an
  explicit origin description; no GPS coordinate is required;
- source references and review metadata sufficient to identify whether the
  synthetic/test map is unreviewed or reviewed. Full capture rebuild/rollback is
  deferred to MAP-05.

### Levels

Each level has stable `levelId`, human `levelRef`, mutable `name`, numeric
`ordinal` and finite `elevationM`. IDs are authoritative. `levelRef`, `name`,
`ordinal`, elevation and the current wire code are not IDs and need not be equal
or consecutive.

### Spaces and zones

Each space has stable `spaceId`, one `levelId`, a kind (`room`, `corridor`,
`lobby`, `service`, `outdoor` or `void`), mutable name/reference, navigability,
egress requirements and an associated route node where navigable.

Each operational zone has stable `zoneId`, one `levelId`, a mutable name and one
or more member `spaceId` values. MAP-01 zones are deliberately single-level so
an incident or coverage count cannot ambiguously refer to several floors. A
future aggregate area may reference multiple zones rather than weakening this
invariant.

### Connectors and landings

Each vertical connector has stable `connectorId`, kind (`stairs`, `lift`,
`escalator` or `ramp`), baseline availability/access semantics and two or more
landings. Each landing has stable `landingId`, `levelId`, `spaceId` and
`nodeId`. A connector traversal route edge may connect only landings belonging
to that connector. A landing is not inferred from matching X/Y coordinates.

### Portals, exits and places

A portal represents a door, opening or gate between two spaces on one level.
A `finalExit` portal must cross from an indoor space to an outdoor space and be
backed by an explicit exit route edge. Direction, emergency use and
accessibility are explicit.

Named operational places, including assembly points, have stable `placeId`,
kind, `spaceId` and `nodeId`. Human labels are not muster identity.

### Route nodes and edges

Route nodes have stable IDs, level/space membership, semantic kind and finite
building-local `{xM, yM}` coordinates. Route edges have stable IDs, explicit
`fromNodeId`/`toNodeId`, kind (`walk`, `door`, `stairs`, `lift`, `escalator`,
`ramp` or `exit`), directionality, finite positive distance and duration,
emergency-use state and accessibility evidence.

Only connector traversal edges may cross levels. Same-level portal edges must
agree with portal space membership. No missing or zero cost will default to a
usable edge.

### Accessibility and availability

Accessibility uses evidence-bearing tri-state values rather than optimistic
booleans:

- `stepFree`: `yes`, `no` or `unknown`;
- `wheelchair`: `yes`, `no` or `unknown`.

Step-free/wheelchair profiles accept only explicit `yes` along every selected
edge and semantic transfer object. `unknown` fails closed. This is routing
policy, not an accessibility-compliance claim.

Published baseline availability remains in the versioned graph. Request-time
`closedEdgeIds` and `closedConnectorIds` form an immutable operational overlay;
the router must not mutate the graph.

## Frozen routing contract

The independent router will provide deterministic:

- point-to-point routing;
- routing to the best eligible final exit;
- ordered node and edge IDs;
- ordered level and connector transitions;
- total distance and nominal duration;
- `buildingId`, `mapVersion`, profile and closure context; and
- explicit `ok`, `no-route` or invalid-request outcomes with reason codes.

Supported test profiles:

1. `walking`: ordinary authorised pedestrian route.
2. `step-free`: every edge/portal/connector must explicitly support step-free
   and wheelchair travel.
3. `evacuation-walking`: final-exit route; lifts and escalators are excluded;
   only edges explicitly marked for emergency use are eligible.
4. `evacuation-step-free`: combines final-exit and affirmative accessible-route
   constraints; it must fail rather than fall back to stairs or unknown data.

Equal-cost choices are resolved by stable edge/node ID order. Inputs and graph
collections may be reordered without changing route semantics or fingerprints.

## Deterministic fixture

The canonical synthetic building must contain, at minimum:

- the exact FLOOR-01 stable building/map/level/connector/landing ID seam;
- three non-consecutive semantic levels presented as `B1`, `G` and `2A`, with
  distinct ordinals and elevations;
- rooms, corridors/lobbies, an outdoor space and at least four single-level
  operational zones;
- stairs and a lift spanning all required levels;
- explicit escalator and ramp examples so their direction/accessibility rules
  are not merely schema enums;
- two final exits, at least one explicitly step-free, plus an assembly point;
- an upward-only edge, a restricted/non-navigable space, an unknown-access path
  and two plausible alternatives for closure rerouting; and
- an explicit injective map from the three stable level IDs to valid signed
  legacy wire floor codes.

The fixture is a model exercise, not a surveyed building.

## Pre-registered tests and failure injections

### Contract and identity

- valid fixture and serialize/parse round trip return zero validation errors;
- canonical serialization/fingerprint is identical after collection reordering;
- changing only human level/space/zone/place labels leaves every stable ID and
  semantic route ID sequence unchanged;
- non-consecutive ordinals/labels are accepted and duplicate stable IDs are
  rejected across every owned collection;
- unknown fields, non-finite numbers, malformed types and missing mandatory
  properties fail closed with stable machine-readable issue codes;
- wire floor codes must be integer, unique and within `-64..63`; they cannot be
  derived implicitly from labels or ordinals.

### Referential and semantic integrity

Named mutations will cover unknown building/version references; missing levels,
spaces, zones, connectors, landings, portals, places, nodes and edges; level/
space/node disagreements; duplicate landing levels; connector edges joining
another connector's landing; cross-level `walk`/`door`/`exit` edges; invalid
same-space portals; final exits that do not lead outdoors; invalid assembly
membership; multi-level zones; empty zones; orphan navigable spaces; negative,
zero or non-finite costs; invalid accessibility states; and invalid temporal or
coordinate-frame metadata.

### Routing behaviour

- a standard cross-floor route succeeds and returns the expected stable level,
  landing, connector, node and edge sequence;
- reverse traversal of an upward-only escalator is rejected;
- `step-free` never selects stairs, an unknown-access edge or a connector whose
  affirmative accessibility evidence is missing;
- closure of the preferred accessible connector reroutes through a verified
  accessible alternative; closing both returns `no-route` with a stable reason;
- `evacuation-walking` excludes lifts/escalators and terminates only through a
  valid final exit into outdoor space;
- `evacuation-step-free` reaches an explicitly accessible final exit or fails
  closed without substituting stairs;
- closing a preferred stair/exit deterministically reroutes or returns no route;
- a closed edge or connector is never returned and the published graph remains
  byte-identical after every request;
- all fixture spaces marked `egressRequired` have a valid evacuation-walking
  route to a final exit;
- all spaces marked `stepFreeEgressRequired` have a valid
  evacuation-step-free route to an accessible final exit; and
- invalid origin/destination/profile/closure identifiers return invalid-request,
  not a misleading no-route or partial route.

### Product-boundary projections

Pure projection helpers will demonstrate, without changing product code:

- ordered Guard-style level rows retain stable `levelId`, label, name, ordinal
  and elevation;
- Command-style zones come from the shared model and include stable building,
  level and member-space identity;
- assembly/muster places are referenced by stable IDs with separate labels; and
- legacy floor wire mapping is explicit and reversible inside one map version.

## Acceptance gates

All promotion gates are conjunctive:

| Gate | Pass threshold |
|---|---|
| G1 contract | Schema document, pure validator and canonical serializer exist; canonical fixture has zero errors |
| G2 domain coverage | Fixture includes every required level/space/zone/connector/exit/accessibility/place concept listed above |
| G3 adversarial validation | At least 35 named structural/referential/semantic invalid mutations are rejected with the expected issue code; zero unexpected accepts |
| G4 routing | Every frozen routing scenario passes; directed, closure, final-exit and no-route semantics are exact |
| G5 accessibility | No stairs, unknown or negative accessibility evidence appears in any step-free result; all required accessible-egress assertions pass |
| G6 reachability | 100% of fixture `egressRequired` spaces and 100% of `stepFreeEgressRequired` spaces satisfy their corresponding exit audit |
| G7 identity | Label rename and collection reorder preserve stable IDs and canonical semantic route/fingerprint results |
| G8 product seam | Level, zone, assembly and explicit wire-code projections pass round-trip/injectivity tests without deriving identity from display metadata |
| G9 regression quality | At least 50 focused tests pass; combined existing pure R&D tests, service tests, product Jest suites and TypeScript checks remain green |
| G10 scale regression | A deterministic graph of at least 1,000 route nodes completes 10,000 mixed profile/closure route requests in under 5,000 ms on this development host |
| G11 reproduction | Two independent benchmark/evaluation runs produce identical semantic fingerprints and pass/fail counts |
| G12 evidence | Machine-readable measurements, input/output fingerprints, tool/runtime metadata and hashes for all decision artefacts verify |

The scale gate is a local algorithm-regression bound only. It is not mobile,
server capacity, venue size or incident-load evidence.

## Planned artefacts

Prototype:

- `building-graph.mjs` — canonical serializer, validator, router, reachability
  audit and projections;
- `fixture.mjs` — canonical synthetic graph and deterministic scale fixture;
- `building-graph.test.mjs` — contract/adversarial/routing/projection tests;
- `benchmark.mjs` — two-run scale and reproducibility measurement;
- `schema-v1.json` — machine-readable JSON Schema representation;
- `README.md` — implementation scope and reproduction commands.

Result:

- `README.md` — finding, measurements, failures and decision;
- `data-contract.md` — field/invariant and product-integration seam;
- `measurements.json` — machine-readable gate results;
- `evidence-manifest.json` — source/runtime/artefact hashes.

## Decision rules

### PROMOTE

Promote only the platform-neutral schema, validator, graph/router contract and
projection seam if **all** G1-G12 pass. Promotion means product development may
adopt and harden those contracts. It does not promote the fixture as a real map
or the router as safety-certified guidance.

### REPEAT

Repeat MAP-01 if a pure gate fails but the model remains plausibly correctable.
Even after pure promotion, separately repeat through MAP-04/MAP-10 with one
permissioned real plan/building, two operators, topology review and app adapter
work before making commissioning or real-route claims.

### HOLD

Hold real building-plan ingestion, identifiable/site-sensitive map storage and
operational deployment until site-owner authority, security classification,
tenant isolation, encryption, access audit, retention/deletion and named-review
workflows exist. Hold regulatory/accessibility/evacuation claims for competent
specialist review and real evidence.

### STOP

Regardless of the promotion result, stop these design paths:

- consecutive integers, public floor labels, room names or zone names as global
  identity;
- straight-line 2D distance as cross-floor responder-route truth;
- geometry overlap or matching X/Y coordinates as proof of connectivity;
- treating lifts/escalators as automatically permitted in evacuation;
- treating `unknown` accessibility as accessible;
- silently defaulting missing edge distance/duration to zero; and
- presenting synthetic routes as surveyed, compliant or operationally safe.

## Reproduction commands to freeze after implementation

The result README will record exact commands. Expected entry points are:

```text
node --test docs/research/rnd/prototypes/building-graph/building-graph.test.mjs
node docs/research/rnd/prototypes/building-graph/benchmark.mjs
```

Product and existing-R&D regressions will be run only after the prototype gates
pass, and their exact output/counts will be captured rather than inferred.
