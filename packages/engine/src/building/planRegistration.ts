import type {
  PlanControlPoint,
  PlanPoint,
  SpaceShape,
  VenuePackage,
  VenueSourceReference,
} from './types';
import { assertVenuePackage } from './validation';
import { forkVenueDraft } from './venuePackage';

export const PLAN_IMPORT_SCHEMA = 'loc8.plan-import.v1' as const;
export const PLAN_REGISTRATION_RECEIPT_SCHEMA = 'loc8.plan-registration-receipt.v1' as const;
export const PLAN_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const PLAN_REGISTRATION_MAX_RMS_M = 0.25;
export const PLAN_REGISTRATION_MAX_RESIDUAL_M = 0.5;

const STABLE_ID = /^[a-z][a-z0-9._-]{2,95}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const ROOT_KEYS = new Set(['schemaVersion', 'importId', 'evidenceClass', 'packageId', 'buildingId', 'mapVersion', 'levelId', 'targetFrameId', 'sourceFrame', 'sourceRef', 'controlPoints', 'shapes']);
const SOURCE_FRAME_KEYS = new Set(['frameId', 'unit', 'widthPx', 'heightPx']);
const SOURCE_REF_KEYS = new Set(['sourceId', 'kind', 'sha256', 'licence', 'permission', 'synthetic']);
const CONTROL_KEYS = new Set(['controlPointId', 'name', 'source', 'target', 'uncertaintyM']);
const SOURCE_POINT_KEYS = new Set(['xPx', 'yPx']);
const TARGET_POINT_KEYS = new Set(['xM', 'yM']);
const SHAPE_KEYS = new Set(['shapeId', 'spaceId', 'points']);
const SOURCE_KINDS = new Set(['synthetic', 'plan', 'survey', 'scan', 'import', 'operator']);
const EVIDENCE_CLASSES = new Set(['synthetic', 'operator-unverified']);
const BOUNDS_EPSILON = 1e-7;

export type PlanImportEvidenceClass = 'synthetic' | 'operator-unverified';

export interface SourcePixelPoint {
  xPx: number;
  yPx: number;
}

export interface PlanImportControlPoint {
  controlPointId: string;
  name: string;
  source: SourcePixelPoint;
  target: PlanPoint;
  uncertaintyM: number;
}

export interface PlanImportShape {
  shapeId: string;
  spaceId: string;
  points: SourcePixelPoint[];
}

export interface PlanImportBundle {
  schemaVersion: typeof PLAN_IMPORT_SCHEMA;
  importId: string;
  evidenceClass: PlanImportEvidenceClass;
  packageId: string;
  buildingId: string;
  mapVersion: string;
  levelId: string;
  targetFrameId: string;
  sourceFrame: {
    frameId: string;
    unit: 'px';
    widthPx: number;
    heightPx: number;
  };
  sourceRef: VenueSourceReference;
  controlPoints: PlanImportControlPoint[];
  shapes: PlanImportShape[];
}

export interface PlanImportIssue {
  code: string;
  path: string;
  message: string;
}

export interface PlanSimilarityTransform {
  scaleMPerPx: number;
  rotationDeg: number;
  translateXM: number;
  translateYM: number;
}

export interface PlanControlPointResidual {
  controlPointId: string;
  residualM: number;
}

export interface PlanRegistrationReceipt {
  schemaVersion: typeof PLAN_REGISTRATION_RECEIPT_SCHEMA;
  evidenceClass: PlanImportEvidenceClass;
  importId: string;
  sourceFrameId: string;
  targetFrameId: string;
  sourcePackageId: string;
  sourceMapVersion: string;
  resultingPackageId: string;
  resultingMapVersion: string;
  levelId: string;
  sourceRefId: string;
  transform: PlanSimilarityTransform;
  rmsResidualM: number;
  maxResidualM: number;
  controlPointResiduals: PlanControlPointResidual[];
  transformedShapeCount: number;
}

export interface EvaluatedPlanRegistration {
  transform: PlanSimilarityTransform;
  rmsResidualM: number;
  maxResidualM: number;
  controlPointResiduals: PlanControlPointResidual[];
  transformedShapes: SpaceShape[];
}

