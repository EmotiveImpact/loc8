'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { root } = require('./source-test-loader.cjs');
const { DEFAULT_MATRIX, aggregate, csv } = require('./benchmark-relay.cjs');
const { makeTopology, sha256 } = require('./relay-simulation.cjs');
const { MODEL_VERSION, POLICIES, compareBranch } = require('./branch-simulation.cjs');

const ASSUMPTIONS = [
  'Same immutable 25-byte payload and canonical raw47-byte frame; full immutable witness excludes only TTL.',
  'Static directed canonical GATT peers; keyed independent erasures, one message and one source attempt.',
  'Native inclusive jitter, first-receipt degree clamp, frozen TTL, full eligible outgoing fanout.',
  'Branch duplicates exclude their witnessed ingress only; same one timer, no retries or cancelled downstream branches.',
  'Exact jitter first-delivery equivalence is model-scoped, not native queue/churn/hostile-identity evidence.',
  'No RF airtime, collision, link retries, discovery, MTU, power, battery, OS suspension or range model.',
  'Dense means descriptive cohort mean canonical degree>=6; all paired trial results remain available.',
  'V1 retry candidate and its gate remain HOLD; v2 uses reliable jitter as its reference and discloses current cost.',
];
function trialKey(row) { return JSON.stringify([row.topology, row.nodeCount, row.targetHops, row.loss, row.repetition, row.policy]); }
function historicalBaselines() {
  const file = path.join(root, 'docs/research/rnd/results/evidence/2026-10-03-ble-density/relay-trials.json.gz');
  const rows = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
  return new Map(rows.filter(row => row.policy === 'current' || row.policy === 'jitter').map(row => [trialKey(row), row]));
}
function gateReport(result) {
  const groups = new Map();
  for (const row of result.aggregates) {
    const key = JSON.stringify([row.topology, row.nodeCount, row.targetHops, row.loss]);
    if (!groups.has(key)) groups.set(key, {});
    groups.get(key)[row.policy] = row;
  }
  const dense = [...groups.values()].filter(group => group.jitter.meanDirectedLinks / group.jitter.nodeCount >= 6);
  const denseStrictSaving = dense.filter(group => group.branch.meanDirectedAttempts < group.jitter.meanDirectedAttempts).length;
  const savings = dense.map(group => 1 - group.branch.meanDirectedAttempts / group.jitter.meanDirectedAttempts);
  const duplicates = compareBranch({ adjacency: [[1], [2], []], source: 0, target: 2,
    seed: 5, loss: 0, originRepeatAtMs: [2] });
  const report = { evidenceClass: 'registered-v2-static-model-gate', runs: result.runs,
    pairedTrials: result.comparisons.length, graphCohorts: groups.size,
    exactJitterArrivalMismatches: result.comparisons.filter(row => !row.exactlyMatchedJitterArrivals).length,
    branchAttemptRegressions: result.comparisons.filter(row => !row.branchAttemptsNoGreaterThanJitter).length,
    historicalBaselineChecked: result.historicalBaselineChecked,
    historicalBaselineMismatches: result.historicalBaselineMismatches,
    denseCohorts: dense.length, denseCohortsWithStrictSaving: denseStrictSaving,
    denseMinimumMeanSavingFraction: savings.length ? Math.min(...savings) : null,
    denseMaximumMeanSavingFraction: savings.length ? Math.max(...savings) : null,
    meanAttemptsSavedPerPairedTrial: result.comparisons.reduce((sum, row) => sum + row.attemptsSavedAgainstJitter, 0) / result.comparisons.length,
    branchCostGreaterThanCurrentCohorts: [...groups.values()].filter(group => group.branch.meanDirectedAttempts > group.current.meanDirectedAttempts).length,
    branchCostMoreThanTwiceCurrentCohorts: [...groups.values()].filter(group => group.branch.meanDirectedAttempts > group.current.meanDirectedAttempts * 2).length,
    soleBridgeDuplicateRepair: !duplicates.current.targetDelivered && duplicates.branch.targetDelivered && duplicates.exactlyMatchedJitterArrivals,
    horizonDroppedEvents: result.aggregates.reduce((sum, row) => sum + row.horizonDroppedEvents, 0),
    denseDefinition: 'mean canonical directed-link degree >=6; descriptive grouping',
    priorV1Decision: 'HOLD_UNCHANGED', productionPromotion: false,
  };
  const pass = report.exactJitterArrivalMismatches === 0 && report.branchAttemptRegressions === 0 &&
    report.historicalBaselineChecked && report.historicalBaselineMismatches === 0 && report.denseCohorts > 0 &&
    report.denseCohortsWithStrictSaving === report.denseCohorts && report.soleBridgeDuplicateRepair && report.horizonDroppedEvents === 0;
  report.decision = pass ? 'REPEAT_NATIVE_SHADOW_ONLY' : 'HOLD_V2_CANDIDATE';
  return report;
}

