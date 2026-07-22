import {
  PLAN_IMPORT_MAX_BYTES,
  PLAN_IMPORT_SCHEMA,
  PLAN_REGISTRATION_MAX_RESIDUAL_M,
  PLAN_REGISTRATION_MAX_RMS_M,
  PlanRegistrationError,
  createLocalDemoPublication,
  createSyntheticFourLevelVenue,
  createSyntheticPlanImport,
  evaluatePlanRegistration,
  parsePlanImportJson,
  registerPlanImport,
  validatePlanImportBundle,
  validateVenuePackage,
  type PlanImportBundle,
  type VenuePackage,
} from '..';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fixture() {
  const venue = createSyntheticFourLevelVenue();
  return { venue, bundle: createSyntheticPlanImport(venue) };
}

function topology(venue: VenuePackage) {
  return {
    spaces: venue.spaces.map((value) => value.spaceId),
    zones: venue.zones.map((value) => value.zoneId),
    connectors: venue.connectors.map((value) => value.connectorId),
    portals: venue.portals.map((value) => value.portalId),
    nodes: venue.routeNodes.map((value) => value.nodeId),
    edges: venue.routeEdges.map((value) => value.edgeId),
  };
}

describe('plan registration happy paths', () => {
  it('recovers the deterministic synthetic similarity transform', () => {
    const { venue, bundle } = fixture();
    const evaluated = evaluatePlanRegistration(bundle, venue);
    expect(evaluated.transform.scaleMPerPx).toBeCloseTo(0.05, 10);
    expect(evaluated.transform.rotationDeg).toBeCloseTo(4, 10);
    expect(evaluated.rmsResidualM).toBeLessThan(1e-10);
    expect(evaluated.maxResidualM).toBeLessThan(1e-10);
    expect(evaluated.transformedShapes).toHaveLength(venue.floorPlans.find((plan) => plan.levelId === bundle.levelId)!.shapes.length);
  });

  it('generates byte-for-byte deterministic synthetic input', () => {
    const venue = createSyntheticFourLevelVenue();
    expect(JSON.stringify(createSyntheticPlanImport(venue))).toBe(JSON.stringify(createSyntheticPlanImport(venue)));
  });

  it('parses a bounded matching JSON bundle', () => {
    const { venue, bundle } = fixture();
    expect(parsePlanImportJson(JSON.stringify(bundle), venue)).toEqual(bundle);
  });

  it('applies geometry and provenance without mutating either input', () => {
    const { venue, bundle } = fixture();
    const venueBefore = JSON.stringify(venue);
    const bundleBefore = JSON.stringify(bundle);
    const result = registerPlanImport(bundle, venue);
    expect(JSON.stringify(venue)).toBe(venueBefore);
    expect(JSON.stringify(bundle)).toBe(bundleBefore);
    expect(result.venue).not.toBe(venue);
    expect(result.venue.floorPlans.find((plan) => plan.levelId === bundle.levelId)?.sourceRefId).toBe(bundle.sourceRef.sourceId);
    expect(result.venue.provenance.sourceRefs).toContainEqual(bundle.sourceRef);
    expect(result.venue.provenance.review.status).toBe('unreviewed');
    expect(validateVenuePackage(result.venue)).toEqual([]);
  });

  it('preserves every semantic and routing identity while replacing plan geometry', () => {
    const { venue, bundle } = fixture();
    const result = registerPlanImport(bundle, venue);
    expect(topology(result.venue)).toEqual(topology(venue));
  });

  it('returns a frozen, bounded receipt that never claims a survey', () => {
    const { venue, bundle } = fixture();
    const receipt = registerPlanImport(bundle, venue).receipt;
    expect(receipt).toMatchObject({
      evidenceClass: 'synthetic',
      sourcePackageId: venue.packageId,
      sourceMapVersion: venue.mapVersion,
      resultingMapVersion: venue.mapVersion,
      transformedShapeCount: bundle.shapes.length,
    });
    expect(receipt.rmsResidualM).toBeLessThanOrEqual(PLAN_REGISTRATION_MAX_RMS_M);
    expect(receipt.maxResidualM).toBeLessThanOrEqual(PLAN_REGISTRATION_MAX_RESIDUAL_M);
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(Object.isFrozen(receipt.transform)).toBe(true);
  });

  it('forks an immutable package only with explicit successor lineage', () => {
    const draft = createSyntheticFourLevelVenue();
    const local = createLocalDemoPublication(draft, {
      packageId: 'package.synthetic.hq.local.002',
      mapVersion: 'map.synthetic.local.002',
      publishedAt: '2027-01-15T08:00:00.000Z',
      publishedBy: 'operator.command.01',
    }).package as VenuePackage;
    const bundle = createSyntheticPlanImport(local);
    const result = registerPlanImport(bundle, local, {
      successor: {
        packageId: 'package.synthetic.hq.draft.003',
        mapVersion: 'map.synthetic.draft.003',
        validFrom: '2027-01-16T08:00:00.000Z',
      },
    });
    expect(result.venue).toMatchObject({ state: 'draft', parentMapVersion: local.mapVersion, mapVersion: 'map.synthetic.draft.003' });
    expect(result.receipt.sourceMapVersion).toBe(local.mapVersion);
    expect(result.receipt.resultingMapVersion).toBe('map.synthetic.draft.003');
  });

  it('accepts structurally valid operator-unverified provenance without promoting it', () => {
    const { venue, bundle } = fixture();
    bundle.evidenceClass = 'operator-unverified';
    bundle.sourceRef = {
      sourceId: 'source.operator.plan.ground', kind: 'plan', sha256: 'a'.repeat(64),
      licence: 'Customer supplied for local commissioning', permission: 'Operator declaration remains unverified', synthetic: false,
    };
    const result = registerPlanImport(bundle, venue);
    expect(result.receipt.evidenceClass).toBe('operator-unverified');
    expect(result.venue.provenance.review.status).toBe('unreviewed');
  });
});