export interface RegisterPlanImportOptions {
  successor?: {
    packageId: string;
    mapVersion: string;
    validFrom: string;
  };
}

export interface RegisteredPlanImport {
  venue: VenuePackage;
  receipt: Readonly<PlanRegistrationReceipt>;
}

export class PlanRegistrationError extends Error {
  readonly issues: readonly PlanImportIssue[];

  constructor(issues: readonly PlanImportIssue[]) {
    super(`plan import failed with ${issues.length} issue(s)`);
    this.name = 'PlanRegistrationError';
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return value;
}

function issue(code: string, path: string, message: string): PlanImportIssue {
  return { code, path, message };
}

function exactObject(errors: PlanImportIssue[], value: unknown, keys: ReadonlySet<string>, path: string): value is Record<string, unknown> {
  if (!isRecord(value)) {
    errors.push(issue('type', path, 'must be an object'));
    return false;
  }
  for (const key of keys) if (!(key in value)) errors.push(issue('required', `${path}.${key}`, 'is required'));
  for (const key of Object.keys(value)) if (!keys.has(key)) errors.push(issue('unexpected-field', `${path}.${key}`, 'is not allowed'));
  return true;
}

function stableId(errors: PlanImportIssue[], value: unknown, path: string): value is string {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) {
    errors.push(issue('stable-id', path, 'must be a lower-case stable identifier'));
    return false;
  }
  return true;
}

function boundedText(errors: PlanImportIssue[], value: unknown, path: string): value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 240) {
    errors.push(issue('text', path, 'must be a non-empty bounded string'));
    return false;
  }
  return true;
}

function boundedNumber(errors: PlanImportIssue[], value: unknown, path: string, minimum: number, maximum: number): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(issue('finite-number', path, 'must be a finite number'));
    return false;
  }
  if (value < minimum || value > maximum) {
    errors.push(issue('number-range', path, `must be within ${minimum}..${maximum}`));
    return false;
  }
  return true;
}

function validateSourcePoint(errors: PlanImportIssue[], value: unknown, path: string, widthPx: number, heightPx: number) {
  if (!exactObject(errors, value, SOURCE_POINT_KEYS, path)) return;
  boundedNumber(errors, value.xPx, `${path}.xPx`, 0, widthPx);
  boundedNumber(errors, value.yPx, `${path}.yPx`, 0, heightPx);
}

function validateTargetPoint(errors: PlanImportIssue[], value: unknown, path: string, widthM: number, heightM: number) {
  if (!exactObject(errors, value, TARGET_POINT_KEYS, path)) return;
  boundedNumber(errors, value.xM, `${path}.xM`, 0, widthM);
  boundedNumber(errors, value.yM, `${path}.yM`, 0, heightM);
}

