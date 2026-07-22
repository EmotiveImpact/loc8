import {
  VENUE_PACKAGE_SCHEMA,
  type AccessibilityEvidence,
  type VenuePackage,
  type VenueValidationIssue,
} from './types';

const STABLE_ID = /^[a-z][a-z0-9._-]{2,95}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const PACKAGE_STATES = new Set(['draft', 'local-demo', 'published', 'retired']);
const AUTHORITIES = new Set(['browser-local', 'gateway', 'connected-service']);
const SOURCE_KINDS = new Set(['synthetic', 'plan', 'survey', 'scan', 'import', 'operator']);
const REVIEW_STATES = new Set(['unreviewed', 'reviewed', 'rejected']);
const SPACE_KINDS = new Set(['room', 'corridor', 'lobby', 'service', 'outdoor', 'void']);
const CONNECTOR_KINDS = new Set(['stairs', 'lift', 'escalator', 'ramp']);
const PORTAL_KINDS = new Set(['door', 'opening', 'gate']);
const PLACE_KINDS = new Set(['assembly', 'aed', 'anchor', 'gateway', 'other']);
const NODE_KINDS = new Set(['space', 'landing', 'place']);
const EDGE_KINDS = new Set(['walk', 'door', 'stairs', 'lift', 'escalator', 'ramp', 'exit']);
const CONNECTOR_EDGE_KINDS = new Set(['stairs', 'lift', 'escalator', 'ramp']);
const EVIDENCE_VALUES = new Set(['yes', 'no', 'unknown']);
const AVAILABILITY_VALUES = new Set(['open', 'closed', 'unknown']);
const PORTAL_DIRECTIONS = new Set(['both', 'forward']);

const ROOT_KEYS = new Set([
  'schemaVersion', 'packageId', 'buildingId', 'mapVersion', 'parentMapVersion',
  'name', 'state', 'validFrom', 'validTo', 'coordinateFrame', 'provenance',
  'publication', 'levels', 'floorPlans', 'spaces', 'zones', 'connectors',
  'portals', 'places', 'routeNodes', 'routeEdges', 'legacyFloorCodes',
]);
const FRAME_KEYS = new Set(['frameId', 'unit', 'originDescription', 'xAxis', 'yAxis', 'zAxis']);
const PROVENANCE_KEYS = new Set(['sourceRefs', 'review']);
const SOURCE_KEYS = new Set(['sourceId', 'kind', 'sha256', 'licence', 'permission', 'synthetic']);
const REVIEW_KEYS = new Set(['status', 'reviewedBy', 'reviewedAt']);
const PUBLICATION_KEYS = new Set(['authority', 'signed', 'contentSha256', 'publishedAt', 'publishedBy']);
const LEVEL_KEYS = new Set(['levelId', 'levelRef', 'name', 'ordinal', 'elevationM']);
const PLAN_KEYS = new Set(['planId', 'levelId', 'widthM', 'heightM', 'sourceRefId', 'shapes', 'controlPoints']);
const SHAPE_KEYS = new Set(['shapeId', 'spaceId', 'points']);
const POINT_KEYS = new Set(['xM', 'yM']);
const CONTROL_POINT_KEYS = new Set(['controlPointId', 'name', 'position', 'sourceRefId', 'uncertaintyM']);
const SPACE_KEYS = new Set([
  'spaceId', 'levelId', 'kind', 'name', 'ref', 'navigable', 'egressRequired',
  'stepFreeEgressRequired', 'nodeId',
]);
const ZONE_KEYS = new Set(['zoneId', 'levelId', 'name', 'spaceIds']);
const CONNECTOR_KEYS = new Set([
  'connectorId', 'kind', 'name', 'availability', 'emergencyUse', 'accessibility', 'landings',
]);
const LANDING_KEYS = new Set(['landingId', 'levelId', 'spaceId', 'nodeId']);
const ACCESS_KEYS = new Set(['stepFree', 'wheelchair']);
const PORTAL_KEYS = new Set([
  'portalId', 'levelId', 'kind', 'name', 'fromSpaceId', 'toSpaceId', 'direction',
  'finalExit', 'availability', 'emergencyUse', 'accessibility',
]);
const PLACE_KEYS = new Set(['placeId', 'kind', 'name', 'spaceId', 'nodeId']);
const NODE_KEYS = new Set(['nodeId', 'levelId', 'spaceId', 'kind', 'position']);
const EDGE_KEYS = new Set([
  'edgeId', 'fromNodeId', 'toNodeId', 'kind', 'bidirectional', 'distanceM',
  'durationSec', 'availability', 'emergencyUse', 'accessibility', 'connectorId', 'portalId',
]);
const LEGACY_KEYS = new Set(['levelId', 'code']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIsoTime(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/u.test(value) && Number.isFinite(Date.parse(value));
}

function issue(code: string, path: string, message: string): VenueValidationIssue {
  return { code, path, message };
}

function exactRecord(
  errors: VenueValidationIssue[],
  value: unknown,
  required: readonly string[],
  allowed: ReadonlySet<string>,
  path: string,
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    errors.push(issue('type', path, 'must be an object'));
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(issue('unexpected-field', `${path}.${key}`, 'is not allowed'));
  }
  for (const key of required) {
    if (!(key in value)) errors.push(issue('required', `${path}.${key}`, 'is required'));
  }
  return true;
}

