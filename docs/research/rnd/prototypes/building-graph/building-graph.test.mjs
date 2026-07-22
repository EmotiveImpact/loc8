import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  GraphValidationError,
  ROUTE_PROFILES,
  SCHEMA_VERSION,
  auditEgress,
  canonicalStringify,
  compileBuildingGraph,
  createLegacyFloorCodec,
  graphFingerprint,
  projectLevels,
  projectPlaces,
  projectZones,
  route,
  routeToExit,
  semanticIdentityFingerprint,
  validateBuildingGraph,
} from './building-graph.mjs';
import {
  createCanonicalBuildingGraph,
  createRenamedBuildingGraph,
  createReorderedBuildingGraph,
  createScaleBuildingGraph,
} from './fixture.mjs';

function findBy(items, field, value) {
  const found = items.find((item) => item[field] === value);
  assert.ok(found, `missing ${field}=${value}`);
  return found;
}

function validMutation(name, expectedCode, mutate) {
  return { name, expectedCode, mutate };
}

export const ADVERSARIAL_CASES = Object.freeze([
  validMutation('unknown root field', 'unexpected-field', (graph) => { graph.extra = true; }),
  validMutation('level collection wrong type', 'type', (graph) => { graph.levels = {}; }),
  validMutation('landing collection wrong type', 'type', (graph) => { graph.connectors[0].landings = {}; }),
  validMutation('zone members wrong type', 'type', (graph) => { graph.zones[0].spaceIds = 'space-b1-car-park'; }),
  validMutation('edge accessibility wrong type', 'type', (graph) => { graph.routeEdges[0].accessibility = null; }),
  validMutation('route position wrong type', 'type', (graph) => { graph.routeNodes[0].position = []; }),
  validMutation('wrong schema version', 'schema-version', (graph) => { graph.schemaVersion = 'loc8.building-graph.v0'; }),
  validMutation('malformed building id', 'stable-id', (graph) => { graph.buildingId = 'Building A'; }),
  validMutation('invalid publication status', 'status', (graph) => { graph.status = 'published'; }),
  validMutation('invalid validFrom', 'time', (graph) => { graph.validFrom = 'tomorrow'; }),
  validMutation('validTo before validFrom', 'time-order', (graph) => { graph.validTo = '2020-01-01T00:00:00.000Z'; }),
  validMutation('coordinate unit is not metres', 'coordinate-unit', (graph) => { graph.coordinateFrame.unit = 'ft'; }),
  validMutation('coordinate axes collide', 'coordinate-axis', (graph) => { graph.coordinateFrame.yAxis = graph.coordinateFrame.xAxis; }),
  validMutation('coordinate value unknown field', 'unexpected-field', (graph) => { graph.coordinateFrame.epsg = 4326; }),
  validMutation('source list empty', 'minimum-items', (graph) => { graph.provenance.sourceRefs = []; }),
  validMutation('source hash malformed', 'sha256', (graph) => { graph.provenance.sourceRefs[0].sha256 = 'abc'; }),
  validMutation('source kind unknown', 'source-kind', (graph) => { graph.provenance.sourceRefs[0].kind = 'marketing'; }),
  validMutation('review evidence missing reviewer', 'review-evidence', (graph) => { graph.provenance.review.reviewedBy = null; }),
  validMutation('duplicate level id', 'duplicate-id', (graph) => { graph.levels.push(structuredClone(graph.levels[0])); }),
  validMutation('duplicate level ordinal', 'duplicate-ordinal', (graph) => { graph.levels[2].ordinal = graph.levels[1].ordinal; }),
  validMutation('non-finite level elevation', 'finite-number', (graph) => { graph.levels[0].elevationM = Number.NaN; }),
  validMutation('unknown level field', 'unexpected-field', (graph) => { graph.levels[0].displayOrder = 1; }),
  validMutation('space references unknown level', 'unknown-level', (graph) => { graph.spaces[0].levelId = 'level-missing'; }),
  validMutation('navigable space has no node', 'space-node', (graph) => { graph.spaces[0].nodeId = null; }),
  validMutation('void made navigable', 'void-navigable', (graph) => {
    const space = findBy(graph.spaces, 'spaceId', 'space-ground-void');
    space.navigable = true;
    space.nodeId = 'node-ground-hall';
  }),
  validMutation('step-free egress without general egress', 'accessible-egress-space', (graph) => {
    graph.spaces[0].egressRequired = false;
  }),
  validMutation('zone has no spaces', 'minimum-items', (graph) => { graph.zones[0].spaceIds = []; }),
  validMutation('zone references unknown space', 'unknown-space', (graph) => { graph.zones[0].spaceIds = ['space-missing']; }),
  validMutation('zone crosses levels', 'multi-level-zone', (graph) => { graph.zones[0].spaceIds.push('space-ground-hall'); }),
  validMutation('zone repeats a space', 'duplicate-reference', (graph) => { graph.zones[0].spaceIds.push(graph.zones[0].spaceIds[0]); }),
  validMutation('connector has one landing', 'minimum-items', (graph) => { graph.connectors[0].landings = graph.connectors[0].landings.slice(0, 1); }),
  validMutation('connector repeats landing level', 'duplicate-landing-level', (graph) => { graph.connectors[0].landings[2].levelId = 'level-ground'; }),
  validMutation('landing id duplicated globally', 'duplicate-id', (graph) => { graph.connectors[1].landings[0].landingId = 'landing-east-b1'; }),
  validMutation('landing references unknown space', 'unknown-space', (graph) => { graph.connectors[0].landings[0].spaceId = 'space-missing'; }),
  validMutation('landing node has wrong kind', 'landing-node-mismatch', (graph) => { graph.connectors[0].landings[0].nodeId = 'node-b1-lobby'; }),
  validMutation('connector accessibility conflicts', 'accessibility-conflict', (graph) => {
    graph.connectors[2].accessibility = { stepFree: 'no', wheelchair: 'yes' };
  }),
  validMutation('connector availability unknown enum', 'availability', (graph) => { graph.connectors[0].availability = 'sometimes'; }),
  validMutation('portal connects one space to itself', 'portal-space', (graph) => { graph.portals[0].toSpaceId = graph.portals[0].fromSpaceId; }),
  validMutation('final exit leads indoors', 'final-exit', (graph) => {
    findBy(graph.portals, 'portalId', 'portal-final-exit-east').toSpaceId = 'space-ground-foyer';
  }),
  validMutation('outdoor portal not marked final', 'outdoor-portal', (graph) => {
    findBy(graph.portals, 'portalId', 'portal-final-exit-east').finalExit = false;
  }),
  validMutation('portal accessibility enum unknown', 'accessibility', (graph) => { graph.portals[0].accessibility.stepFree = 'maybe'; }),
  validMutation('assembly place is indoors', 'assembly-space', (graph) => { graph.places[0].spaceId = 'space-ground-hall'; }),
  validMutation('place node missing', 'unknown-node', (graph) => { graph.places[0].nodeId = 'node-missing'; }),
  validMutation('route node references unknown space', 'unknown-space', (graph) => { graph.routeNodes[0].spaceId = 'space-missing'; }),
  validMutation('route node and space levels disagree', 'node-level', (graph) => { graph.routeNodes[0].levelId = 'level-ground'; }),
  validMutation('route node coordinate non-finite', 'finite-number', (graph) => { graph.routeNodes[0].position.xM = Number.POSITIVE_INFINITY; }),
  validMutation('node placed in non-navigable space', 'node-space', (graph) => {
    graph.routeNodes[0].spaceId = 'space-b1-service';
  }),
  validMutation('primary node belongs to another space', 'space-node-mismatch', (graph) => { graph.spaces[0].nodeId = 'node-b1-lobby'; }),
  validMutation('edge references missing node', 'unknown-node', (graph) => { graph.routeEdges[0].fromNodeId = 'node-missing'; }),
  validMutation('edge distance is zero', 'positive-number', (graph) => { graph.routeEdges[0].distanceM = 0; }),
  validMutation('edge duration is negative', 'positive-number', (graph) => { graph.routeEdges[0].durationSec = -1; }),
  validMutation('edge has unknown availability', 'availability', (graph) => { graph.routeEdges[0].availability = 'conditional'; }),
  validMutation('edge repeats id', 'duplicate-id', (graph) => { graph.routeEdges.push(structuredClone(graph.routeEdges[0])); }),
  validMutation('walk edge crosses levels', 'cross-level-edge', (graph) => { graph.routeEdges[0].toNodeId = 'node-ground-hall'; }),
  validMutation('walk edge crosses spaces', 'walk-space', (graph) => { graph.routeEdges[0].toNodeId = 'node-b1-lobby'; }),
  validMutation('connector edge uses wrong connector kind', 'connector-kind', (graph) => {
    findBy(graph.routeEdges, 'edgeId', 'edge-stairs-east-b1-ground').kind = 'lift';
  }),
  validMutation('connector edge uses another landing', 'connector-landing', (graph) => {
    findBy(graph.routeEdges, 'edgeId', 'edge-stairs-east-b1-ground').toNodeId = 'node-landing-west-ground';
  }),
  validMutation('portal route edge has wrong kind', 'portal-edge-kind', (graph) => {
    findBy(graph.routeEdges, 'edgeId', 'edge-door-ground-main-hall').kind = 'exit';
  }),
  validMutation('portal edge orientation reversed', 'portal-node-space', (graph) => {
    const item = findBy(graph.routeEdges, 'edgeId', 'edge-door-ground-main-hall');
    [item.fromNodeId, item.toNodeId] = [item.toNodeId, item.fromNodeId];
  }),
  validMutation('portal direction and edge disagree', 'portal-direction', (graph) => {
    findBy(graph.portals, 'portalId', 'portal-ground-main-hall').direction = 'forward';
  }),
  validMutation('portal has duplicate route edge', 'portal-edge-count', (graph) => {
    const copy = structuredClone(findBy(graph.routeEdges, 'edgeId', 'edge-door-ground-main-hall'));
    copy.edgeId = 'edge-door-ground-main-hall-copy';
    graph.routeEdges.push(copy);
  }),
  validMutation('portal route edge removed', 'portal-edge-count', (graph) => {
    graph.routeEdges = graph.routeEdges.filter((item) => item.edgeId !== 'edge-door-ground-main-hall');
  }),
  validMutation('connector landing traversal removed', 'orphan-landing', (graph) => {
    graph.routeEdges = graph.routeEdges.filter((item) => item.edgeId !== 'edge-stairs-east-b1-ground');
  }),
  validMutation('navigable space is orphaned', 'orphan-space', (graph) => {
    graph.spaces.push({
      spaceId: 'space-ground-orphan',
      levelId: 'level-ground',
      kind: 'room',
      name: 'Orphan room',
      ref: null,
      navigable: true,
      egressRequired: false,
      stepFreeEgressRequired: false,
      nodeId: 'node-ground-orphan',
    });
    graph.routeNodes.push({
      nodeId: 'node-ground-orphan',
      levelId: 'level-ground',
      spaceId: 'space-ground-orphan',
      kind: 'space',
      position: { xM: 100, yM: 100 },
    });
  }),
  validMutation('wire code outside signed field', 'wire-floor-code', (graph) => { graph.legacyFloorCodes[0].code = -65; }),
  validMutation('wire code not injective', 'duplicate-wire-code', (graph) => { graph.legacyFloorCodes[2].code = 0; }),
  validMutation('wire level duplicated', 'duplicate-wire-level', (graph) => { graph.legacyFloorCodes.push({ levelId: 'level-ground', code: 3 }); }),
  validMutation('wire level missing', 'missing-wire-code', (graph) => { graph.legacyFloorCodes = graph.legacyFloorCodes.slice(1); }),
  validMutation('wire mapping references unknown level', 'unknown-level', (graph) => { graph.legacyFloorCodes[0].levelId = 'level-missing'; }),
  validMutation('required edge field absent', 'required', (graph) => { delete graph.routeEdges[0].durationSec; }),
  validMutation('unknown edge field', 'unexpected-field', (graph) => { graph.routeEdges[0].weight = 0; }),
]);

