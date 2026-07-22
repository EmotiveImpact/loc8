import { createHash } from 'node:crypto';

export const SCHEMA_VERSION = 'loc8.building-graph.v1';

export const ROUTE_PROFILES = Object.freeze([
  'walking',
  'step-free',
  'evacuation-walking',
  'evacuation-step-free',
]);

const PROFILE_SET = new Set(ROUTE_PROFILES);
const STABLE_ID = /^[a-z][a-z0-9._-]{2,95}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const STATUS = new Set(['draft', 'reviewed', 'retired']);
const SOURCE_KINDS = new Set(['synthetic', 'plan', 'survey', 'scan', 'import', 'operator']);
const REVIEW_STATUS = new Set(['unreviewed', 'reviewed', 'rejected']);
const SPACE_KINDS = new Set(['room', 'corridor', 'lobby', 'service', 'outdoor', 'void']);
const CONNECTOR_KINDS = new Set(['stairs', 'lift', 'escalator', 'ramp']);
const PORTAL_KINDS = new Set(['door', 'opening', 'gate']);
const PLACE_KINDS = new Set(['assembly', 'aed', 'anchor', 'gateway', 'other']);
const NODE_KINDS = new Set(['space', 'landing', 'portal', 'place']);
const EDGE_KINDS = new Set(['walk', 'door', 'stairs', 'lift', 'escalator', 'ramp', 'exit']);
const ACCESS_VALUES = new Set(['yes', 'no', 'unknown']);
const AVAILABILITY = new Set(['open', 'closed', 'unknown']);
const PORTAL_DIRECTIONS = new Set(['both', 'forward']);
const CONNECTOR_EDGE_KINDS = new Set(['stairs', 'lift', 'escalator', 'ramp']);
const STEP_FREE_PROFILES = new Set(['step-free', 'evacuation-step-free']);
const EVACUATION_PROFILES = new Set(['evacuation-walking', 'evacuation-step-free']);

const ROOT_KEYS = new Set([
  'schemaVersion', 'buildingId', 'mapVersion', 'name', 'status', 'validFrom',
  'validTo', 'coordinateFrame', 'provenance', 'levels', 'spaces', 'zones',
  'connectors', 'portals', 'places', 'routeNodes', 'routeEdges', 'legacyFloorCodes',
]);
const COORDINATE_FRAME_KEYS = new Set([
  'frameId', 'unit', 'originDescription', 'xAxis', 'yAxis', 'zAxis',
]);
const PROVENANCE_KEYS = new Set(['sourceRefs', 'review']);
const SOURCE_KEYS = new Set(['sourceId', 'kind', 'sha256', 'licence', 'permission', 'synthetic']);
const REVIEW_KEYS = new Set(['status', 'reviewedBy', 'reviewedAt']);
const LEVEL_KEYS = new Set(['levelId', 'levelRef', 'name', 'ordinal', 'elevationM']);
const SPACE_KEYS = new Set([
  'spaceId', 'levelId', 'kind', 'name', 'ref', 'navigable', 'egressRequired',
  'stepFreeEgressRequired', 'nodeId',
]);
const ZONE_KEYS = new Set(['zoneId', 'levelId', 'name', 'spaceIds']);
const CONNECTOR_KEYS = new Set([
  'connectorId', 'kind', 'name', 'availability', 'emergencyUse', 'accessibility', 'landings',
]);
const LANDING_KEYS = new Set(['landingId', 'levelId', 'spaceId', 'nodeId']);
const ACCESSIBILITY_KEYS = new Set(['stepFree', 'wheelchair']);
const PORTAL_KEYS = new Set([
  'portalId', 'levelId', 'kind', 'name', 'fromSpaceId', 'toSpaceId', 'direction',
  'finalExit', 'availability', 'emergencyUse', 'accessibility',
]);
const PLACE_KEYS = new Set(['placeId', 'kind', 'name', 'spaceId', 'nodeId']);
const NODE_KEYS = new Set(['nodeId', 'levelId', 'spaceId', 'kind', 'position']);
const POSITION_KEYS = new Set(['xM', 'yM']);
const EDGE_KEYS = new Set([
  'edgeId', 'fromNodeId', 'toNodeId', 'kind', 'bidirectional', 'distanceM',
  'durationSec', 'availability', 'emergencyUse', 'accessibility', 'connectorId', 'portalId',
]);
const LEGACY_CODE_KEYS = new Set(['levelId', 'code']);
const REQUEST_KEYS = new Set(['fromNodeId', 'toNodeId', 'profile', 'closedEdgeIds', 'closedConnectorIds']);
const EXIT_REQUEST_KEYS = new Set(['fromNodeId', 'profile', 'closedEdgeIds', 'closedConnectorIds']);

const ARRAY_ID_FIELDS = [
  // Prefer an object's own identity over referenced parent identities. For
  // example, a route edge with connectorId must sort by edgeId, and a portal
  // with levelId must sort by portalId.
  'edgeId', 'nodeId', 'landingId', 'placeId', 'portalId', 'connectorId', 'zoneId',
  'spaceId', 'levelId', 'sourceId',
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIsoTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function issue(code, path, message) {
  return { code, path, message };
}

function rejectUnexpectedKeys(errors, value, allowed, path) {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(issue('unexpected-field', `${path}.${key}`, 'is not allowed'));
  }
}

function requireRecord(errors, value, fields, allowed, path) {
  if (!isRecord(value)) {
    errors.push(issue('type', path, 'must be an object'));
    return false;
  }
  rejectUnexpectedKeys(errors, value, allowed, path);
  for (const field of fields) {
    if (!(field in value)) errors.push(issue('required', `${path}.${field}`, 'is required'));
  }
  return true;
}

function requireArray(errors, value, path, { min = 0 } = {}) {
  if (!Array.isArray(value)) {
    errors.push(issue('type', path, 'must be an array'));
    return false;
  }
  if (value.length < min) errors.push(issue('minimum-items', path, `must contain at least ${min} item(s)`));
  return true;
}

function validateStableId(errors, value, path) {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) {
    errors.push(issue('stable-id', path, 'must be a lower-case stable identifier'));
  }
}

function validateText(errors, value, path, { empty = false } = {}) {
  if (typeof value !== 'string' || (!empty && value.trim().length === 0) || value.length > 240) {
    errors.push(issue('text', path, empty ? 'must be a bounded string' : 'must be a non-empty bounded string'));
  }
}

function validateEnum(errors, value, allowed, path, code = 'enum') {
  if (!allowed.has(value)) errors.push(issue(code, path, `must be one of: ${[...allowed].join(', ')}`));
}

function validateBoolean(errors, value, path) {
  if (typeof value !== 'boolean') errors.push(issue('type', path, 'must be a boolean'));
}

function validatePositive(errors, value, path) {
  if (!isFiniteNumber(value) || value <= 0) errors.push(issue('positive-number', path, 'must be finite and > 0'));
}

