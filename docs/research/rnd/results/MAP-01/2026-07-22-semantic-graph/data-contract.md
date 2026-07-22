# `loc8.building-graph.v1` data and integration contract

## Purpose

`loc8.building-graph.v1` is the minimum pure contract needed to give Loc8 one
semantic source of truth for levels, spaces, operational zones, vertical
connectors, doors, final exits, assembly places and cross-floor route topology.

It deliberately separates:

1. **physical semantics** — what a room, door, stair, lift, landing or exit is;
2. **route topology** — which directed positive-cost traversal edges the
   published map currently permits; and
3. **request overlay** — edge/connector closures applied without mutating the
   versioned baseline.

Geometry, raw captures, positioning estimates, radio coverage, occupancy and
incident hazards remain separate layers. A graph route does not certify the
underlying survey or the safety of using it.

## Root identity and publication fields

| Field | Meaning/invariant |
|---|---|
| `schemaVersion` | Exactly `loc8.building-graph.v1` |
| `buildingId` | Stable building identity shared with FLOOR-01 |
| `mapVersion` | Immutable identity for one published graph revision |
| `name` | Mutable display metadata; never a key |
| `status` | `draft`, `reviewed` or `retired` |
| `validFrom`, `validTo` | ISO timestamps; end must be after start |
| `coordinateFrame` | Named building-local metre frame with explicit origin and distinct axes |
| `provenance.sourceRefs` | Bounded source kind, hash if available, licence/permission and synthetic flag |
| `provenance.review` | Unreviewed/reviewed/rejected state plus reviewer/time evidence when reviewed |

The prototype rejects unknown contract-owned fields. It does not claim the
minimal provenance block is enough for full reconstruction/rollback; MAP-05
must add immutable raw observations, transforms, algorithm versions and change
lineage.

## Semantic collections

### `levels`

```text
Level {
  levelId, levelRef, name, ordinal, elevationM
}
```

- `levelId` is authoritative and stable.
- `levelRef` is the sign/lift-button label and may be `B1`, `G`, `2A` or another
  local notation.
- `ordinal` expresses machine ordering but need not be consecutive.
- `elevationM` is finite building-local elevation, not a global altitude.
- IDs, labels, ordinals, elevations and packet wire codes are different facts.