test('schema constant is frozen', () => {
  assert.equal(SCHEMA_VERSION, 'loc8.building-graph.v1');
  assert.deepEqual(ROUTE_PROFILES, [
    'walking', 'step-free', 'evacuation-walking', 'evacuation-step-free',
  ]);
});

test('machine-readable JSON Schema is strict and version aligned', () => {
  const schema = JSON.parse(readFileSync(new URL('./schema-v1.json', import.meta.url), 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.properties.schemaVersion.const, SCHEMA_VERSION);
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes('buildingId'));
  assert.ok(schema.required.includes('routeEdges'));
  assert.equal(schema.$defs.routeEdge.additionalProperties, false);
  assert.deepEqual(schema.$defs.accessibility.properties.stepFree.enum, ['yes', 'no', 'unknown']);
});

test('canonical fixture validates with zero errors', () => {
  assert.deepEqual(validateBuildingGraph(createCanonicalBuildingGraph()), []);
});

test('scale fixture validates and contains at least 1,000 route nodes', () => {
  const graph = createScaleBuildingGraph();
  assert.deepEqual(validateBuildingGraph(graph), []);
  assert.ok(graph.routeNodes.length >= 1_000);
});

test('JSON round trip preserves the full canonical graph', () => {
  const graph = createCanonicalBuildingGraph();
  assert.deepEqual(JSON.parse(JSON.stringify(graph)), graph);
});

