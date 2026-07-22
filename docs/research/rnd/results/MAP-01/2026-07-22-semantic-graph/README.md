# Result: minimum semantic multi-floor building graph

**Question:** `MAP-01`, with bounded evidence for `MAP-02` and `MAP-03`

**Evidence date:** 2026-07-22

**Pre-registration:** commit `37e9eb1`

**Evidence class:** deterministic synthetic schema/validator/router experiment

## Decision

### PROMOTE into product development

Promote the following **pure contracts and development seams**:

- `loc8.building-graph.v1` and its fail-closed semantic validator;
- separate physical semantic objects and explicit directed route topology;
- stable building/level/space/zone/connector/landing/portal/place IDs;
- affirmative-evidence accessibility profiles and request-time closure overlays;
- deterministic point-to-point/final-exit routing and publication-time egress
  audit;
- shared level/zone/assembly projections for later Guard/Command adapters; and
- the explicit semantic-level-to-legacy-wire-code adapter.

All twelve frozen pure gates passed. This promotion authorises product teams to
adopt and harden the contract; it does not promote the synthetic fixture as a
real building or the router as safety-certified guidance.

### REPEAT

- MAP-04 with one permissioned real plan/building, explicit scale/control
  points, measured registration residuals and corrected topology.
- MAP-10 with a second operator reproducing the commission without developer
  assistance.
- Guard/Command/engine adapters and workflow tests against stable semantic IDs.
- real accessibility/fire/venue route semantics with competent specialist
  review and deliberately blocked/changed route scenarios.

### HOLD

- real site-sensitive plans, captures or route deployment until tenant
  isolation, encryption, access/export audit, retention/delete and named map
  review exist;
- evacuation, accessibility, compliance, safe-navigation, commissioning-time,
  route-accuracy and pilot-readiness claims until their corresponding real and
  specialist evidence exists.

### STOP

- floor labels, room/zone names or consecutive integers as global identity;
- straight-line 2D distance as cross-floor responder-route truth;
- geometry overlap or equal X/Y positions as proof of connectivity;
- treating unknown accessibility as accessible;
- assuming lifts/escalators are emergency-usable;
- missing/zero route cost defaults; and
- presenting synthetic route success as surveyed-building or safety evidence.

## Finding

The minimum useful Loc8 building object is not a floor list or a 3D mesh. It is
a versioned **operational semantic graph** with two linked planes:

1. physical semantics describe levels, rooms, zones, doors, stairs, lifts,
   ramps, escalators, landings, exits and assembly places; and
2. explicit directed route nodes/edges describe traversability, cost,
   direction, availability, emergency use and accessibility evidence.

A third request-time closure overlay can remove edges/connectors without
mutating or silently republishing the baseline map. The validator proves that
these planes agree structurally; it cannot prove the building survey is true.

This directly resolves the current split-brain product model: Command zones are
2D centroids/rectangles without building or level identity, Guard uses
hard-coded integer floors and a separate hard-coded map, muster/incident
messages rely on mutable strings, and responder ranking is straight-line 2D.
One graph can supply all of those views while retaining stable semantic IDs.

## What was investigated

### Current Loc8 source

The experiment was grounded in the actual seams, not screenshots or strategy
claims:

- Command domain types, coverage/nearest-responder logic, demo zones and
  simulation;
- Guard floor/team/map/store state;
- engine operations messages and signed six-bit floor codec;
- FLOOR-01's frozen building/map/level/connector/landing identity seam; and
- existing R&D mapping, innovation, programme, question and decision records.

### Retained and primary-source comparison

- Anyplace `722955182375` (MIT): direct `Space`, `Floor`, `Poi`, `Connection`,
  controller and Dijkstra source inspection. Reused as model/routing ideas only;
  no source copied.
- Multi-floor S-Graphs `35dd3561730a` (`feature/multi_floor`, GPL-3.0):
  transition/landing architecture is learn/reimplement only.
- HOV-SG `d6e65a53c8be`: useful hierarchy reference but the repository combines
  an MIT file/badge with a README instruction to contact the authors for
  commercial use. Treat as conflicting commercial terms; no code copied.
