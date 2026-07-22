# Innovation opportunities and end-state vision

## The defensible product

The strongest synthesis is a **coverage-aware operational digital twin**:

> A live, offline-capable model of a venue that understands rooms, floors,
> connectors, people and incidents *and* understands whether the communications
> paths needed to operate that venue are currently reachable.

Most indoor-mapping products model physical space. Most mesh products model
radios. Most workforce products assume connectivity. Loc8 can join all three:

- semantic building/floor/room/egress graph;
- probabilistic person/asset floor and zone estimates with provenance;
- live BLE/IP/LoRa reachability and RF-shadow graph;
- incident workflow, acknowledgement, muster and assisted search; and
- an auditable commissioning process that learns and improves each site.

That combination is more defensible than claiming a novel flood algorithm or a
single indoor-positioning accuracy number.

## High-value innovations

### 1. The building learns itself during installation

A guided commissioning walk simultaneously:

- traces rooms, doors and vertical connectors;
- learns actual storey-height distributions;
- records pressure, BLE/Wi-Fi/LoRa fingerprints and transition modes;
- discovers RF shadows and congestion;
- validates exit/accessible routes; and
- recommends anchor/gateway/repeater positions.

The customer receives a commissioning evidence pack, not a box of beacons and a
promise. Subsequent walks detect map, pressure and RF drift.

### 2. Route on both safety and connectivity

During an incident, normal shortest-path routing is insufficient. Compute routes
over two coupled graphs:

- the physical graph: accessibility, crowding, hazards, closed doors, smoke or
  unsafe zones; and
- the communications graph: expected phone/anchor/gateway reachability and last
  known delivery quality.

This can identify an evacuation route whose messages will still propagate, or
dispatch a “data mule”/responder through a courier gap.

### 3. Confidence-native operations

Every location/floor display carries:

- probability/confidence;
- evidence types;
- last absolute anchor and age;
- last message/delivery path and age; and
- human correction/audit history.

This is safer and commercially credible. “Unknown, last confirmed on L2 four
minutes ago” is operationally better than a precise-looking wrong dot on L3.

### 4. Phone mesh plus durable venue backbone

Phones provide zero-install local participation; fixed BLE anchors provide
semantic truth; LoRa repeaters/gateways provide range and outage resilience; IP
provides high capacity when available. The application envelope remains the same.

Sell this in capability tiers:

- **Connected Operations:** Guard + Command over hardened venue IP.
- **Resilient Venue:** signed floor/zone anchors and phone BLE fallback.
- **Resilient Campus:** LoRa repeaters/gateways and cross-building operations.
- **Precision/Regulated:** commissioned RTT/UWB/AoA, stronger evidence packs and
  agreed service levels.

### 5. Privacy-preserving operational data moat

With customer permission, retain derived, de-identified performance features:

- radio propagation by building material/topology;
- transition signatures by connector/phone model;
- anchor placement outcome;
- delivery and battery performance; and
- intervention/incident workflow timings.

Use them to improve deployment planning and calibration. Do not centralise raw
person trails by default. Site-owned raw data plus federated/aggregated derived
models can become an advantage without turning Loc8 into a surveillance product.

## Build/buy/adopt boundary

Build and own:

- operational event model, identity/roles and site isolation;
- semantic building and connector graph;
- floor/zone evidence fusion and confidence contract;
- coupled safety/reachability routing;
- incident/muster/search UX and audit chain;
- commissioning workflow and deployment recommender; and
- transport-independent application security.

Adopt/adapt:

- current public-domain BitChat delivery/network components;
- MeshCore or LoRaMesher for early LoRa carrier experiments;
- RadioLib if custom radio firmware becomes necessary;
- RoomPlan/PALMS/plane extraction as mapping accelerators;
- Navigine/blelocpp/Bermuda algorithms as tested baselines; and
- OSM indoor concepts for interchange.

Avoid building initially:

- a universal photogrammetry/SLAM engine;
- custom radio silicon;
- centimetre positioning from commodity BLE RSSI;
- a general consumer chat network; or
- an all-purpose GIS/BIM suite.

## 12-month R&D sequence

### 0-8 weeks: prove the missing fundamentals

- physical three-phone BLE relay, mixed OS and background matrix;
- secure connected bridge scope and protocol-v2 design;
- floor-transition data logger with manual truth;
- one-site semantic floor/connector graph; and
- Bermuda-style landing anchors and pressure-reference prototype.

### 2-4 months: fused vertical positioning and commissioning alpha

- HMM/Viterbi floor estimator with confidence/evidence;
- learned connector/storey heights and device capability profiles;
- installer floor-plan import, connector tracing and guided walk;
- coverage map/repeater recommendation prototype; and
- field comparison of phone BLE, MeshCore and LoRaMesher.

### 4-8 months: resilience and operational twin

- BitChat-derived authenticated protocol-v2 components behind feature flags;
- LoRa gateway adapter carrying the same application envelope;
- live physical + RF graph in Command;
- delivery-aware dispatch and assisted search; and
- repeatable commissioning/evidence report.

### 8-12 months: validation and differentiated pilots

- multi-building/device season/weather dataset;
- red-team and external cryptographic review;
- battery, congestion, failure-injection and anchor-tamper tests;
- premium RTT/UWB/AoA feasibility with a design partner; and
- quantified pilot outcomes tied to time-to-locate, acknowledgement, muster and
  coverage—not only localisation error.

## Claims that would constitute real breakthroughs

Only publish these after reproducible evidence:

- floor accuracy and correction latency across named device/building cohorts;
- percentage of site area with delivery at a stated latency/reliability under
  crowd and phone-state conditions;
- reduction in anchors/repeaters or commissioning labour from the learned
  deployment planner;
- incident time saved by confidence/reachability-aware search; and
- graceful operation under measured IP, gateway, anchor and peer failures.

The edge is the evidence-backed system, not the phrase “mesh” or “AI”.