type InvalidCase = [string, string, (bundle: PlanImportBundle, venue: VenuePackage) => void];

const invalidCases: InvalidCase[] = [
  ['unknown root field', 'unexpected-field', (bundle) => { (bundle as PlanImportBundle & { extra: boolean }).extra = true; }],
  ['wrong schema', 'schema-version', (bundle) => { (bundle.schemaVersion as string) = 'loc8.plan-import.v0'; }],
  ['invalid import ID', 'stable-id', (bundle) => { bundle.importId = 'BAD ID'; }],
  ['unknown evidence class', 'evidence-class', (bundle) => { (bundle.evidenceClass as string) = 'surveyed'; }],
  ['package mismatch', 'package-mismatch', (bundle) => { bundle.packageId = 'package.other'; }],
  ['building mismatch', 'building-mismatch', (bundle) => { bundle.buildingId = 'building.other'; }],
  ['map mismatch', 'map-version-mismatch', (bundle) => { bundle.mapVersion = 'map.other'; }],
  ['unknown level', 'unknown-level', (bundle) => { bundle.levelId = 'level.unknown'; }],
  ['target frame mismatch', 'target-frame-mismatch', (bundle) => { bundle.targetFrameId = 'frame.other'; }],
  ['source unit other than pixels', 'source-unit', (bundle) => { (bundle.sourceFrame.unit as string) = 'm'; }],
  ['source width beyond bound', 'number-range', (bundle) => { bundle.sourceFrame.widthPx = 100_001; }],
  ['identical source and target frame', 'frame-identity', (bundle) => { bundle.sourceFrame.frameId = bundle.targetFrameId; }],
  ['synthetic class with non-synthetic source', 'synthetic-provenance', (bundle) => { bundle.sourceRef.synthetic = false; }],
  ['operator input without digest', 'operator-provenance', (bundle) => { bundle.evidenceClass = 'operator-unverified'; bundle.sourceRef.synthetic = false; bundle.sourceRef.kind = 'plan'; }],
  ['fewer than three control points', 'control-point-count', (bundle) => { bundle.controlPoints = bundle.controlPoints.slice(0, 2); }],
  ['duplicate control-point ID', 'duplicate-control-point', (bundle) => { bundle.controlPoints[1].controlPointId = bundle.controlPoints[0].controlPointId; }],
  ['duplicate source point', 'duplicate-source-point', (bundle) => { bundle.controlPoints[1].source = clone(bundle.controlPoints[0].source); }],
  ['duplicate target point', 'duplicate-target-point', (bundle) => { bundle.controlPoints[1].target = clone(bundle.controlPoints[0].target); }],
  ['source point outside source frame', 'number-range', (bundle) => { bundle.controlPoints[0].source.xPx = -1; }],
  ['target point outside plan', 'number-range', (bundle) => { bundle.controlPoints[0].target.xM = 73; }],
  ['negative uncertainty', 'number-range', (bundle) => { bundle.controlPoints[0].uncertaintyM = -0.1; }],
  ['empty shape collection', 'shape-count', (bundle) => { bundle.shapes = []; }],
  ['unknown space', 'unknown-space', (bundle) => { bundle.shapes[0].spaceId = 'space.unknown'; }],
  ['changed stable shape ID', 'shape-id-mismatch', (bundle) => { bundle.shapes[0].shapeId = 'shape.changed'; }],
  ['duplicate space shape', 'duplicate-space-shape', (bundle) => { bundle.shapes[1].spaceId = bundle.shapes[0].spaceId; bundle.shapes[1].shapeId = bundle.shapes[0].shapeId; }],
  ['missing target shape', 'missing-space-shape', (bundle) => { bundle.shapes.pop(); }],
  ['polygon with fewer than three points', 'polygon-point-count', (bundle) => { bundle.shapes[0].points = bundle.shapes[0].points.slice(0, 2); }],
  ['unknown control-point field', 'unexpected-field', (bundle) => { (bundle.controlPoints[0] as PlanImportBundle['controlPoints'][number] & { extra: boolean }).extra = true; }],
  ['conflicting existing source reference', 'source-conflict', (bundle) => { bundle.sourceRef.sourceId = 'source.synthetic.concept'; }],
  ['control-point ID used on another floor', 'control-id-conflict', (bundle) => { bundle.controlPoints[0].controlPointId = 'control.one.origin'; }],
  ['non-finite coordinate', 'finite-number', (bundle) => { bundle.shapes[0].points[0].xPx = Number.NaN; }],
];

