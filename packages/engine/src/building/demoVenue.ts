import {
  VENUE_PACKAGE_SCHEMA,
  type AccessibilityEvidence,
  type ConnectorKind,
  type PlanPoint,
  type PortalKind,
  type SpaceKind,
  type VenueConnector,
  type VenueFloorPlan,
  type BuildingLevel,
  type VenuePackage,
  type VenuePlace,
  type VenuePortal,
  type VenueRouteEdge,
  type VenueRouteNode,
  type VenueSpace,
  type VenueZone,
} from './types';
import { assertVenuePackage } from './validation';

const YES: AccessibilityEvidence = { stepFree: 'yes', wheelchair: 'yes' };
const NO: AccessibilityEvidence = { stepFree: 'no', wheelchair: 'no' };

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectanglePoints(rectangle: Rectangle): PlanPoint[] {
  return [
    { xM: rectangle.x, yM: rectangle.y },
    { xM: rectangle.x + rectangle.width, yM: rectangle.y },
    { xM: rectangle.x + rectangle.width, yM: rectangle.y + rectangle.height },
    { xM: rectangle.x, yM: rectangle.y + rectangle.height },
  ];
}

function rectangleCenter(rectangle: Rectangle): PlanPoint {
  return { xM: rectangle.x + rectangle.width / 2, yM: rectangle.y + rectangle.height / 2 };
}

/**
 * A deliberately synthetic four-level venue used for product development and replay.
 * It is not a surveyed building and must never be presented as physical-site evidence.
 */
