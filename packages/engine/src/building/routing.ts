import type {
  RouteProfile,
  VenueExitRouteRequest,
  VenuePackage,
  VenueRouteEdge,
  VenueRouteRequest,
  VenueRouteResult,
  VenueRouteSuccess,
} from './types';
import { compileVenuePackage } from './venuePackage';

interface Traversal {
  edge: VenueRouteEdge;
  fromNodeId: string;
  toNodeId: string;
  reversed: boolean;
}

function isEvacuation(profile: RouteProfile) {
  return profile === 'evacuation-walking' || profile === 'evacuation-step-free';
}

function isStepFree(profile: RouteProfile) {
  return profile === 'step-free' || profile === 'evacuation-step-free';
}

function eligibleEdge(
  venue: VenuePackage,
  edge: VenueRouteEdge,
  profile: RouteProfile,
  closedEdges: ReadonlySet<string>,
  closedConnectors: ReadonlySet<string>,
) {
  if (edge.availability !== 'open' || closedEdges.has(edge.edgeId)) return false;
  if (edge.connectorId !== null) {
    if (closedConnectors.has(edge.connectorId)) return false;
    const connector = venue.connectors.find((candidate) => candidate.connectorId === edge.connectorId);
    if (!connector || connector.availability !== 'open') return false;
    if (isEvacuation(profile) && !connector.emergencyUse) return false;
    if (isStepFree(profile) && connector.accessibility.stepFree !== 'yes') return false;
  }
  if (edge.portalId !== null) {
    const portal = venue.portals.find((candidate) => candidate.portalId === edge.portalId);
    if (!portal || portal.availability !== 'open') return false;
    if (isEvacuation(profile) && !portal.emergencyUse) return false;
    if (isStepFree(profile) && portal.accessibility.stepFree !== 'yes') return false;
  }
  if (isEvacuation(profile) && !edge.emergencyUse) return false;
  if (isStepFree(profile) && edge.accessibility.stepFree !== 'yes') return false;
  return true;
}

function buildTraversals(
  venue: VenuePackage,
  profile: RouteProfile,
  closedEdges: ReadonlySet<string>,
  closedConnectors: ReadonlySet<string>,
) {
  const graph = new Map<string, Traversal[]>();
  const add = (traversal: Traversal) => graph.set(
    traversal.fromNodeId,
    [...(graph.get(traversal.fromNodeId) ?? []), traversal]
      .sort((left, right) => left.edge.edgeId.localeCompare(right.edge.edgeId) || left.toNodeId.localeCompare(right.toNodeId)),
  );
  for (const edge of venue.routeEdges) {
    if (!eligibleEdge(venue, edge, profile, closedEdges, closedConnectors)) continue;
    add({ edge, fromNodeId: edge.fromNodeId, toNodeId: edge.toNodeId, reversed: false });
    if (edge.bidirectional) add({ edge, fromNodeId: edge.toNodeId, toNodeId: edge.fromNodeId, reversed: true });
  }
  return graph;
}

function shortestPath(
  venue: VenuePackage,
  fromNodeId: string,
  targets: ReadonlySet<string>,
  profile: RouteProfile,
  closedEdgeIds: string[],
  closedConnectorIds: string[],
): VenueRouteSuccess | undefined {
  const compiled = compileVenuePackage(venue);
  const graph = buildTraversals(venue, profile, new Set(closedEdgeIds), new Set(closedConnectorIds));
  const distance = new Map<string, number>([[fromNodeId, 0]]);
  const signature = new Map<string, string>([[fromNodeId, '']]);
  const previous = new Map<string, Traversal>();
  const remaining = new Set(Object.keys(compiled.nodesById));
  let destination: string | undefined;

  while (remaining.size > 0) {
    const current = [...remaining].sort((left, right) =>
      (distance.get(left) ?? Number.POSITIVE_INFINITY) - (distance.get(right) ?? Number.POSITIVE_INFINITY) ||
      (signature.get(left) ?? '').localeCompare(signature.get(right) ?? '') || left.localeCompare(right))[0];
    if (current === undefined || !Number.isFinite(distance.get(current) ?? Number.POSITIVE_INFINITY)) break;
    remaining.delete(current);
    if (targets.has(current)) {
      destination = current;
      break;
    }
    for (const traversal of graph.get(current) ?? []) {
      if (!remaining.has(traversal.toNodeId)) continue;
      const candidateDistance = (distance.get(current) ?? 0) + traversal.edge.durationSec;
      const candidateSignature = `${signature.get(current) ?? ''}/${traversal.edge.edgeId}${traversal.reversed ? ':r' : ':f'}`;
      const knownDistance = distance.get(traversal.toNodeId) ?? Number.POSITIVE_INFINITY;
      const knownSignature = signature.get(traversal.toNodeId) ?? '\uffff';
      if (candidateDistance < knownDistance || (candidateDistance === knownDistance && candidateSignature < knownSignature)) {
        distance.set(traversal.toNodeId, candidateDistance);
        signature.set(traversal.toNodeId, candidateSignature);
        previous.set(traversal.toNodeId, traversal);
      }
    }
  }
  if (destination === undefined) return undefined;

  const path: Traversal[] = [];
  let cursor = destination;
  while (cursor !== fromNodeId) {
    const traversal = previous.get(cursor);
    if (!traversal) return undefined;
    path.unshift(traversal);
    cursor = traversal.fromNodeId;
  }
  const nodeIds = [fromNodeId, ...path.map((entry) => entry.toNodeId)];
  return {
    outcome: 'ok',
    reason: 'route-found',
    buildingId: venue.buildingId,
    mapVersion: venue.mapVersion,
    profile,
    fromNodeId,
    toNodeId: destination,
    closedEdgeIds: [...closedEdgeIds].sort(),
    closedConnectorIds: [...closedConnectorIds].sort(),
    nodeIds,
    edgeIds: path.map((entry) => entry.edge.edgeId),
    reversedEdgeIds: path.filter((entry) => entry.reversed).map((entry) => entry.edge.edgeId),
    levelIds: [...new Set(nodeIds.map((nodeId) => compiled.nodesById[nodeId].levelId))],
    connectorIds: [...new Set(path.map((entry) => entry.edge.connectorId).filter((id): id is string => id !== null))],
    totalDistanceM: path.reduce((sum, entry) => sum + entry.edge.distanceM, 0),
    totalDurationSec: path.reduce((sum, entry) => sum + entry.edge.durationSec, 0),
  };
}