This follows the useful interoperability distinction in OpenStreetMap's
[`level`](https://wiki.openstreetmap.org/wiki/Levels) and
[`level:ref`](https://wiki.openstreetmap.org/wiki/Key:level:ref) concepts without
copying OSM data or making OSM tags Loc8 primary keys.

### `spaces`

```text
Space {
  spaceId, levelId,
  kind: room | corridor | lobby | service | outdoor | void,
  name, ref,
  navigable, egressRequired, stepFreeEgressRequired,
  nodeId
}
```

Every navigable space has a matching primary route node and must participate in
at least one edge. A `void` cannot be navigable. Step-free egress requirement
implies general egress requirement. Requirement flags declare which spaces the
publication audit must test; they do not declare regulatory occupancy classes.

### `zones`

```text
Zone { zoneId, levelId, name, spaceIds[] }
```

MAP-01 operational zones are non-empty and single-level. Every member is a
known navigable space on that level. Multi-floor business groupings should
reference several stable zones rather than turning one incident/coverage zone
into an ambiguous floor reference.

### `connectors` and landings

```text
Connector {
  connectorId,
  kind: stairs | lift | escalator | ramp,
  name, availability, emergencyUse, accessibility,
  landings[] { landingId, levelId, spaceId, nodeId }
}
```

A connector has at least two landings and at most one landing per level. Every
landing matches a navigable space and a route node of kind `landing`, and every
landing participates in a connector traversal edge. Connector edges can join
only two landings belonging to that same connector and must change level.

Stable landing objects are the direct seam to FLOOR-01 transition truth. X/Y
coincidence is never treated as connectivity.

### `portals` and final exits

```text
Portal {
  portalId, levelId,
  kind: door | opening | gate,
  name, fromSpaceId, toSpaceId,
  direction: both | forward,
  finalExit, availability, emergencyUse, accessibility
}
```

Each portal has exactly one route edge, and its node-space orientation,
direction and `door`/`exit` kind must agree. A final exit must lead from an
indoor space to an outdoor space; any indoor/outdoor portal must be explicitly
marked as a final exit.

This makes a door a first-class operational edge whose access/direction/closure
can change, rather than a decorative geometry feature.

### `places`

```text
Place {
  placeId,
  kind: assembly | aed | anchor | gateway | other,
  name, spaceId, nodeId
}
```

An assembly point must be in a navigable outdoor space. Muster and other
operational messages should carry stable `placeId` plus an independently
resolved label, not the label alone.

## Directed route graph

```text
RouteNode {
  nodeId, levelId, spaceId,
  kind: space | landing | portal | place,
  position { xM, yM }
}

RouteEdge {
  edgeId, fromNodeId, toNodeId,
  kind: walk | door | stairs | lift | escalator | ramp | exit,
  bidirectional,
  distanceM, durationSec,
  availability, emergencyUse, accessibility,
  connectorId | null,
  portalId | null
}
```

Every cost is finite and strictly positive. There is no missing/zero default.
Only connector edges may cross levels. A `walk` edge stays inside one space;
cross-space movement uses a portal. A door/exit edge stays on one level and
must match one portal. These invariants stop geometry or cheap edge weights
from silently manufacturing impossible routes.

The split aligns conceptually with OGC
[`IndoorGML 2.0`](https://docs.ogc.org/is/22-045r5/22-045r5.html): physical cell
spaces and transfer objects remain distinct from the dual connectivity graph.
This prototype does not implement the IndoorGML encoding and does not claim
OGC conformance.

## Accessibility and availability

Every connector, portal and edge declares:

```text
accessibility {
  stepFree: yes | no | unknown,
  wheelchair: yes | no | unknown
}
```

`wheelchair=yes` requires `stepFree=yes`. A step-free profile requires both to
be `yes` on every edge and every referenced transfer object. `unknown` is
evidence missing, not permission.

Baseline availability is `open`, `closed` or `unknown`. Only `open` is routed.
Request-time `closedEdgeIds` and `closedConnectorIds` add live constraints; they
never change the graph object or map version.

This is a fail-closed routing policy, not an Equality Act, Approved Document M,
BS 9999, fire strategy or evacuation-plan assessment. Real classifications and
emergency-use rules require competent review.

## Route request/result

Point-to-point:

```text
route(compiledGraph, {
  fromNodeId,
  toNodeId,
  profile,
  closedEdgeIds?,
  closedConnectorIds?
})
```

Final exit:

```text
routeToExit(compiledGraph, {
  fromNodeId,
  profile,
  closedEdgeIds?,
  closedConnectorIds?
})
```

Successful results include building/map/profile/closure identity, ordered
`nodeIds`, `edgeIds`, compressed `levelIds`, traversed `connectorIds`, distance,
nominal duration, semantic route fingerprint and final-exit portal where
applicable. Equal-cost routes resolve by stable edge/node identity.

Outcomes are explicit:

- `ok` / `route-found`;
- `no-route` / `no-eligible-route` or `no-final-exit`; or
- `invalid-request` with stable reasons for unknown origins, destinations,
  profiles, closures or request fields.

No partial route is returned as success.

## Profiles

| Profile | Allowed policy |
|---|---|
| `walking` | Explicitly open, directionally traversable baseline |
| `step-free` | Walking plus affirmative step-free/wheelchair evidence; stairs excluded |
| `evacuation-walking` | Emergency-use edges/transfers only; lift/escalator excluded; final exit target |
| `evacuation-step-free` | Evacuation plus affirmative accessible evidence |

The graph does not yet implement credential/role access. SEC and product work
must decide whether route visibility and restricted-space traversal are
authorised by a reviewed policy rather than a client-controlled request flag.

## Current product integration seam

The prototype does not modify apps or packets. The promoted development path is:

1. keep this contract in a shared package with schema-versioned storage and
   validation at import/publication boundaries;
2. replace Guard's hard-coded floor rows with `projectLevels()` output while
   retaining `levelId` in state;
3. replace independent Guard/Command zone fixtures with `projectZones()` output;
4. make muster/incident data carry stable `placeId`/`zoneId`/`levelId`, with
   labels as snapshots for human-readable audit;
5. rank responders by eligible graph-route time only after their map node/floor
   evidence is sufficiently trustworthy; preserve straight-line distance only
   as an explicitly labelled fallback;
6. use `createLegacyFloorCodec()` at the v1 packet boundary so the signed
   `-64..63` code never becomes semantic identity; and
7. version a future wire/application payload before carrying full semantic IDs.

The code inspected for this seam is:

- `apps/command/src/domain/types.ts`, `coverage.ts`, `sim.ts`, `zones.ts`;
- `apps/guard/src/state/guardTeam.ts`, `guardStore.ts`;
- `apps/guard/src/ui/TeamMap.tsx`, `FloorStrip.tsx`; and
- `packages/engine/src/core/opsMessages.ts`.

## Anyplace comparison and reuse decision

Direct source at retained MIT commit `722955182375` showed useful precedents:

- buildings, floors, POIs and POI connections are separate objects;
- stair/lift/entrance POIs make cross-floor graph routing possible; and
- a mature indoor product needs floor/POI/connection APIs, not a flat map.

The inspected model/router also explains what not to adopt unchanged:

- floor identity is derived from building ID plus mutable `floor_number`;
- route connections are effectively undirected;
- default/weak distance weighting is unsuitable for vertical travel;
- there is no Loc8-grade direction, accessibility evidence, live closure,
  emergency-use or final-exit policy; and
- rooms/zones/operational provenance are insufficient for the target workflows.

Decision: reuse the MIT ideas and vocabulary comparison; do not copy Anyplace's
old Dijkstra/model code into Loc8. The new implementation is independent.

## Remaining evidence before product use

- MAP-04: import/trace one permissioned real plan, measure scale/control-point
  residuals, model corrections and route sensitivity.
- MAP-05: immutable source/capture lineage, rebuild and rollback.
- MAP-10: second-operator commissioning reproduction and task time/error.
- specialist accessibility/fire/venue review of semantics and profiles.
- secure per-tenant encrypted storage, access/export audit and retention/delete
  verification for security-sensitive building data.
- Guard/Command adapter and user workflow tests, without calling them complete
  merely because the pure projections work.
- incident exercises comparing graph-route support with human procedures and
  evaluating misleading/no-route failure modes.