test('collection reorder preserves canonical graph fingerprint', () => {
  const graph = createCanonicalBuildingGraph();
  const reordered = createReorderedBuildingGraph();
  assert.equal(canonicalStringify(graph), canonicalStringify(reordered));
  assert.equal(graphFingerprint(graph), graphFingerprint(reordered));
});

test('label rename changes full graph but preserves semantic identity', () => {
  const graph = createCanonicalBuildingGraph();
  const renamed = createRenamedBuildingGraph();
  assert.notEqual(graphFingerprint(graph), graphFingerprint(renamed));
  assert.equal(semanticIdentityFingerprint(graph), semanticIdentityFingerprint(renamed));
});

test('coordinate-frame semantics change the semantic identity fingerprint', () => {
  const graph = createCanonicalBuildingGraph();
  const changed = structuredClone(graph);
  changed.coordinateFrame.originDescription = 'A different surveyed control point';
  assert.notEqual(semanticIdentityFingerprint(graph), semanticIdentityFingerprint(changed));
});

test('malformed root fails closed without throwing', () => {
  assert.deepEqual(validateBuildingGraph(null), [{ code: 'type', path: '$', message: 'must be an object' }]);
});

test('FLOOR-01 stable IDs are preserved exactly', () => {
  const graph = createCanonicalBuildingGraph();
  assert.equal(graph.buildingId, 'building-synthetic-a001');
  assert.equal(graph.mapVersion, 'map-synthetic-v1');
  assert.deepEqual(graph.levels.map((item) => item.levelId), ['level-b1', 'level-ground', 'level-2a']);
  const stairs = findBy(graph.connectors, 'connectorId', 'connector-east-stairs');
  assert.ok(stairs.landings.some((item) => item.landingId === 'landing-east-ground'));
  assert.ok(stairs.landings.some((item) => item.landingId === 'landing-east-2a'));
});