- [OpenStreetMap Simple Indoor Tagging](https://wiki.openstreetmap.org/wiki/Simple_Indoor_Tagging)
  and [`level`](https://wiki.openstreetmap.org/wiki/Levels): interoperability
  concepts for rooms/corridors/doors/vertical features and machine level versus
  displayed `level:ref`. Wiki text is CC BY-SA 2.0; no text or OSM data copied.
- [OGC IndoorGML 2.0](https://docs.ogc.org/is/22-045r5/22-045r5.html), OGC
  22-045r5: conceptual separation of physical cell spaces and the dual
  connectivity graph, general versus transfer space and ordered routes. No
  encoding was copied and no OGC conformance is claimed.

Any future OSM data import needs a separate ODbL review. Licence permissiveness
was not treated as engineering or safety validation.

## What was built

Prototype directory:
[`../../../prototypes/building-graph/`](../../../prototypes/building-graph/README.md)

- strict JSON Schema 2020-12 representation;
- independent dependency-free semantic validator;
- canonical full and label-insensitive semantic-identity fingerprints;
- validated, deeply frozen compiled snapshot with read-only lookup views;
- deterministic directed shortest-nominal-time router with stable tie-breaking;
- `walking`, `step-free`, `evacuation-walking` and
  `evacuation-step-free` policies;
- immutable edge/connector closure overlay;
- final-exit and required-space egress audit;
- Guard-style level, Command-style zone and stable assembly-place projections;
- explicit reversible legacy signed floor-code mapping; and
- canonical three-floor and 1,002-node scale fixtures.

No product, packet or Expo code was changed.

## Measurements

Full machine-readable results are in [`measurements.json`](measurements.json).

### Canonical semantic fixture

| Measure | Result |
|---|---:|
| Levels / spaces / zones | 3 / 12 / 5 |
| Connectors | 5: two stairs, lift, ramp, upward escalator |
| Portals / final exits / places | 7 / 2 / 1 assembly point |
| Route nodes / edges | 39 / 45 |
| Validation errors | 0 |
| Required evacuation spaces reachable | 8/8 (100%) |
| Required step-free evacuation spaces reachable | 7/7 (100%) |
| Focused tests | 123/123 passed |
| Named invalid mutations | 71/71 rejected with expected issue code |

Full fixture SHA-256:
`fb7dff2d7529e86dd0d5bb000a718d8834f92811e7e865e2cad4fb1307e88ec8`.
Reordering every graph collection produced the same fingerprint.

Semantic identity SHA-256:
`d4bf246671c8f8f3f8615d4e467bf0d6e940362ee142cc48efb7585bdf7e40a4`.
Renaming the building, levels, spaces, zones, connectors, portals and assembly
place produced the same semantic-identity fingerprint and route sequences.

### Route outcomes

| Scenario | Result |
|---|---|
| Ordinary `B1` → `2A` | lift, levels `B1 → G → 2A`, 71 s nominal |
| Step-free `B1` → `2A` | affirmatively accessible lift, 71 s |
| Step-free with lift closed | verified ramp reroute, 183 s |
| Step-free with lift and ramp closed | explicit `no-route`; never stairs/unknown |
| Evacuation from `2A` | east stairs to east final exit; lift/escalator excluded |
| Step-free evacuation from `2A` | emergency-eligible ramp to accessible final exit |
| Preferred stair/exit closures | deterministic west-stair/west-exit reroutes |
| All eligible connectors or exits closed | explicit `no-route` |
| Up-only escalator reverse | rejected |
| Unknown-access door under step-free profile | rejected |

### Scale and reproduction

The deterministic scale graph contains 1,002 nodes and 1,001 edges. Each command
executed 10,000 requests twice: 8,000 point-to-point, 2,000 exit, 770 with a
closure, and 2,500 for each profile.

| Independent command | Run durations | Outcomes | Returned traversals |
|---|---|---|---:|
| 1 | 3,706.137 ms; 3,676.832 ms | 9,718 `ok`; 282 deliberate `no-route`; 0 invalid | 3,499,328 |
| 2 | 3,684.560 ms; 3,679.830 ms | identical | 3,499,328 |

All four durations passed the 5,000 ms local bound. Every run produced result
SHA-256
`6d832d23700431b26c3b1d9971abbb62950447a73a6b628aa6e339484239a5ea`.
This is a local algorithm regression only—not mobile/server capacity or venue
load evidence.

### Existing-system regressions

| Check | Result |
|---|---|
| Combined building/floor/protocol/secure-relay pure tests | 188/188 pass |
| `services/loc8-relayd` | 24/24 pass |
| Direct Jest discovery | exactly 27 suites |
| Product Jest | 27/27 suites, 274/274 tests pass |
| Root TypeScript | pass |
| Guard TypeScript | pass |
| Command TypeScript | pass |

Jest still reports the pre-existing open-handle warning after success. The
authoritative process-exit run used `--forceExit`; this experiment did not cause
or repair that separate harness-cleanup issue.

## Gate audit

| Gate | Evidence | Result |
|---|---|---|
| G1 contract | JSON Schema, validator, serializer, zero-error fixture | PASS |
| G2 coverage | every frozen level/space/zone/connector/exit/access/place kind | PASS |
| G3 adversarial | 71 named invalid mutations, zero unexpected accepts | PASS |
| G4 routing | direction, cross-floor, closure, exit, reroute/no-route scenarios | PASS |
| G5 accessibility | affirmative-only step-free paths; stairs/unknown rejected | PASS |
| G6 reachability | 8/8 walking and 7/7 step-free required spaces | PASS |
| G7 identity | reorder and label-rename fingerprints/routes stable | PASS |
| G8 product seam | level/zone/place projection and wire-code round trip | PASS |
| G9 regressions | 123 focused, 188 combined, service/product/TS green | PASS |
| G10 scale | 10,000 requests over 1,002 nodes under 5,000 ms twice | PASS |
| G11 reproduce | two commands/four runs, identical outcomes/fingerprint | PASS |
| G12 evidence | measurements and hashed evidence manifest | PASS |

## Failures found and corrected

The experiment did not pass merely because the happy path worked. Tests exposed
three implementation defects before the evidence freeze:

1. canonical arrays sometimes sorted portals/edges by a referenced level or
   connector rather than their own ID, so collection reversal changed the full
   fingerprint;
2. a malformed connector `landings` type reached a later `.find()` and threw
   instead of returning validation issues; and
3. a compiled graph retained the caller's mutable source object, allowing later
   changes behind a stale stored fingerprint.

The implementation—not the thresholds—was corrected. It now prioritises each
object's own ID, remains fail-closed for malformed nested collections, and
compiles a deeply frozen snapshot with read-only map views. All corresponding
tests pass.

## Breakthrough and product advantage

The most valuable result is not Dijkstra itself. It is the executable contract
that makes Loc8's future evidence layers composable:

```text
floor estimate ─┐
incident/guard ─┼─> stable semantic node ─> eligible physical route
map/connector ──┘                              │
                                               ├─ closures/accessibility
mesh/coverage evidence (later) ────────────────┘
```

Because FLOOR-01 and MAP-01 share stable level/connector/landing IDs, a floor
estimate can resolve to an operational space without translating through a
display label. The same graph can later attach coverage confidence and mesh
reachability to route edges. That enables a defensible Loc8 capability beyond a
generic indoor map: answer not only “what is shortest?” but eventually “what is
physically eligible, accessible, operationally open, radio-reachable and
supported by current evidence?”

Only the physical/semantic foundation is proven here. Coupled route/radio
decision support remains a hypothesis for later `X-03` evidence and must retain
human procedures and uncertainty.

## Commands

```sh
node --test docs/research/rnd/prototypes/building-graph/building-graph.test.mjs
node docs/research/rnd/prototypes/building-graph/benchmark.mjs

node --test \
  docs/research/rnd/prototypes/floor-corpus/floor-corpus.test.mjs \
  docs/research/rnd/prototypes/secure-relay/secure-relay.test.mjs \
  docs/research/rnd/prototypes/protocol-v2-boundary/protocol-v2-boundary.test.mjs \
  docs/research/rnd/prototypes/building-graph/building-graph.test.mjs

npm --prefix services/loc8-relayd test
npx jest --listTests
npm test -- --runInBand --forceExit
npx tsc --noEmit -p tsconfig.json
npx tsc --noEmit -p apps/guard/tsconfig.json
npm --prefix apps/command run typecheck
```

## Next action

The Principal R&D queue now moves to `SEC-05`, the reviewed cryptographic
library/logical-frame/credential/prekey bake-off. MAP product development may
start from this promoted contract in a separate coherent change, while real
building work remains a `REPEAT` under MAP-04/MAP-10 rather than being inferred
from this synthetic result.