function validateAccessibility(errors, value, path) {
  if (!requireRecord(errors, value, ['stepFree', 'wheelchair'], ACCESSIBILITY_KEYS, path)) return;
  validateEnum(errors, value.stepFree, ACCESS_VALUES, `${path}.stepFree`, 'accessibility');
  validateEnum(errors, value.wheelchair, ACCESS_VALUES, `${path}.wheelchair`, 'accessibility');
  if (value.wheelchair === 'yes' && value.stepFree !== 'yes') {
    errors.push(issue('accessibility-conflict', path, 'wheelchair yes requires stepFree yes'));
  }
}

function validateUnique(errors, collection, idField, path, globalSet = undefined) {
  const seen = new Set();
  if (!Array.isArray(collection)) return seen;
  collection.forEach((item, index) => {
    const id = item?.[idField];
    if (typeof id !== 'string') return;
    if (seen.has(id) || globalSet?.has(id)) {
      errors.push(issue('duplicate-id', `${path}[${index}].${idField}`, `${id} is duplicated`));
    }
    seen.add(id);
    globalSet?.add(id);
  });
  return seen;
}

function validatePrimitiveUnique(errors, values, path) {
  if (!Array.isArray(values)) return;
  const seen = new Set();
  values.forEach((value, index) => {
    if (seen.has(value)) errors.push(issue('duplicate-reference', `${path}[${index}]`, `${value} is duplicated`));
    seen.add(value);
  });
}

function indexBy(collection, field) {
  return new Map((Array.isArray(collection) ? collection : []).map((item) => [item?.[field], item]));
}

function firstArrayId(value) {
  if (!isRecord(value)) return undefined;
  const field = ARRAY_ID_FIELDS.find((candidate) => typeof value[candidate] === 'string');
  return field ? value[field] : undefined;
}

function canonicalValue(value) {
  if (Array.isArray(value)) {
    const mapped = value.map(canonicalValue);
    if (mapped.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
      return mapped.sort((left, right) => String(left).localeCompare(String(right)));
    }
    const ids = mapped.map(firstArrayId);
    if (ids.every((id) => id !== undefined)) {
      return mapped
        .map((item, index) => ({ item, id: ids[index] }))
        .sort((left, right) => left.id.localeCompare(right.id))
        .map(({ item }) => item);
    }
    return mapped;
  }
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]),
  );
}

export function canonicalStringify(value) {
  return JSON.stringify(canonicalValue(value));
}

export function graphFingerprint(graph) {
  return createHash('sha256').update(canonicalStringify(graph)).digest('hex');
}

function identityProjection(graph) {
  return {
    schemaVersion: graph.schemaVersion,
    buildingId: graph.buildingId,
    mapVersion: graph.mapVersion,
    coordinateFrame: graph.coordinateFrame,
    levels: graph.levels?.map(({ levelId, ordinal, elevationM }) => ({ levelId, ordinal, elevationM })),
    spaces: graph.spaces?.map((space) => ({
      spaceId: space.spaceId,
      levelId: space.levelId,
      kind: space.kind,
      navigable: space.navigable,
      egressRequired: space.egressRequired,
      stepFreeEgressRequired: space.stepFreeEgressRequired,
      nodeId: space.nodeId,
    })),
    zones: graph.zones?.map(({ zoneId, levelId, spaceIds }) => ({ zoneId, levelId, spaceIds })),
    connectors: graph.connectors?.map((connector) => ({
      connectorId: connector.connectorId,
      kind: connector.kind,
      availability: connector.availability,
      emergencyUse: connector.emergencyUse,
      accessibility: connector.accessibility,
      landings: connector.landings,
    })),
    portals: graph.portals?.map((portal) => ({
      portalId: portal.portalId,
      levelId: portal.levelId,
      kind: portal.kind,
      fromSpaceId: portal.fromSpaceId,
      toSpaceId: portal.toSpaceId,
      direction: portal.direction,
      finalExit: portal.finalExit,
      availability: portal.availability,
      emergencyUse: portal.emergencyUse,
      accessibility: portal.accessibility,
    })),
    places: graph.places?.map(({ placeId, kind, spaceId, nodeId }) => ({ placeId, kind, spaceId, nodeId })),
    routeNodes: graph.routeNodes,
    routeEdges: graph.routeEdges,
    legacyFloorCodes: graph.legacyFloorCodes,
  };
}

export function semanticIdentityFingerprint(graph) {
  return createHash('sha256').update(canonicalStringify(identityProjection(graph))).digest('hex');
}

function collectTopology(graph) {
  return {
    levels: indexBy(graph.levels, 'levelId'),
    spaces: indexBy(graph.spaces, 'spaceId'),
    zones: indexBy(graph.zones, 'zoneId'),
    connectors: indexBy(graph.connectors, 'connectorId'),
    portals: indexBy(graph.portals, 'portalId'),
    places: indexBy(graph.places, 'placeId'),
    nodes: indexBy(graph.routeNodes, 'nodeId'),
    edges: indexBy(graph.routeEdges, 'edgeId'),
  };
}