test('fixture covers every required semantic kind', () => {
  const graph = createCanonicalBuildingGraph();
  assert.deepEqual(new Set(graph.levels.map((item) => item.levelRef)), new Set(['B1', 'G', '2A']));
  for (const kind of ['room', 'corridor', 'lobby', 'service', 'outdoor', 'void']) {
    assert.ok(graph.spaces.some((item) => item.kind === kind), `missing space kind ${kind}`);
  }
  for (const kind of ['stairs', 'lift', 'escalator', 'ramp']) {
    assert.ok(graph.connectors.some((item) => item.kind === kind), `missing connector ${kind}`);
  }
  assert.equal(graph.portals.filter((item) => item.finalExit).length, 2);
  assert.ok(graph.places.some((item) => item.kind === 'assembly'));
  assert.ok(graph.portals.some((item) => item.accessibility.stepFree === 'unknown'));
});

test('every named adversarial mutation fails with its expected issue code', async (t) => {
  assert.ok(ADVERSARIAL_CASES.length >= 35);
  for (const scenario of ADVERSARIAL_CASES) {
    await t.test(scenario.name, () => {
      const graph = structuredClone(createCanonicalBuildingGraph());
      scenario.mutate(graph);
      const errors = validateBuildingGraph(graph);
      assert.ok(errors.length > 0, `${scenario.name} unexpectedly validated`);
      assert.ok(
        errors.some((error) => error.code === scenario.expectedCode),
        `${scenario.name}: expected ${scenario.expectedCode}; got ${JSON.stringify(errors)}`,
      );
    });
  }
});