function arrayValue(
  errors: VenueValidationIssue[],
  value: unknown,
  path: string,
  minimum = 0,
): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push(issue('type', path, 'must be an array'));
    return false;
  }
  if (value.length < minimum) errors.push(issue('minimum-items', path, `must contain at least ${minimum} item(s)`));
  return true;
}

function stableId(errors: VenueValidationIssue[], value: unknown, path: string): value is string {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) {
    errors.push(issue('stable-id', path, 'must be a lower-case stable identifier'));
    return false;
  }
  return true;
}

function text(errors: VenueValidationIssue[], value: unknown, path: string): value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 240) {
    errors.push(issue('text', path, 'must be a non-empty bounded string'));
    return false;
  }
  return true;
}

function finite(errors: VenueValidationIssue[], value: unknown, path: string): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(issue('finite-number', path, 'must be a finite number'));
    return false;
  }
  return true;
}

function positive(errors: VenueValidationIssue[], value: unknown, path: string): value is number {
  if (!finite(errors, value, path)) return false;
  if (value <= 0) {
    errors.push(issue('positive-number', path, 'must be greater than zero'));
    return false;
  }
  return true;
}

function booleanValue(errors: VenueValidationIssue[], value: unknown, path: string): value is boolean {
  if (typeof value !== 'boolean') {
    errors.push(issue('type', path, 'must be a boolean'));
    return false;
  }
  return true;
}

function enumValue(errors: VenueValidationIssue[], value: unknown, values: ReadonlySet<string>, path: string, code = 'enum') {
  if (typeof value !== 'string' || !values.has(value)) {
    errors.push(issue(code, path, `must be one of: ${[...values].join(', ')}`));
    return false;
  }
  return true;
}

function uniqueId(
  errors: VenueValidationIssue[],
  value: unknown,
  path: string,
  globalIds: Set<string>,
) {
  if (!stableId(errors, value, path)) return;
  if (globalIds.has(value)) errors.push(issue('duplicate-id', path, `${value} is duplicated`));
  globalIds.add(value);
}

function accessibility(errors: VenueValidationIssue[], value: unknown, path: string): value is AccessibilityEvidence {
  if (!exactRecord(errors, value, ['stepFree', 'wheelchair'], ACCESS_KEYS, path)) return false;
  const stepFree = enumValue(errors, value.stepFree, EVIDENCE_VALUES, `${path}.stepFree`, 'accessibility');
  const wheelchair = enumValue(errors, value.wheelchair, EVIDENCE_VALUES, `${path}.wheelchair`, 'accessibility');
  if (value.wheelchair === 'yes' && value.stepFree !== 'yes') {
    errors.push(issue('accessibility-conflict', path, 'wheelchair yes requires stepFree yes'));
  }
  return stepFree && wheelchair;
}

function point(
  errors: VenueValidationIssue[],
  value: unknown,
  path: string,
  bounds?: { widthM: number; heightM: number },
) {
  if (!exactRecord(errors, value, ['xM', 'yM'], POINT_KEYS, path)) return;
  const validX = finite(errors, value.xM, `${path}.xM`);
  const validY = finite(errors, value.yM, `${path}.yM`);
  if (bounds && validX && validY) {
    const xM = value.xM as number;
    const yM = value.yM as number;
    if (xM < 0 || yM < 0 || xM > bounds.widthM || yM > bounds.heightM) {
      errors.push(issue('plan-bounds', path, 'must fall within floor-plan bounds'));
    }
  }
}

function polygonArea(points: unknown[]) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (!isRecord(current) || !isRecord(next) || typeof current.xM !== 'number' || typeof current.yM !== 'number' ||
        typeof next.xM !== 'number' || typeof next.yM !== 'number') return 0;
    area += current.xM * next.yM - next.xM * current.yM;
  }
  return Math.abs(area / 2);
}

