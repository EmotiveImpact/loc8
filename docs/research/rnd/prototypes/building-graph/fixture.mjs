import { SCHEMA_VERSION } from './building-graph.mjs';

const YES = Object.freeze({ stepFree: 'yes', wheelchair: 'yes' });
const NO = Object.freeze({ stepFree: 'no', wheelchair: 'no' });
const UNKNOWN = Object.freeze({ stepFree: 'unknown', wheelchair: 'unknown' });

function access(value) {
  return { ...value };
}

function node(nodeId, levelId, spaceId, kind, xM, yM) {
  return { nodeId, levelId, spaceId, kind, position: { xM, yM } };
}

function edge(
  edgeId,
  fromNodeId,
  toNodeId,
  kind,
  {
    bidirectional = true,
    distanceM = 1,
    durationSec = 1,
    availability = 'open',
    emergencyUse = true,
    accessibility = YES,
    connectorId = null,
    portalId = null,
  } = {},
) {
  return {
    edgeId,
    fromNodeId,
    toNodeId,
    kind,
    bidirectional,
    distanceM,
    durationSec,
    availability,
    emergencyUse,
    accessibility: access(accessibility),
    connectorId,
    portalId,
  };
}

function walk(edgeId, fromNodeId, toNodeId, distanceM, durationSec, accessibility = YES) {
  return edge(edgeId, fromNodeId, toNodeId, 'walk', {
    distanceM,
    durationSec,
    accessibility,
  });
}

function portalEdge(edgeId, fromNodeId, toNodeId, portalId, finalExit, accessibility = YES) {
  return edge(edgeId, fromNodeId, toNodeId, finalExit ? 'exit' : 'door', {
    distanceM: finalExit ? 2 : 1.2,
    durationSec: finalExit ? 2 : 1.5,
    accessibility,
    portalId,
  });
}

function connectorEdge(
  edgeId,
  fromNodeId,
  toNodeId,
  kind,
  connectorId,
  distanceM,
  durationSec,
  { bidirectional = true, emergencyUse = true, accessibility = YES } = {},
) {
  return edge(edgeId, fromNodeId, toNodeId, kind, {
    bidirectional,
    distanceM,
    durationSec,
    emergencyUse,
    accessibility,
    connectorId,
  });
}

function space(
  spaceId,
  levelId,
  kind,
  name,
  nodeId,
  {
    ref = null,
    navigable = true,
    egressRequired = true,
    stepFreeEgressRequired = true,
  } = {},
) {
  return {
    spaceId,
    levelId,
    kind,
    name,
    ref,
    navigable,
    egressRequired,
    stepFreeEgressRequired,
    nodeId,
  };
}

function connector(connectorId, kind, name, landings, accessibility, emergencyUse) {
  return {
    connectorId,
    kind,
    name,
    availability: 'open',
    emergencyUse,
    accessibility: access(accessibility),
    landings,
  };
}

function landing(landingId, levelId, spaceId, nodeId) {
  return { landingId, levelId, spaceId, nodeId };
}

function portal(
  portalId,
  levelId,
  name,
  fromSpaceId,
  toSpaceId,
  {
    kind = 'door',
    direction = 'both',
    finalExit = false,
    accessibility = YES,
  } = {},
) {
  return {
    portalId,
    levelId,
    kind,
    name,
    fromSpaceId,
    toSpaceId,
    direction,
    finalExit,
    availability: 'open',
    emergencyUse: true,
    accessibility: access(accessibility),
  };
}

