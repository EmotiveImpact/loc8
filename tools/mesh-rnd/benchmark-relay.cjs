'use strict';
// Deterministic artifacts; timing is diagnostic stderr only, never benchmark evidence.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { root } = require('./source-test-loader.cjs');
const { MODEL_VERSION, POLICIES, TOPOLOGIES, sha256, makeTopology, percentile,
  simulateRelay, simulateStoreCarryForward } = require('./relay-simulation.cjs');

const DEFAULT_MATRIX = Object.freeze({ nodeCounts: [10, 25, 50, 100, 250],
  targetHops: [1, 3, 7], losses: [0, 0.1, 0.3, 0.5], repetitions: 10, seed: 'loc8-r3-2026-10-03' });
const ASSUMPTIONS = Object.freeze([
  'Synthetic single immutable 25-byte application packet; no production transport wiring.',
  'Directed persistent GATT links with full fanout and admitted-ingress split horizon.',
  'Independent keyed Bernoulli link erasures; no collision, contention or RF airtime model.',
  'Canonical synthetic peers; native dual central/peripheral role identities not modelled.',
  'Current policy includes native degree jitter and first-duplicate cancellation.',
  'Jitter policy is an ablation removing cancellation; Trickle is an independently written bounded variant.',
  'Existing origin TTL7, dense clamp and decrement retained for every policy.',
  'One source attempt; Trickle adds bounded relay attempts only, not origin retries.',
  'No discovery, queue/backpressure, MTU, RSSI/range, mobility, OS background or battery evidence.',
  'Ideal TTL eligibility is a route upper bound; receipt-order and suppression can still prevent delivery.',
  'Source-born lifetime in the separate contact model is trusted out-of-band synthetic metadata.',
]);
const COLUMNS = ['topology', 'nodeCount', 'targetHops', 'loss', 'policy', 'runs',
  'allNodeDeliveryRate', 'ttlEligibleDeliveryRate', 'targetDeliveryRate', 'targetTTLEligibleRate',
  'meanDirectedAttempts', 'meanUsefulDeliveries', 'meanDuplicateArrivals',
  'meanSuppressionDecisions', 'meanCancelledRelays', 'meanRelayForwards',
  'p50LatencyMs', 'p95LatencyMs', 'targetP50LatencyMs', 'targetP95LatencyMs',
  'meanStructurallyUnreachableNodes', 'meanTTLIneligibleNodes', 'meanEligibleUndeliveredNodes',
  'meanDirectedLinks', 'maxEventsProcessed', 'horizonDroppedEvents'];

function aggregate(rows) {
  const mean = field => rows.reduce((sum, row) => sum + row[field], 0) / rows.length;
  const validMean = field => {
    const usable = rows.filter(row => row[field] !== null);
    return usable.length === 0 ? null : usable.reduce((sum, row) => sum + row[field], 0) / usable.length;
  };
  const latencies = rows.flatMap(row => row.latenciesMs);
  const targets = rows.map(row => row.targetLatencyMs).filter(value => value !== null);
  const first = rows[0];
  return { topology: first.topology, nodeCount: first.nodeCount, targetHops: first.targetHops,
    loss: first.loss, policy: first.policy, runs: rows.length,
    allNodeDeliveryRate: mean('allNodeDeliveryRate'), ttlEligibleDeliveryRate: validMean('ttlEligibleDeliveryRate'),
    targetDeliveryRate: mean('targetDelivered'), targetTTLEligibleRate: mean('targetTTLEligible'),
    meanDirectedAttempts: mean('directedAttempts'), meanUsefulDeliveries: mean('usefulDeliveries'),
    meanDuplicateArrivals: mean('duplicateArrivals'), meanSuppressionDecisions: mean('suppressionDecisions'),
    meanCancelledRelays: mean('cancelledRelays'), meanRelayForwards: mean('relayForwards'),
    p50LatencyMs: percentile(latencies, 0.5), p95LatencyMs: percentile(latencies, 0.95),
    targetP50LatencyMs: percentile(targets, 0.5), targetP95LatencyMs: percentile(targets, 0.95),
    meanStructurallyUnreachableNodes: mean('structurallyUnreachableNodes'),
    meanTTLIneligibleNodes: mean('ttlIneligibleNodes'), meanEligibleUndeliveredNodes: mean('eligibleUndeliveredNodes'),
    meanDirectedLinks: mean('directedLinks'), maxEventsProcessed: Math.max(...rows.map(row => row.eventsProcessed)),
    horizonDroppedEvents: rows.reduce((sum, row) => sum + row.horizonDroppedEvents, 0) };
}