function polygonArea(points: readonly PlanPoint[]) {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.xM * next.yM - next.xM * point.yM;
  }, 0) / 2);
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validatePlanImportBundle(value: unknown, venue: VenuePackage): PlanImportIssue[] {
  const errors: PlanImportIssue[] = [];
  assertVenuePackage(venue);
  if (!exactObject(errors, value, ROOT_KEYS, '$')) return errors;

  if (value.schemaVersion !== PLAN_IMPORT_SCHEMA) errors.push(issue('schema-version', '$.schemaVersion', `must equal ${PLAN_IMPORT_SCHEMA}`));
  stableId(errors, value.importId, '$.importId');
  if (typeof value.evidenceClass !== 'string' || !EVIDENCE_CLASSES.has(value.evidenceClass)) errors.push(issue('evidence-class', '$.evidenceClass', 'must be synthetic or operator-unverified'));
  for (const key of ['packageId', 'buildingId', 'mapVersion', 'levelId', 'targetFrameId']) stableId(errors, value[key], `$.${key}`);
  if (value.packageId !== venue.packageId) errors.push(issue('package-mismatch', '$.packageId', 'must match the current venue package'));
  if (value.buildingId !== venue.buildingId) errors.push(issue('building-mismatch', '$.buildingId', 'must match the current venue building'));
  if (value.mapVersion !== venue.mapVersion) errors.push(issue('map-version-mismatch', '$.mapVersion', 'must match the current venue map version'));
  if (value.targetFrameId !== venue.coordinateFrame.frameId) errors.push(issue('target-frame-mismatch', '$.targetFrameId', 'must match the venue coordinate frame'));

  const plan = venue.floorPlans.find((candidate) => candidate.levelId === value.levelId);
  if (!plan) errors.push(issue('unknown-level', '$.levelId', 'must identify a level with a floor plan'));
  const widthM = plan?.widthM ?? 0;
  const heightM = plan?.heightM ?? 0;

  let sourceWidth = 0;
  let sourceHeight = 0;
  if (exactObject(errors, value.sourceFrame, SOURCE_FRAME_KEYS, '$.sourceFrame')) {
    stableId(errors, value.sourceFrame.frameId, '$.sourceFrame.frameId');
    if (value.sourceFrame.unit !== 'px') errors.push(issue('source-unit', '$.sourceFrame.unit', 'must equal px'));
    if (boundedNumber(errors, value.sourceFrame.widthPx, '$.sourceFrame.widthPx', 1, 100_000)) sourceWidth = value.sourceFrame.widthPx;
    if (boundedNumber(errors, value.sourceFrame.heightPx, '$.sourceFrame.heightPx', 1, 100_000)) sourceHeight = value.sourceFrame.heightPx;
    if (value.sourceFrame.frameId === value.targetFrameId) errors.push(issue('frame-identity', '$.sourceFrame.frameId', 'source and target frames must be distinct'));
  }

  if (exactObject(errors, value.sourceRef, SOURCE_REF_KEYS, '$.sourceRef')) {
    const sourceRef = value.sourceRef;
    stableId(errors, sourceRef.sourceId, '$.sourceRef.sourceId');
    if (typeof sourceRef.kind !== 'string' || !SOURCE_KINDS.has(sourceRef.kind)) errors.push(issue('source-kind', '$.sourceRef.kind', 'is not supported'));
    if (sourceRef.sha256 !== null && (typeof sourceRef.sha256 !== 'string' || !SHA256.test(sourceRef.sha256))) errors.push(issue('sha256', '$.sourceRef.sha256', 'must be null or a lower-case SHA-256 digest'));
    boundedText(errors, sourceRef.licence, '$.sourceRef.licence');
    boundedText(errors, sourceRef.permission, '$.sourceRef.permission');
    if (typeof sourceRef.synthetic !== 'boolean') errors.push(issue('type', '$.sourceRef.synthetic', 'must be a boolean'));
    if (value.evidenceClass === 'synthetic' && (sourceRef.synthetic !== true || sourceRef.kind !== 'synthetic')) errors.push(issue('synthetic-provenance', '$.sourceRef', 'synthetic evidence requires synthetic provenance'));
    if (value.evidenceClass === 'operator-unverified' && (sourceRef.synthetic !== false || typeof sourceRef.sha256 !== 'string' || !SHA256.test(sourceRef.sha256))) errors.push(issue('operator-provenance', '$.sourceRef', 'operator-unverified evidence requires non-synthetic provenance and a SHA-256 digest'));
    const existing = venue.provenance.sourceRefs.find((candidate) => candidate.sourceId === sourceRef.sourceId);
    if (existing && !sameJson(existing, sourceRef)) errors.push(issue('source-conflict', '$.sourceRef.sourceId', 'conflicts with existing venue provenance'));
  }

  const sourceKeys = new Set<string>();
  const targetKeys = new Set<string>();
  const controlIds = new Set<string>();
  if (!Array.isArray(value.controlPoints) || value.controlPoints.length < 3 || value.controlPoints.length > 32) {
    errors.push(issue('control-point-count', '$.controlPoints', 'must contain 3..32 observations'));
  } else value.controlPoints.forEach((control, index) => {
    const path = `$.controlPoints[${index}]`;
    if (!exactObject(errors, control, CONTROL_KEYS, path)) return;
    if (stableId(errors, control.controlPointId, `${path}.controlPointId`)) {
      if (controlIds.has(control.controlPointId)) errors.push(issue('duplicate-control-point', `${path}.controlPointId`, 'must be unique'));
      controlIds.add(control.controlPointId);
      const outsideTargetPlan = venue.floorPlans.filter((candidate) => candidate.levelId !== value.levelId)
        .some((candidate) => candidate.controlPoints.some((point) => point.controlPointId === control.controlPointId));
      if (outsideTargetPlan) errors.push(issue('control-id-conflict', `${path}.controlPointId`, 'is already used by another floor plan'));
    }
    boundedText(errors, control.name, `${path}.name`);
    validateSourcePoint(errors, control.source, `${path}.source`, sourceWidth, sourceHeight);
    validateTargetPoint(errors, control.target, `${path}.target`, widthM, heightM);
    boundedNumber(errors, control.uncertaintyM, `${path}.uncertaintyM`, 0, 100);
    if (isRecord(control.source) && typeof control.source.xPx === 'number' && typeof control.source.yPx === 'number') {
      const key = `${control.source.xPx}:${control.source.yPx}`;
      if (sourceKeys.has(key)) errors.push(issue('duplicate-source-point', `${path}.source`, 'must be unique'));
      sourceKeys.add(key);
    }
    if (isRecord(control.target) && typeof control.target.xM === 'number' && typeof control.target.yM === 'number') {
      const key = `${control.target.xM}:${control.target.yM}`;
      if (targetKeys.has(key)) errors.push(issue('duplicate-target-point', `${path}.target`, 'must be unique'));
      targetKeys.add(key);
    }
  });

  const expectedShapes = new Map(plan?.shapes.map((shape) => [shape.spaceId, shape.shapeId]) ?? []);
  const seenSpaces = new Set<string>();
  if (!Array.isArray(value.shapes) || value.shapes.length < 1 || value.shapes.length > 256) {
    errors.push(issue('shape-count', '$.shapes', 'must contain 1..256 shapes'));
  } else value.shapes.forEach((shape, index) => {
    const path = `$.shapes[${index}]`;
    if (!exactObject(errors, shape, SHAPE_KEYS, path)) return;
    stableId(errors, shape.shapeId, `${path}.shapeId`);
    if (stableId(errors, shape.spaceId, `${path}.spaceId`)) {
      if (seenSpaces.has(shape.spaceId)) errors.push(issue('duplicate-space-shape', `${path}.spaceId`, 'must appear exactly once'));
      seenSpaces.add(shape.spaceId);
      const expectedShapeId = expectedShapes.get(shape.spaceId);
      if (!expectedShapeId) errors.push(issue('unknown-space', `${path}.spaceId`, 'does not identify an existing shape on the target level'));
      else if (shape.shapeId !== expectedShapeId) errors.push(issue('shape-id-mismatch', `${path}.shapeId`, 'must preserve the existing stable shape ID'));
    }
    if (!Array.isArray(shape.points) || shape.points.length < 3 || shape.points.length > 128) errors.push(issue('polygon-point-count', `${path}.points`, 'must contain 3..128 points'));
    else shape.points.forEach((point, pointIndex) => validateSourcePoint(errors, point, `${path}.points[${pointIndex}]`, sourceWidth, sourceHeight));
  });
  for (const spaceId of expectedShapes.keys()) if (!seenSpaces.has(spaceId)) errors.push(issue('missing-space-shape', '$.shapes', `is missing ${spaceId}`));

  return errors.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
}