export function createCanonicalBuildingGraph() {
  const levels = [
    { levelId: 'level-b1', levelRef: 'B1', name: 'Basement parking', ordinal: -1, elevationM: -3.2 },
    { levelId: 'level-ground', levelRef: 'G', name: 'Ground floor', ordinal: 0, elevationM: 0 },
    { levelId: 'level-2a', levelRef: '2A', name: 'Upper balcony', ordinal: 2, elevationM: 6.8 },
  ];

  const spaces = [
    space('space-b1-car-park', 'level-b1', 'room', 'Car park', 'node-b1-car-park', { ref: 'P-B1' }),
    space('space-b1-lobby', 'level-b1', 'lobby', 'Basement lobby', 'node-b1-lobby'),
    space('space-b1-service', 'level-b1', 'service', 'Restricted plant', null, {
      navigable: false,
      egressRequired: false,
      stepFreeEgressRequired: false,
    }),
    space('space-ground-main-room', 'level-ground', 'room', 'Main room', 'node-ground-main-room', { ref: 'G-101' }),
    space('space-ground-hall', 'level-ground', 'corridor', 'Ground circulation hall', 'node-ground-hall'),
    space('space-ground-foyer', 'level-ground', 'lobby', 'West foyer', 'node-ground-foyer'),
    space('space-ground-outside-east', 'level-ground', 'outdoor', 'East external area', 'node-outside-east', {
      egressRequired: false,
      stepFreeEgressRequired: false,
    }),
    space('space-ground-outside-west', 'level-ground', 'outdoor', 'West external area', 'node-outside-west', {
      egressRequired: false,
      stepFreeEgressRequired: false,
    }),
    space('space-ground-void', 'level-ground', 'void', 'Atrium void', null, {
      navigable: false,
      egressRequired: false,
      stepFreeEgressRequired: false,
    }),
    space('space-2a-balcony', 'level-2a', 'room', 'Upper balcony', 'node-2a-balcony', { ref: '2A-201' }),
    space('space-2a-foyer', 'level-2a', 'lobby', 'Upper circulation', 'node-2a-foyer'),
    space('space-2a-observation', 'level-2a', 'room', 'Observation room', 'node-2a-observation', {
      ref: '2A-202',
      stepFreeEgressRequired: false,
    }),
  ];

  const zones = [
    { zoneId: 'zone-b1-parking', levelId: 'level-b1', name: 'Car park operations', spaceIds: ['space-b1-car-park'] },
    { zoneId: 'zone-ground-main', levelId: 'level-ground', name: 'Main room', spaceIds: ['space-ground-main-room'] },
    { zoneId: 'zone-ground-foyer', levelId: 'level-ground', name: 'Foyer and hall', spaceIds: ['space-ground-foyer', 'space-ground-hall'] },
    { zoneId: 'zone-2a-balcony', levelId: 'level-2a', name: 'Upper balcony', spaceIds: ['space-2a-balcony'] },
    { zoneId: 'zone-2a-observation', levelId: 'level-2a', name: 'Observation', spaceIds: ['space-2a-observation'] },
  ];

  const connectors = [
    connector('connector-east-stairs', 'stairs', 'East stairs', [
      landing('landing-east-b1', 'level-b1', 'space-b1-lobby', 'node-landing-east-b1'),
      landing('landing-east-ground', 'level-ground', 'space-ground-hall', 'node-landing-east-ground'),
      landing('landing-east-2a', 'level-2a', 'space-2a-foyer', 'node-landing-east-2a'),
    ], NO, true),
    connector('connector-west-stairs', 'stairs', 'West stairs', [
      landing('landing-west-b1', 'level-b1', 'space-b1-lobby', 'node-landing-west-b1'),
      landing('landing-west-ground', 'level-ground', 'space-ground-hall', 'node-landing-west-ground'),
      landing('landing-west-2a', 'level-2a', 'space-2a-foyer', 'node-landing-west-2a'),
    ], NO, true),
    connector('connector-central-lift', 'lift', 'Central lift', [
      landing('landing-lift-b1', 'level-b1', 'space-b1-lobby', 'node-landing-lift-b1'),
      landing('landing-lift-ground', 'level-ground', 'space-ground-hall', 'node-landing-lift-ground'),
      landing('landing-lift-2a', 'level-2a', 'space-2a-foyer', 'node-landing-lift-2a'),
    ], YES, false),
    connector('connector-access-ramp', 'ramp', 'Accessible ramp', [
      landing('landing-ramp-b1', 'level-b1', 'space-b1-lobby', 'node-landing-ramp-b1'),
      landing('landing-ramp-ground', 'level-ground', 'space-ground-hall', 'node-landing-ramp-ground'),
      landing('landing-ramp-2a', 'level-2a', 'space-2a-foyer', 'node-landing-ramp-2a'),
    ], YES, true),
    connector('connector-north-escalator', 'escalator', 'North up escalator', [
      landing('landing-escalator-ground', 'level-ground', 'space-ground-hall', 'node-landing-escalator-ground'),
      landing('landing-escalator-2a', 'level-2a', 'space-2a-foyer', 'node-landing-escalator-2a'),
    ], NO, false),
  ];

  const portals = [
    portal('portal-b1-car-lobby', 'level-b1', 'Car park lobby door', 'space-b1-car-park', 'space-b1-lobby'),
    portal('portal-ground-main-hall', 'level-ground', 'Main room door', 'space-ground-main-room', 'space-ground-hall'),
    portal('portal-ground-foyer-hall', 'level-ground', 'Foyer hall opening', 'space-ground-foyer', 'space-ground-hall', { kind: 'opening' }),
    portal('portal-2a-balcony-foyer', 'level-2a', 'Balcony door', 'space-2a-balcony', 'space-2a-foyer'),
    portal('portal-2a-observation-foyer', 'level-2a', 'Unsurveyed observation door', 'space-2a-observation', 'space-2a-foyer', { accessibility: UNKNOWN }),
    portal('portal-final-exit-east', 'level-ground', 'East final exit', 'space-ground-hall', 'space-ground-outside-east', { kind: 'gate', finalExit: true }),
    portal('portal-final-exit-west', 'level-ground', 'West final exit', 'space-ground-foyer', 'space-ground-outside-west', { finalExit: true }),
  ];

  const places = [
    {
      placeId: 'place-assembly-a',
      kind: 'assembly',
      name: 'Assembly Point A',
      spaceId: 'space-ground-outside-east',
      nodeId: 'node-place-assembly-a',
    },
  ];

  const routeNodes = [
    node('node-b1-car-park', 'level-b1', 'space-b1-car-park', 'space', 5, 5),
    node('node-b1-lobby', 'level-b1', 'space-b1-lobby', 'space', 18, 5),
    node('node-ground-main-room', 'level-ground', 'space-ground-main-room', 'space', 8, 20),
    node('node-ground-hall', 'level-ground', 'space-ground-hall', 'space', 18, 20),
    node('node-ground-foyer', 'level-ground', 'space-ground-foyer', 'space', 28, 20),
    node('node-outside-east', 'level-ground', 'space-ground-outside-east', 'space', 18, 35),
    node('node-outside-west', 'level-ground', 'space-ground-outside-west', 'space', 36, 20),
    node('node-2a-balcony', 'level-2a', 'space-2a-balcony', 'space', 8, 20),
    node('node-2a-foyer', 'level-2a', 'space-2a-foyer', 'space', 18, 20),
    node('node-2a-observation', 'level-2a', 'space-2a-observation', 'space', 28, 20),

    node('node-portal-b1-car', 'level-b1', 'space-b1-car-park', 'portal', 10, 5),
    node('node-portal-b1-lobby', 'level-b1', 'space-b1-lobby', 'portal', 12, 5),
    node('node-portal-ground-main', 'level-ground', 'space-ground-main-room', 'portal', 12, 20),
    node('node-portal-ground-hall-main', 'level-ground', 'space-ground-hall', 'portal', 14, 20),
    node('node-portal-ground-foyer', 'level-ground', 'space-ground-foyer', 'portal', 25, 20),
    node('node-portal-ground-hall-foyer', 'level-ground', 'space-ground-hall', 'portal', 23, 20),
    node('node-portal-2a-balcony', 'level-2a', 'space-2a-balcony', 'portal', 12, 20),
    node('node-portal-2a-foyer-balcony', 'level-2a', 'space-2a-foyer', 'portal', 14, 20),
    node('node-portal-2a-observation', 'level-2a', 'space-2a-observation', 'portal', 24, 20),
    node('node-portal-2a-foyer-observation', 'level-2a', 'space-2a-foyer', 'portal', 22, 20),
    node('node-portal-exit-east-inside', 'level-ground', 'space-ground-hall', 'portal', 18, 28),
    node('node-portal-exit-east-outside', 'level-ground', 'space-ground-outside-east', 'portal', 18, 30),
    node('node-portal-exit-west-inside', 'level-ground', 'space-ground-foyer', 'portal', 32, 20),
    node('node-portal-exit-west-outside', 'level-ground', 'space-ground-outside-west', 'portal', 34, 20),
    node('node-place-assembly-a', 'level-ground', 'space-ground-outside-east', 'place', 18, 42),

    node('node-landing-east-b1', 'level-b1', 'space-b1-lobby', 'landing', 18, 8),
    node('node-landing-east-ground', 'level-ground', 'space-ground-hall', 'landing', 18, 23),
    node('node-landing-east-2a', 'level-2a', 'space-2a-foyer', 'landing', 18, 23),
    node('node-landing-west-b1', 'level-b1', 'space-b1-lobby', 'landing', 20, 8),
    node('node-landing-west-ground', 'level-ground', 'space-ground-hall', 'landing', 20, 23),
    node('node-landing-west-2a', 'level-2a', 'space-2a-foyer', 'landing', 20, 23),
    node('node-landing-lift-b1', 'level-b1', 'space-b1-lobby', 'landing', 16, 8),
    node('node-landing-lift-ground', 'level-ground', 'space-ground-hall', 'landing', 16, 23),
    node('node-landing-lift-2a', 'level-2a', 'space-2a-foyer', 'landing', 16, 23),
    node('node-landing-ramp-b1', 'level-b1', 'space-b1-lobby', 'landing', 24, 8),
    node('node-landing-ramp-ground', 'level-ground', 'space-ground-hall', 'landing', 24, 23),
    node('node-landing-ramp-2a', 'level-2a', 'space-2a-foyer', 'landing', 24, 23),
    node('node-landing-escalator-ground', 'level-ground', 'space-ground-hall', 'landing', 22, 23),
    node('node-landing-escalator-2a', 'level-2a', 'space-2a-foyer', 'landing', 22, 23),
  ];

  const routeEdges = [
    walk('edge-walk-b1-car-door', 'node-b1-car-park', 'node-portal-b1-car', 5, 4),
    walk('edge-walk-b1-lobby-door', 'node-b1-lobby', 'node-portal-b1-lobby', 6, 5),
    walk('edge-walk-b1-east', 'node-b1-lobby', 'node-landing-east-b1', 3, 3),
    walk('edge-walk-b1-west', 'node-b1-lobby', 'node-landing-west-b1', 3.5, 3.5),
    walk('edge-walk-b1-lift', 'node-b1-lobby', 'node-landing-lift-b1', 2.5, 2.5),
    walk('edge-walk-b1-ramp', 'node-b1-lobby', 'node-landing-ramp-b1', 6, 5),

    walk('edge-walk-ground-main-door', 'node-ground-main-room', 'node-portal-ground-main', 4, 3),
    walk('edge-walk-ground-hall-main', 'node-ground-hall', 'node-portal-ground-hall-main', 4, 3),
    walk('edge-walk-ground-foyer-door', 'node-ground-foyer', 'node-portal-ground-foyer', 3, 2.5),
    walk('edge-walk-ground-hall-foyer', 'node-ground-hall', 'node-portal-ground-hall-foyer', 5, 4),
    walk('edge-walk-ground-exit-east', 'node-ground-hall', 'node-portal-exit-east-inside', 8, 6),
    walk('edge-walk-ground-exit-west', 'node-ground-foyer', 'node-portal-exit-west-inside', 4, 3),
    walk('edge-walk-outside-east', 'node-outside-east', 'node-portal-exit-east-outside', 5, 4),
    walk('edge-walk-outside-west', 'node-outside-west', 'node-portal-exit-west-outside', 2, 2),
    walk('edge-walk-assembly-a', 'node-outside-east', 'node-place-assembly-a', 7, 6),
    walk('edge-walk-ground-east', 'node-ground-hall', 'node-landing-east-ground', 3, 3),
    walk('edge-walk-ground-west', 'node-ground-hall', 'node-landing-west-ground', 3.5, 3.5),
    walk('edge-walk-ground-lift', 'node-ground-hall', 'node-landing-lift-ground', 2.5, 2.5),
    walk('edge-walk-ground-ramp', 'node-ground-hall', 'node-landing-ramp-ground', 6, 5),
    walk('edge-walk-ground-escalator', 'node-ground-hall', 'node-landing-escalator-ground', 4, 3.5),

    walk('edge-walk-2a-balcony-door', 'node-2a-balcony', 'node-portal-2a-balcony', 4, 3),
    walk('edge-walk-2a-foyer-balcony', 'node-2a-foyer', 'node-portal-2a-foyer-balcony', 4, 3),
    walk('edge-walk-2a-observation-door', 'node-2a-observation', 'node-portal-2a-observation', 4, 3),
    walk('edge-walk-2a-foyer-observation', 'node-2a-foyer', 'node-portal-2a-foyer-observation', 4, 3),
    walk('edge-walk-2a-east', 'node-2a-foyer', 'node-landing-east-2a', 3, 3),
    walk('edge-walk-2a-west', 'node-2a-foyer', 'node-landing-west-2a', 3.5, 3.5),
    walk('edge-walk-2a-lift', 'node-2a-foyer', 'node-landing-lift-2a', 2.5, 2.5),
    walk('edge-walk-2a-ramp', 'node-2a-foyer', 'node-landing-ramp-2a', 6, 5),
    walk('edge-walk-2a-escalator', 'node-2a-foyer', 'node-landing-escalator-2a', 4, 3.5),

    portalEdge('edge-door-b1-car-lobby', 'node-portal-b1-car', 'node-portal-b1-lobby', 'portal-b1-car-lobby', false),
    portalEdge('edge-door-ground-main-hall', 'node-portal-ground-main', 'node-portal-ground-hall-main', 'portal-ground-main-hall', false),
    portalEdge('edge-door-ground-foyer-hall', 'node-portal-ground-foyer', 'node-portal-ground-hall-foyer', 'portal-ground-foyer-hall', false),
    portalEdge('edge-door-2a-balcony-foyer', 'node-portal-2a-balcony', 'node-portal-2a-foyer-balcony', 'portal-2a-balcony-foyer', false),
    portalEdge('edge-door-2a-observation-foyer', 'node-portal-2a-observation', 'node-portal-2a-foyer-observation', 'portal-2a-observation-foyer', false, UNKNOWN),
    portalEdge('edge-exit-east', 'node-portal-exit-east-inside', 'node-portal-exit-east-outside', 'portal-final-exit-east', true),
    portalEdge('edge-exit-west', 'node-portal-exit-west-inside', 'node-portal-exit-west-outside', 'portal-final-exit-west', true),

    connectorEdge('edge-stairs-east-b1-ground', 'node-landing-east-b1', 'node-landing-east-ground', 'stairs', 'connector-east-stairs', 5, 48, { accessibility: NO }),
    connectorEdge('edge-stairs-east-ground-2a', 'node-landing-east-ground', 'node-landing-east-2a', 'stairs', 'connector-east-stairs', 9, 70, { accessibility: NO }),
    connectorEdge('edge-stairs-west-b1-ground', 'node-landing-west-b1', 'node-landing-west-ground', 'stairs', 'connector-west-stairs', 6, 55, { accessibility: NO }),
    connectorEdge('edge-stairs-west-ground-2a', 'node-landing-west-ground', 'node-landing-west-2a', 'stairs', 'connector-west-stairs', 10, 82, { accessibility: NO }),
    connectorEdge('edge-lift-b1-ground', 'node-landing-lift-b1', 'node-landing-lift-ground', 'lift', 'connector-central-lift', 3.2, 20, { emergencyUse: false }),
    connectorEdge('edge-lift-ground-2a', 'node-landing-lift-ground', 'node-landing-lift-2a', 'lift', 'connector-central-lift', 6.8, 28, { emergencyUse: false }),
    connectorEdge('edge-ramp-b1-ground', 'node-landing-ramp-b1', 'node-landing-ramp-ground', 'ramp', 'connector-access-ramp', 58, 55),
    connectorEdge('edge-ramp-ground-2a', 'node-landing-ramp-ground', 'node-landing-ramp-2a', 'ramp', 'connector-access-ramp', 105, 100),
    connectorEdge('edge-escalator-ground-2a', 'node-landing-escalator-ground', 'node-landing-escalator-2a', 'escalator', 'connector-north-escalator', 12, 35, {
      bidirectional: false,
      emergencyUse: false,
      accessibility: NO,
    }),
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    buildingId: 'building-synthetic-a001',
    mapVersion: 'map-synthetic-v1',
    name: 'Synthetic multi-floor operations fixture',
    status: 'reviewed',
    validFrom: '2026-07-22T00:00:00.000Z',
    validTo: null,
    coordinateFrame: {
      frameId: 'frame-building-synthetic-a001',
      unit: 'm',
      originDescription: 'Synthetic south-west ground-floor control point',
      xAxis: 'east-positive',
      yAxis: 'north-positive',
      zAxis: 'up-positive',
    },
    provenance: {
      sourceRefs: [{
        sourceId: 'source-map01-synthetic-a001',
        kind: 'synthetic',
        sha256: null,
        licence: 'Loc8 internal synthetic fixture',
        permission: 'research-only synthetic data',
        synthetic: true,
      }],
      review: {
        status: 'reviewed',
        reviewedBy: 'reviewer-principal-rd',
        reviewedAt: '2026-07-22T00:00:00.000Z',
      },
    },
    levels,
    spaces,
    zones,
    connectors,
    portals,
    places,
    routeNodes,
    routeEdges,
    legacyFloorCodes: [
      { levelId: 'level-b1', code: -1 },
      { levelId: 'level-ground', code: 0 },
      { levelId: 'level-2a', code: 2 },
    ],
  };
}