function requestClosures(request: VenueRouteRequest | VenueExitRouteRequest) {
  return {
    closedEdgeIds: [...new Set(request.closedEdgeIds ?? [])],
    closedConnectorIds: [...new Set(request.closedConnectorIds ?? [])],
  };
}

function invalidClosure(venue: VenuePackage, edgeIds: readonly string[], connectorIds: readonly string[]): VenueRouteResult | undefined {
  const compiled = compileVenuePackage(venue);
  const edgeId = edgeIds.find((id) => compiled.edgesById[id] === undefined);
  if (edgeId) return { outcome: 'invalid-request', reason: 'unknown closed edge', field: 'closedEdgeIds', id: edgeId };
  const connectorId = connectorIds.find((id) => compiled.connectorsById[id] === undefined);
  if (connectorId) return { outcome: 'invalid-request', reason: 'unknown closed connector', field: 'closedConnectorIds', id: connectorId };
  return undefined;
}

export function routeBetweenNodes(venue: VenuePackage, request: VenueRouteRequest): VenueRouteResult {
  const compiled = compileVenuePackage(venue);
  if (!compiled.nodesById[request.fromNodeId]) return { outcome: 'invalid-request', reason: 'unknown start node', field: 'fromNodeId', id: request.fromNodeId };
  if (!compiled.nodesById[request.toNodeId]) return { outcome: 'invalid-request', reason: 'unknown destination node', field: 'toNodeId', id: request.toNodeId };
  const closures = requestClosures(request);
  const invalid = invalidClosure(venue, closures.closedEdgeIds, closures.closedConnectorIds);
  if (invalid) return invalid;
  return shortestPath(venue, request.fromNodeId, new Set([request.toNodeId]), request.profile, closures.closedEdgeIds, closures.closedConnectorIds) ?? {
    outcome: 'no-route',
    reason: 'no-eligible-route',
    buildingId: venue.buildingId,
    mapVersion: venue.mapVersion,
    profile: request.profile,
    fromNodeId: request.fromNodeId,
    closedEdgeIds: closures.closedEdgeIds,
    closedConnectorIds: closures.closedConnectorIds,
  };
}

export function routeToNearestExit(venue: VenuePackage, request: VenueExitRouteRequest): VenueRouteResult {
  const compiled = compileVenuePackage(venue);
  if (!compiled.nodesById[request.fromNodeId]) return { outcome: 'invalid-request', reason: 'unknown start node', field: 'fromNodeId', id: request.fromNodeId };
  const closures = requestClosures(request);
  const invalid = invalidClosure(venue, closures.closedEdgeIds, closures.closedConnectorIds);
  if (invalid) return invalid;
  const exits = venue.routeEdges.filter((edge) => edge.kind === 'exit' && edge.portalId !== null);
  if (exits.length === 0) return { outcome: 'no-route', reason: 'no-final-exit' };
  const result = shortestPath(venue, request.fromNodeId, new Set(exits.map((edge) => edge.toNodeId)), request.profile, closures.closedEdgeIds, closures.closedConnectorIds);
  if (!result) return {
    outcome: 'no-route', reason: 'no-eligible-route', buildingId: venue.buildingId, mapVersion: venue.mapVersion,
    profile: request.profile, fromNodeId: request.fromNodeId, closedEdgeIds: closures.closedEdgeIds,
    closedConnectorIds: closures.closedConnectorIds,
  };
  const exit = exits.find((edge) => edge.toNodeId === result.toNodeId);
  return { ...result, exitPortalId: exit?.portalId ?? undefined };
}