function benchmarkRelay(matrix = DEFAULT_MATRIX) {
  const config = { ...DEFAULT_MATRIX, ...matrix };
  if (!Number.isSafeInteger(config.repetitions) || config.repetitions < 1 || config.repetitions > 1000) {
    throw new RangeError('repetitions must be an integer in [1, 1000]');
  }
  const trials = [], groups = new Map(), topologyDigests = [];
  for (const topology of TOPOLOGIES) for (const nodeCount of config.nodeCounts) {
    for (const targetHops of config.targetHops) for (let repetition = 0; repetition < config.repetitions; repetition++) {
      // Shared topology per repetition across loss levels and policies.
      const seed = `${config.seed}:${topology}:${nodeCount}:${targetHops}:${repetition}`;
      const graph = makeTopology(topology, nodeCount, targetHops, seed);
      topologyDigests.push({ topology, nodeCount, targetHops, repetition, seed, digest: graph.digest });
      for (const loss of config.losses) for (const policy of POLICIES) {
        const result = simulateRelay({ ...graph, loss, policy, seed });
        const row = { topology, targetHops, repetition, topologyDigest: graph.digest, ...result };
        trials.push(row);
        const groupKey = JSON.stringify([topology, nodeCount, targetHops, loss, policy]);
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey).push(row);
      }
    }
  }
  const aggregates = [...groups.values()].map(aggregate);
  const carryForward = {
    beforeExpiry: simulateStoreCarryForward({ nodeCount: 3, lifetimeMs: 1000,
      contacts: [{ at: 10, from: 0, to: 1 }, { at: 900, from: 1, to: 2 }] }),
    duplicateThenExpiry: simulateStoreCarryForward({ nodeCount: 3, lifetimeMs: 1000,
      contacts: [{ at: 10, from: 0, to: 1 }, { at: 999, from: 0, to: 1 },
        { at: 1000, from: 1, to: 2 }] }),
  };
  return { model: MODEL_VERSION, evidenceClass: 'deterministic-software-simulation',
    matrix: config, policies: POLICIES, topologies: TOPOLOGIES, assumptions: ASSUMPTIONS,
    runs: trials.length, topologyDigests, aggregates, carryForward, trials };
}

function csv(rows) {
  const escape = value => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[",\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return COLUMNS.join(',') + '\n' + rows.map(row => COLUMNS.map(column => escape(row[column])).join(',')).join('\n') + '\n';
}

function writeArtifacts(result, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const { trials, ...summary } = result;
  const files = {
    'relay-matrix.json': Buffer.from(JSON.stringify(summary, null, 2) + '\n'),
    'relay-matrix.csv': Buffer.from(csv(result.aggregates)),
    'relay-trials.json.gz': zlib.gzipSync(Buffer.from(JSON.stringify(trials) + '\n'), { level: 9 }),
  };
  const sourcePaths = [
    'packages/engine/src/experimental/relayPolicy.ts',
    'tools/mesh-rnd/relay-simulation.cjs', 'tools/mesh-rnd/relay-simulation.node.cjs',
    'tools/mesh-rnd/benchmark-relay.cjs', 'tools/mesh-rnd/source-test-loader.cjs',
    'tools/mesh-rnd/relay-policy.node.cjs',
    'packages/engine/src/core/packetCodec.ts', 'packages/engine/src/core/floorMath.ts',
    'packages/engine/src/core/fragmentValidation.ts', 'packages/engine/src/core/types.ts',
    'docs/research/rnd/BLE-DENSITY-PROTOCOL-2026-10-03.md', 'package-lock.json',
  ];
  const manifest = { schema: 'loc8.relay-simulation-receipt.v1', model: MODEL_VERSION,
    evidenceClass: result.evidenceClass, matrix: result.matrix, runs: result.runs,
    nodeVersion: process.version, typescriptVersion: require('typescript').version,
    code: sourcePaths.map(file => ({ path: file, sha256: sha256(fs.readFileSync(path.join(root, file))) })),
    artifacts: Object.entries(files).map(([file, data]) => ({ path: file, bytes: data.length, sha256: sha256(data) })),
    assumptions: ASSUMPTIONS };
  for (const [file, data] of Object.entries(files)) fs.writeFileSync(path.join(outDir, file), data);
  fs.writeFileSync(path.join(outDir, 'relay-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let outDir = null, repetitions = DEFAULT_MATRIX.repetitions;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) outDir = path.resolve(args[++i]);
    else if (args[i] === '--repetitions' && args[i + 1]) repetitions = Number(args[++i]);
    else throw new Error('usage: node tools/mesh-rnd/benchmark-relay.cjs [--out DIRECTORY] [--repetitions 10]');
  }
  const started = performance.now();
  const result = benchmarkRelay({ repetitions });
  if (outDir) {
    const manifest = writeArtifacts(result, outDir);
    process.stdout.write(JSON.stringify({ outputDirectory: outDir, runs: result.runs,
      aggregateRows: result.aggregates.length, artifacts: manifest.artifacts }, null, 2) + '\n');
  } else {
    const { trials, ...summary } = result;
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  }
  process.stderr.write(`Simulation host cost: ${((performance.now() - started) / 1000).toFixed(3)} seconds; no radio measurement.\n`);
}

module.exports = { DEFAULT_MATRIX, ASSUMPTIONS, COLUMNS, aggregate, benchmarkRelay, csv, writeArtifacts };