export function validateBuildingGraph(graph) {
  const errors = [];
  if (!requireRecord(errors, graph, [
    'schemaVersion', 'buildingId', 'mapVersion', 'name', 'status', 'validFrom', 'validTo',
    'coordinateFrame', 'provenance', 'levels', 'spaces', 'zones', 'connectors',
    'portals', 'places', 'routeNodes', 'routeEdges', 'legacyFloorCodes',
  ], ROOT_KEYS, '$')) return errors;

  if (graph.schemaVersion !== SCHEMA_VERSION) {
    errors.push(issue('schema-version', '$.schemaVersion', `must equal ${SCHEMA_VERSION}`));
  }
  validateStableId(errors, graph.buildingId, '$.buildingId');
  validateStableId(errors, graph.mapVersion, '$.mapVersion');
  validateText(errors, graph.name, '$.name');
  validateEnum(errors, graph.status, STATUS, '$.status', 'status');
  if (!isIsoTime(graph.validFrom)) errors.push(issue('time', '$.validFrom', 'must be an ISO-8601 timestamp'));
  if (graph.validTo !== null && !isIsoTime(graph.validTo)) {
    errors.push(issue('time', '$.validTo', 'must be null or an ISO-8601 timestamp'));
  }
  if (isIsoTime(graph.validFrom) && isIsoTime(graph.validTo) && Date.parse(graph.validTo) <= Date.parse(graph.validFrom)) {
    errors.push(issue('time-order', '$.validTo', 'must be after validFrom'));
  }

  if (requireRecord(errors, graph.coordinateFrame, [
    'frameId', 'unit', 'originDescription', 'xAxis', 'yAxis', 'zAxis',
  ], COORDINATE_FRAME_KEYS, '$.coordinateFrame')) {
    validateStableId(errors, graph.coordinateFrame.frameId, '$.coordinateFrame.frameId');
    if (graph.coordinateFrame.unit !== 'm') errors.push(issue('coordinate-unit', '$.coordinateFrame.unit', 'must equal m'));
    for (const field of ['originDescription', 'xAxis', 'yAxis', 'zAxis']) {
      validateText(errors, graph.coordinateFrame[field], `$.coordinateFrame.${field}`);
    }
    if (new Set([graph.coordinateFrame.xAxis, graph.coordinateFrame.yAxis, graph.coordinateFrame.zAxis]).size !== 3) {
      errors.push(issue('coordinate-axis', '$.coordinateFrame', 'axis descriptions must be distinct'));
    }
  }

  if (requireRecord(errors, graph.provenance, ['sourceRefs', 'review'], PROVENANCE_KEYS, '$.provenance')) {
    if (requireArray(errors, graph.provenance.sourceRefs, '$.provenance.sourceRefs', { min: 1 })) {
      validateUnique(errors, graph.provenance.sourceRefs, 'sourceId', '$.provenance.sourceRefs');
      graph.provenance.sourceRefs.forEach((source, index) => {
        const path = `$.provenance.sourceRefs[${index}]`;
        if (!requireRecord(errors, source, [
          'sourceId', 'kind', 'sha256', 'licence', 'permission', 'synthetic',
        ], SOURCE_KEYS, path)) return;
        validateStableId(errors, source.sourceId, `${path}.sourceId`);
        validateEnum(errors, source.kind, SOURCE_KINDS, `${path}.kind`, 'source-kind');
        if (source.sha256 !== null && (typeof source.sha256 !== 'string' || !SHA256.test(source.sha256))) {
          errors.push(issue('sha256', `${path}.sha256`, 'must be null or a lower-case SHA-256 digest'));
        }
        validateText(errors, source.licence, `${path}.licence`);
        validateText(errors, source.permission, `${path}.permission`);
        validateBoolean(errors, source.synthetic, `${path}.synthetic`);
      });
    }
    if (requireRecord(errors, graph.provenance.review, [
      'status', 'reviewedBy', 'reviewedAt',
    ], REVIEW_KEYS, '$.provenance.review')) {
      validateEnum(errors, graph.provenance.review.status, REVIEW_STATUS, '$.provenance.review.status', 'review-status');
      if (graph.provenance.review.reviewedBy !== null) {
        validateStableId(errors, graph.provenance.review.reviewedBy, '$.provenance.review.reviewedBy');
      }
      if (graph.provenance.review.reviewedAt !== null && !isIsoTime(graph.provenance.review.reviewedAt)) {
        errors.push(issue('time', '$.provenance.review.reviewedAt', 'must be null or an ISO-8601 timestamp'));
      }
      if (graph.provenance.review.status === 'reviewed' &&
          (graph.provenance.review.reviewedBy === null || graph.provenance.review.reviewedAt === null)) {
        errors.push(issue('review-evidence', '$.provenance.review', 'reviewed maps require reviewer and review time'));
      }
    }
  }

  requireArray(errors, graph.levels, '$.levels', { min: 1 });
  requireArray(errors, graph.spaces, '$.spaces', { min: 1 });
  requireArray(errors, graph.zones, '$.zones', { min: 1 });
  requireArray(errors, graph.connectors, '$.connectors');
  requireArray(errors, graph.portals, '$.portals', { min: 1 });
  requireArray(errors, graph.places, '$.places', { min: 1 });
  requireArray(errors, graph.routeNodes, '$.routeNodes', { min: 2 });
  requireArray(errors, graph.routeEdges, '$.routeEdges', { min: 1 });
  requireArray(errors, graph.legacyFloorCodes, '$.legacyFloorCodes', { min: 1 });

  const globalIds = new Set();
  for (const [collection, idField, path] of [
    [graph.levels, 'levelId', '$.levels'],
    [graph.spaces, 'spaceId', '$.spaces'],
    [graph.zones, 'zoneId', '$.zones'],
    [graph.connectors, 'connectorId', '$.connectors'],
    [graph.portals, 'portalId', '$.portals'],
    [graph.places, 'placeId', '$.places'],
    [graph.routeNodes, 'nodeId', '$.routeNodes'],
    [graph.routeEdges, 'edgeId', '$.routeEdges'],
  ]) validateUnique(errors, collection, idField, path, globalIds);

  const topology = collectTopology(graph);
  const ordinals = new Set();
  (Array.isArray(graph.levels) ? graph.levels : []).forEach((level, index) => {
    const path = `$.levels[${index}]`;
    if (!requireRecord(errors, level, [
      'levelId', 'levelRef', 'name', 'ordinal', 'elevationM',
    ], LEVEL_KEYS, path)) return;
    validateStableId(errors, level.levelId, `${path}.levelId`);
    validateText(errors, level.levelRef, `${path}.levelRef`);
    validateText(errors, level.name, `${path}.name`);
    if (!Number.isSafeInteger(level.ordinal)) errors.push(issue('ordinal', `${path}.ordinal`, 'must be a safe integer'));
    if (ordinals.has(level.ordinal)) errors.push(issue('duplicate-ordinal', `${path}.ordinal`, 'must be unique within the building'));
    ordinals.add(level.ordinal);
    if (!isFiniteNumber(level.elevationM)) errors.push(issue('finite-number', `${path}.elevationM`, 'must be finite'));
  });

  (Array.isArray(graph.spaces) ? graph.spaces : []).forEach((space, index) => {
    const path = `$.spaces[${index}]`;
    if (!requireRecord(errors, space, [
      'spaceId', 'levelId', 'kind', 'name', 'ref', 'navigable', 'egressRequired',
      'stepFreeEgressRequired', 'nodeId',
    ], SPACE_KEYS, path)) return;
    validateStableId(errors, space.spaceId, `${path}.spaceId`);
    validateStableId(errors, space.levelId, `${path}.levelId`);
    if (!topology.levels.has(space.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
    validateEnum(errors, space.kind, SPACE_KINDS, `${path}.kind`, 'space-kind');
    validateText(errors, space.name, `${path}.name`);
    if (space.ref !== null) validateText(errors, space.ref, `${path}.ref`);
    validateBoolean(errors, space.navigable, `${path}.navigable`);
    validateBoolean(errors, space.egressRequired, `${path}.egressRequired`);
    validateBoolean(errors, space.stepFreeEgressRequired, `${path}.stepFreeEgressRequired`);
    if (space.nodeId !== null) validateStableId(errors, space.nodeId, `${path}.nodeId`);
    if (space.navigable && space.nodeId === null) errors.push(issue('space-node', `${path}.nodeId`, 'navigable space requires a primary route node'));
    if (!space.navigable && space.nodeId !== null) errors.push(issue('space-node', `${path}.nodeId`, 'non-navigable space cannot expose a primary route node'));
    if (space.kind === 'void' && space.navigable) errors.push(issue('void-navigable', path, 'void space cannot be navigable'));
    if (space.egressRequired && !space.navigable) errors.push(issue('egress-space', path, 'egressRequired space must be navigable'));
    if (space.stepFreeEgressRequired && !space.egressRequired) {
      errors.push(issue('accessible-egress-space', path, 'stepFreeEgressRequired implies egressRequired'));
    }
  });

  (Array.isArray(graph.zones) ? graph.zones : []).forEach((zone, index) => {
    const path = `$.zones[${index}]`;
    if (!requireRecord(errors, zone, ['zoneId', 'levelId', 'name', 'spaceIds'], ZONE_KEYS, path)) return;
    validateStableId(errors, zone.zoneId, `${path}.zoneId`);
    validateStableId(errors, zone.levelId, `${path}.levelId`);
    if (!topology.levels.has(zone.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
    validateText(errors, zone.name, `${path}.name`);
    if (requireArray(errors, zone.spaceIds, `${path}.spaceIds`, { min: 1 })) {
      validatePrimitiveUnique(errors, zone.spaceIds, `${path}.spaceIds`);
      zone.spaceIds.forEach((spaceId, spaceIndex) => {
        validateStableId(errors, spaceId, `${path}.spaceIds[${spaceIndex}]`);
        const space = topology.spaces.get(spaceId);
        if (!space) errors.push(issue('unknown-space', `${path}.spaceIds[${spaceIndex}]`, 'does not reference a space'));
        else if (space.levelId !== zone.levelId) errors.push(issue('multi-level-zone', `${path}.spaceIds[${spaceIndex}]`, 'space must be on the zone level'));
        else if (!space.navigable) errors.push(issue('zone-space', `${path}.spaceIds[${spaceIndex}]`, 'zone space must be navigable'));
      });
    }
  });

  const landingIds = new Set();
  const landingOwners = new Map();
  (Array.isArray(graph.connectors) ? graph.connectors : []).forEach((connector, index) => {
    const path = `$.connectors[${index}]`;
    if (!requireRecord(errors, connector, [
      'connectorId', 'kind', 'name', 'availability', 'emergencyUse', 'accessibility', 'landings',
    ], CONNECTOR_KEYS, path)) return;
    validateStableId(errors, connector.connectorId, `${path}.connectorId`);
    validateEnum(errors, connector.kind, CONNECTOR_KINDS, `${path}.kind`, 'connector-kind');
    validateText(errors, connector.name, `${path}.name`);
    validateEnum(errors, connector.availability, AVAILABILITY, `${path}.availability`, 'availability');
    validateBoolean(errors, connector.emergencyUse, `${path}.emergencyUse`);
    validateAccessibility(errors, connector.accessibility, `${path}.accessibility`);
    if (requireArray(errors, connector.landings, `${path}.landings`, { min: 2 })) {
      validateUnique(errors, connector.landings, 'landingId', `${path}.landings`, landingIds);
      const landingLevels = new Set();
      connector.landings.forEach((landing, landingIndex) => {
        const landingPath = `${path}.landings[${landingIndex}]`;
        if (!requireRecord(errors, landing, [
          'landingId', 'levelId', 'spaceId', 'nodeId',
        ], LANDING_KEYS, landingPath)) return;
        for (const field of ['landingId', 'levelId', 'spaceId', 'nodeId']) {
          validateStableId(errors, landing[field], `${landingPath}.${field}`);
        }
        if (landingLevels.has(landing.levelId)) errors.push(issue('duplicate-landing-level', `${landingPath}.levelId`, 'connector may have only one landing per level'));
        landingLevels.add(landing.levelId);
        const space = topology.spaces.get(landing.spaceId);
        if (!topology.levels.has(landing.levelId)) errors.push(issue('unknown-level', `${landingPath}.levelId`, 'does not reference a level'));
        if (!space) errors.push(issue('unknown-space', `${landingPath}.spaceId`, 'does not reference a space'));
        else if (space.levelId !== landing.levelId) errors.push(issue('landing-level', landingPath, 'landing space and level must agree'));
        else if (!space.navigable) errors.push(issue('landing-space', landingPath, 'landing space must be navigable'));
        landingOwners.set(landing.landingId, { connector, landing });
      });
    }
  });

  (Array.isArray(graph.portals) ? graph.portals : []).forEach((portal, index) => {
    const path = `$.portals[${index}]`;
    if (!requireRecord(errors, portal, [
      'portalId', 'levelId', 'kind', 'name', 'fromSpaceId', 'toSpaceId', 'direction',
      'finalExit', 'availability', 'emergencyUse', 'accessibility',
    ], PORTAL_KEYS, path)) return;
    for (const field of ['portalId', 'levelId', 'fromSpaceId', 'toSpaceId']) {
      validateStableId(errors, portal[field], `${path}.${field}`);
    }
    validateEnum(errors, portal.kind, PORTAL_KINDS, `${path}.kind`, 'portal-kind');
    validateText(errors, portal.name, `${path}.name`);
    validateEnum(errors, portal.direction, PORTAL_DIRECTIONS, `${path}.direction`, 'portal-direction');
    validateBoolean(errors, portal.finalExit, `${path}.finalExit`);
    validateEnum(errors, portal.availability, AVAILABILITY, `${path}.availability`, 'availability');
    validateBoolean(errors, portal.emergencyUse, `${path}.emergencyUse`);
    validateAccessibility(errors, portal.accessibility, `${path}.accessibility`);
    const from = topology.spaces.get(portal.fromSpaceId);
    const to = topology.spaces.get(portal.toSpaceId);
    if (!topology.levels.has(portal.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
    if (!from) errors.push(issue('unknown-space', `${path}.fromSpaceId`, 'does not reference a space'));
    if (!to) errors.push(issue('unknown-space', `${path}.toSpaceId`, 'does not reference a space'));
    if (from && from.levelId !== portal.levelId) errors.push(issue('portal-level', `${path}.fromSpaceId`, 'from space must be on portal level'));
    if (to && to.levelId !== portal.levelId) errors.push(issue('portal-level', `${path}.toSpaceId`, 'to space must be on portal level'));
    if (portal.fromSpaceId === portal.toSpaceId) errors.push(issue('portal-space', path, 'portal must connect two distinct spaces'));
    if (portal.finalExit && from && to && (from.kind === 'outdoor' || to.kind !== 'outdoor')) {
      errors.push(issue('final-exit', path, 'final exit must lead from an indoor space to an outdoor space'));
    }
    if (!portal.finalExit && from && to && (from.kind === 'outdoor' || to.kind === 'outdoor')) {
      errors.push(issue('outdoor-portal', path, 'indoor/outdoor portal must be marked finalExit'));
    }
  });

  (Array.isArray(graph.places) ? graph.places : []).forEach((place, index) => {
    const path = `$.places[${index}]`;
    if (!requireRecord(errors, place, ['placeId', 'kind', 'name', 'spaceId', 'nodeId'], PLACE_KEYS, path)) return;
    for (const field of ['placeId', 'spaceId', 'nodeId']) validateStableId(errors, place[field], `${path}.${field}`);
    validateEnum(errors, place.kind, PLACE_KINDS, `${path}.kind`, 'place-kind');
    validateText(errors, place.name, `${path}.name`);
    const space = topology.spaces.get(place.spaceId);
    if (!space) errors.push(issue('unknown-space', `${path}.spaceId`, 'does not reference a space'));
    else if (!space.navigable) errors.push(issue('place-space', path, 'place must be in a navigable space'));
    if (place.kind === 'assembly' && space && space.kind !== 'outdoor') {
      errors.push(issue('assembly-space', path, 'assembly place must be outdoors'));
    }
  });

  (Array.isArray(graph.routeNodes) ? graph.routeNodes : []).forEach((node, index) => {
    const path = `$.routeNodes[${index}]`;
    if (!requireRecord(errors, node, ['nodeId', 'levelId', 'spaceId', 'kind', 'position'], NODE_KEYS, path)) return;
    for (const field of ['nodeId', 'levelId', 'spaceId']) validateStableId(errors, node[field], `${path}.${field}`);
    validateEnum(errors, node.kind, NODE_KINDS, `${path}.kind`, 'node-kind');
    const space = topology.spaces.get(node.spaceId);
    if (!topology.levels.has(node.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
    if (!space) errors.push(issue('unknown-space', `${path}.spaceId`, 'does not reference a space'));
    else if (space.levelId !== node.levelId) errors.push(issue('node-level', path, 'node level and space level must agree'));
    else if (!space.navigable) errors.push(issue('node-space', path, 'route node cannot be in a non-navigable space'));
    if (requireRecord(errors, node.position, ['xM', 'yM'], POSITION_KEYS, `${path}.position`)) {
      for (const field of ['xM', 'yM']) {
        if (!isFiniteNumber(node.position[field])) errors.push(issue('finite-number', `${path}.position.${field}`, 'must be finite'));
      }
    }
  });

  for (const [spaceId, space] of topology.spaces) {
    if (!space?.navigable) continue;
    const node = topology.nodes.get(space.nodeId);
    if (!node) errors.push(issue('unknown-node', `$.spaces.${spaceId}.nodeId`, 'primary node does not exist'));
    else if (node.spaceId !== spaceId || node.levelId !== space.levelId) {
      errors.push(issue('space-node-mismatch', `$.spaces.${spaceId}.nodeId`, 'primary node must belong to the space and level'));
    }
  }

  for (const [connectorId, connector] of topology.connectors) {
    for (const landing of Array.isArray(connector?.landings) ? connector.landings : []) {
      const node = topology.nodes.get(landing.nodeId);
      if (!node) errors.push(issue('unknown-node', `$.connectors.${connectorId}.landings.${landing.landingId}.nodeId`, 'landing node does not exist'));
      else if (node.levelId !== landing.levelId || node.spaceId !== landing.spaceId || node.kind !== 'landing') {
        errors.push(issue('landing-node-mismatch', `$.connectors.${connectorId}.landings.${landing.landingId}`, 'landing node must match level/space and have landing kind'));
      }
    }
  }

  for (const [placeId, place] of topology.places) {
    const node = topology.nodes.get(place?.nodeId);
    if (!node) errors.push(issue('unknown-node', `$.places.${placeId}.nodeId`, 'place node does not exist'));
    else if (node.spaceId !== place.spaceId || node.kind !== 'place') {
      errors.push(issue('place-node-mismatch', `$.places.${placeId}.nodeId`, 'place node must match space and have place kind'));
    }
  }

  const portalEdgeCounts = new Map();
  const connectorLandingUse = new Map();
  const spaceEdgeUse = new Map();
  (Array.isArray(graph.routeEdges) ? graph.routeEdges : []).forEach((edge, index) => {
    const path = `$.routeEdges[${index}]`;
    if (!requireRecord(errors, edge, [
      'edgeId', 'fromNodeId', 'toNodeId', 'kind', 'bidirectional', 'distanceM',
      'durationSec', 'availability', 'emergencyUse', 'accessibility', 'connectorId', 'portalId',
    ], EDGE_KEYS, path)) return;
    for (const field of ['edgeId', 'fromNodeId', 'toNodeId']) validateStableId(errors, edge[field], `${path}.${field}`);
    validateEnum(errors, edge.kind, EDGE_KINDS, `${path}.kind`, 'edge-kind');
    validateBoolean(errors, edge.bidirectional, `${path}.bidirectional`);
    validatePositive(errors, edge.distanceM, `${path}.distanceM`);
    validatePositive(errors, edge.durationSec, `${path}.durationSec`);
    validateEnum(errors, edge.availability, AVAILABILITY, `${path}.availability`, 'availability');
    validateBoolean(errors, edge.emergencyUse, `${path}.emergencyUse`);
    validateAccessibility(errors, edge.accessibility, `${path}.accessibility`);
    if (edge.connectorId !== null) validateStableId(errors, edge.connectorId, `${path}.connectorId`);
    if (edge.portalId !== null) validateStableId(errors, edge.portalId, `${path}.portalId`);
    const from = topology.nodes.get(edge.fromNodeId);
    const to = topology.nodes.get(edge.toNodeId);
    if (!from) errors.push(issue('unknown-node', `${path}.fromNodeId`, 'does not reference a route node'));
    if (!to) errors.push(issue('unknown-node', `${path}.toNodeId`, 'does not reference a route node'));
    if (edge.fromNodeId === edge.toNodeId) errors.push(issue('edge-loop', path, 'edge endpoints must differ'));
    if (!from || !to) return;
    spaceEdgeUse.set(from.spaceId, (spaceEdgeUse.get(from.spaceId) ?? 0) + 1);
    spaceEdgeUse.set(to.spaceId, (spaceEdgeUse.get(to.spaceId) ?? 0) + 1);

    if (CONNECTOR_EDGE_KINDS.has(edge.kind)) {
      if (edge.portalId !== null) errors.push(issue('connector-edge', `${path}.portalId`, 'connector edge cannot reference a portal'));
      const connector = topology.connectors.get(edge.connectorId);
      if (!connector) errors.push(issue('unknown-connector', `${path}.connectorId`, 'does not reference a connector'));
      else {
        if (connector.kind !== edge.kind) errors.push(issue('connector-kind', path, 'edge kind must match connector kind'));
        const connectorLandings = Array.isArray(connector.landings) ? connector.landings : [];
        const fromLanding = connectorLandings.find((landing) => landing.nodeId === edge.fromNodeId);
        const toLanding = connectorLandings.find((landing) => landing.nodeId === edge.toNodeId);
        if (!fromLanding || !toLanding) errors.push(issue('connector-landing', path, 'edge endpoints must be landings of the referenced connector'));
        else {
          connectorLandingUse.set(fromLanding.landingId, true);
          connectorLandingUse.set(toLanding.landingId, true);
        }
      }
      if (from.levelId === to.levelId) errors.push(issue('connector-level', path, 'connector traversal must change level'));
    } else if (edge.kind === 'walk') {
      if (edge.connectorId !== null || edge.portalId !== null) errors.push(issue('walk-reference', path, 'walk edge cannot reference connector or portal'));
      if (from.levelId !== to.levelId) errors.push(issue('cross-level-edge', path, 'walk edge cannot cross levels'));
      if (from.spaceId !== to.spaceId) errors.push(issue('walk-space', path, 'walk edge must stay within one space'));
    } else {
      if (edge.connectorId !== null) errors.push(issue('portal-edge', `${path}.connectorId`, 'portal edge cannot reference a connector'));
      const portal = topology.portals.get(edge.portalId);
      if (!portal) errors.push(issue('unknown-portal', `${path}.portalId`, 'does not reference a portal'));
      else {
        portalEdgeCounts.set(portal.portalId, (portalEdgeCounts.get(portal.portalId) ?? 0) + 1);
        const expectedKind = portal.finalExit ? 'exit' : 'door';
        if (edge.kind !== expectedKind) errors.push(issue('portal-edge-kind', path, `edge kind must be ${expectedKind}`));
        if (from.levelId !== portal.levelId || to.levelId !== portal.levelId) errors.push(issue('portal-level', path, 'portal edge nodes must be on portal level'));
        if (from.spaceId !== portal.fromSpaceId || to.spaceId !== portal.toSpaceId) {
          errors.push(issue('portal-node-space', path, 'edge orientation must match portal from/to spaces'));
        }
        if ((portal.direction === 'both') !== edge.bidirectional) {
          errors.push(issue('portal-direction', path, 'edge bidirectionality must match portal direction'));
        }
      }
      if (from.levelId !== to.levelId) errors.push(issue('cross-level-edge', path, 'door/exit edge cannot cross levels'));
    }
  });

  for (const [portalId] of topology.portals) {
    if (portalEdgeCounts.get(portalId) !== 1) {
      errors.push(issue('portal-edge-count', `$.portals.${portalId}`, 'portal must have exactly one route edge'));
    }
  }
  for (const [connectorId, connector] of topology.connectors) {
    for (const landing of Array.isArray(connector?.landings) ? connector.landings : []) {
      if (!connectorLandingUse.has(landing.landingId)) {
        errors.push(issue('orphan-landing', `$.connectors.${connectorId}.landings.${landing.landingId}`, 'landing must participate in a connector traversal edge'));
      }
    }
  }
  for (const [spaceId, space] of topology.spaces) {
    if (space?.navigable && !spaceEdgeUse.has(spaceId)) {
      errors.push(issue('orphan-space', `$.spaces.${spaceId}`, 'navigable space must participate in a route edge'));
    }
  }

  const codesByLevel = new Map();
  const levelsByCode = new Map();
  (Array.isArray(graph.legacyFloorCodes) ? graph.legacyFloorCodes : []).forEach((entry, index) => {
    const path = `$.legacyFloorCodes[${index}]`;
    if (!requireRecord(errors, entry, ['levelId', 'code'], LEGACY_CODE_KEYS, path)) return;
    validateStableId(errors, entry.levelId, `${path}.levelId`);
    if (!topology.levels.has(entry.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
    if (!Number.isSafeInteger(entry.code) || entry.code < -64 || entry.code > 63) {
      errors.push(issue('wire-floor-code', `${path}.code`, 'must be an integer in -64..63'));
    }
    if (codesByLevel.has(entry.levelId)) errors.push(issue('duplicate-wire-level', `${path}.levelId`, 'level has more than one wire code'));
    if (levelsByCode.has(entry.code)) errors.push(issue('duplicate-wire-code', `${path}.code`, 'wire code must be injective'));
    codesByLevel.set(entry.levelId, entry.code);
    levelsByCode.set(entry.code, entry.levelId);
  });
  for (const levelId of topology.levels.keys()) {
    if (!codesByLevel.has(levelId)) errors.push(issue('missing-wire-code', `$.legacyFloorCodes.${levelId}`, 'every level requires an explicit wire code'));
  }

  return errors.sort((left, right) =>
    left.path.localeCompare(right.path) || left.code.localeCompare(right.code) || left.message.localeCompare(right.message)
  );
}

export class GraphValidationError extends Error {
  constructor(errors) {
    super(`building graph failed validation with ${errors.length} issue(s)`);
    this.name = 'GraphValidationError';
    this.errors = errors;
  }
}

class MinHeap {
  #items = [];

  push(value) {
    this.#items.push(value);
    let index = this.#items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (compareState(this.#items[parent], value) <= 0) break;
      this.#items[index] = this.#items[parent];
      index = parent;
    }
    this.#items[index] = value;
  }

  pop() {
    if (this.#items.length === 0) return undefined;
    const result = this.#items[0];
    const tail = this.#items.pop();
    if (this.#items.length === 0) return result;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.#items.length) break;
      let child = left;
      if (right < this.#items.length && compareState(this.#items[right], this.#items[left]) < 0) child = right;
      if (compareState(this.#items[child], tail) >= 0) break;
      this.#items[index] = this.#items[child];
      index = child;
    }
    this.#items[index] = tail;
    return result;
  }

  get size() {
    return this.#items.length;
  }
}

function compareState(left, right) {
  return left.cost - right.cost || left.nodeId.localeCompare(right.nodeId) || left.serial - right.serial;
}

function makeAdjacency(graph) {
  const adjacency = new Map(graph.routeNodes.map((node) => [node.nodeId, []]));
  const sortedEdges = [...graph.routeEdges].sort((left, right) => left.edgeId.localeCompare(right.edgeId));
  for (const edge of sortedEdges) {
    adjacency.get(edge.fromNodeId).push({ edge, fromNodeId: edge.fromNodeId, toNodeId: edge.toNodeId, reversed: false });
    if (edge.bidirectional) {
      adjacency.get(edge.toNodeId).push({ edge, fromNodeId: edge.toNodeId, toNodeId: edge.fromNodeId, reversed: true });
    }
  }
  for (const arcs of adjacency.values()) {
    arcs.sort((left, right) => left.edge.edgeId.localeCompare(right.edge.edgeId) || left.toNodeId.localeCompare(right.toNodeId));
    for (const arc of arcs) Object.freeze(arc);
    Object.freeze(arcs);
  }
  return readOnlyMap(adjacency);
}

function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function readOnlyMap(map) {
  return Object.freeze({
    size: map.size,
    get: (key) => map.get(key),
    has: (key) => map.has(key),
    keys: () => map.keys(),
    values: () => map.values(),
    entries: () => map.entries(),
    [Symbol.iterator]: () => map[Symbol.iterator](),
  });
}

function readOnlyTopology(topology) {
  return Object.freeze(Object.fromEntries(
    Object.entries(topology).map(([key, value]) => [key, readOnlyMap(value)]),
  ));
}

export function compileBuildingGraph(graph) {
  const errors = validateBuildingGraph(graph);
  if (errors.length > 0) throw new GraphValidationError(errors);
  const snapshot = deepFreeze(structuredClone(graph));
  const topology = readOnlyTopology(collectTopology(snapshot));
  const exitTargets = new Map();
  for (const portal of snapshot.portals) {
    if (!portal.finalExit) continue;
    const edge = snapshot.routeEdges.find((candidate) => candidate.portalId === portal.portalId);
    exitTargets.set(edge.toNodeId, portal.portalId);
  }
  return Object.freeze({
    __compiledBuildingGraph: true,
    graph: snapshot,
    topology,
    adjacency: makeAdjacency(snapshot),
    exitTargets: readOnlyMap(exitTargets),
    graphFingerprint: graphFingerprint(snapshot),
    semanticIdentityFingerprint: semanticIdentityFingerprint(snapshot),
  });
}

function asCompiled(value) {
  return value?.__compiledBuildingGraph === true ? value : compileBuildingGraph(value);
}

function validateRequest(compiled, request, allowedKeys, includeDestination) {
  if (!isRecord(request)) return { outcome: 'invalid-request', reason: 'request-type' };
  for (const key of Object.keys(request)) {
    if (!allowedKeys.has(key)) return { outcome: 'invalid-request', reason: 'unknown-request-field', field: key };
  }
  if (!compiled.topology.nodes.has(request.fromNodeId)) return { outcome: 'invalid-request', reason: 'unknown-origin' };
  if (includeDestination && !compiled.topology.nodes.has(request.toNodeId)) {
    return { outcome: 'invalid-request', reason: 'unknown-destination' };
  }
  if (!PROFILE_SET.has(request.profile)) return { outcome: 'invalid-request', reason: 'invalid-profile' };
  for (const [field, index, reason] of [
    ['closedEdgeIds', compiled.topology.edges, 'unknown-closed-edge'],
    ['closedConnectorIds', compiled.topology.connectors, 'unknown-closed-connector'],
  ]) {
    const values = request[field] ?? [];
    if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
      return { outcome: 'invalid-request', reason: `invalid-${field}` };
    }
    const unknown = values.find((value) => !index.has(value));
    if (unknown) return { outcome: 'invalid-request', reason, id: unknown };
  }
  return null;
}

function affirmative(accessibility) {
  return accessibility?.stepFree === 'yes' && accessibility?.wheelchair === 'yes';
}

function edgeEligible(compiled, arc, profile, closedEdges, closedConnectors) {
  const { edge } = arc;
  if (edge.availability !== 'open' || closedEdges.has(edge.edgeId)) return false;
  const connector = edge.connectorId === null ? null : compiled.topology.connectors.get(edge.connectorId);
  const portal = edge.portalId === null ? null : compiled.topology.portals.get(edge.portalId);
  if (connector && (connector.availability !== 'open' || closedConnectors.has(connector.connectorId))) return false;
  if (portal && portal.availability !== 'open') return false;

  if (STEP_FREE_PROFILES.has(profile)) {
    if (edge.kind === 'stairs' || !affirmative(edge.accessibility)) return false;
    if (connector && !affirmative(connector.accessibility)) return false;
    if (portal && !affirmative(portal.accessibility)) return false;
  }
  if (EVACUATION_PROFILES.has(profile)) {
    if (!edge.emergencyUse || edge.kind === 'lift' || edge.kind === 'escalator') return false;
    if (connector && !connector.emergencyUse) return false;
    if (portal && !portal.emergencyUse) return false;
  }
  return true;
}

function reconstruct(compiled, originId, endState, previous, profile, request, exitPortalId = undefined) {
  const arcs = [];
  let cursor = endState.nodeId;
  while (cursor !== originId) {
    const step = previous.get(cursor);
    if (!step) throw new Error('route reconstruction failed');
    arcs.push(step.arc);
    cursor = step.previousNodeId;
  }
  arcs.reverse();
  const nodeIds = [originId, ...arcs.map((arc) => arc.toNodeId)];
  const levelIds = [];
  for (const nodeId of nodeIds) {
    const levelId = compiled.topology.nodes.get(nodeId).levelId;
    if (levelIds.at(-1) !== levelId) levelIds.push(levelId);
  }
  const connectorIds = [];
  for (const arc of arcs) {
    const connectorId = arc.edge.connectorId;
    if (connectorId && connectorIds.at(-1) !== connectorId) connectorIds.push(connectorId);
  }
  const totalDistanceM = arcs.reduce((sum, arc) => sum + arc.edge.distanceM, 0);
  const edgeIds = arcs.map((arc) => arc.edge.edgeId);
  const reversedEdgeIds = arcs.filter((arc) => arc.reversed).map((arc) => arc.edge.edgeId);
  const closedEdgeIds = [...(request.closedEdgeIds ?? [])].sort();
  const closedConnectorIds = [...(request.closedConnectorIds ?? [])].sort();
  const roundedDistanceM = Number(totalDistanceM.toFixed(6));
  const roundedDurationSec = Number(endState.cost.toFixed(6));
  return {
    outcome: 'ok',
    reason: 'route-found',
    buildingId: compiled.graph.buildingId,
    mapVersion: compiled.graph.mapVersion,
    profile,
    fromNodeId: originId,
    toNodeId: endState.nodeId,
    closedEdgeIds,
    closedConnectorIds,
    nodeIds,
    edgeIds,
    reversedEdgeIds,
    levelIds,
    connectorIds,
    totalDistanceM: roundedDistanceM,
    totalDurationSec: roundedDurationSec,
    // Route order is semantic. JSON.stringify is intentional here: unlike the
    // graph canonicaliser, it must not sort the ordered node/edge sequences.
    semanticFingerprint: createHash('sha256').update(JSON.stringify({
      buildingId: compiled.graph.buildingId,
      mapVersion: compiled.graph.mapVersion,
      profile,
      fromNodeId: originId,
      toNodeId: endState.nodeId,
      closedEdgeIds,
      closedConnectorIds,
      nodeIds,
      edgeIds,
      reversedEdgeIds,
      levelIds,
      connectorIds,
      totalDistanceM: roundedDistanceM,
      totalDurationSec: roundedDurationSec,
      exitPortalId: exitPortalId ?? null,
    })).digest('hex'),
    ...(exitPortalId ? { exitPortalId } : {}),
  };
}

function findRoute(compiled, request, targets) {
  const closedEdges = new Set(request.closedEdgeIds ?? []);
  const closedConnectors = new Set(request.closedConnectorIds ?? []);
  const best = new Map([[request.fromNodeId, { cost: 0, chain: null, version: 0 }]]);
  const previous = new Map();
  const queue = new MinHeap();
  let serial = 0;
  let selectedTarget;
  queue.push({ nodeId: request.fromNodeId, cost: 0, version: 0, serial: serial += 1 });

  const chainSequence = (chain) => {
    if (chain === null) return [];
    if (chain.sequence) return chain.sequence;
    const sequence = [];
    for (let cursor = chain; cursor !== null; cursor = cursor.previous) sequence.push(cursor.edgeKey);
    sequence.reverse();
    chain.sequence = sequence;
    return sequence;
  };
  const compareChains = (left, right) => {
    const leftSequence = chainSequence(left);
    const rightSequence = chainSequence(right);
    const length = Math.min(leftSequence.length, rightSequence.length);
    for (let index = 0; index < length; index += 1) {
      const compared = leftSequence[index].localeCompare(rightSequence[index]);
      if (compared !== 0) return compared;
    }
    return leftSequence.length - rightSequence.length;
  };

  while (queue.size > 0) {
    const current = queue.pop();
    const known = best.get(current.nodeId);
    if (!known || current.cost !== known.cost || current.version !== known.version) continue;
    if (selectedTarget && current.cost > selectedTarget.cost) break;
    if (targets.has(current.nodeId)) {
      const candidate = { nodeId: current.nodeId, cost: current.cost, chain: known.chain };
      if (!selectedTarget || candidate.cost < selectedTarget.cost ||
          (candidate.cost === selectedTarget.cost &&
            (compareChains(candidate.chain, selectedTarget.chain) < 0 ||
              (compareChains(candidate.chain, selectedTarget.chain) === 0 &&
                candidate.nodeId.localeCompare(selectedTarget.nodeId) < 0)))) {
        selectedTarget = candidate;
      }
      continue;
    }
    for (const arc of compiled.adjacency.get(current.nodeId) ?? []) {
      if (!edgeEligible(compiled, arc, request.profile, closedEdges, closedConnectors)) continue;
      const cost = Number((current.cost + arc.edge.durationSec).toFixed(9));
      const chain = {
        previous: known.chain,
        edgeKey: `${arc.edge.edgeId}${arc.reversed ? ':r' : ':f'}`,
      };
      const existing = best.get(arc.toNodeId);
      if (existing && (cost > existing.cost ||
          (cost === existing.cost && compareChains(chain, existing.chain) >= 0))) continue;
      const version = (existing?.version ?? -1) + 1;
      best.set(arc.toNodeId, { cost, chain, version });
      previous.set(arc.toNodeId, { previousNodeId: current.nodeId, arc });
      queue.push({ nodeId: arc.toNodeId, cost, version, serial: serial += 1 });
    }
  }
  if (selectedTarget) {
    return reconstruct(
      compiled,
      request.fromNodeId,
      selectedTarget,
      previous,
      request.profile,
      request,
      targets.get(selectedTarget.nodeId),
    );
  }
  return {
    outcome: 'no-route',
    reason: 'no-eligible-route',
    buildingId: compiled.graph.buildingId,
    mapVersion: compiled.graph.mapVersion,
    profile: request.profile,
    fromNodeId: request.fromNodeId,
    closedEdgeIds: [...closedEdges].sort(),
    closedConnectorIds: [...closedConnectors].sort(),
  };
}

export function route(graphOrCompiled, request) {
  const compiled = asCompiled(graphOrCompiled);
  const invalid = validateRequest(compiled, request, REQUEST_KEYS, true);
  if (invalid) return invalid;
  return findRoute(compiled, request, new Map([[request.toNodeId, undefined]]));
}

export function routeToExit(graphOrCompiled, request) {
  const compiled = asCompiled(graphOrCompiled);
  const invalid = validateRequest(compiled, request, EXIT_REQUEST_KEYS, false);
  if (invalid) return invalid;
  if (compiled.exitTargets.size === 0) return { outcome: 'no-route', reason: 'no-final-exit' };
  return findRoute(compiled, request, compiled.exitTargets);
}

export function auditEgress(graphOrCompiled, overlay = {}) {
  const compiled = asCompiled(graphOrCompiled);
  const closedEdgeIds = overlay.closedEdgeIds ?? [];
  const closedConnectorIds = overlay.closedConnectorIds ?? [];
  const walking = [];
  const stepFree = [];
  for (const space of compiled.graph.spaces) {
    if (space.egressRequired) {
      const result = routeToExit(compiled, {
        fromNodeId: space.nodeId,
        profile: 'evacuation-walking',
        closedEdgeIds,
        closedConnectorIds,
      });
      walking.push({ spaceId: space.spaceId, outcome: result.outcome, reason: result.reason, exitPortalId: result.exitPortalId ?? null });
    }
    if (space.stepFreeEgressRequired) {
      const result = routeToExit(compiled, {
        fromNodeId: space.nodeId,
        profile: 'evacuation-step-free',
        closedEdgeIds,
        closedConnectorIds,
      });
      stepFree.push({ spaceId: space.spaceId, outcome: result.outcome, reason: result.reason, exitPortalId: result.exitPortalId ?? null });
    }
  }
  const summarise = (entries) => ({
    required: entries.length,
    reachable: entries.filter((entry) => entry.outcome === 'ok').length,
    percent: entries.length === 0 ? 100 : Number((100 * entries.filter((entry) => entry.outcome === 'ok').length / entries.length).toFixed(3)),
    failures: entries.filter((entry) => entry.outcome !== 'ok'),
  });
  return {
    buildingId: compiled.graph.buildingId,
    mapVersion: compiled.graph.mapVersion,
    walking: summarise(walking),
    stepFree: summarise(stepFree),
  };
}

export function projectLevels(graphOrCompiled) {
  const compiled = asCompiled(graphOrCompiled);
  return [...compiled.graph.levels]
    .sort((left, right) => left.ordinal - right.ordinal || left.levelId.localeCompare(right.levelId))
    .map(({ levelId, levelRef, name, ordinal, elevationM }) => ({
      buildingId: compiled.graph.buildingId,
      mapVersion: compiled.graph.mapVersion,
      levelId,
      levelRef,
      name,
      ordinal,
      elevationM,
    }));
}

export function projectZones(graphOrCompiled) {
  const compiled = asCompiled(graphOrCompiled);
  return [...compiled.graph.zones]
    .sort((left, right) => left.zoneId.localeCompare(right.zoneId))
    .map((zone) => {
      const points = zone.spaceIds.map((spaceId) => {
        const space = compiled.topology.spaces.get(spaceId);
        return compiled.topology.nodes.get(space.nodeId).position;
      });
      return {
        buildingId: compiled.graph.buildingId,
        mapVersion: compiled.graph.mapVersion,
        zoneId: zone.zoneId,
        levelId: zone.levelId,
        name: zone.name,
        spaceIds: [...zone.spaceIds].sort(),
        localCenterM: {
          xM: Number((points.reduce((sum, point) => sum + point.xM, 0) / points.length).toFixed(6)),
          yM: Number((points.reduce((sum, point) => sum + point.yM, 0) / points.length).toFixed(6)),
        },
      };
    });
}

export function projectPlaces(graphOrCompiled, kind = undefined) {
  const compiled = asCompiled(graphOrCompiled);
  return compiled.graph.places
    .filter((place) => kind === undefined || place.kind === kind)
    .sort((left, right) => left.placeId.localeCompare(right.placeId))
    .map((place) => {
      const node = compiled.topology.nodes.get(place.nodeId);
      return {
        buildingId: compiled.graph.buildingId,
        mapVersion: compiled.graph.mapVersion,
        placeId: place.placeId,
        kind: place.kind,
        name: place.name,
        spaceId: place.spaceId,
        levelId: node.levelId,
        nodeId: place.nodeId,
      };
    });
}

export function createLegacyFloorCodec(graphOrCompiled) {
  const compiled = asCompiled(graphOrCompiled);
  const byLevel = new Map(compiled.graph.legacyFloorCodes.map(({ levelId, code }) => [levelId, code]));
  const byCode = new Map(compiled.graph.legacyFloorCodes.map(({ levelId, code }) => [code, levelId]));
  return Object.freeze({
    buildingId: compiled.graph.buildingId,
    mapVersion: compiled.graph.mapVersion,
    entries: [...compiled.graph.legacyFloorCodes].sort((left, right) => left.code - right.code),
    encode(levelId) {
      if (!byLevel.has(levelId)) throw new RangeError(`unknown semantic level: ${levelId}`);
      return byLevel.get(levelId);
    },
    decode(code) {
      if (!byCode.has(code)) throw new RangeError(`unknown legacy floor code: ${code}`);
      return byCode.get(code);
    },
  });
}