test('invalid graph cannot compile', () => {
  const graph = createCanonicalBuildingGraph();
  graph.levels[0].ordinal = graph.levels[1].ordinal;
  assert.throws(() => compileBuildingGraph(graph), GraphValidationError);
});

test('ordinary cross-floor route selects lift and ordered levels', () => {
  const result = route(compileBuildingGraph(createCanonicalBuildingGraph()), {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'walking',
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.levelIds, ['level-b1', 'level-ground', 'level-2a']);
  assert.deepEqual(result.connectorIds, ['connector-central-lift']);
  assert.ok(result.edgeIds.includes('edge-lift-b1-ground'));
  assert.ok(result.edgeIds.includes('edge-lift-ground-2a'));
});

test('route sequence is contiguous and ordered', () => {
  const compiled = compileBuildingGraph(createCanonicalBuildingGraph());
  const result = route(compiled, {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'walking',
  });
  assert.equal(result.nodeIds.length, result.edgeIds.length + 1);
  assert.equal(result.nodeIds[0], result.fromNodeId);
  assert.equal(result.nodeIds.at(-1), result.toNodeId);
});

test('step-free route uses only affirmative accessible edges and lift', () => {
  const compiled = compileBuildingGraph(createCanonicalBuildingGraph());
  const result = route(compiled, {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'step-free',
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.connectorIds, ['connector-central-lift']);
  for (const edgeId of result.edgeIds) {
    const item = compiled.topology.edges.get(edgeId);
    assert.equal(item.accessibility.stepFree, 'yes');
    assert.equal(item.accessibility.wheelchair, 'yes');
    assert.notEqual(item.kind, 'stairs');
  }
});

test('closing lift reroutes step-free travel through ramp', () => {
  const result = route(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'step-free',
    closedConnectorIds: ['connector-central-lift'],
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.connectorIds, ['connector-access-ramp']);
});

test('closing both verified accessible connectors fails closed', () => {
  const result = route(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'step-free',
    closedConnectorIds: ['connector-central-lift', 'connector-access-ramp'],
  });
  assert.deepEqual(result.outcome, 'no-route');
  assert.equal(result.reason, 'no-eligible-route');
});

test('unknown baseline connector availability is never treated as open', () => {
  const graph = createCanonicalBuildingGraph();
  findBy(graph.connectors, 'connectorId', 'connector-central-lift').availability = 'unknown';
  const result = route(graph, {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'step-free',
    closedConnectorIds: ['connector-access-ramp'],
  });
  assert.equal(result.outcome, 'no-route');
});

test('unknown baseline edge availability is never treated as open', () => {
  const graph = createCanonicalBuildingGraph();
  findBy(graph.routeEdges, 'edgeId', 'edge-door-2a-observation-foyer').availability = 'unknown';
  const result = route(graph, {
    fromNodeId: 'node-2a-observation',
    toNodeId: 'node-2a-foyer',
    profile: 'walking',
  });
  assert.equal(result.outcome, 'no-route');
});

test('walking may traverse unknown accessibility evidence', () => {
  const result = route(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-2a-observation',
    toNodeId: 'node-2a-foyer',
    profile: 'walking',
  });
  assert.equal(result.outcome, 'ok');
  assert.ok(result.edgeIds.includes('edge-door-2a-observation-foyer'));
});

