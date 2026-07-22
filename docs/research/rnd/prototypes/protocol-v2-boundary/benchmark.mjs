import { performance } from 'node:perf_hooks';
import { selectFanout } from './protocol-v2-boundary.mjs';

function handle(number) {
  const value = new Uint8Array(8);
  new DataView(value.buffer).setBigUint64(0, BigInt(number));
  return value;
}

function makeGraph(size, targetDegree) {
  const graph = new Map(Array.from({ length: size }, (_, i) => [`n${i}`, new Set()]));
  const link = (a, b) => { graph.get(a).add(b); graph.get(b).add(a); };
  for (let i = 0; i < size; i += 1) link(`n${i}`, `n${(i + 1) % size}`);
  for (let distance = 2; distance <= Math.ceil(targetDegree / 2); distance += 1) {
    for (let i = 0; i < size; i += 1) link(`n${i}`, `n${(i + distance) % size}`);
  }
  return graph;
}

function flood(graph, messageHandle, controlled) {
  const seen = new Set(['n0']);
  const queue = [{ node: 'n0', ingress: null }];
  let attempts = 0;
  let duplicates = 0;
  while (queue.length) {
    const { node, ingress } = queue.shift();
    const candidates = [...graph.get(node)].filter((neighbor) => neighbor !== ingress);
    const selected = controlled
      ? selectFanout(candidates, messageHandle, { nodeId: node, trafficClass: 'normal' })
      : candidates;
    for (const neighbor of selected) {
      attempts += 1;
      if (seen.has(neighbor)) { duplicates += 1; continue; }
      seen.add(neighbor);
      queue.push({ node: neighbor, ingress: node });
    }
  }
  return { delivered: seen.size, attempts, duplicates };
}

const size = 32;
const messages = 100;
const cohorts = [];
const started = performance.now();
for (const degree of [2, 4, 8, 16, 31]) {
  const graph = makeGraph(size, degree);
  const totals = { fullAttempts: 0, controlledAttempts: 0, fullDelivered: 0, controlledDelivered: 0 };
  for (let i = 0; i < messages; i += 1) {
    const id = handle(degree * 1000 + i);
    const full = flood(graph, id, false);
    const controlled = flood(graph, id, true);
    totals.fullAttempts += full.attempts;
    totals.controlledAttempts += controlled.attempts;
    totals.fullDelivered += full.delivered;
    totals.controlledDelivered += controlled.delivered;
  }
  cohorts.push({
    nodes: size,
    targetDegree: degree,
    messages,
    fullDeliveryPct: 100 * totals.fullDelivered / (messages * size),
    controlledDeliveryPct: 100 * totals.controlledDelivered / (messages * size),
    fullAttemptsPerMessage: totals.fullAttempts / messages,
    controlledAttemptsPerMessage: totals.controlledAttempts / messages,
    attemptReductionPct: 100 * (1 - totals.controlledAttempts / totals.fullAttempts),
  });
}
const elapsedMs = performance.now() - started;
const minimumDelivery = Math.min(...cohorts.map((row) => row.controlledDeliveryPct));
const dense = cohorts.filter((row) => row.targetDegree >= 8);
const minimumDenseReduction = Math.min(...dense.map((row) => row.attemptReductionPct));
console.log(JSON.stringify({
  model: 'deterministic connected ring-plus-chords; no radio loss or OS suspension',
  cohorts,
  gates: {
    controlledDeliveryAtLeast95Pct: minimumDelivery >= 95,
    denseAttemptReductionAtLeast50Pct: minimumDenseReduction >= 50,
  },
  elapsedMs,
}, null, 2));
