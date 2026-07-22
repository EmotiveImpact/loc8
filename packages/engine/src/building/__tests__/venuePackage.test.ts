import {
  canonicalVenueJson,
  compileVenuePackage,
  createLegacyFloorCodec,
  createLocalDemoPublication,
  createSyntheticFourLevelVenue,
  forkVenueDraft,
  projectFloorPlans,
  projectLevels,
  projectPlaces,
  projectZones,
  routeBetweenNodes,
  routeToNearestExit,
  validateVenuePackage,
  type VenuePackage,
} from '..';

function cloneVenue(): VenuePackage {
  return JSON.parse(JSON.stringify(createSyntheticFourLevelVenue())) as VenuePackage;
}

describe('semantic venue package', () => {
  it('validates the synthetic four-level commissioning fixture', () => {
    const venue = cloneVenue();
    expect(validateVenuePackage(venue)).toEqual([]);
    expect(venue.levels.map((level) => level.levelRef)).toEqual(['B1', 'G', 'L1', 'L2']);
    expect(venue.provenance.sourceRefs.every((source) => source.synthetic)).toBe(true);
  });

  it('compiles a detached and deeply immutable package with stable indexes', () => {
    const venue = cloneVenue();
    const compiled = compileVenuePackage(venue);
    venue.name = 'Mutated input';
    expect(compiled.package.name).toBe('Loc8 Synthetic Operations Centre');
    expect(compiled.levelsById['level.ground'].levelRef).toBe('G');
    expect(Object.isFrozen(compiled)).toBe(true);
    expect(Object.isFrozen(compiled.package.levels)).toBe(true);
    try {
      (compiled.package.levels[0] as { name: string }).name = 'Mutated compiled value';
    } catch {
      // Strict runtimes throw; non-strict runtimes ignore writes to frozen objects.
    }
    expect(compiled.package.levels[0].name).toBe('Basement');
  });

  it('produces canonical JSON independent of object property insertion order', () => {
    const venue = cloneVenue();
    const reversed = Object.fromEntries(Object.entries(venue).reverse()) as unknown as VenuePackage;
    expect(canonicalVenueJson(reversed)).toBe(canonicalVenueJson(venue));
  });

  it('publishes an honest browser-local demo without changing the draft', () => {
    const venue = cloneVenue();
    const published = createLocalDemoPublication(venue, {
      packageId: 'package.synthetic.hq.local.002',
      mapVersion: 'map.synthetic.local.002',
      publishedAt: '2026-07-22T12:00:00.000Z',
      publishedBy: 'operator.demo',
    });
    expect(venue.state).toBe('draft');
    expect(published.package).toMatchObject({
      state: 'local-demo',
      parentMapVersion: 'map.synthetic.draft.001',
      publication: { authority: 'browser-local', signed: false, contentSha256: null },
    });
  });

  it('forks a publication into a new editable draft with lineage', () => {
    const source = createLocalDemoPublication(cloneVenue(), {
      packageId: 'package.synthetic.hq.local.002',
      mapVersion: 'map.synthetic.local.002',
      publishedAt: '2026-07-22T12:00:00.000Z',
      publishedBy: 'operator.demo',
    }).package as VenuePackage;
    const draft = forkVenueDraft(source, {
      packageId: 'package.synthetic.hq.draft.003',
      mapVersion: 'map.synthetic.draft.003',
      validFrom: '2026-07-22T13:00:00.000Z',
    });
    expect(draft.state).toBe('draft');
    expect(draft.parentMapVersion).toBe('map.synthetic.local.002');
    expect(draft.publication.publishedAt).toBeNull();
  });

  it('projects the same stable building objects for product consumers', () => {
    const venue = cloneVenue();
    expect(projectLevels(venue)).toHaveLength(4);
    expect(projectFloorPlans(venue)).toHaveLength(4);
    expect(projectZones(venue)).toHaveLength(4);
    expect(projectPlaces(venue)).toHaveLength(4);
    expect(projectZones(venue)[0]).toMatchObject({ buildingId: venue.buildingId, mapVersion: venue.mapVersion });
  });

  it('encodes legacy floor bytes only at the compatibility boundary', () => {
    const codec = createLegacyFloorCodec(cloneVenue());
    expect(codec.encode('level.basement')).toBe(-1);
    expect(codec.decode(2)).toBe('level.two');
    expect(codec.encode('level.unknown')).toBeUndefined();
  });

  it('routes deterministically across floors and honours route profiles', () => {
    const venue = cloneVenue();
    const walking = routeBetweenNodes(venue, {
      fromNodeId: 'node.two.north.primary',
      toNodeId: 'node.ground.corridor.primary',
      profile: 'walking',
    });
    expect(walking.outcome).toBe('ok');
    if (walking.outcome === 'ok') expect(walking.levelIds).toEqual(['level.two', 'level.one', 'level.ground']);

    const evacuation = routeToNearestExit(venue, {
      fromNodeId: 'node.two.north.primary',
      profile: 'evacuation-step-free',
    });
    expect(evacuation.outcome).toBe('ok');
    if (evacuation.outcome === 'ok') {
      expect(evacuation.connectorIds).toEqual(['connector.east-ramp']);
      expect(evacuation.exitPortalId).toMatch(/^portal\.ground\.(east|west)-exit$/u);
    }
  });

  it('recalculates around closures and returns an honest no-route result', () => {
    const venue = cloneVenue();
    const detour = routeToNearestExit(venue, {
      fromNodeId: 'node.two.north.primary',
      profile: 'evacuation-walking',
      closedConnectorIds: ['connector.west-stairs'],
    });
    expect(detour.outcome).toBe('ok');
    if (detour.outcome === 'ok') expect(detour.connectorIds).toEqual(['connector.east-ramp']);

    const unavailable = routeToNearestExit(venue, {
      fromNodeId: 'node.two.north.primary',
      profile: 'evacuation-step-free',
      closedConnectorIds: ['connector.east-ramp'],
    });
    expect(unavailable).toMatchObject({ outcome: 'no-route', reason: 'no-eligible-route' });
  });

  it('rejects unknown nodes and closure identifiers before routing', () => {
    const venue = cloneVenue();
    expect(routeBetweenNodes(venue, {
      fromNodeId: 'node.unknown',
      toNodeId: 'node.ground.corridor.primary',
      profile: 'walking',
    })).toMatchObject({ outcome: 'invalid-request', field: 'fromNodeId' });
    expect(routeBetweenNodes(venue, {
      fromNodeId: 'node.two.north.primary',
      toNodeId: 'node.ground.corridor.primary',
      profile: 'walking',
      closedEdgeIds: ['edge.unknown'],
    })).toMatchObject({ outcome: 'invalid-request', field: 'closedEdgeIds' });
  });
});