function transformPoint(point: SourcePixelPoint, transform: PlanSimilarityTransform): PlanPoint {
  const radians = transform.rotationDeg * Math.PI / 180;
  const cosine = Math.cos(radians) * transform.scaleMPerPx;
  const sine = Math.sin(radians) * transform.scaleMPerPx;
  return {
    xM: cosine * point.xPx - sine * point.yPx + transform.translateXM,
    yM: sine * point.xPx + cosine * point.yPx + transform.translateYM,
  };
}

function clampToPlan(point: PlanPoint, widthM: number, heightM: number): PlanPoint {
  return {
    xM: Math.min(widthM, Math.max(0, Math.abs(point.xM) < BOUNDS_EPSILON ? 0 : point.xM)),
    yM: Math.min(heightM, Math.max(0, Math.abs(point.yM) < BOUNDS_EPSILON ? 0 : point.yM)),
  };
}

export function evaluatePlanRegistration(bundle: PlanImportBundle, venue: VenuePackage): EvaluatedPlanRegistration {
  const validation = validatePlanImportBundle(bundle, venue);
  if (validation.length > 0) throw new PlanRegistrationError(validation);
  const plan = venue.floorPlans.find((candidate) => candidate.levelId === bundle.levelId)!;
  const sourceCentroid = bundle.controlPoints.reduce((sum, point) => ({ x: sum.x + point.source.xPx, y: sum.y + point.source.yPx }), { x: 0, y: 0 });
  const targetCentroid = bundle.controlPoints.reduce((sum, point) => ({ x: sum.x + point.target.xM, y: sum.y + point.target.yM }), { x: 0, y: 0 });
  sourceCentroid.x /= bundle.controlPoints.length;
  sourceCentroid.y /= bundle.controlPoints.length;
  targetCentroid.x /= bundle.controlPoints.length;
  targetCentroid.y /= bundle.controlPoints.length;

  let denominator = 0;
  let dot = 0;
  let cross = 0;
  for (const point of bundle.controlPoints) {
    const sx = point.source.xPx - sourceCentroid.x;
    const sy = point.source.yPx - sourceCentroid.y;
    const tx = point.target.xM - targetCentroid.x;
    const ty = point.target.yM - targetCentroid.y;
    denominator += sx * sx + sy * sy;
    dot += sx * tx + sy * ty;
    cross += sx * ty - sy * tx;
  }
  const geometryScale = Math.max(bundle.sourceFrame.widthPx, bundle.sourceFrame.heightPx, 1);
  const nonCollinear = bundle.controlPoints.some((first, firstIndex) => bundle.controlPoints.some((second, secondIndex) => bundle.controlPoints.some((third, thirdIndex) => {
    if (firstIndex === secondIndex || firstIndex === thirdIndex || secondIndex === thirdIndex) return false;
    const area2 = Math.abs((second.source.xPx - first.source.xPx) * (third.source.yPx - first.source.yPx) - (second.source.yPx - first.source.yPx) * (third.source.xPx - first.source.xPx));
    return area2 > geometryScale * geometryScale * 1e-9;
  })));
  if (!nonCollinear || denominator <= 1e-12) throw new PlanRegistrationError([issue('degenerate-control-points', '$.controlPoints', 'must contain at least three non-collinear source points')]);

  const a = dot / denominator;
  const b = cross / denominator;
  const transform: PlanSimilarityTransform = {
    scaleMPerPx: Math.hypot(a, b),
    rotationDeg: Math.atan2(b, a) * 180 / Math.PI,
    translateXM: targetCentroid.x - a * sourceCentroid.x + b * sourceCentroid.y,
    translateYM: targetCentroid.y - b * sourceCentroid.x - a * sourceCentroid.y,
  };
  if (!Number.isFinite(transform.scaleMPerPx) || transform.scaleMPerPx < 0.001 || transform.scaleMPerPx > 10) {
    throw new PlanRegistrationError([issue('registration-scale', '$.controlPoints', 'fitted scale must be within 0.001..10 metres per pixel')]);
  }

  const controlPointResiduals = bundle.controlPoints.map((point) => {
    const projected = transformPoint(point.source, transform);
    return { controlPointId: point.controlPointId, residualM: Math.hypot(projected.xM - point.target.xM, projected.yM - point.target.yM) };
  });
  const rmsResidualM = Math.sqrt(controlPointResiduals.reduce((sum, point) => sum + point.residualM ** 2, 0) / controlPointResiduals.length);
  const maxResidualM = Math.max(...controlPointResiduals.map((point) => point.residualM));
  if (rmsResidualM > PLAN_REGISTRATION_MAX_RMS_M || maxResidualM > PLAN_REGISTRATION_MAX_RESIDUAL_M) {
    throw new PlanRegistrationError([issue('registration-residual', '$.controlPoints', `fit exceeds ${PLAN_REGISTRATION_MAX_RMS_M}m RMS or ${PLAN_REGISTRATION_MAX_RESIDUAL_M}m maximum`)]);
  }

  const transformedShapes = bundle.shapes.map((shape) => ({
    shapeId: shape.shapeId,
    spaceId: shape.spaceId,
    points: shape.points.map((point) => transformPoint(point, transform)),
  }));
  const geometryIssues: PlanImportIssue[] = [];
  transformedShapes.forEach((shape, shapeIndex) => {
    shape.points.forEach((point, pointIndex) => {
      if (point.xM < -BOUNDS_EPSILON || point.yM < -BOUNDS_EPSILON || point.xM > plan.widthM + BOUNDS_EPSILON || point.yM > plan.heightM + BOUNDS_EPSILON) {
        geometryIssues.push(issue('registered-plan-bounds', `$.shapes[${shapeIndex}].points[${pointIndex}]`, 'transformed point falls outside target floor-plan bounds'));
      }
    });
    if (polygonArea(shape.points) <= 0.000001) geometryIssues.push(issue('registered-polygon-area', `$.shapes[${shapeIndex}].points`, 'transformed polygon must have non-zero area'));
    shape.points = shape.points.map((point) => clampToPlan(point, plan.widthM, plan.heightM));
  });
  if (geometryIssues.length > 0) throw new PlanRegistrationError(geometryIssues);

  return { transform, rmsResidualM, maxResidualM, controlPointResiduals, transformedShapes };
}

