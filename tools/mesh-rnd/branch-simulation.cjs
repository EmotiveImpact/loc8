'use strict';
// V2 consumes existing Loc8-owned topology/seed helpers; v1 files stay frozen.
const { createLoader } = require('./source-test-loader.cjs');
const { unit, sha256, structuralReachability, ttlEligibility, percentile,
  simulateRelay, FIXTURE_PAYLOAD } = require('./relay-simulation.cjs');
const { ExperimentalBranchRelayPolicy } = createLoader()('packages/engine/src/experimental/branchRelayPolicy.ts');
const MODEL_VERSION = 'loc8.directed-gatt-branch.v2';
const POLICIES = Object.freeze(['current', 'jitter', 'branch']);

function makeFrame(ttl = 7) {
  const frame = Buffer.alloc(47);
  frame[0] = 1; frame[1] = 0x30; frame[2] = ttl;
  frame.writeBigUInt64BE(1_800_000_000_000n, 3);
  frame[11] = 0; frame.writeUInt16BE(25, 12);
  frame.write('LOC8', 14, 'ascii'); frame.writeUInt32BE(42, 18);
  FIXTURE_PAYLOAD.copy(frame, 22);
  return frame;
}
function immutableKey(frame) { const canonical = Buffer.from(frame); canonical[2] = 0; return sha256(canonical); }
function bounded(value, low, high, name, integer = false) {
  if (!Number.isFinite(value) || value < low || value > high || (integer && !Number.isSafeInteger(value))) {
    throw new RangeError(`${name} outside [${low}, ${high}]`);
  }
  return value;
}
class EventHeap {
  constructor() { this.items = []; this.serial = 0; }
  static before(a, b) { return a.at < b.at || (a.at === b.at && a.serial < b.serial); }
  push(event) {
    event.serial = this.serial++;
    const a = this.items; let i = a.length; a.push(event);
    while (i > 0) { const parent = (i - 1) >> 1;
      if (!EventHeap.before(event, a[parent])) break;
      a[i] = a[parent]; i = parent;
    }
    a[i] = event;
  }
  pop() {
    const a = this.items; if (a.length === 0) return null;
    const top = a[0], last = a.pop(); if (a.length === 0) return top;
    let i = 0;
    while (i * 2 + 1 < a.length) { let child = i * 2 + 1;
      if (child + 1 < a.length && EventHeap.before(a[child + 1], a[child])) child++;
      if (!EventHeap.before(a[child], last)) break;
      a[i] = a[child]; i = child;
    }
    a[i] = last; return top;
  }
  get size() { return this.items.length; }
}