type InvalidMutation = [name: string, expectedCode: string, mutate: (venue: VenuePackage) => void];

const invalidMutations: InvalidMutation[] = [
  ['unknown schema version', 'schema-version', (venue) => { (venue.schemaVersion as string) = 'loc8.venue-package.v0'; }],
  ['invalid stable package ID', 'stable-id', (venue) => { venue.packageId = 'BAD ID'; }],
  ['invalid validity timestamp', 'time', (venue) => { venue.validFrom = 'tomorrow'; }],
  ['validity range reversed', 'time-order', (venue) => { venue.validTo = '2026-07-22T08:00:00.000Z'; }],
  ['duplicate coordinate axes', 'coordinate-axis', (venue) => { venue.coordinateFrame.yAxis = venue.coordinateFrame.xAxis; }],
  ['invalid source digest', 'sha256', (venue) => { venue.provenance.sourceRefs[0].sha256 = '1234'; }],
  ['reviewed state without reviewer', 'review-evidence', (venue) => { venue.provenance.review.status = 'reviewed'; }],
  ['signed draft publication', 'draft-publication', (venue) => { venue.publication.signed = true; }],
  ['duplicate level identifier', 'duplicate-id', (venue) => { venue.levels[1].levelId = venue.levels[0].levelId; }],
  ['duplicate level ordinal', 'duplicate-ordinal', (venue) => { venue.levels[1].ordinal = venue.levels[0].ordinal; }],
  ['missing level plan', 'missing-level-plan', (venue) => { venue.floorPlans.pop(); }],
  ['duplicate plan for level', 'duplicate-level-plan', (venue) => { const plan = { ...venue.floorPlans[0], planId: 'plan.duplicate' }; venue.floorPlans.push(plan); }],
  ['non-positive plan width', 'positive-number', (venue) => { venue.floorPlans[0].widthM = 0; }],
  ['point outside plan bounds', 'plan-bounds', (venue) => { venue.floorPlans[0].shapes[0].points[0].xM = -1; }],
  ['zero-area polygon', 'polygon-area', (venue) => { venue.floorPlans[0].shapes[0].points = [{ xM: 1, yM: 1 }, { xM: 2, yM: 2 }, { xM: 3, yM: 3 }]; }],
  ['shape references missing space', 'unknown-space', (venue) => { venue.floorPlans[0].shapes[0].spaceId = 'space.missing'; }],
  ['indoor space has no shape', 'missing-space-shape', (venue) => { const id = venue.spaces[0].spaceId; venue.floorPlans[0].shapes = venue.floorPlans[0].shapes.filter((shape) => shape.spaceId !== id); }],
  ['navigable space has no primary node', 'space-node', (venue) => { venue.spaces[0].nodeId = null; }],
  ['step-free egress without egress', 'step-free-egress', (venue) => { venue.spaces[0].egressRequired = false; }],
  ['zone references another level', 'multi-level-zone', (venue) => { venue.zones[0].spaceIds[0] = 'space.ground.corridor'; }],
  ['connector repeats a landing level', 'duplicate-landing-level', (venue) => { venue.connectors[0].landings[1].levelId = venue.connectors[0].landings[0].levelId; }],
  ['wheelchair evidence conflicts with step-free evidence', 'accessibility-conflict', (venue) => { venue.connectors[0].accessibility = { stepFree: 'no', wheelchair: 'yes' }; }],
  ['portal connects a space to itself', 'portal-space', (venue) => { venue.portals[0].toSpaceId = venue.portals[0].fromSpaceId; }],
  ['final exit leads to an indoor space', 'final-exit', (venue) => { const portal = venue.portals.find((candidate) => candidate.finalExit)!; portal.toSpaceId = 'space.ground.north'; }],
  ['assembly place is indoors', 'assembly-space', (venue) => { venue.places[0].spaceId = 'space.ground.corridor'; }],
  ['place node has wrong node kind', 'place-node-mismatch', (venue) => { const node = venue.routeNodes.find((candidate) => candidate.nodeId === venue.places[0].nodeId)!; node.kind = 'space'; }],
  ['route node references a missing space', 'unknown-space', (venue) => { venue.routeNodes[0].spaceId = 'space.missing'; }],
  ['route edge references a missing node', 'unknown-node', (venue) => { venue.routeEdges[0].toNodeId = 'node.missing'; }],
  ['walk edge crosses levels', 'cross-level-edge', (venue) => { const walk = venue.routeEdges.find((edge) => edge.kind === 'walk')!; walk.toNodeId = 'node.ground.corridor.primary'; }],
  ['connector traversal uses wrong edge kind', 'connector-kind', (venue) => { const edge = venue.routeEdges.find((candidate) => candidate.connectorId === 'connector.west-stairs')!; edge.kind = 'lift'; }],
  ['portal has no traversal edge', 'portal-edge-count', (venue) => { const portalId = venue.portals[0].portalId; venue.routeEdges = venue.routeEdges.filter((edge) => edge.portalId !== portalId); }],
  ['legacy floor byte is duplicated', 'duplicate-wire-code', (venue) => { venue.legacyFloorCodes[1].code = venue.legacyFloorCodes[0].code; }],
  ['legacy floor mapping is missing', 'missing-wire-code', (venue) => { venue.legacyFloorCodes.pop(); }],
  ['unexpected root data is rejected', 'unexpected-field', (venue) => { (venue as VenuePackage & { surprise: boolean }).surprise = true; }],
];

describe.each(invalidMutations)('venue validation: %s', (_name, expectedCode, mutate) => {
  it(`reports ${expectedCode}`, () => {
    const venue = cloneVenue();
    mutate(venue);
    expect(validateVenuePackage(venue)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: expectedCode }),
    ]));
  });
});