describe.each(invalidCases)('plan import validation: %s', (_name, code, mutate) => {
  it(`reports ${code} and does not alter the venue`, () => {
    const { venue, bundle } = fixture();
    const before = JSON.stringify(venue);
    mutate(bundle, venue);
    expect(validatePlanImportBundle(bundle, venue)).toEqual(expect.arrayContaining([expect.objectContaining({ code })]));
    expect(JSON.stringify(venue)).toBe(before);
  });
});

describe('registration fail-closed evaluation cases', () => {
  it('rejects three collinear source observations', () => {
    const { venue, bundle } = fixture();
    bundle.controlPoints = bundle.controlPoints.slice(0, 3);
    bundle.controlPoints.forEach((point, index) => { point.source = { xPx: 100 + index * 100, yPx: 100 }; });
    expect(() => evaluatePlanRegistration(bundle, venue)).toThrow(PlanRegistrationError);
    try { evaluatePlanRegistration(bundle, venue); } catch (error) {
      expect((error as PlanRegistrationError).issues).toContainEqual(expect.objectContaining({ code: 'degenerate-control-points' }));
    }
  });

  it('rejects a fitted scale below the frozen range', () => {
    const { venue, bundle } = fixture();
    bundle.controlPoints.forEach((point) => { point.target = { xM: point.source.xPx * 0.0001, yM: point.source.yPx * 0.0001 }; });
    expect(() => evaluatePlanRegistration(bundle, venue)).toThrow(PlanRegistrationError);
    try { evaluatePlanRegistration(bundle, venue); } catch (error) {
      expect((error as PlanRegistrationError).issues).toContainEqual(expect.objectContaining({ code: 'registration-scale' }));
    }
  });

  it('rejects control-point residuals above the frozen gate', () => {
    const { venue, bundle } = fixture();
    bundle.controlPoints[0].target = { xM: 3, yM: 3 };
    expect(() => evaluatePlanRegistration(bundle, venue)).toThrow(PlanRegistrationError);
    try { evaluatePlanRegistration(bundle, venue); } catch (error) {
      expect((error as PlanRegistrationError).issues).toContainEqual(expect.objectContaining({ code: 'registration-residual' }));
    }
  });

  it('rejects transformed geometry outside the target plan', () => {
    const { venue, bundle } = fixture();
    bundle.shapes[0].points[0] = { xPx: 0, yPx: 0 };
    expect(() => evaluatePlanRegistration(bundle, venue)).toThrow(PlanRegistrationError);
    try { evaluatePlanRegistration(bundle, venue); } catch (error) {
      expect((error as PlanRegistrationError).issues).toContainEqual(expect.objectContaining({ code: 'registered-plan-bounds' }));
    }
  });

  it('requires explicit successor identity for an immutable package', () => {
    const draft = createSyntheticFourLevelVenue();
    const local = createLocalDemoPublication(draft, {
      packageId: 'package.synthetic.hq.local.002', mapVersion: 'map.synthetic.local.002',
      publishedAt: '2027-01-15T08:00:00.000Z', publishedBy: 'operator.command.01',
    }).package as VenuePackage;
    const bundle = createSyntheticPlanImport(local);
    expect(() => registerPlanImport(bundle, local)).toThrow(PlanRegistrationError);
  });

  it('rejects malformed JSON', () => {
    const venue = createSyntheticFourLevelVenue();
    expect(() => parsePlanImportJson('{', venue)).toThrow(PlanRegistrationError);
  });

  it('rejects JSON above the two-mebibyte boundary before parsing', () => {
    const venue = createSyntheticFourLevelVenue();
    expect(() => parsePlanImportJson(' '.repeat(PLAN_IMPORT_MAX_BYTES + 1), venue)).toThrow(PlanRegistrationError);
  });

  it('exports the frozen schema name', () => {
    expect(PLAN_IMPORT_SCHEMA).toBe('loc8.plan-import.v1');
  });
});