export function validateVenuePackage(value: unknown): VenueValidationIssue[] {
  const errors: VenueValidationIssue[] = [];
  if (!exactRecord(errors, value, [...ROOT_KEYS], ROOT_KEYS, '$')) return errors;

  if (value.schemaVersion !== VENUE_PACKAGE_SCHEMA) {
    errors.push(issue('schema-version', '$.schemaVersion', `must equal ${VENUE_PACKAGE_SCHEMA}`));
  }
  stableId(errors, value.packageId, '$.packageId');
  stableId(errors, value.buildingId, '$.buildingId');
  stableId(errors, value.mapVersion, '$.mapVersion');
  if (value.parentMapVersion !== null) stableId(errors, value.parentMapVersion, '$.parentMapVersion');
  text(errors, value.name, '$.name');
  enumValue(errors, value.state, PACKAGE_STATES, '$.state', 'package-state');
  if (!isIsoTime(value.validFrom)) errors.push(issue('time', '$.validFrom', 'must be an ISO-8601 timestamp'));
  if (value.validTo !== null && !isIsoTime(value.validTo)) errors.push(issue('time', '$.validTo', 'must be null or an ISO-8601 timestamp'));
  if (isIsoTime(value.validFrom) && isIsoTime(value.validTo) && Date.parse(value.validTo) <= Date.parse(value.validFrom)) {
    errors.push(issue('time-order', '$.validTo', 'must be after validFrom'));
  }

  if (exactRecord(errors, value.coordinateFrame, [...FRAME_KEYS], FRAME_KEYS, '$.coordinateFrame')) {
    stableId(errors, value.coordinateFrame.frameId, '$.coordinateFrame.frameId');
    if (value.coordinateFrame.unit !== 'm') errors.push(issue('coordinate-unit', '$.coordinateFrame.unit', 'must equal m'));
    for (const key of ['originDescription', 'xAxis', 'yAxis', 'zAxis']) text(errors, value.coordinateFrame[key], `$.coordinateFrame.${key}`);
    if (new Set([value.coordinateFrame.xAxis, value.coordinateFrame.yAxis, value.coordinateFrame.zAxis]).size !== 3) {
      errors.push(issue('coordinate-axis', '$.coordinateFrame', 'axis descriptions must be distinct'));
    }
  }

  const sourceIds = new Set<string>();
  if (exactRecord(errors, value.provenance, [...PROVENANCE_KEYS], PROVENANCE_KEYS, '$.provenance')) {
    if (arrayValue(errors, value.provenance.sourceRefs, '$.provenance.sourceRefs', 1)) {
      value.provenance.sourceRefs.forEach((source, index) => {
        const path = `$.provenance.sourceRefs[${index}]`;
        if (!exactRecord(errors, source, [...SOURCE_KEYS], SOURCE_KEYS, path)) return;
        if (stableId(errors, source.sourceId, `${path}.sourceId`)) {
          if (sourceIds.has(source.sourceId)) errors.push(issue('duplicate-id', `${path}.sourceId`, 'source ID is duplicated'));
          sourceIds.add(source.sourceId);
        }
        enumValue(errors, source.kind, SOURCE_KINDS, `${path}.kind`, 'source-kind');
        if (source.sha256 !== null && (typeof source.sha256 !== 'string' || !SHA256.test(source.sha256))) {
          errors.push(issue('sha256', `${path}.sha256`, 'must be null or a lower-case SHA-256 digest'));
        }
        text(errors, source.licence, `${path}.licence`);
        text(errors, source.permission, `${path}.permission`);
        booleanValue(errors, source.synthetic, `${path}.synthetic`);
      });
    }
    if (exactRecord(errors, value.provenance.review, [...REVIEW_KEYS], REVIEW_KEYS, '$.provenance.review')) {
      enumValue(errors, value.provenance.review.status, REVIEW_STATES, '$.provenance.review.status', 'review-status');
      if (value.provenance.review.reviewedBy !== null) stableId(errors, value.provenance.review.reviewedBy, '$.provenance.review.reviewedBy');
      if (value.provenance.review.reviewedAt !== null && !isIsoTime(value.provenance.review.reviewedAt)) {
        errors.push(issue('time', '$.provenance.review.reviewedAt', 'must be null or an ISO-8601 timestamp'));
      }
      if (value.provenance.review.status === 'reviewed' &&
          (value.provenance.review.reviewedBy === null || value.provenance.review.reviewedAt === null)) {
        errors.push(issue('review-evidence', '$.provenance.review', 'reviewed state requires reviewer and review time'));
      }
    }
  }

  if (exactRecord(errors, value.publication, [...PUBLICATION_KEYS], PUBLICATION_KEYS, '$.publication')) {
    enumValue(errors, value.publication.authority, AUTHORITIES, '$.publication.authority', 'authority');
    booleanValue(errors, value.publication.signed, '$.publication.signed');
    if (value.publication.contentSha256 !== null &&
        (typeof value.publication.contentSha256 !== 'string' || !SHA256.test(value.publication.contentSha256))) {
      errors.push(issue('sha256', '$.publication.contentSha256', 'must be null or a lower-case SHA-256 digest'));
    }
    if (value.publication.publishedAt !== null && !isIsoTime(value.publication.publishedAt)) {
      errors.push(issue('time', '$.publication.publishedAt', 'must be null or an ISO-8601 timestamp'));
    }
    if (value.publication.publishedBy !== null) stableId(errors, value.publication.publishedBy, '$.publication.publishedBy');
    if (value.state === 'draft') {
      if (value.publication.signed || value.publication.contentSha256 !== null || value.publication.publishedAt !== null ||
          value.publication.publishedBy !== null || value.publication.authority !== 'browser-local') {
        errors.push(issue('draft-publication', '$.publication', 'draft must be unsigned browser-local state without publication evidence'));
      }
    }
    if (value.state === 'local-demo') {
      if (value.publication.authority !== 'browser-local' || value.publication.signed ||
          value.publication.contentSha256 !== null || value.publication.publishedAt === null || value.publication.publishedBy === null) {
        errors.push(issue('local-demo-publication', '$.publication', 'local demo must be unsigned browser-local state with actor and time'));
      }
    }
    if (value.state === 'published') {
      if (value.publication.authority === 'browser-local' || !value.publication.signed ||
          value.publication.contentSha256 === null || value.publication.publishedAt === null || value.publication.publishedBy === null) {
        errors.push(issue('published-evidence', '$.publication', 'published state requires non-browser authority, signature flag, digest, actor and time'));
      }
      if (!isRecord(value.provenance) || !isRecord(value.provenance.review) || value.provenance.review.status !== 'reviewed') {
        errors.push(issue('published-review', '$.provenance.review', 'published state requires reviewed provenance'));
      }
    }
  }

  const collectionFields: Array<[string, number]> = [
    ['levels', 1], ['floorPlans', 1], ['spaces', 1], ['zones', 1], ['connectors', 1],
    ['portals', 1], ['places', 1], ['routeNodes', 2], ['routeEdges', 1], ['legacyFloorCodes', 1],
  ];
  for (const [field, minimum] of collectionFields) arrayValue(errors, value[field], `$.${field}`, minimum);

  const globalIds = new Set<string>();
  const levels = new Map<string, Record<string, unknown>>();
  const plans = new Map<string, Record<string, unknown>>();
  const spaces = new Map<string, Record<string, unknown>>();
  const connectors = new Map<string, Record<string, unknown>>();
  const portals = new Map<string, Record<string, unknown>>();
  const nodes = new Map<string, Record<string, unknown>>();
  const placeOwners = new Map<string, { spaceId: string; nodeId: string }>();
  const sourceRefValues = sourceIds;
  const ordinals = new Set<number>();

  if (Array.isArray(value.levels)) value.levels.forEach((level, index) => {
    const path = `$.levels[${index}]`;
    if (!exactRecord(errors, level, [...LEVEL_KEYS], LEVEL_KEYS, path)) return;
    uniqueId(errors, level.levelId, `${path}.levelId`, globalIds);
    if (typeof level.levelId === 'string') levels.set(level.levelId, level);
    text(errors, level.levelRef, `${path}.levelRef`);
    text(errors, level.name, `${path}.name`);
    if (!Number.isSafeInteger(level.ordinal)) errors.push(issue('ordinal', `${path}.ordinal`, 'must be a safe integer'));
    else if (ordinals.has(level.ordinal as number)) errors.push(issue('duplicate-ordinal', `${path}.ordinal`, 'must be unique'));
    else ordinals.add(level.ordinal as number);
    finite(errors, level.elevationM, `${path}.elevationM`);
  });

  const planByLevel = new Map<string, string>();
  const shapedSpaces = new Set<string>();
  if (Array.isArray(value.floorPlans)) value.floorPlans.forEach((plan, index) => {
    const path = `$.floorPlans[${index}]`;
    if (!exactRecord(errors, plan, [...PLAN_KEYS], PLAN_KEYS, path)) return;
    uniqueId(errors, plan.planId, `${path}.planId`, globalIds);
    if (typeof plan.planId === 'string') plans.set(plan.planId, plan);
    stableId(errors, plan.levelId, `${path}.levelId`);
    if (typeof plan.levelId === 'string') {
      if (!levels.has(plan.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
      if (planByLevel.has(plan.levelId)) errors.push(issue('duplicate-level-plan', `${path}.levelId`, 'level has more than one floor plan'));
      planByLevel.set(plan.levelId, String(plan.planId));
    }
    const widthValid = positive(errors, plan.widthM, `${path}.widthM`);
    const heightValid = positive(errors, plan.heightM, `${path}.heightM`);
    stableId(errors, plan.sourceRefId, `${path}.sourceRefId`);
    if (typeof plan.sourceRefId === 'string' && !sourceRefValues.has(plan.sourceRefId)) {
      errors.push(issue('unknown-source', `${path}.sourceRefId`, 'does not reference provenance'));
    }
    const bounds = widthValid && heightValid ? { widthM: plan.widthM as number, heightM: plan.heightM as number } : undefined;
    if (arrayValue(errors, plan.shapes, `${path}.shapes`, 1)) plan.shapes.forEach((shape, shapeIndex) => {
      const shapePath = `${path}.shapes[${shapeIndex}]`;
      if (!exactRecord(errors, shape, [...SHAPE_KEYS], SHAPE_KEYS, shapePath)) return;
      uniqueId(errors, shape.shapeId, `${shapePath}.shapeId`, globalIds);
      stableId(errors, shape.spaceId, `${shapePath}.spaceId`);
      if (typeof shape.spaceId === 'string') {
        if (shapedSpaces.has(shape.spaceId)) errors.push(issue('duplicate-space-shape', `${shapePath}.spaceId`, 'space has more than one shape'));
        shapedSpaces.add(shape.spaceId);
      }
      if (arrayValue(errors, shape.points, `${shapePath}.points`, 3)) {
        shape.points.forEach((candidate, pointIndex) => point(errors, candidate, `${shapePath}.points[${pointIndex}]`, bounds));
        if (polygonArea(shape.points) <= 0.000001) errors.push(issue('polygon-area', `${shapePath}.points`, 'polygon must have non-zero area'));
      }
    });
    if (arrayValue(errors, plan.controlPoints, `${path}.controlPoints`)) plan.controlPoints.forEach((control, controlIndex) => {
      const controlPath = `${path}.controlPoints[${controlIndex}]`;
      if (!exactRecord(errors, control, [...CONTROL_POINT_KEYS], CONTROL_POINT_KEYS, controlPath)) return;
      uniqueId(errors, control.controlPointId, `${controlPath}.controlPointId`, globalIds);
      text(errors, control.name, `${controlPath}.name`);
      point(errors, control.position, `${controlPath}.position`, bounds);
      stableId(errors, control.sourceRefId, `${controlPath}.sourceRefId`);
      if (typeof control.sourceRefId === 'string' && !sourceRefValues.has(control.sourceRefId)) {
        errors.push(issue('unknown-source', `${controlPath}.sourceRefId`, 'does not reference provenance'));
      }
      if (finite(errors, control.uncertaintyM, `${controlPath}.uncertaintyM`) && (control.uncertaintyM as number) < 0) {
        errors.push(issue('uncertainty', `${controlPath}.uncertaintyM`, 'must be non-negative'));
      }
    });
  });
  for (const levelId of levels.keys()) {
    if (!planByLevel.has(levelId)) errors.push(issue('missing-level-plan', `$.floorPlans.${levelId}`, 'every level requires one floor plan'));
  }

  if (Array.isArray(value.spaces)) value.spaces.forEach((space, index) => {
    const path = `$.spaces[${index}]`;
    if (!exactRecord(errors, space, [...SPACE_KEYS], SPACE_KEYS, path)) return;
    uniqueId(errors, space.spaceId, `${path}.spaceId`, globalIds);
    if (typeof space.spaceId === 'string') spaces.set(space.spaceId, space);
    stableId(errors, space.levelId, `${path}.levelId`);
    if (typeof space.levelId === 'string' && !levels.has(space.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
    enumValue(errors, space.kind, SPACE_KINDS, `${path}.kind`, 'space-kind');
    text(errors, space.name, `${path}.name`);
    if (space.ref !== null) text(errors, space.ref, `${path}.ref`);
    booleanValue(errors, space.navigable, `${path}.navigable`);
    booleanValue(errors, space.egressRequired, `${path}.egressRequired`);
    booleanValue(errors, space.stepFreeEgressRequired, `${path}.stepFreeEgressRequired`);
    if (space.nodeId !== null) stableId(errors, space.nodeId, `${path}.nodeId`);
    if (space.navigable === true && space.nodeId === null) errors.push(issue('space-node', `${path}.nodeId`, 'navigable space requires a primary route node'));
    if (space.navigable === false && space.nodeId !== null) errors.push(issue('space-node', `${path}.nodeId`, 'non-navigable space cannot have a primary route node'));
    if (space.kind === 'void' && space.navigable === true) errors.push(issue('void-navigable', path, 'void cannot be navigable'));
    if (space.egressRequired === true && space.navigable !== true) errors.push(issue('egress-space', path, 'egress-required space must be navigable'));
    if (space.stepFreeEgressRequired === true && space.egressRequired !== true) errors.push(issue('step-free-egress', path, 'step-free egress implies egress required'));
  });

  for (const plan of plans.values()) {
    if (!Array.isArray(plan.shapes)) continue;
    for (const shape of plan.shapes) {
      if (!isRecord(shape) || typeof shape.spaceId !== 'string') continue;
      const space = spaces.get(shape.spaceId);
      if (!space) errors.push(issue('unknown-space', `$.floorPlans.${String(plan.planId)}.shapes.${String(shape.shapeId)}.spaceId`, 'does not reference a space'));
      else if (space.levelId !== plan.levelId) errors.push(issue('shape-level', `$.floorPlans.${String(plan.planId)}.shapes.${String(shape.shapeId)}`, 'shape and space levels must agree'));
    }
  }
  for (const [spaceId, space] of spaces) {
    if (space.kind !== 'outdoor' && !shapedSpaces.has(spaceId)) errors.push(issue('missing-space-shape', `$.spaces.${spaceId}`, 'indoor space requires plan geometry'));
  }

  if (Array.isArray(value.zones)) value.zones.forEach((zone, index) => {
    const path = `$.zones[${index}]`;
    if (!exactRecord(errors, zone, [...ZONE_KEYS], ZONE_KEYS, path)) return;
    uniqueId(errors, zone.zoneId, `${path}.zoneId`, globalIds);
    stableId(errors, zone.levelId, `${path}.levelId`);
    text(errors, zone.name, `${path}.name`);
    const seen = new Set<string>();
    if (arrayValue(errors, zone.spaceIds, `${path}.spaceIds`, 1)) zone.spaceIds.forEach((spaceId, spaceIndex) => {
      const refPath = `${path}.spaceIds[${spaceIndex}]`;
      if (!stableId(errors, spaceId, refPath)) return;
      if (seen.has(spaceId)) errors.push(issue('duplicate-reference', refPath, 'space reference is duplicated'));
      seen.add(spaceId);
      const space = spaces.get(spaceId);
      if (!space) errors.push(issue('unknown-space', refPath, 'does not reference a space'));
      else if (space.levelId !== zone.levelId) errors.push(issue('multi-level-zone', refPath, 'zone and space levels must agree'));
      else if (space.navigable !== true) errors.push(issue('zone-space', refPath, 'zone space must be navigable'));
    });
  });

  const landingOwners = new Map<string, { connectorId: string; levelId: string; spaceId: string; nodeId: string }>();
  if (Array.isArray(value.connectors)) value.connectors.forEach((connector, index) => {
    const path = `$.connectors[${index}]`;
    if (!exactRecord(errors, connector, [...CONNECTOR_KEYS], CONNECTOR_KEYS, path)) return;
    uniqueId(errors, connector.connectorId, `${path}.connectorId`, globalIds);
    if (typeof connector.connectorId === 'string') connectors.set(connector.connectorId, connector);
    enumValue(errors, connector.kind, CONNECTOR_KINDS, `${path}.kind`, 'connector-kind');
    text(errors, connector.name, `${path}.name`);
    enumValue(errors, connector.availability, AVAILABILITY_VALUES, `${path}.availability`, 'availability');
    booleanValue(errors, connector.emergencyUse, `${path}.emergencyUse`);
    accessibility(errors, connector.accessibility, `${path}.accessibility`);
    const landingLevels = new Set<string>();
    if (arrayValue(errors, connector.landings, `${path}.landings`, 2)) connector.landings.forEach((landing, landingIndex) => {
      const landingPath = `${path}.landings[${landingIndex}]`;
      if (!exactRecord(errors, landing, [...LANDING_KEYS], LANDING_KEYS, landingPath)) return;
      uniqueId(errors, landing.landingId, `${landingPath}.landingId`, globalIds);
      for (const field of ['levelId', 'spaceId', 'nodeId']) stableId(errors, landing[field], `${landingPath}.${field}`);
      if (typeof landing.levelId === 'string') {
        if (landingLevels.has(landing.levelId)) errors.push(issue('duplicate-landing-level', `${landingPath}.levelId`, 'connector may have one landing per level'));
        landingLevels.add(landing.levelId);
      }
      const space = typeof landing.spaceId === 'string' ? spaces.get(landing.spaceId) : undefined;
      if (typeof landing.levelId === 'string' && !levels.has(landing.levelId)) errors.push(issue('unknown-level', `${landingPath}.levelId`, 'does not reference a level'));
      if (!space) errors.push(issue('unknown-space', `${landingPath}.spaceId`, 'does not reference a space'));
      else if (space.levelId !== landing.levelId) errors.push(issue('landing-level', landingPath, 'landing space and level must agree'));
      if (typeof landing.landingId === 'string' && typeof connector.connectorId === 'string' &&
          typeof landing.levelId === 'string' && typeof landing.spaceId === 'string' && typeof landing.nodeId === 'string') {
        landingOwners.set(landing.landingId, {
          connectorId: connector.connectorId,
          levelId: landing.levelId,
          spaceId: landing.spaceId,
          nodeId: landing.nodeId,
        });
      }
    });
  });

  if (Array.isArray(value.portals)) value.portals.forEach((portal, index) => {
    const path = `$.portals[${index}]`;
    if (!exactRecord(errors, portal, [...PORTAL_KEYS], PORTAL_KEYS, path)) return;
    uniqueId(errors, portal.portalId, `${path}.portalId`, globalIds);
    if (typeof portal.portalId === 'string') portals.set(portal.portalId, portal);
    for (const field of ['levelId', 'fromSpaceId', 'toSpaceId']) stableId(errors, portal[field], `${path}.${field}`);
    enumValue(errors, portal.kind, PORTAL_KINDS, `${path}.kind`, 'portal-kind');
    text(errors, portal.name, `${path}.name`);
    enumValue(errors, portal.direction, PORTAL_DIRECTIONS, `${path}.direction`, 'portal-direction');
    booleanValue(errors, portal.finalExit, `${path}.finalExit`);
    enumValue(errors, portal.availability, AVAILABILITY_VALUES, `${path}.availability`, 'availability');
    booleanValue(errors, portal.emergencyUse, `${path}.emergencyUse`);
    accessibility(errors, portal.accessibility, `${path}.accessibility`);
    const from = typeof portal.fromSpaceId === 'string' ? spaces.get(portal.fromSpaceId) : undefined;
    const to = typeof portal.toSpaceId === 'string' ? spaces.get(portal.toSpaceId) : undefined;
    if (typeof portal.levelId === 'string' && !levels.has(portal.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
    if (!from) errors.push(issue('unknown-space', `${path}.fromSpaceId`, 'does not reference a space'));
    if (!to) errors.push(issue('unknown-space', `${path}.toSpaceId`, 'does not reference a space'));
    if (from && from.levelId !== portal.levelId) errors.push(issue('portal-level', `${path}.fromSpaceId`, 'from space must be on portal level'));
    if (to && to.levelId !== portal.levelId) errors.push(issue('portal-level', `${path}.toSpaceId`, 'to space must be on portal level'));
    if (portal.fromSpaceId === portal.toSpaceId) errors.push(issue('portal-space', path, 'portal must connect distinct spaces'));
    if (portal.finalExit === true && from && to && (from.kind === 'outdoor' || to.kind !== 'outdoor')) {
      errors.push(issue('final-exit', path, 'final exit must lead from indoor to outdoor space'));
    }
    if (portal.finalExit === false && from && to && (from.kind === 'outdoor' || to.kind === 'outdoor')) {
      errors.push(issue('outdoor-portal', path, 'indoor/outdoor portal must be a final exit'));
    }
  });

  if (Array.isArray(value.places)) value.places.forEach((place, index) => {
    const path = `$.places[${index}]`;
    if (!exactRecord(errors, place, [...PLACE_KEYS], PLACE_KEYS, path)) return;
    uniqueId(errors, place.placeId, `${path}.placeId`, globalIds);
    for (const field of ['spaceId', 'nodeId']) stableId(errors, place[field], `${path}.${field}`);
    enumValue(errors, place.kind, PLACE_KINDS, `${path}.kind`, 'place-kind');
    text(errors, place.name, `${path}.name`);
    const space = typeof place.spaceId === 'string' ? spaces.get(place.spaceId) : undefined;
    if (!space) errors.push(issue('unknown-space', `${path}.spaceId`, 'does not reference a space'));
    else if (space.navigable !== true) errors.push(issue('place-space', path, 'place requires navigable space'));
    if (place.kind === 'assembly' && space?.kind !== 'outdoor') errors.push(issue('assembly-space', path, 'assembly place must be outdoors'));
    if (typeof place.placeId === 'string' && typeof place.spaceId === 'string' && typeof place.nodeId === 'string') {
      placeOwners.set(place.placeId, { spaceId: place.spaceId, nodeId: place.nodeId });
    }
  });

  if (Array.isArray(value.routeNodes)) value.routeNodes.forEach((node, index) => {
    const path = `$.routeNodes[${index}]`;
    if (!exactRecord(errors, node, [...NODE_KEYS], NODE_KEYS, path)) return;
    uniqueId(errors, node.nodeId, `${path}.nodeId`, globalIds);
    if (typeof node.nodeId === 'string') nodes.set(node.nodeId, node);
    for (const field of ['levelId', 'spaceId']) stableId(errors, node[field], `${path}.${field}`);
    enumValue(errors, node.kind, NODE_KINDS, `${path}.kind`, 'node-kind');
    const space = typeof node.spaceId === 'string' ? spaces.get(node.spaceId) : undefined;
    if (typeof node.levelId === 'string' && !levels.has(node.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference a level'));
    if (!space) errors.push(issue('unknown-space', `${path}.spaceId`, 'does not reference a space'));
    else if (space.levelId !== node.levelId) errors.push(issue('node-level', path, 'node and space levels must agree'));
    else if (space.navigable !== true) errors.push(issue('node-space', path, 'route node requires navigable space'));
    point(errors, node.position, `${path}.position`);
  });

  for (const [spaceId, space] of spaces) {
    if (space.navigable !== true) continue;
    const node = typeof space.nodeId === 'string' ? nodes.get(space.nodeId) : undefined;
    if (!node) errors.push(issue('unknown-node', `$.spaces.${spaceId}.nodeId`, 'primary node does not exist'));
    else if (node.spaceId !== spaceId || node.levelId !== space.levelId) errors.push(issue('space-node-mismatch', `$.spaces.${spaceId}.nodeId`, 'primary node must belong to space and level'));
  }
  for (const [landingId, landing] of landingOwners) {
    const node = nodes.get(landing.nodeId);
    if (!node) errors.push(issue('unknown-node', `$.connectors.${landing.connectorId}.${landingId}.nodeId`, 'landing node does not exist'));
    else if (node.kind !== 'landing' || node.levelId !== landing.levelId || node.spaceId !== landing.spaceId) {
      errors.push(issue('landing-node-mismatch', `$.connectors.${landing.connectorId}.${landingId}`, 'landing node must match connector landing'));
    }
  }
  for (const [placeId, place] of placeOwners) {
    const node = nodes.get(place.nodeId);
    if (!node) errors.push(issue('unknown-node', `$.places.${placeId}.nodeId`, 'place node does not exist'));
    else if (node.kind !== 'place' || node.spaceId !== place.spaceId) {
      errors.push(issue('place-node-mismatch', `$.places.${placeId}.nodeId`, 'place node must be a place-kind node in the referenced space'));
    }
  }

  const portalEdgeCount = new Map<string, number>();
  const landingNodeUse = new Set<string>();
  const spaceEdgeUse = new Set<string>();
  if (Array.isArray(value.routeEdges)) value.routeEdges.forEach((edge, index) => {
    const path = `$.routeEdges[${index}]`;
    if (!exactRecord(errors, edge, [...EDGE_KEYS], EDGE_KEYS, path)) return;
    uniqueId(errors, edge.edgeId, `${path}.edgeId`, globalIds);
    for (const field of ['fromNodeId', 'toNodeId']) stableId(errors, edge[field], `${path}.${field}`);
    enumValue(errors, edge.kind, EDGE_KINDS, `${path}.kind`, 'edge-kind');
    booleanValue(errors, edge.bidirectional, `${path}.bidirectional`);
    positive(errors, edge.distanceM, `${path}.distanceM`);
    positive(errors, edge.durationSec, `${path}.durationSec`);
    enumValue(errors, edge.availability, AVAILABILITY_VALUES, `${path}.availability`, 'availability');
    booleanValue(errors, edge.emergencyUse, `${path}.emergencyUse`);
    accessibility(errors, edge.accessibility, `${path}.accessibility`);
    if (edge.connectorId !== null) stableId(errors, edge.connectorId, `${path}.connectorId`);
    if (edge.portalId !== null) stableId(errors, edge.portalId, `${path}.portalId`);
    const from = typeof edge.fromNodeId === 'string' ? nodes.get(edge.fromNodeId) : undefined;
    const to = typeof edge.toNodeId === 'string' ? nodes.get(edge.toNodeId) : undefined;
    if (!from) errors.push(issue('unknown-node', `${path}.fromNodeId`, 'does not reference a route node'));
    if (!to) errors.push(issue('unknown-node', `${path}.toNodeId`, 'does not reference a route node'));
    if (edge.fromNodeId === edge.toNodeId) errors.push(issue('edge-loop', path, 'edge endpoints must differ'));
    if (!from || !to) return;
    if (typeof from.spaceId === 'string') spaceEdgeUse.add(from.spaceId);
    if (typeof to.spaceId === 'string') spaceEdgeUse.add(to.spaceId);

    if (typeof edge.kind === 'string' && CONNECTOR_EDGE_KINDS.has(edge.kind)) {
      if (edge.portalId !== null) errors.push(issue('connector-edge', `${path}.portalId`, 'connector edge cannot reference portal'));
      const connector = typeof edge.connectorId === 'string' ? connectors.get(edge.connectorId) : undefined;
      if (!connector) errors.push(issue('unknown-connector', `${path}.connectorId`, 'does not reference connector'));
      else {
        if (connector.kind !== edge.kind) errors.push(issue('connector-kind', path, 'edge kind must match connector kind'));
        const landings = Array.isArray(connector.landings) ? connector.landings.filter(isRecord) : [];
        const fromLanding = landings.find((candidate) => candidate.nodeId === edge.fromNodeId);
        const toLanding = landings.find((candidate) => candidate.nodeId === edge.toNodeId);
        if (!fromLanding || !toLanding) errors.push(issue('connector-landing', path, 'edge endpoints must be connector landings'));
        else {
          landingNodeUse.add(String(fromLanding.nodeId));
          landingNodeUse.add(String(toLanding.nodeId));
        }
      }
      if (from.levelId === to.levelId) errors.push(issue('connector-level', path, 'connector traversal must change level'));
    } else if (edge.kind === 'walk') {
      if (edge.connectorId !== null || edge.portalId !== null) errors.push(issue('walk-reference', path, 'walk cannot reference connector or portal'));
      if (from.levelId !== to.levelId) errors.push(issue('cross-level-edge', path, 'walk cannot cross levels'));
      if (from.spaceId !== to.spaceId) errors.push(issue('walk-space', path, 'walk must stay within one space'));
    } else {
      if (edge.connectorId !== null) errors.push(issue('portal-edge', `${path}.connectorId`, 'portal edge cannot reference connector'));
      const portal = typeof edge.portalId === 'string' ? portals.get(edge.portalId) : undefined;
      if (!portal) errors.push(issue('unknown-portal', `${path}.portalId`, 'does not reference portal'));
      else {
        portalEdgeCount.set(String(portal.portalId), (portalEdgeCount.get(String(portal.portalId)) ?? 0) + 1);
        const expectedKind = portal.finalExit === true ? 'exit' : 'door';
        if (edge.kind !== expectedKind) errors.push(issue('portal-edge-kind', path, `edge kind must be ${expectedKind}`));
        if (from.spaceId !== portal.fromSpaceId || to.spaceId !== portal.toSpaceId) errors.push(issue('portal-node-space', path, 'edge orientation must match portal spaces'));
        if ((portal.direction === 'both') !== edge.bidirectional) errors.push(issue('portal-direction', path, 'edge bidirectionality must match portal'));
      }
      if (from.levelId !== to.levelId) errors.push(issue('cross-level-edge', path, 'door/exit cannot cross levels'));
    }
  });

  for (const portalId of portals.keys()) {
    if (portalEdgeCount.get(portalId) !== 1) errors.push(issue('portal-edge-count', `$.portals.${portalId}`, 'portal requires exactly one traversal edge'));
  }
  for (const landing of landingOwners.values()) {
    if (!landingNodeUse.has(landing.nodeId)) errors.push(issue('orphan-landing', `$.connectors.${landing.connectorId}.${landing.nodeId}`, 'landing must participate in connector traversal'));
  }
  for (const [spaceId, space] of spaces) {
    if (space.navigable === true && !spaceEdgeUse.has(spaceId)) errors.push(issue('orphan-space', `$.spaces.${spaceId}`, 'navigable space must participate in route edge'));
  }

  const codesByLevel = new Map<string, number>();
  const levelsByCode = new Map<number, string>();
  if (Array.isArray(value.legacyFloorCodes)) value.legacyFloorCodes.forEach((entry, index) => {
    const path = `$.legacyFloorCodes[${index}]`;
    if (!exactRecord(errors, entry, [...LEGACY_KEYS], LEGACY_KEYS, path)) return;
    stableId(errors, entry.levelId, `${path}.levelId`);
    if (typeof entry.levelId === 'string' && !levels.has(entry.levelId)) errors.push(issue('unknown-level', `${path}.levelId`, 'does not reference level'));
    if (!Number.isSafeInteger(entry.code) || (entry.code as number) < -64 || (entry.code as number) > 63) {
      errors.push(issue('wire-floor-code', `${path}.code`, 'must be integer in -64..63'));
      return;
    }
    if (codesByLevel.has(entry.levelId as string)) errors.push(issue('duplicate-wire-level', `${path}.levelId`, 'level has multiple wire codes'));
    if (levelsByCode.has(entry.code as number)) errors.push(issue('duplicate-wire-code', `${path}.code`, 'wire code must be unique'));
    codesByLevel.set(entry.levelId as string, entry.code as number);
    levelsByCode.set(entry.code as number, entry.levelId as string);
  });
  for (const levelId of levels.keys()) {
    if (!codesByLevel.has(levelId)) errors.push(issue('missing-wire-code', `$.legacyFloorCodes.${levelId}`, 'level requires explicit wire code'));
  }

  return errors.sort((left, right) =>
    left.path.localeCompare(right.path) || left.code.localeCompare(right.code) || left.message.localeCompare(right.message));
}

export function assertVenuePackage(value: unknown): asserts value is VenuePackage {
  const errors = validateVenuePackage(value);
  if (errors.length > 0) throw new VenueValidationError(errors);
}

export class VenueValidationError extends Error {
  readonly issues: readonly VenueValidationIssue[];

  constructor(issues: readonly VenueValidationIssue[]) {
    super(`venue package failed validation with ${issues.length} issue(s)`);
    this.name = 'VenueValidationError';
    this.issues = issues;
  }
}
