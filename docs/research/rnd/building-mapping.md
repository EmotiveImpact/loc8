# Whole-building mapping architecture

## Goal

Turn a set of room scans, floor plans, installation observations and operational
landmarks into one versioned building model that can answer:

- where rooms, exits, hazards and people are;
- which floors and zones are connected and accessible;
- which routes remain physically and radio-reachable;
- what evidence supports a floor/location estimate; and
- what changed between as-planned, as-mapped and live incident state.

The useful product is not merely a 3D mesh. It is an **operational building
graph** with geometry, semantics, radio coverage and provenance.

## Separate four layers

1. **Raw captures:** floor-plan images/PDFs, RoomPlan/USDZ, LiDAR/RGB/depth,
   device trajectories, pressure/IMU, BLE/Wi-Fi samples and manual notes.
2. **Geometry:** coordinate frames, room polygons, walls, openings, floor planes,
   point clouds and 3D surfaces.
3. **Semantic graph:** building, level, room/zone, door, stair, lift, escalator,
   ramp, exit, assembly point, restricted area, anchor and gateway.
4. **Operational overlay:** live occupancy, floor estimates, hazards, closures,
   mesh links, RF shadows, device health and incident/audit events.

Keep raw observations immutable. Derived geometry and semantics must record the
algorithm/version and reviewer that produced them so a later mapping engine can
rebuild the model.

## Multi-floor capture workflow

### iOS commissioning path

Apple RoomPlan's `CapturedStructure` combines multiple `CapturedRoom` scans, and
Apple explicitly documents structures with varying floor heights and rooms on
different floors. Reuse one compatible AR session/world coordinate context when
possible, scan room by room, and persist each raw capture before merging.

RoomPlan can seed walls, openings, doors, floors, objects and dimensions. It
does not remove the need to identify operational zones, verify exits, connect
stairs/lifts, reconcile duplicate rooms or validate as-built conditions.

### Android/cross-platform path

Use ARCore/depth or visual-inertial odometry behind the same capture contract.
Where phone depth is weak, accept imported floor plans plus a guided walk and
visual/QR control points. PALMS is a strong research baseline for aligning phone
LiDAR or monocular depth to a known plan without a previous venue visit.

### Transition capture

At each stair, lift, escalator or ramp:

1. select/confirm the connector and starting landing;
2. record continuous AR/SLAM pose, pressure, IMU and radio observations;
3. mark the destination landing;
4. infer direction/mode and elevation delta;
5. connect the two semantic floor nodes; and
6. repeat in both directions where practical.

The S-Graphs multi-floor branch shows why transition trajectories should be
first-class graph objects. HOV-SG similarly links floor-level room graphs using
stair trajectories.

## Coordinate frames and registration

Maintain explicit transforms:

```text
device/session -> room capture -> floor-local -> building-local -> optional site/world
```

Never silently bake these into points. A control-point observation should include
source/target frame, transform, uncertainty, timestamp and reviewer status.

Use at least three non-collinear control points when registering an imported plan.
Store both the source plan and transform so corrected plans do not destroy the
survey trail. Hilti 2026 is a useful caution: even construction floor plans can
differ from the as-built state.

## Suggested semantic schema

```text
Site
└── Building
    ├── Level {id, levelRef, ordinal, elevationRange}
    │   ├── Space {room|corridor|zone|void|outdoor}
    │   ├── Boundary {wall|door|opening|window}
    │   ├── Asset {anchor|gateway|extinguisher|AED|camera|sensor}
    │   └── Hazard/Restriction
    └── Connector
        ├── Landing {levelId, spaceId, position}
        └── Edge {stairs|lift|escalator|ramp, direction, accessibility,
                  learnedHeight, travelTimeDistribution}
```

Add stable IDs and temporal validity. Names and floor labels are mutable human
metadata, not primary keys.

For interoperability, support OpenStreetMap Simple Indoor Tagging concepts:
`indoor=level/room/corridor`, `level`, `level:ref`, doors and vertical features
with multi-level ranges. OSM distinguishes the machine level value from the label
shown on a lift button, which matches the required Loc8 model.

## Geometry extraction

- Use horizontal plane RANSAC as in hdl_graph_slam to stabilise floor/ceiling
  geometry and drift.
- Use vertical occupancy/density histograms only in an offline pipeline and
  validate the peaks; HOV-SG's floor segmentation is a useful reference but has
  conflicting commercial terms and high compute requirements.
- Build per-floor occupancy/navigation graphs from walkable space, then connect
  them only through semantic connector landings.
- Retain doors as graph edges because access, direction and closure change routes.
- Treat objects/classes produced by vision as suggestions until reviewed where
  operational safety depends on them.

## Coverage mapping as part of commissioning

Every guided walk should also record:

- BLE peer/anchor RSSI and packet success;
- LoRa SNR/RSSI, hops and delivery acknowledgements when hardware is present;
- Wi-Fi AP observations/RTT capability;
- phone model, carry position and scan state;
- pressure/temperature; and
- background/locked-screen state.

Aggregate into confidence-bounded coverage cells and graph edges. The output is
not a colourful heatmap alone; it should recommend where to install or move an
anchor/gateway/repeater and predict which operational routes remain connected.

## Versioning and review

Each published building version needs:

- source capture hashes and licences/permissions;
- schema and algorithm versions;
- control-point/registration residuals;
- unresolved topology/geometry conflicts;
- floor and connector validation status;
- radio survey coverage and device mix;
- named reviewer and approval time; and
- a rollback path.

Mapping data is sensitive security information. Encrypt it at rest/in transit,
separate tenants/sites, minimise consumer access, and audit exports.

## Recommended first implementation

Build the semantic graph and importer before a universal 3D reconstruction
engine. A high-value v1 can ingest a plan, let an installer trace rooms/exits and
connectors, place signed anchors, walk the site, learn floor transitions and
capture coverage. Add RoomPlan/PALMS-assisted geometry as accelerators behind the
same model. This produces operational value sooner and preserves a path to a
full digital twin.

## Primary reading

- [Apple: scanning the rooms of a single structure](https://developer.apple.com/documentation/roomplan/scanning-the-rooms-of-a-single-structure)
- [Apple `CapturedStructure`](https://developer.apple.com/documentation/roomplan/capturedstructure)
- [OSM Simple Indoor Tagging](https://wiki.openstreetmap.org/wiki/Simple_Indoor_Tagging)
- [PALMS](https://github.com/Head-inthe-Cloud/PALMS-Plane-based-Accessible-Indoor-Localization-Using-Mobile-Smartphones)
- [NUFR-M3F](https://github.com/neufieldrobotics/NUFR-M3F)
- [Hilti-Trimble SLAM Challenge 2026](https://github.com/Hilti-Research/hilti-trimble-slam-challenge-2026) — non-commercial dataset terms