export function createRenamedBuildingGraph() {
  const graph = structuredClone(createCanonicalBuildingGraph());
  graph.name = 'Renamed synthetic building';
  graph.levels.forEach((level, index) => {
    level.levelRef = ['P', 'Lobby', 'Gallery'][index];
    level.name = `Renamed level ${index}`;
  });
  graph.spaces.forEach((item, index) => { item.name = `Renamed space ${index}`; });
  graph.zones.forEach((item, index) => { item.name = `Renamed zone ${index}`; });
  graph.connectors.forEach((item, index) => { item.name = `Renamed connector ${index}`; });
  graph.portals.forEach((item, index) => { item.name = `Renamed portal ${index}`; });
  graph.places.forEach((item, index) => { item.name = `Renamed place ${index}`; });
  return graph;
}

export function createReorderedBuildingGraph() {
  const graph = structuredClone(createCanonicalBuildingGraph());
  for (const field of [
    'levels', 'spaces', 'zones', 'connectors', 'portals', 'places', 'routeNodes',
    'routeEdges', 'legacyFloorCodes',
  ]) graph[field].reverse();
  graph.zones.forEach((zone) => zone.spaceIds.reverse());
  graph.connectors.forEach((item) => item.landings.reverse());
  graph.provenance.sourceRefs.reverse();
  return graph;
}

