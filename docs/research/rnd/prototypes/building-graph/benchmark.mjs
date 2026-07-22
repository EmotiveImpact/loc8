import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import {
  ROUTE_PROFILES,
  auditEgress,
  compileBuildingGraph,
  graphFingerprint,
  route,
  routeToExit,
  semanticIdentityFingerprint,
  validateBuildingGraph,
} from './building-graph.mjs';
import { createScaleBuildingGraph } from './fixture.mjs';

const INTERIOR_NODE_COUNT = 1_000;
const QUERY_COUNT = 10_000;
const MAXIMUM_DURATION_MS = 5_000;

function pad(index) {
  return String(index).padStart(4, '0');
}

function makeQueries() {
  return Array.from({ length: QUERY_COUNT }, (_, index) => {
    const base = {
      fromNodeId: `node-scale-${pad((index * 37 + 13) % INTERIOR_NODE_COUNT)}`,
      profile: ROUTE_PROFILES[index % ROUTE_PROFILES.length],
      closedEdgeIds: index % 13 === 0
        ? [`edge-scale-${pad((index * 97) % (INTERIOR_NODE_COUNT - 1))}`]
        : [],
      closedConnectorIds: [],
    };
    if (index % 5 === 0) return { kind: 'exit', request: base };
    return {
      kind: 'point',
      request: {
        ...base,
        toNodeId: `node-scale-${pad((index * 173 + 499) % INTERIOR_NODE_COUNT)}`,
      },
    };
  });
}

function digestQueries(queries) {
  const hash = createHash('sha256');
  for (const query of queries) hash.update(JSON.stringify(query));
  return hash.digest('hex');
}

function run(compiled, queries) {
  const resultHash = createHash('sha256');
  const outcomes = { ok: 0, 'no-route': 0, 'invalid-request': 0 };
  const profiles = Object.fromEntries(ROUTE_PROFILES.map((profile) => [profile, 0]));
  let traversedEdges = 0;
  const startedAt = performance.now();
  queries.forEach(({ kind, request }, index) => {
    const result = kind === 'exit' ? routeToExit(compiled, request) : route(compiled, request);
    outcomes[result.outcome] = (outcomes[result.outcome] ?? 0) + 1;
    profiles[request.profile] += 1;
    traversedEdges += result.edgeIds?.length ?? 0;
    resultHash.update(JSON.stringify({
      index,
      kind,
      outcome: result.outcome,
      reason: result.reason,
      semanticFingerprint: result.semanticFingerprint ?? null,
      totalDistanceM: result.totalDistanceM ?? null,
      totalDurationSec: result.totalDurationSec ?? null,
      exitPortalId: result.exitPortalId ?? null,
    }));
  });
  return {
    durationMs: Number((performance.now() - startedAt).toFixed(3)),
    outcomes,
    profiles,
    traversedEdges,
    resultFingerprintSha256: resultHash.digest('hex'),
  };
}

const graph = createScaleBuildingGraph({ interiorNodeCount: INTERIOR_NODE_COUNT });
const validationErrors = validateBuildingGraph(graph);
const compiled = compileBuildingGraph(graph);
const queries = makeQueries();
const queryFingerprintSha256 = digestQueries(queries);
const first = run(compiled, queries);
const second = run(compiled, queries);
const egress = auditEgress(compiled);
const closureQueryCount = queries.filter(({ request }) => request.closedEdgeIds.length > 0).length;
const exitQueryCount = queries.filter(({ kind }) => kind === 'exit').length;
const pointQueryCount = queries.length - exitQueryCount;
const resultFingerprintsMatch = first.resultFingerprintSha256 === second.resultFingerprintSha256;

const gatePass =
  validationErrors.length === 0 &&
  graph.routeNodes.length >= 1_000 &&
  queries.length === QUERY_COUNT &&
  closureQueryCount > 0 &&
  exitQueryCount > 0 &&
  first.outcomes.ok > 0 &&
  first.outcomes['no-route'] > 0 &&
  first.outcomes['invalid-request'] === 0 &&
  second.outcomes['invalid-request'] === 0 &&
  first.durationMs < MAXIMUM_DURATION_MS &&
  second.durationMs < MAXIMUM_DURATION_MS &&
  resultFingerprintsMatch &&
  egress.walking.percent === 100 &&
  egress.stepFree.percent === 100;

const evidence = {
  benchmark: 'map-01-building-graph-v1',
  runtime: process.version,
  platform: process.platform,
  architecture: process.arch,
  graph: {
    buildingId: graph.buildingId,
    mapVersion: graph.mapVersion,
    routeNodeCount: graph.routeNodes.length,
    routeEdgeCount: graph.routeEdges.length,
    fullFingerprintSha256: graphFingerprint(graph),
    semanticIdentityFingerprintSha256: semanticIdentityFingerprint(graph),
    validationErrorCount: validationErrors.length,
  },
  queries: {
    count: queries.length,
    minimumCount: QUERY_COUNT,
    pointQueryCount,
    exitQueryCount,
    closureQueryCount,
    queryFingerprintSha256,
  },
  maximumDurationMs: MAXIMUM_DURATION_MS,
  runs: [first, second],
  resultFingerprintsMatch,
  egress,
  gatePass,
};

process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!gatePass) process.exitCode = 1;