function simulateBranch(options) {
  const n = bounded(options.adjacency?.length, 2, 1000, 'node count', true);
  const adjacency = options.adjacency.map((peers, node) => {
    if (!Array.isArray(peers)) throw new RangeError('adjacency row must be an array');
    peers.forEach(peer => bounded(peer, 0, n - 1, 'peer', true));
    if (peers.includes(node) || new Set(peers).size !== peers.length) throw new RangeError('self/duplicate canonical links');
    return [...peers].sort((a, b) => a - b);
  });
  const source = bounded(options.source ?? 0, 0, n - 1, 'source', true);
  const target = options.target == null ? null : bounded(options.target, 0, n - 1, 'target', true);
  const originTTL = bounded(options.originTTL ?? 7, 1, 7, 'originTTL', true);
  const loss = bounded(options.loss ?? 0, 0, 1, 'loss');
  const linkDelayMs = bounded(options.linkDelayMs ?? 1, 0.001, 1000, 'linkDelayMs');
  const horizonMs = bounded(options.horizonMs ?? 60_000, 1, 1_000_000, 'horizonMs');
  const maxEvents = bounded(options.maxEvents ?? 2_000_000, 1, 10_000_000, 'maxEvents', true);
  const seed = String(options.seed ?? 1);
  const repeatAtMs = (options.originRepeatAtMs ?? []).map(at => bounded(at, 0, horizonMs, 'repeat time'));
  const canonicalPeers = adjacency.map(peers => new Set(peers));
  adjacency.forEach((peers, from) => peers.forEach(to => canonicalPeers[to].add(from)));
  const degrees = canonicalPeers.map(peers => peers.size);
  const distance = structuralReachability(adjacency, source), eligible = ttlEligibility(adjacency, source, originTTL, degrees);
  const policies = adjacency.map((_, node) => { let draw = 0;
    return new ExperimentalBranchRelayPolicy({ ...options.branchOptions,
      random: () => unit(seed, 'timer', node, draw++) });
  });
  const sourceFrame = makeFrame(originTTL), key = immutableKey(sourceFrame);
  policies[source].markOrigin(key, sourceFrame, 0);
  const deliveredAt = Array(n).fill(null); deliveredAt[source] = 0;
  const transmissions = Array(n).fill(0), ticks = Array.from({ length: n }, () => ({ token: 0, deadline: null }));
  const heap = new EventHeap();
  let directedAttempts = 0, erasedAttempts = 0, receivedCopies = 0, eventsProcessed = 0;
  let horizonDroppedEvents = 0, lastEventAtMs = 0, maxPendingStates = 0, maxWitnessBytes = 47, maxExclusionLinks = 0;
  const scheduleTick = node => {
    const deadline = policies[node].nextDeadline(), timer = ticks[node];
    if (deadline === timer.deadline) return;
    timer.deadline = deadline; timer.token++;
    if (deadline !== null) heap.push({ at: deadline, kind: 'tick', node, token: timer.token });
  };
  const transmit = (from, frame, links, at) => {
    if (immutableKey(frame) !== key) throw new Error('immutable frame rewritten');
    const attempt = ++transmissions[from];
    for (const to of links) {
      directedAttempts++;
      if (unit(seed, 'loss', from, to, attempt) < loss) { erasedAttempts++; continue; }
      heap.push({ at: at + linkDelayMs, kind: 'receive', node: to, from, frame });
    }
  };
  heap.push({ at: 0, kind: 'origin' });
  repeatAtMs.forEach(at => heap.push({ at, kind: 'origin' }));
  while (heap.size > 0) {
    const event = heap.pop();
    if (event.at > horizonMs) { horizonDroppedEvents++; continue; }
    if (++eventsProcessed > maxEvents) throw new Error('simulation event bound exceeded');
    lastEventAtMs = event.at;
    if (event.kind === 'origin') transmit(source, sourceFrame, adjacency[source], event.at);
    else if (event.kind === 'receive') {
      receivedCopies++;
      const accepted = policies[event.node].observe({ key, frame: event.frame,
        degree: degrees[event.node], ingressLink: String(event.from), senderIsSelf: event.node === source }, event.at);
      if (accepted && deliveredAt[event.node] === null) deliveredAt[event.node] = event.at;
      const sizes = policies[event.node].sizes();
      maxPendingStates = Math.max(maxPendingStates, sizes.pending);
      maxWitnessBytes = Math.max(maxWitnessBytes, sizes.witnessBytes);
      maxExclusionLinks = Math.max(maxExclusionLinks, sizes.exclusions);
      scheduleTick(event.node);
    } else if (event.kind === 'tick' && ticks[event.node].token === event.token) {
      ticks[event.node].deadline = null;
      for (const forward of policies[event.node].drain(event.at, adjacency[event.node].map(String))) {
        transmit(event.node, forward.frame, forward.links.map(Number), event.at);
      }
      scheduleTick(event.node);
    }
  }
  const latenciesMs = deliveredAt.filter((at, node) => node !== source && at !== null);
  const usefulDeliveries = latenciesMs.length;
  const eligibleNodes = eligible.filter((value, node) => node !== source && value).length;
  const eligibleDeliveries = eligible.filter((value, node) => node !== source && value && deliveredAt[node] !== null).length;
  const stats = policies.reduce((sum, policy) => {
    for (const [field, value] of Object.entries(policy.stats)) sum[field] = (sum[field] ?? 0) + value;
    return sum;
  }, {});
  return { model: MODEL_VERSION, policy: 'branch', seed, nodeCount: n, source, target, loss, originTTL,
    directedLinks: adjacency.reduce((sum, peers) => sum + peers.length, 0),
    targetShortestHops: target === null ? null : distance[target], targetTTLEligible: target === null ? null : eligible[target],
    targetDelivered: target === null ? null : deliveredAt[target] !== null,
    targetLatencyMs: target === null ? null : deliveredAt[target], allNodeDeliveryRate: usefulDeliveries / (n - 1),
    ttlEligibleDeliveryRate: eligibleNodes === 0 ? null : eligibleDeliveries / eligibleNodes,
    usefulDeliveries, eligibleNodes, eligibleDeliveries,
    structurallyUnreachableNodes: distance.filter(value => value === null).length,
    ttlIneligibleNodes: eligible.filter((value, node) => node !== source && !value && distance[node] !== null).length,
    eligibleUndeliveredNodes: eligibleNodes - eligibleDeliveries,
    directedAttempts, erasedAttempts, receivedCopies, duplicateArrivals: stats.duplicates,
    suppressionDecisions: 0, cancelledRelays: 0, relayForwards: stats.forwarded, policyStats: stats,
    transmissionsByNode: transmissions, maxPendingStates, maxWitnessBytes, maxExclusionLinks,
    eventsProcessed, horizonDroppedEvents, lastEventAtMs, deliveredAtMs: deliveredAt, latenciesMs,
    p50LatencyMs: percentile(latenciesMs, 0.5), p95LatencyMs: percentile(latenciesMs, 0.95),
    payloadBytes: 25, payloadSHA256: sha256(FIXTURE_PAYLOAD), immutableFrameSHA256: key };
}

function compareBranch(options) {
  const current = simulateRelay({ ...options, policy: 'current' });
  const jitter = simulateRelay({ ...options, policy: 'jitter' });
  const branch = simulateBranch(options);
  return { current, jitter, branch,
    exactlyMatchedJitterArrivals: JSON.stringify(jitter.deliveredAtMs) === JSON.stringify(branch.deliveredAtMs),
    branchAttemptsNoGreaterThanJitter: branch.directedAttempts <= jitter.directedAttempts,
    attemptsSavedAgainstJitter: jitter.directedAttempts - branch.directedAttempts };
}

module.exports = { MODEL_VERSION, POLICIES, makeFrame, immutableKey, simulateBranch, compareBranch };