export function parsePlanImportJson(json: string, venue: VenuePackage): PlanImportBundle {
  if (new TextEncoder().encode(json).length > PLAN_IMPORT_MAX_BYTES) throw new PlanRegistrationError([issue('json-size', '$', `must be at most ${PLAN_IMPORT_MAX_BYTES} bytes`)]);
  let value: unknown;
  try {
    value = JSON.parse(json) as unknown;
  } catch {
    throw new PlanRegistrationError([issue('json', '$', 'must be valid JSON')]);
  }
  const errors = validatePlanImportBundle(value, venue);
  if (errors.length > 0) throw new PlanRegistrationError(errors);
  evaluatePlanRegistration(value as PlanImportBundle, venue);
  return clone(value as PlanImportBundle);
}

export function registerPlanImport(bundle: PlanImportBundle, venue: VenuePackage, options: RegisterPlanImportOptions = {}): RegisteredPlanImport {
  const evaluated = evaluatePlanRegistration(bundle, venue);
  let draft: VenuePackage;
  if (venue.state === 'draft') draft = clone(venue);
  else {
    if (!options.successor) throw new PlanRegistrationError([issue('successor-required', '$', 'an immutable package requires explicit successor identity and time')]);
    draft = forkVenueDraft(venue, options.successor);
  }
  const targetPlan = draft.floorPlans.find((candidate) => candidate.levelId === bundle.levelId)!;
  targetPlan.shapes = clone(evaluated.transformedShapes);
  targetPlan.sourceRefId = bundle.sourceRef.sourceId;
  targetPlan.controlPoints = bundle.controlPoints.map<PlanControlPoint>((point) => ({
    controlPointId: point.controlPointId,
    name: point.name,
    position: clone(point.target),
    sourceRefId: bundle.sourceRef.sourceId,
    uncertaintyM: point.uncertaintyM,
  }));
  if (!draft.provenance.sourceRefs.some((source) => source.sourceId === bundle.sourceRef.sourceId)) draft.provenance.sourceRefs.push(clone(bundle.sourceRef));
  draft.provenance.review = { status: 'unreviewed', reviewedBy: null, reviewedAt: null };
  assertVenuePackage(draft);
  const receipt: PlanRegistrationReceipt = {
    schemaVersion: PLAN_REGISTRATION_RECEIPT_SCHEMA,
    evidenceClass: bundle.evidenceClass,
    importId: bundle.importId,
    sourceFrameId: bundle.sourceFrame.frameId,
    targetFrameId: bundle.targetFrameId,
    sourcePackageId: venue.packageId,
    sourceMapVersion: venue.mapVersion,
    resultingPackageId: draft.packageId,
    resultingMapVersion: draft.mapVersion,
    levelId: bundle.levelId,
    sourceRefId: bundle.sourceRef.sourceId,
    transform: clone(evaluated.transform),
    rmsResidualM: evaluated.rmsResidualM,
    maxResidualM: evaluated.maxResidualM,
    controlPointResiduals: clone(evaluated.controlPointResiduals),
    transformedShapeCount: evaluated.transformedShapes.length,
  };
  return { venue: draft, receipt: deepFreeze(receipt) };
}