export function createScaleBuildingGraph({ interiorNodeCount = 1_000 } = {}) {
  if (!Number.isSafeInteger(interiorNodeCount) || interiorNodeCount < 2) {
    throw new RangeError('interiorNodeCount must be a safe integer >= 2');
  }
  const padded = (index) => String(index).padStart(4, '0');
  const routeNodes = Array.from({ length: interiorNodeCount }, (_, index) =>
    node(`node-scale-${padded(index)}`, 'level-scale-ground', 'space-scale-corridor', 'space', index, 0)
  );
  routeNodes.push(
    node('node-scale-outside', 'level-scale-ground', 'space-scale-outdoor', 'space', interiorNodeCount + 1, 0),
    node('node-scale-assembly', 'level-scale-ground', 'space-scale-outdoor', 'place', interiorNodeCount + 10, 0),
  );
  const routeEdges = Array.from({ length: interiorNodeCount - 1 }, (_, index) =>
    walk(
      `edge-scale-${padded(index)}`,
      `node-scale-${padded(index)}`,
      `node-scale-${padded(index + 1)}`,
      1,
      0.1,
    )
  );
  routeEdges.push(
    portalEdge(
      'edge-scale-final-exit',
      `node-scale-${padded(interiorNodeCount - 1)}`,
      'node-scale-outside',
      'portal-scale-final-exit',
      true,
    ),
    walk('edge-scale-assembly', 'node-scale-outside', 'node-scale-assembly', 9, 7),
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    buildingId: 'building-scale-synthetic-a001',
    mapVersion: 'map-scale-synthetic-v1',
    name: 'Synthetic routing scale fixture',
    status: 'reviewed',
    validFrom: '2026-07-22T00:00:00.000Z',
    validTo: null,
    coordinateFrame: {
      frameId: 'frame-scale-synthetic-a001',
      unit: 'm',
      originDescription: 'Synthetic linear corridor origin',
      xAxis: 'forward-positive',
      yAxis: 'left-positive',
      zAxis: 'up-positive',
    },
    provenance: {
      sourceRefs: [{
        sourceId: 'source-map01-scale-a001',
        kind: 'synthetic',
        sha256: null,
        licence: 'Loc8 internal synthetic fixture',
        permission: 'research-only synthetic data',
        synthetic: true,
      }],
      review: {
        status: 'reviewed',
        reviewedBy: 'reviewer-principal-rd',
        reviewedAt: '2026-07-22T00:00:00.000Z',
      },
    },
    levels: [{
      levelId: 'level-scale-ground',
      levelRef: 'G',
      name: 'Scale ground',
      ordinal: 0,
      elevationM: 0,
    }],
    spaces: [
      space('space-scale-corridor', 'level-scale-ground', 'corridor', 'Scale corridor', 'node-scale-0000'),
      space('space-scale-outdoor', 'level-scale-ground', 'outdoor', 'Scale outside', 'node-scale-outside', {
        egressRequired: false,
        stepFreeEgressRequired: false,
      }),
    ],
    zones: [{
      zoneId: 'zone-scale-corridor',
      levelId: 'level-scale-ground',
      name: 'Scale corridor zone',
      spaceIds: ['space-scale-corridor'],
    }],
    connectors: [],
    portals: [portal(
      'portal-scale-final-exit',
      'level-scale-ground',
      'Scale final exit',
      'space-scale-corridor',
      'space-scale-outdoor',
      { finalExit: true },
    )],
    places: [{
      placeId: 'place-scale-assembly',
      kind: 'assembly',
      name: 'Scale assembly point',
      spaceId: 'space-scale-outdoor',
      nodeId: 'node-scale-assembly',
    }],
    routeNodes,
    routeEdges,
    legacyFloorCodes: [{ levelId: 'level-scale-ground', code: 0 }],
  };
}