test('step-free route rejects unknown accessibility evidence', () => {
  const result = route(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-2a-observation',
    toNodeId: 'node-2a-foyer',
    profile: 'step-free',
  });
  assert.equal(result.outcome, 'no-route');
});

test('upward-only escalator works in its declared direction', () => {
  const result = route(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-landing-escalator-ground',
    toNodeId: 'node-landing-escalator-2a',
    profile: 'walking',
    closedConnectorIds: [
      'connector-east-stairs', 'connector-west-stairs', 'connector-central-lift', 'connector-access-ramp',
    ],
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.edgeIds, ['edge-escalator-ground-2a']);
});

test('upward-only escalator rejects reverse traversal', () => {
  const result = route(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-landing-escalator-2a',
    toNodeId: 'node-landing-escalator-ground',
    profile: 'walking',
    closedConnectorIds: [
      'connector-east-stairs', 'connector-west-stairs', 'connector-central-lift', 'connector-access-ramp',
    ],
  });
  assert.equal(result.outcome, 'no-route');
});

test('forward-only portal permits only its declared orientation', () => {
  const graph = createCanonicalBuildingGraph();
  findBy(graph.portals, 'portalId', 'portal-2a-observation-foyer').direction = 'forward';
  findBy(graph.routeEdges, 'edgeId', 'edge-door-2a-observation-foyer').bidirectional = false;
  assert.equal(route(graph, {
    fromNodeId: 'node-2a-observation',
    toNodeId: 'node-2a-foyer',
    profile: 'walking',
  }).outcome, 'ok');
  assert.equal(route(graph, {
    fromNodeId: 'node-2a-foyer',
    toNodeId: 'node-2a-observation',
    profile: 'walking',
  }).outcome, 'no-route');
});

test('evacuation route excludes lift and escalator and uses east stairs', () => {
  const result = routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-2a-balcony',
    profile: 'evacuation-walking',
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.connectorIds, ['connector-east-stairs']);
  assert.ok(!result.edgeIds.some((id) => id.startsWith('edge-lift-') || id.startsWith('edge-escalator-')));
  assert.equal(result.exitPortalId, 'portal-final-exit-east');
});

test('closing east stairs reroutes evacuation through west stairs', () => {
  const result = routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-2a-balcony',
    profile: 'evacuation-walking',
    closedConnectorIds: ['connector-east-stairs'],
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.connectorIds, ['connector-west-stairs']);
});

test('closing both stairs reroutes evacuation through emergency ramp', () => {
  const result = routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-2a-balcony',
    profile: 'evacuation-walking',
    closedConnectorIds: ['connector-east-stairs', 'connector-west-stairs'],
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.connectorIds, ['connector-access-ramp']);
});

test('closing all evacuation connectors returns no route', () => {
  const result = routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-2a-balcony',
    profile: 'evacuation-walking',
    closedConnectorIds: ['connector-east-stairs', 'connector-west-stairs', 'connector-access-ramp'],
  });
  assert.equal(result.outcome, 'no-route');
});

test('closing east exit selects west final exit', () => {
  const result = routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-ground-hall',
    profile: 'evacuation-walking',
    closedEdgeIds: ['edge-exit-east'],
  });
  assert.equal(result.outcome, 'ok');
  assert.equal(result.exitPortalId, 'portal-final-exit-west');
  assert.ok(result.edgeIds.includes('edge-exit-west'));
});

test('closing both final-exit edges returns no route', () => {
  const result = routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-ground-hall',
    profile: 'evacuation-walking',
    closedEdgeIds: ['edge-exit-east', 'edge-exit-west'],
  });
  assert.equal(result.outcome, 'no-route');
});