export function createSyntheticFourLevelVenue(): VenuePackage {
  const levels: BuildingLevel[] = [
    { levelId: 'level.basement', levelRef: 'B1', name: 'Basement', ordinal: -1, elevationM: -3.4 },
    { levelId: 'level.ground', levelRef: 'G', name: 'Ground Floor', ordinal: 0, elevationM: 0 },
    { levelId: 'level.one', levelRef: 'L1', name: 'Level 1', ordinal: 1, elevationM: 3.6 },
    { levelId: 'level.two', levelRef: 'L2', name: 'Level 2', ordinal: 2, elevationM: 7.2 },
  ];
  const floorPlans: VenueFloorPlan[] = levels.map((level) => ({
    planId: `plan.${level.levelId.slice(6)}`,
    levelId: level.levelId,
    widthM: 72,
    heightM: 34,
    sourceRefId: 'source.synthetic.concept',
    shapes: [],
    controlPoints: [
      {
        controlPointId: `control.${level.levelId.slice(6)}.origin`,
        name: `${level.levelRef} local origin`,
        position: { xM: 0, yM: 0 },
        sourceRefId: 'source.synthetic.concept',
        uncertaintyM: 0,
      },
      {
        controlPointId: `control.${level.levelId.slice(6)}.extent`,
        name: `${level.levelRef} plan extent`,
        position: { xM: 72, yM: 34 },
        sourceRefId: 'source.synthetic.concept',
        uncertaintyM: 0,
      },
    ],
  }));
  const spaces: VenueSpace[] = [];
  const zones: VenueZone[] = [];
  const connectors: VenueConnector[] = [];
  const portals: VenuePortal[] = [];
  const places: VenuePlace[] = [];
  const routeNodes: VenueRouteNode[] = [];
  const routeEdges: VenueRouteEdge[] = [];

  const planFor = (levelId: string) => floorPlans.find((plan) => plan.levelId === levelId)!;
  const spaceFor = (levelId: string, key: string) => spaces.find((space) => space.spaceId === `space.${levelId.slice(6)}.${key}`)!;
  const primaryNodeFor = (space: VenueSpace) => space.nodeId!;
  const addSpace = (
    level: BuildingLevel,
    key: string,
    name: string,
    kind: SpaceKind,
    rectangle: Rectangle,
    navigable = true,
  ) => {
    const token = `${level.levelId.slice(6)}.${key}`;
    const spaceId = `space.${token}`;
    const nodeId = navigable ? `node.${token}.primary` : null;
    const space: VenueSpace = {
      spaceId,
      levelId: level.levelId,
      kind,
      name,
      ref: key === 'north' ? `${level.levelRef}-101` : key === 'south' ? `${level.levelRef}-102` : null,
      navigable,
      egressRequired: navigable && kind !== 'outdoor',
      stepFreeEgressRequired: navigable && kind !== 'outdoor',
      nodeId,
    };
    spaces.push(space);
    planFor(level.levelId).shapes.push({
      shapeId: `shape.${token}`,
      spaceId,
      points: rectanglePoints(rectangle),
    });
    if (nodeId) routeNodes.push({
      nodeId,
      levelId: level.levelId,
      spaceId,
      kind: 'space',
      position: rectangleCenter(rectangle),
    });
    return space;
  };

  const addEdge = (edge: VenueRouteEdge) => routeEdges.push(edge);
  const addWalk = (id: string, fromNodeId: string, toNodeId: string, distanceM: number) => addEdge({
    edgeId: `edge.${id}`,
    fromNodeId,
    toNodeId,
    kind: 'walk',
    bidirectional: true,
    distanceM,
    durationSec: Math.max(1, Math.round(distanceM / 1.2)),
    availability: 'open',
    emergencyUse: true,
    accessibility: YES,
    connectorId: null,
    portalId: null,
  });
  const addPortal = (
    level: BuildingLevel,
    key: string,
    name: string,
    from: VenueSpace,
    to: VenueSpace,
    options: { finalExit?: boolean; kind?: PortalKind; accessibility?: AccessibilityEvidence } = {},
  ) => {
    const portalId = `portal.${level.levelId.slice(6)}.${key}`;
    const finalExit = options.finalExit ?? false;
    portals.push({
      portalId,
      levelId: level.levelId,
      kind: options.kind ?? 'door',
      name,
      fromSpaceId: from.spaceId,
      toSpaceId: to.spaceId,
      direction: 'both',
      finalExit,
      availability: 'open',
      emergencyUse: true,
      accessibility: options.accessibility ?? YES,
    });
    addEdge({
      edgeId: `edge.${level.levelId.slice(6)}.${key}`,
      fromNodeId: primaryNodeFor(from),
      toNodeId: primaryNodeFor(to),
      kind: finalExit ? 'exit' : 'door',
      bidirectional: true,
      distanceM: 2,
      durationSec: 3,
      availability: 'open',
      emergencyUse: true,
      accessibility: options.accessibility ?? YES,
      connectorId: null,
      portalId,
    });
  };

  for (const level of levels) {
    const key = level.levelId.slice(6);
    const corridor = addSpace(level, 'corridor', `${level.name} central corridor`, 'corridor', { x: 12, y: 12, width: 48, height: 10 });
    const north = addSpace(level, 'north', `${level.name} north room`, 'room', { x: 16, y: 2, width: 18, height: 10 });
    const south = addSpace(level, 'south', `${level.name} south room`, 'room', { x: 16, y: 22, width: 18, height: 10 });
    const stairs = addSpace(level, 'stairs', `${level.name} west stair lobby`, 'lobby', { x: 6, y: 12, width: 6, height: 5 });
    const lift = addSpace(level, 'lift', `${level.name} lift lobby`, 'lobby', { x: 6, y: 17, width: 6, height: 5 });
    const ramp = addSpace(level, 'ramp', `${level.name} east ramp lobby`, 'lobby', { x: 60, y: 12, width: 6, height: 10 });
    addSpace(level, 'plant', `${level.name} secured plant`, 'service', { x: 38, y: 2, width: 14, height: 10 }, false);
    addPortal(level, 'north-door', `${north.name} door`, corridor, north);
    addPortal(level, 'south-door', `${south.name} door`, corridor, south);
    addPortal(level, 'stairs-door', `${stairs.name} opening`, corridor, stairs, { kind: 'opening' });
    addPortal(level, 'lift-door', `${lift.name} opening`, corridor, lift, { kind: 'opening' });
    addPortal(level, 'ramp-door', `${ramp.name} opening`, corridor, ramp, { kind: 'opening' });
    zones.push({
      zoneId: `zone.${key}.operations`,
      levelId: level.levelId,
      name: `${level.name} operations zone`,
      spaceIds: [corridor.spaceId, north.spaceId, south.spaceId, stairs.spaceId, lift.spaceId, ramp.spaceId],
    });
  }

  const ground = levels.find((level) => level.levelId === 'level.ground')!;
  const groundCorridor = spaceFor('level.ground', 'corridor');
  const westAssemblySpace = addSpace(ground, 'outside-west', 'West assembly apron', 'outdoor', { x: 0, y: 12, width: 6, height: 10 });
  const eastAssemblySpace = addSpace(ground, 'outside-east', 'East assembly apron', 'outdoor', { x: 66, y: 12, width: 6, height: 10 });
  addPortal(ground, 'west-exit', 'West final exit', groundCorridor, westAssemblySpace, { finalExit: true, kind: 'gate' });
  addPortal(ground, 'east-exit', 'East final exit', groundCorridor, eastAssemblySpace, { finalExit: true, kind: 'gate' });

  const addConnector = (
    key: string,
    kind: ConnectorKind,
    name: string,
    spaceKey: string,
    accessibility: AccessibilityEvidence,
    emergencyUse: boolean,
  ) => {
    const connectorId = `connector.${key}`;
    const landings = levels.map((level) => {
      const shortLevel = level.levelId.slice(6);
      const space = spaceFor(level.levelId, spaceKey);
      const nodeId = `node.${shortLevel}.${key}.landing`;
      routeNodes.push({
        nodeId,
        levelId: level.levelId,
        spaceId: space.spaceId,
        kind: 'landing',
        position: { ...routeNodes.find((node) => node.nodeId === primaryNodeFor(space))!.position },
      });
      addWalk(`${shortLevel}.${key}.approach`, primaryNodeFor(space), nodeId, 1);
      return { landingId: `landing.${shortLevel}.${key}`, levelId: level.levelId, spaceId: space.spaceId, nodeId };
    });
    connectors.push({ connectorId, kind, name, availability: 'open', emergencyUse, accessibility, landings });
    landings.slice(0, -1).forEach((landing, index) => {
      const next = landings[index + 1];
      addEdge({
        edgeId: `edge.${key}.${levels[index].levelId.slice(6)}-${levels[index + 1].levelId.slice(6)}`,
        fromNodeId: landing.nodeId,
        toNodeId: next.nodeId,
        kind,
        bidirectional: true,
        distanceM: kind === 'ramp' ? 18 : 4,
        durationSec: kind === 'lift' ? 12 : kind === 'ramp' ? 18 : 8,
        availability: 'open',
        emergencyUse,
        accessibility,
        connectorId,
        portalId: null,
      });
    });
  };
  addConnector('west-stairs', 'stairs', 'West protected stairs', 'stairs', NO, true);
  addConnector('central-lift', 'lift', 'Central passenger lift', 'lift', YES, false);
  addConnector('east-ramp', 'ramp', 'East step-free ramp', 'ramp', YES, true);

  const addPlace = (key: string, kind: VenuePlace['kind'], name: string, space: VenueSpace, offset: PlanPoint) => {
    const placeId = `place.${key}`;
    const nodeId = `node.${key}.place`;
    const primary = routeNodes.find((node) => node.nodeId === primaryNodeFor(space))!;
    places.push({ placeId, kind, name, spaceId: space.spaceId, nodeId });
    routeNodes.push({
      nodeId,
      levelId: space.levelId,
      spaceId: space.spaceId,
      kind: 'place',
      position: { xM: primary.position.xM + offset.xM, yM: primary.position.yM + offset.yM },
    });
    addWalk(`${key}.approach`, primary.nodeId, nodeId, 1);
  };
  addPlace('assembly.east', 'assembly', 'East assembly point', eastAssemblySpace, { xM: 1, yM: 0 });
  addPlace('gateway.ground', 'gateway', 'Gateway G-01', groundCorridor, { xM: -3, yM: 0 });
  addPlace('aed.one', 'aed', 'Level 1 AED', spaceFor('level.one', 'corridor'), { xM: 3, yM: 0 });
  addPlace('anchor.two', 'anchor', 'Level 2 commissioning anchor', spaceFor('level.two', 'corridor'), { xM: 0, yM: 2 });

  const venue: VenuePackage = {
    schemaVersion: VENUE_PACKAGE_SCHEMA,
    packageId: 'package.synthetic.hq.draft',
    buildingId: 'building.synthetic.hq',
    mapVersion: 'map.synthetic.draft.001',
    parentMapVersion: null,
    name: 'Loc8 Synthetic Operations Centre',
    state: 'draft',
    validFrom: '2026-07-22T09:00:00.000Z',
    validTo: null,
    coordinateFrame: {
      frameId: 'frame.synthetic.local',
      unit: 'm',
      originDescription: 'Synthetic south-west plan corner; no physical survey claim',
      xAxis: 'synthetic plan east',
      yAxis: 'synthetic plan north',
      zAxis: 'synthetic elevation above ground datum',
    },
    provenance: {
      sourceRefs: [{
        sourceId: 'source.synthetic.concept',
        kind: 'synthetic',
        sha256: null,
        licence: 'Loc8 internal synthetic fixture',
        permission: 'Product development and automated testing only',
        synthetic: true,
      }],
      review: { status: 'unreviewed', reviewedBy: null, reviewedAt: null },
    },
    publication: {
      authority: 'browser-local',
      signed: false,
      contentSha256: null,
      publishedAt: null,
      publishedBy: null,
    },
    levels,
    floorPlans,
    spaces,
    zones,
    connectors,
    portals,
    places,
    routeNodes,
    routeEdges,
    legacyFloorCodes: [
      { levelId: 'level.basement', code: -1 },
      { levelId: 'level.ground', code: 0 },
      { levelId: 'level.one', code: 1 },
      { levelId: 'level.two', code: 2 },
    ],
  };
  assertVenuePackage(venue);
  return venue;
}

export const SYNTHETIC_FOUR_LEVEL_VENUE = createSyntheticFourLevelVenue();