function benchmarkBranch(matrix = DEFAULT_MATRIX, { checkHistorical = true } = {}) {
  const config = { ...DEFAULT_MATRIX, ...matrix };
  if (!Number.isSafeInteger(config.repetitions) || config.repetitions < 1 || config.repetitions > 1000) throw new RangeError('invalid repetitions');
  const historical = checkHistorical ? historicalBaselines() : null;
  const trials = [], groups = new Map(), comparisons = [], topologyDigests = [];
  let historicalBaselineMismatches = 0;
  for (const topology of ['line', 'crowd', 'sole-bridge']) for (const nodeCount of config.nodeCounts) {
    for (const targetHops of config.targetHops) for (let repetition = 0; repetition < config.repetitions; repetition++) {
      const seed = `${config.seed}:${topology}:${nodeCount}:${targetHops}:${repetition}`;
      const graph = makeTopology(topology, nodeCount, targetHops, seed);
      topologyDigests.push({ topology, nodeCount, targetHops, repetition, seed, digest: graph.digest });
      for (const loss of config.losses) {
        const compared = compareBranch({ ...graph, seed, loss });
        comparisons.push({ topology, nodeCount, targetHops, repetition, seed, loss,
          exactlyMatchedJitterArrivals: compared.exactlyMatchedJitterArrivals,
          branchAttemptsNoGreaterThanJitter: compared.branchAttemptsNoGreaterThanJitter,
          attemptsSavedAgainstJitter: compared.attemptsSavedAgainstJitter });
        for (const policy of POLICIES) {
          const row = { topology, targetHops, repetition, topologyDigest: graph.digest, ...compared[policy] };
          trials.push(row);
          if (historical && policy !== 'branch' && JSON.stringify(historical.get(trialKey(row))) !== JSON.stringify(row)) {
            historicalBaselineMismatches++;
          }
          const groupKey = JSON.stringify([topology, nodeCount, targetHops, loss, policy]);
          if (!groups.has(groupKey)) groups.set(groupKey, []);
          groups.get(groupKey).push(row);
        }
      }
    }
  }
  const result = { model: MODEL_VERSION, evidenceClass: 'deterministic-v2-directed-gatt-simulation',
    matrix: config, policies: POLICIES, assumptions: ASSUMPTIONS, runs: trials.length,
    historicalBaselineChecked: Boolean(historical), historicalBaselineMismatches,
    topologyDigests, comparisons, aggregates: [...groups.values()].map(aggregate), trials };
  result.gates = gateReport(result);
  return result;
}

function writeArtifacts(result, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const { trials, ...summary } = result;
  const files = {
    'branch-matrix.json': Buffer.from(JSON.stringify(summary, null, 2) + '\n'),
    'branch-matrix.csv': Buffer.from(csv(result.aggregates)),
    'branch-trials.json.gz': zlib.gzipSync(Buffer.from(JSON.stringify(trials) + '\n'), { level: 9 }),
    'branch-gates.json': Buffer.from(JSON.stringify(result.gates, null, 2) + '\n'),
  };
  const sourcePaths = [
    'packages/engine/src/experimental/branchRelayPolicy.ts',
    'tools/mesh-rnd/branch-policy.node.cjs', 'tools/mesh-rnd/branch-simulation.cjs',
    'tools/mesh-rnd/branch-simulation.node.cjs', 'tools/mesh-rnd/branch-benchmark.cjs',
    'tools/mesh-rnd/branch-benchmark.node.cjs', 'tools/mesh-rnd/branch-verify.cjs',
    'tools/mesh-rnd/source-test-loader.cjs', 'tools/mesh-rnd/relay-simulation.cjs',
    'tools/mesh-rnd/benchmark-relay.cjs', 'packages/engine/src/experimental/relayPolicy.ts',
    'packages/engine/src/core/packetCodec.ts', 'packages/engine/src/core/floorMath.ts',
    'packages/engine/src/core/fragmentValidation.ts', 'packages/engine/src/core/types.ts',
    'docs/research/rnd/BLE-BRANCH-PROTOCOL-2026-10-03.md', 'package-lock.json',
  ];
  const manifest = { schema: 'loc8.branch-relay-receipt.v2', model: MODEL_VERSION,
    evidenceClass: result.evidenceClass, matrix: result.matrix, runs: result.runs,
    nodeVersion: process.version, typescriptVersion: require('typescript').version,
    code: sourcePaths.map(file => ({ path: file, sha256: sha256(fs.readFileSync(path.join(root, file))) })),
    historicalBaseline: ['relay-trials.json.gz', 'relay-manifest.json'].map(file => {
      const relative = `docs/research/rnd/results/evidence/2026-10-03-ble-density/${file}`;
      return { path: relative, sha256: sha256(fs.readFileSync(path.join(root, relative))) };
    }),
    artifacts: Object.entries(files).map(([file, data]) => ({ path: file, bytes: data.length, sha256: sha256(data) })),
    assumptions: ASSUMPTIONS };
  for (const [file, data] of Object.entries(files)) fs.writeFileSync(path.join(outDir, file), data);
  fs.writeFileSync(path.join(outDir, 'branch-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (require.main === module) {
  const args = process.argv.slice(2); let outDir = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) outDir = path.resolve(args[++i]);
    else throw new Error('usage: node tools/mesh-rnd/branch-benchmark.cjs [--out DIRECTORY]');
  }
  const started = performance.now(), result = benchmarkBranch();
  if (outDir) {
    const manifest = writeArtifacts(result, outDir);
    process.stdout.write(JSON.stringify({ directory: outDir, gates: result.gates, artifacts: manifest.artifacts }, null, 2) + '\n');
  } else { const { trials, ...summary } = result; process.stdout.write(JSON.stringify(summary, null, 2) + '\n'); }
  process.stderr.write(`V2 simulation host cost: ${((performance.now() - started) / 1000).toFixed(3)} seconds; no radio measurement.\n`);
}
module.exports = { ASSUMPTIONS, benchmarkBranch, gateReport, writeArtifacts };