test('step-free evacuation excludes lift and uses emergency ramp', () => {
  const result = routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-2a-balcony',
    profile: 'evacuation-step-free',
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.connectorIds, ['connector-access-ramp']);
  assert.ok(!result.edgeIds.some((id) => id.startsWith('edge-lift-')));
});

test('egress audit reaches every required space', () => {
  const report = auditEgress(createCanonicalBuildingGraph());
  assert.equal(report.walking.required, 8);
  assert.equal(report.walking.percent, 100);
  assert.equal(report.stepFree.required, 7);
  assert.equal(report.stepFree.percent, 100);
  assert.deepEqual(report.walking.failures, []);
  assert.deepEqual(report.stepFree.failures, []);
});

test('egress audit exposes closure failures rather than hiding them', () => {
  const report = auditEgress(createCanonicalBuildingGraph(), {
    closedEdgeIds: ['edge-exit-east', 'edge-exit-west'],
  });
  assert.equal(report.walking.reachable, 0);
  assert.equal(report.stepFree.reachable, 0);
  assert.ok(report.walking.failures.length > 0);
});

test('route overlays never mutate the published graph', () => {
  const graph = createCanonicalBuildingGraph();
  const before = JSON.stringify(graph);
  routeToExit(graph, {
    fromNodeId: 'node-2a-balcony',
    profile: 'evacuation-walking',
    closedEdgeIds: ['edge-exit-east'],
    closedConnectorIds: ['connector-east-stairs'],
  });
  assert.equal(JSON.stringify(graph), before);
});

test('compiled graph snapshots resist caller mutation after validation', () => {
  const source = createCanonicalBuildingGraph();
  const compiled = compileBuildingGraph(source);
  findBy(source.connectors, 'connectorId', 'connector-central-lift').availability = 'closed';
  const result = route(compiled, {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'walking',
  });
  assert.deepEqual(result.connectorIds, ['connector-central-lift']);
  assert.ok(Object.isFrozen(compiled.graph));
  assert.ok(Object.isFrozen(compiled.graph.connectors[0]));
  assert.equal(compiled.topology.edges.set, undefined);
  assert.equal(compiled.adjacency.clear, undefined);
});

test('renamed labels preserve route sequence and semantic fingerprint', () => {
  const request = {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'walking',
  };
  const before = route(createCanonicalBuildingGraph(), request);
  const after = route(createRenamedBuildingGraph(), request);
  assert.deepEqual(after.edgeIds, before.edgeIds);
  assert.deepEqual(after.nodeIds, before.nodeIds);
  assert.equal(after.semanticFingerprint, before.semanticFingerprint);
});

test('collection reorder preserves route sequence and semantic fingerprint', () => {
  const request = {
    fromNodeId: 'node-b1-car-park',
    toNodeId: 'node-2a-balcony',
    profile: 'walking',
  };
  const before = route(createCanonicalBuildingGraph(), request);
  const after = route(createReorderedBuildingGraph(), request);
  assert.deepEqual(after.edgeIds, before.edgeIds);
  assert.equal(after.semanticFingerprint, before.semanticFingerprint);
});

test('equal-cost alternatives resolve by stable edge id', () => {
  const graph = createCanonicalBuildingGraph();
  findBy(graph.routeEdges, 'edgeId', 'edge-walk-2a-west').durationSec = 3;
  findBy(graph.routeEdges, 'edgeId', 'edge-stairs-west-ground-2a').durationSec = 70;
  findBy(graph.routeEdges, 'edgeId', 'edge-walk-ground-west').durationSec = 3;
  const result = routeToExit(graph, {
    fromNodeId: 'node-2a-foyer',
    profile: 'evacuation-walking',
  });
  assert.equal(result.outcome, 'ok');
  assert.deepEqual(result.connectorIds, ['connector-east-stairs']);
});

test('unknown origin is an invalid request', () => {
  assert.deepEqual(routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-missing',
    profile: 'evacuation-walking',
  }), { outcome: 'invalid-request', reason: 'unknown-origin' });
});

