# FLOOR-01 v1 data contract

The authoritative machine and reference implementations are:

- [`../../../prototypes/floor-corpus/schema-v1.json`](../../../prototypes/floor-corpus/schema-v1.json)
- [`../../../prototypes/floor-corpus/floor-corpus.mjs`](../../../prototypes/floor-corpus/floor-corpus.mjs)

JSON Schema enforces the portable record structure and kind-specific payload
allowlists. The reference validator is also authoritative because it enforces
relationships across records that JSON Schema does not: declared capability and
unit agreement, semantic topology, time sync, ground-truth coverage, stream
completeness and recursive privacy checks.

## Bundle format

The durable stream is UTF-8 JSONL:

1. exactly one `{ "recordType": "manifest", "manifest": ... }` record;
2. zero or more `{ "recordType": "event", "event": ... }` records while
   collection is incomplete; and
3. a valid completed bundle has one `session-start` first and one `session-end`
   last.

Each event carries the schema/session ID, contiguous sequence, session
monotonic microseconds, wall milliseconds, clock uncertainty, source and strict
payload. Wall time is never used for ordering.

## Semantic building identity

`buildingId`, `mapVersion`, `levelId`, `connectorId` and `landingId` are stable
opaque IDs. `levelRef` is the human label and may be `B1`, `G`, `M`, `2A` or a
local convention. `ordinal` expresses vertical order without assuming displayed
floors are consecutive. `elevationM` is the map datum used later by fusion and
routing; this contract does not claim it was surveyed accurately.

A connector contains one landing per served level and a declared set of
physical modes. A transition must name the connector and its source/destination
landings; the validator proves those landings belong to the labelled levels and
that direction agrees with level order.

This is deliberately the shared identity seam for `MAP-01`. MAP-01 may extend
building geometry and operational semantics, but it must preserve these IDs and
must not replace them with display labels or integer array positions.

## Capabilities and units

Every potential periodic source appears once in `capabilities`, whether
available or unavailable. Available sources have a positive requested interval;
unavailable sources use zero. A periodic observation is rejected unless its
event kind/source matches an available declaration.

Canonical units are:

| Kind | Manifest unit | Payload |
|---|---|---|
| pressure | `hpa` | hPa; optional relative altitude in metres |
| motion | `mps2-rps` | acceleration in m/s²; angular rate in rad/s |
| steps | `count` | cumulative non-negative count |
| magnetic field | `microtesla` | calibrated x/y/z μT |
| radio observation | `dbm` | RSSI in dBm |
| phone state | `state` | enumerated app/screen/power state |

If the declared native timestamp unit is seconds, milliseconds or nanoseconds,
every event from the source must retain a non-negative native timestamp and the
matching unit. If a source declares `none`, both fields must be absent. The
adapter converts native time once to session monotonic microseconds and never
orders by wall clock.

## Ground truth

`ground-truth-segment` is the evaluation truth timeline. Its categories are:

- `stationary` — known single level outside a transition;
- `transition` — movement between two levels through one connector; and
- `same-floor-control` — movement/environmental activity deliberately not
  changing level.

The analysis interval must be covered once. Aggregate gaps or overlaps above
the manifest's threshold (never more than 100 ms in v1) invalidate the session.
Segment IDs are unique. Source/destination level, connector, landing, mode,
direction and confirmer are retained. A `ground-truth-point` records a landing
confirmation or correction action without replacing the reviewed segment
timeline.

Ground truth is still a human assertion. The physical pilot must confirm both
landings and obtain an independent timeline review; this pure validator cannot
prove the label was honest.

## Clock model

At least two `clock-sync` events must bracket the analysis interval. Each stores
local send/receive monotonic values, a reference wall value, round-trip time,
offset and uncertainty. The event monotonic value must fall within the local
request interval. A session is invalid for transition timing when maximum
uncertainty exceeds 100 ms or adjacent offset change exceeds 5 ms/min.

Clock/source reset is not repaired. End the session (or a future explicitly
versioned segment) and record the deviation.

## Completeness report

For each available periodic source, `evaluateSession()` reports:

- expected and received observations over the inclusive analysis interval;
- missing count and dropout ratio;
- median, p95 and maximum inter-observation interval; and
- number of intervals exceeding twice the requested interval.

These figures measure an exported event timeline. They do not prove the OS
sampled at the requested rate or that a sensor value is accurate.

## Versioning rule

Readers must reject an unknown `schemaVersion`. New event kinds, payload fields,
units or meaning require a new schema version plus migration/replay fixtures.
Arbitrary fields are rejected; silently accepting extensions would undermine
privacy minimisation and reproducibility.