function invertTargetPoint(point: PlanPoint, transform: PlanSimilarityTransform): SourcePixelPoint {
  const radians = transform.rotationDeg * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const dx = point.xM - transform.translateXM;
  const dy = point.yM - transform.translateYM;
  return {
    xPx: (cosine * dx + sine * dy) / transform.scaleMPerPx,
    yPx: (-sine * dx + cosine * dy) / transform.scaleMPerPx,
  };
}

export function createSyntheticPlanImport(venue: VenuePackage, levelId = 'level.ground'): PlanImportBundle {
  assertVenuePackage(venue);
  const plan = venue.floorPlans.find((candidate) => candidate.levelId === levelId);
  if (!plan) throw new PlanRegistrationError([issue('unknown-level', '$.levelId', 'must identify a level with a floor plan')]);
  const scaleMPerPx = 0.05;
  const rotationDeg = 4;
  const sourceOrigin = { xPx: 300, yPx: 300 };
  const radians = rotationDeg * Math.PI / 180;
  const transform: PlanSimilarityTransform = {
    scaleMPerPx,
    rotationDeg,
    translateXM: -scaleMPerPx * Math.cos(radians) * sourceOrigin.xPx + scaleMPerPx * Math.sin(radians) * sourceOrigin.yPx,
    translateYM: -scaleMPerPx * Math.sin(radians) * sourceOrigin.xPx - scaleMPerPx * Math.cos(radians) * sourceOrigin.yPx,
  };
  const targets: Array<{ id: string; name: string; point: PlanPoint }> = [
    { id: 'control.import.northwest', name: 'North-west registered corner', point: { xM: 0, yM: 0 } },
    { id: 'control.import.northeast', name: 'North-east registered corner', point: { xM: plan.widthM, yM: 0 } },
    { id: 'control.import.southwest', name: 'South-west registered corner', point: { xM: 0, yM: plan.heightM } },
    { id: 'control.import.southeast', name: 'South-east registered corner', point: { xM: plan.widthM, yM: plan.heightM } },
  ];
  const bundle: PlanImportBundle = {
    schemaVersion: PLAN_IMPORT_SCHEMA,
    importId: `import.synthetic.${levelId.replace(/^level\./u, '')}.001`,
    evidenceClass: 'synthetic',
    packageId: venue.packageId,
    buildingId: venue.buildingId,
    mapVersion: venue.mapVersion,
    levelId,
    targetFrameId: venue.coordinateFrame.frameId,
    sourceFrame: { frameId: `frame.source.synthetic.${levelId.replace(/^level\./u, '')}`, unit: 'px', widthPx: 2200, heightPx: 1200 },
    sourceRef: {
      sourceId: `source.synthetic.plan.${levelId.replace(/^level\./u, '')}`,
      kind: 'synthetic',
      sha256: null,
      licence: 'Loc8 synthetic development fixture',
      permission: 'Synthetic fixture only; no customer plan or survey evidence',
      synthetic: true,
    },
    controlPoints: targets.map((target) => ({
      controlPointId: target.id,
      name: target.name,
      source: invertTargetPoint(target.point, transform),
      target: target.point,
      uncertaintyM: 0,
    })),
    shapes: plan.shapes.map((shape) => ({
      shapeId: shape.shapeId,
      spaceId: shape.spaceId,
      points: shape.points.map((point) => invertTargetPoint(point, transform)),
    })),
  };
  const errors = validatePlanImportBundle(bundle, venue);
  if (errors.length > 0) throw new PlanRegistrationError(errors);
  return bundle;
}