test('unknown destination is an invalid request', () => {
  assert.deepEqual(route(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-ground-hall',
    toNodeId: 'node-missing',
    profile: 'walking',
  }), { outcome: 'invalid-request', reason: 'unknown-destination' });
});

test('unknown profile is an invalid request', () => {
  assert.deepEqual(route(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-ground-hall',
    toNodeId: 'node-ground-foyer',
    profile: 'fastest',
  }), { outcome: 'invalid-request', reason: 'invalid-profile' });
});

test('unknown closed edge is an invalid request', () => {
  assert.deepEqual(routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-ground-hall',
    profile: 'evacuation-walking',
    closedEdgeIds: ['edge-missing'],
  }), { outcome: 'invalid-request', reason: 'unknown-closed-edge', id: 'edge-missing' });
});

test('unknown closed connector is an invalid request', () => {
  assert.deepEqual(routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-ground-hall',
    profile: 'evacuation-walking',
    closedConnectorIds: ['connector-missing'],
  }), { outcome: 'invalid-request', reason: 'unknown-closed-connector', id: 'connector-missing' });
});

test('unknown request field is rejected', () => {
  assert.deepEqual(routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-ground-hall',
    profile: 'evacuation-walking',
    avoidCrowds: true,
  }), { outcome: 'invalid-request', reason: 'unknown-request-field', field: 'avoidCrowds' });
});

test('non-array closure input is rejected', () => {
  assert.deepEqual(routeToExit(createCanonicalBuildingGraph(), {
    fromNodeId: 'node-ground-hall',
    profile: 'evacuation-walking',
    closedEdgeIds: 'edge-exit-east',
  }), { outcome: 'invalid-request', reason: 'invalid-closedEdgeIds' });
});

test('level projection is semantically ordered, not label sorted', () => {
  const rows = projectLevels(createCanonicalBuildingGraph());
  assert.deepEqual(rows.map((item) => item.levelRef), ['B1', 'G', '2A']);
  assert.deepEqual(rows.map((item) => item.ordinal), [-1, 0, 2]);
  assert.ok(rows.every((item) => item.buildingId === 'building-synthetic-a001'));
});

test('zone projection keeps building, map, level and member-space identity', () => {
  const zones = projectZones(createCanonicalBuildingGraph());
  const item = findBy(zones, 'zoneId', 'zone-ground-foyer');
  assert.equal(item.buildingId, 'building-synthetic-a001');
  assert.equal(item.mapVersion, 'map-synthetic-v1');
  assert.equal(item.levelId, 'level-ground');
  assert.deepEqual(item.spaceIds, ['space-ground-foyer', 'space-ground-hall']);
  assert.ok(Number.isFinite(item.localCenterM.xM));
});

test('assembly projection keeps stable identity separate from label', () => {
  const places = projectPlaces(createCanonicalBuildingGraph(), 'assembly');
  assert.deepEqual(places, [{
    buildingId: 'building-synthetic-a001',
    mapVersion: 'map-synthetic-v1',
    placeId: 'place-assembly-a',
    kind: 'assembly',
    name: 'Assembly Point A',
    spaceId: 'space-ground-outside-east',
    levelId: 'level-ground',
    nodeId: 'node-place-assembly-a',
  }]);
});

test('legacy floor codec is explicit, injective and reversible', () => {
  const codec = createLegacyFloorCodec(createCanonicalBuildingGraph());
  assert.equal(codec.encode('level-b1'), -1);
  assert.equal(codec.encode('level-ground'), 0);
  assert.equal(codec.encode('level-2a'), 2);
  assert.equal(codec.decode(-1), 'level-b1');
  assert.equal(codec.decode(2), 'level-2a');
});

test('legacy floor codec rejects unknown semantic level', () => {
  const codec = createLegacyFloorCodec(createCanonicalBuildingGraph());
  assert.throws(() => codec.encode('level-unknown'), RangeError);
});

test('legacy floor codec rejects unknown wire code', () => {
  const codec = createLegacyFloorCodec(createCanonicalBuildingGraph());
  assert.throws(() => codec.decode(63), RangeError);
});
