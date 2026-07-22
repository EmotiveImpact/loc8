export const VENUE_PACKAGE_SCHEMA = 'loc8.venue-package.v1' as const;

export const ROUTE_PROFILES = [
  'walking',
  'step-free',
  'evacuation-walking',
  'evacuation-step-free',
] as const;

export type VenuePackageState = 'draft' | 'local-demo' | 'published' | 'retired';
export type VenueAuthority = 'browser-local' | 'gateway' | 'connected-service';
export type RouteProfile = (typeof ROUTE_PROFILES)[number];
export type SourceKind = 'synthetic' | 'plan' | 'survey' | 'scan' | 'import' | 'operator';
export type ReviewStatus = 'unreviewed' | 'reviewed' | 'rejected';
export type SpaceKind = 'room' | 'corridor' | 'lobby' | 'service' | 'outdoor' | 'void';
export type ConnectorKind = 'stairs' | 'lift' | 'escalator' | 'ramp';
export type PortalKind = 'door' | 'opening' | 'gate';
export type PlaceKind = 'assembly' | 'aed' | 'anchor' | 'gateway' | 'other';
export type RouteNodeKind = 'space' | 'landing' | 'place';
export type RouteEdgeKind = 'walk' | 'door' | 'stairs' | 'lift' | 'escalator' | 'ramp' | 'exit';
export type EvidenceValue = 'yes' | 'no' | 'unknown';
export type Availability = 'open' | 'closed' | 'unknown';
export type PortalDirection = 'both' | 'forward';

export interface AccessibilityEvidence {
  stepFree: EvidenceValue;
  wheelchair: EvidenceValue;
}

export interface CoordinateFrame {
  frameId: string;
  unit: 'm';
  originDescription: string;
  xAxis: string;
  yAxis: string;
  zAxis: string;
}

export interface VenueSourceReference {
  sourceId: string;
  kind: SourceKind;
  sha256: string | null;
  licence: string;
  permission: string;
  synthetic: boolean;
}

export interface VenueReview {
  status: ReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface VenueProvenance {
  sourceRefs: VenueSourceReference[];
  review: VenueReview;
}

export interface VenuePublication {
  authority: VenueAuthority;
  signed: boolean;
  contentSha256: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
}

export interface BuildingLevel {
  levelId: string;
  levelRef: string;
  name: string;
  ordinal: number;
  elevationM: number;
}

export interface PlanPoint {
  xM: number;
  yM: number;
}

export interface SpaceShape {
  shapeId: string;
  spaceId: string;
  points: PlanPoint[];
}

export interface PlanControlPoint {
  controlPointId: string;
  name: string;
  position: PlanPoint;
  sourceRefId: string;
  uncertaintyM: number;
}

export interface VenueFloorPlan {
  planId: string;
  levelId: string;
  widthM: number;
  heightM: number;
  sourceRefId: string;
  shapes: SpaceShape[];
  controlPoints: PlanControlPoint[];
}

export interface VenueSpace {
  spaceId: string;
  levelId: string;
  kind: SpaceKind;
  name: string;
  ref: string | null;
  navigable: boolean;
  egressRequired: boolean;
  stepFreeEgressRequired: boolean;
  nodeId: string | null;
}

export interface VenueZone {
  zoneId: string;
  levelId: string;
  name: string;
  spaceIds: string[];
}

export interface ConnectorLanding {
  landingId: string;
  levelId: string;
  spaceId: string;
  nodeId: string;
}

export interface VenueConnector {
  connectorId: string;
  kind: ConnectorKind;
  name: string;
  availability: Availability;
  emergencyUse: boolean;
  accessibility: AccessibilityEvidence;
  landings: ConnectorLanding[];
}

export interface VenuePortal {
  portalId: string;
  levelId: string;
  kind: PortalKind;
  name: string;
  fromSpaceId: string;
  toSpaceId: string;
  direction: PortalDirection;
  finalExit: boolean;
  availability: Availability;
  emergencyUse: boolean;
  accessibility: AccessibilityEvidence;
}

export interface VenuePlace {
  placeId: string;
  kind: PlaceKind;
  name: string;
  spaceId: string;
  nodeId: string;
}

export interface VenueRouteNode {
  nodeId: string;
  levelId: string;
  spaceId: string;
  kind: RouteNodeKind;
  position: PlanPoint;
}

export interface VenueRouteEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  kind: RouteEdgeKind;
  bidirectional: boolean;
  distanceM: number;
  durationSec: number;
  availability: Availability;
  emergencyUse: boolean;
  accessibility: AccessibilityEvidence;
  connectorId: string | null;
  portalId: string | null;
}

export interface LegacyFloorCode {
  levelId: string;
  code: number;
}

export interface VenuePackage {
  schemaVersion: typeof VENUE_PACKAGE_SCHEMA;
  packageId: string;
  buildingId: string;
  mapVersion: string;
  parentMapVersion: string | null;
  name: string;
  state: VenuePackageState;
  validFrom: string;
  validTo: string | null;
  coordinateFrame: CoordinateFrame;
  provenance: VenueProvenance;
  publication: VenuePublication;
  levels: BuildingLevel[];
  floorPlans: VenueFloorPlan[];
  spaces: VenueSpace[];
  zones: VenueZone[];
  connectors: VenueConnector[];
  portals: VenuePortal[];
  places: VenuePlace[];
  routeNodes: VenueRouteNode[];
  routeEdges: VenueRouteEdge[];
  legacyFloorCodes: LegacyFloorCode[];
}

export interface VenueValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface VenueRouteRequest {
  fromNodeId: string;
  toNodeId: string;
  profile: RouteProfile;
  closedEdgeIds?: string[];
  closedConnectorIds?: string[];
}

export interface VenueExitRouteRequest {
  fromNodeId: string;
  profile: RouteProfile;
  closedEdgeIds?: string[];
  closedConnectorIds?: string[];
}

export interface VenueRouteSuccess {
  outcome: 'ok';
  reason: 'route-found';
  buildingId: string;
  mapVersion: string;
  profile: RouteProfile;
  fromNodeId: string;
  toNodeId: string;
  closedEdgeIds: string[];
  closedConnectorIds: string[];
  nodeIds: string[];
  edgeIds: string[];
  reversedEdgeIds: string[];
  levelIds: string[];
  connectorIds: string[];
  totalDistanceM: number;
  totalDurationSec: number;
  exitPortalId?: string;
}

export interface VenueNoRoute {
  outcome: 'no-route';
  reason: 'no-eligible-route' | 'no-final-exit';
  buildingId?: string;
  mapVersion?: string;
  profile?: RouteProfile;
  fromNodeId?: string;
  closedEdgeIds?: string[];
  closedConnectorIds?: string[];
}

export interface VenueInvalidRoute {
  outcome: 'invalid-request';
  reason: string;
  field?: string;
  id?: string;
}

export type VenueRouteResult = VenueRouteSuccess | VenueNoRoute | VenueInvalidRoute;

export interface ProjectedLevel extends BuildingLevel {
  buildingId: string;
  mapVersion: string;
}

export interface ProjectedZone extends VenueZone {
  buildingId: string;
  mapVersion: string;
  localCenterM: PlanPoint;
}

export interface ProjectedPlace extends VenuePlace {
  buildingId: string;
  mapVersion: string;
  levelId: string;
}

export interface ProjectedFloorPlan extends VenueFloorPlan {
  buildingId: string;
  mapVersion: string;
}
