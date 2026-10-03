'use strict';
// Detached R3 / SEC-01 E06 model. This does not instantiate a phone transport.
const crypto = require('node:crypto');
const { createLoader } = require('./source-test-loader.cjs');
const load = createLoader();
const { ExperimentalRelayPolicy, relayTTL } = load('packages/engine/src/experimental/relayPolicy.ts');
const codec = load('packages/engine/src/core/packetCodec.ts');

const MODEL_VERSION = 'loc8.directed-gatt-relay.v1';
const POLICIES = Object.freeze(['current', 'jitter', 'trickle']);
const TOPOLOGIES = Object.freeze(['line', 'crowd', 'sole-bridge']);
const FIXTURE_PAYLOAD = Buffer.from(codec.encodePacket({ type: 'position', senderId: 42,
  targetId: 0, latitude: 0, longitude: 0, headingDeg: 0, floor: 0,
  batteryPct: 80, timestampSec: 1_800_000_000, accuracyM: 10 }));

function integer(value, low, high, name) {
  if (!Number.isSafeInteger(value) || value < low || value > high) {
    throw new RangeError(`${name} must be an integer in [${low}, ${high}]`);
  }
  return value;
}
function finite(value, low, high, name) {
  if (!Number.isFinite(value) || value < low || value > high) {
    throw new RangeError(`${name} must be finite in [${low}, ${high}]`);
  }
  return value;
}
function hashText(value) {
  let h = 2166136261;
  for (const char of String(value)) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}
function mix(h, value) {
  h = Math.imul(h ^ (value >>> 0), 0x85ebca6b);
  h ^= h >>> 13;
  return Math.imul(h, 0xc2b2ae35) >>> 0;
}
/** Stateless keyed samples: a policy taking more draws cannot shift link loss. */
function unit(seed, ...keys) {
  let h = hashText(seed);
  for (const key of keys) h = mix(h, typeof key === 'number' ? key : hashText(key));
  h ^= h >>> 16;
  return (h >>> 0) / 0x1_0000_0000;
}
function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex'); }

class EventHeap {
  constructor() { this.items = []; this.serial = 0; }
  static before(a, b) { return a.at < b.at || (a.at === b.at && a.serial < b.serial); }
  push(event) {
    event.serial = this.serial++;
    const a = this.items;
    let i = a.length;
    a.push(event);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!EventHeap.before(event, a[parent])) break;
      a[i] = a[parent]; i = parent;
    }
    a[i] = event;
  }
  pop() {
    const a = this.items;
    if (a.length === 0) return null;
    const top = a[0], last = a.pop();
    if (a.length === 0) return top;
    let i = 0;
    while (i * 2 + 1 < a.length) {
      let child = i * 2 + 1;
      if (child + 1 < a.length && EventHeap.before(a[child + 1], a[child])) child++;
      if (!EventHeap.before(a[child], last)) break;
      a[i] = a[child]; i = child;
    }
    a[i] = last;
    return top;
  }
  get size() { return this.items.length; }
}

/** All peers are canonical synthetic identities, not OS central/peripheral IDs. */
function makeTopology(kind, nodeCount, targetHops, seed = 1) {
  integer(nodeCount, 2, 1000, 'nodeCount');
  integer(targetHops, 1, Math.min(7, nodeCount - 1), 'targetHops');
  if (!TOPOLOGIES.includes(kind)) throw new RangeError('unknown topology');
  const sets = Array.from({ length: nodeCount }, () => new Set());
  const connect = (a, b) => { if (a !== b) { sets[a].add(b); sets[b].add(a); } };
  if (kind === 'line') {
    for (let i = 1; i < nodeCount; i++) connect(i - 1, i);
  } else {
    // Layer membership makes targetHops an exact shortest-path distance.
    const layers = Array.from({ length: targetHops + 1 }, (_, i) => [i]);
    const layerOf = Array(nodeCount);
    for (let i = 0; i <= targetHops; i++) layerOf[i] = i;
    for (let i = targetHops + 1; i < nodeCount; i++) {
      const layer = (i - targetHops - 1) % layers.length;
      layers[layer].push(i); layerOf[i] = layer;
    }
    const bridgeBoundary = Math.floor((targetHops - 1) / 2);
    const allowed = (a, b) => Math.abs(layerOf[a] - layerOf[b]) <= 1 &&
      (kind !== 'sole-bridge' || layerOf[a] === layerOf[b] ||
        Math.min(layerOf[a], layerOf[b]) !== bridgeBoundary);
    for (let i = 1; i <= targetHops; i++) connect(i - 1, i);
    for (const layer of layers) {
      for (let i = 1; i < layer.length; i++) connect(layer[i - 1], layer[i]);
      if (layer.length > 2) connect(layer[0], layer[layer.length - 1]);
    }
    const neighboursPerNode = Math.max(3, Math.ceil(Math.sqrt(nodeCount)));
    for (let a = 0; a < nodeCount; a++) {
      const candidates = Array.from({ length: nodeCount }, (_, b) => b)
        .filter(b => a !== b && allowed(a, b))
        .sort((b, c) => unit(seed, 'topology', a, b) - unit(seed, 'topology', a, c) || b - c);
      for (const b of candidates.slice(0, neighboursPerNode)) connect(a, b);
    }
  }
  const adjacency = sets.map(peers => [...peers].sort((a, b) => a - b));
  return { kind, adjacency, source: 0, target: targetHops, targetHops,
    digest: sha256(JSON.stringify(adjacency)) };
}

function validateAdjacency(adjacency) {
  if (!Array.isArray(adjacency)) throw new TypeError('adjacency required');
  integer(adjacency.length, 2, 1000, 'nodeCount');
  return adjacency.map((links, a) => {
    if (!Array.isArray(links)) throw new TypeError('each adjacency row must be an array');
    const peers = links.map(b => integer(b, 0, adjacency.length - 1, 'peer'));
    if (peers.includes(a) || new Set(peers).size !== peers.length) {
      throw new RangeError('self links and duplicate canonical links are not supported');
    }
    return [...peers].sort((a, b) => a - b);
  });
}

function structuralReachability(adjacency, source) {
  const distance = Array(adjacency.length).fill(null), queue = [source];
  distance[source] = 0;
  for (let i = 0; i < queue.length; i++) {
    const from = queue[i];
    for (const to of adjacency[from]) if (distance[to] === null) {
      distance[to] = distance[from] + 1; queue.push(to);
    }
  }
  return distance;
}

/** Ideal route upper bound with the same clamp; not a promise of flood delivery. */
function ttlEligibility(adjacency, source, originTTL, degrees) {
  const highestTTL = Array(adjacency.length).fill(-1);
  const queue = [];
  highestTTL[source] = originTTL;
  for (const to of adjacency[source]) {
    highestTTL[to] = originTTL;
    queue.push({ node: to, ttl: originTTL, from: source });
  }
  for (let i = 0; i < queue.length; i++) {
    const state = queue[i], outgoing = relayTTL(state.ttl, degrees[state.node]);
    if (outgoing === null) continue;
    for (const to of adjacency[state.node]) {
      if (to === state.from || outgoing <= highestTTL[to]) continue;
      highestTTL[to] = outgoing;
      queue.push({ node: to, ttl: outgoing, from: state.node });
    }
  }
  return highestTTL.map(ttl => ttl >= 0);
}
function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
}

/**
 * One immutable frame from one origin, ideal persistent directed GATT links.
 * Independent Bernoulli erasures; no collisions, contention, discovery, MTU,
 * backpressure, OS suspension, RSSI/range, battery or RF airtime model.
 */
function simulateRelay(options) {
  const adjacency = validateAdjacency(options.adjacency);
  const n = adjacency.length;
  const source = integer(options.source ?? 0, 0, n - 1, 'source');
  const target = options.target == null ? null : integer(options.target, 0, n - 1, 'target');
  const originTTL = integer(options.originTTL ?? 7, 1, 7, 'originTTL');
  const loss = finite(options.loss ?? 0, 0, 1, 'loss');
  const delayMs = finite(options.linkDelayMs ?? 1, 0.001, 1000, 'linkDelayMs');
  const horizonMs = finite(options.horizonMs ?? 60_000, 1, 1_000_000, 'horizonMs');
  const maxEvents = integer(options.maxEvents ?? 2_000_000, 1, 10_000_000, 'maxEvents');
  const policyName = options.policy ?? 'current';
  if (!POLICIES.includes(policyName)) throw new RangeError('unknown policy');
  const seed = String(options.seed ?? 1);
  const repeatAtMs = (options.originRepeatAtMs ?? []).map(at => finite(at, 0, horizonMs, 'repeat time'));
  const canonicalPeers = adjacency.map(outgoing => new Set(outgoing));
  adjacency.forEach((peers, from) => peers.forEach(to => canonicalPeers[to].add(from)));
  const degrees = canonicalPeers.map(peers => peers.size);
  const distance = structuralReachability(adjacency, source);
  const eligible = ttlEligibility(adjacency, source, originTTL, degrees);
  const policyOptions = options.policyOptions ?? {};
  const policies = adjacency.map((_, node) => {
    let draw = 0;
    return new ExperimentalRelayPolicy({ ...policyOptions, policy: policyName,
      random: () => unit(seed, 'timer', node, draw++) });
  });
  const key = sha256(FIXTURE_PAYLOAD); // one synthetic immutable-frame key; no wire rewrite
  policies[source].markOrigin(key, 0);
  const deliveredAt = Array(n).fill(null);
  deliveredAt[source] = 0;
  const ticks = Array.from({ length: n }, () => ({ token: 0, deadline: null }));
  const transmissions = Array(n).fill(0);
  const heap = new EventHeap();
  let directedAttempts = 0, erasedAttempts = 0, receivedCopies = 0, eventsProcessed = 0;
  let horizonDroppedEvents = 0, lastEventAtMs = 0, maxPendingStates = 0;
  const scheduleTick = node => {
    const deadline = policies[node].nextDeadline(), timer = ticks[node];
    if (deadline === timer.deadline) return;
    timer.deadline = deadline; timer.token++;
    if (deadline !== null) heap.push({ at: deadline, kind: 'tick', node, token: timer.token });
  };
  const transmit = (from, ttl, excluded, at) => {
    const attempt = ++transmissions[from];
    for (const to of adjacency[from]) {
      if (String(to) === excluded) continue;
      directedAttempts++;
      // No policy in this key. Identical edge attempt has identical loss.
      if (unit(seed, 'loss', from, to, attempt) < loss) { erasedAttempts++; continue; }
      heap.push({ at: at + delayMs, kind: 'receive', node: to, from, ttl });
    }
  };
  heap.push({ at: 0, kind: 'origin', attempt: 1 });
  repeatAtMs.forEach((at, i) => heap.push({ at, kind: 'origin', attempt: i + 2 }));
  while (heap.size > 0) {
    const event = heap.pop();
    if (event.at > horizonMs) { horizonDroppedEvents++; continue; }
    if (++eventsProcessed > maxEvents) throw new Error('simulation event bound exceeded');
    lastEventAtMs = event.at;
    if (event.kind === 'origin') {
      transmit(source, originTTL, null, event.at);
    } else if (event.kind === 'receive') {
      receivedCopies++;
      const accepted = policies[event.node].observe({ key, ttl: event.ttl,
        degree: degrees[event.node], ingressLink: String(event.from),
        senderIsSelf: event.node === source }, event.at);
      if (accepted && deliveredAt[event.node] === null) deliveredAt[event.node] = event.at;
      maxPendingStates = Math.max(maxPendingStates, policies[event.node].sizes().pending);
      scheduleTick(event.node);
    } else if (event.kind === 'tick' && ticks[event.node].token === event.token) {
      ticks[event.node].deadline = null;
      for (const forward of policies[event.node].drain(event.at)) {
        transmit(event.node, forward.ttl, forward.excludeLink, event.at);
      }
      scheduleTick(event.node);
    }
  }
  const latenciesMs = deliveredAt.filter((at, node) => node !== source && at !== null);
  const usefulDeliveries = latenciesMs.length;
  const eligibleNodes = eligible.filter((value, node) => node !== source && value).length;
  const eligibleDeliveries = eligible.filter((value, node) => node !== source && value && deliveredAt[node] !== null).length;
  const structurallyUnreachableNodes = distance.filter(value => value === null).length;
  const ttlIneligibleNodes = eligible.filter((value, node) => node !== source && !value && distance[node] !== null).length;
  const stats = policies.reduce((sum, policy) => {
    for (const [field, value] of Object.entries(policy.stats)) sum[field] = (sum[field] ?? 0) + value;
    return sum;
  }, {});
  return { model: MODEL_VERSION, policy: policyName, seed, nodeCount: n, source, target,
    loss, originTTL, directedLinks: adjacency.reduce((sum, peers) => sum + peers.length, 0),
    targetShortestHops: target === null ? null : distance[target],
    targetTTLEligible: target === null ? null : eligible[target],
    targetDelivered: target === null ? null : deliveredAt[target] !== null,
    targetLatencyMs: target === null ? null : deliveredAt[target],
    allNodeDeliveryRate: usefulDeliveries / (n - 1),
    ttlEligibleDeliveryRate: eligibleNodes === 0 ? null : eligibleDeliveries / eligibleNodes,
    usefulDeliveries, eligibleNodes, eligibleDeliveries, structurallyUnreachableNodes,
    ttlIneligibleNodes, eligibleUndeliveredNodes: eligibleNodes - eligibleDeliveries,
    directedAttempts, erasedAttempts, receivedCopies, duplicateArrivals: stats.duplicates,
    suppressionDecisions: stats.suppressed, cancelledRelays: stats.cancelled,
    relayForwards: stats.forwarded, policyStats: stats, transmissionsByNode: transmissions,
    maxPendingStates, eventsProcessed, horizonDroppedEvents, lastEventAtMs,
    deliveredAtMs: deliveredAt, latenciesMs,
    p50LatencyMs: percentile(latenciesMs, 0.5), p95LatencyMs: percentile(latenciesMs, 0.95),
    payloadBytes: FIXTURE_PAYLOAD.length, payloadSHA256: sha256(FIXTURE_PAYLOAD) };
}

/**
 * Independent DTN thought experiment: trusted synthetic source-born metadata is
 * out of band. It is absent from Loc8 v1 and does not authenticate real peers.
 * Contacts are directed opportunities, storage is RAM only, one frame per node.
 * A relay freezes its outgoing clamp/decrement at its first forwarding contact;
 * later degree changes cannot increase that cached frame's outgoing hop budget.
 */
function simulateStoreCarryForward(options) {
  const nodeCount = integer(options.nodeCount, 2, 1000, 'nodeCount');
  const source = integer(options.source ?? 0, 0, nodeCount - 1, 'source');
  const originTTL = integer(options.originTTL ?? 7, 1, 7, 'originTTL');
  const bornAtMs = finite(options.bornAtMs ?? 0, 0, 1_000_000_000, 'bornAtMs');
  const lifetimeMs = finite(options.lifetimeMs, 1, 900_000, 'lifetimeMs');
  const payload = Buffer.from(options.payload ?? FIXTURE_PAYLOAD);
  if (payload.length !== 25) throw new RangeError('25-byte fixture payload required');
  const payloadSHA256 = sha256(payload), expiresAtMs = bornAtMs + lifetimeMs;
  const contacts = options.contacts.map((contact, index) => ({
    from: integer(contact.from, 0, nodeCount - 1, 'contact.from'),
    to: integer(contact.to, 0, nodeCount - 1, 'contact.to'),
    at: finite(contact.at, bornAtMs, 1_000_000_000, 'contact.at'), index,
    degree: integer(contact.degree ?? 2, 0, 1000, 'contact.degree'),
  })).sort((a, b) => a.at - b.at || a.index - b.index);
  if (contacts.some(contact => contact.from === contact.to)) throw new RangeError('self contact');
  const stored = Array(nodeCount).fill(null), deliveredAtMs = Array(nodeCount).fill(null);
  stored[source] = { ttl: originTTL, outgoingTTL: originTTL, expiresAtMs, payload: Buffer.from(payload) };
  deliveredAtMs[source] = bornAtMs;
  let directedAttempts = 0, duplicateArrivals = 0, expiredStores = 0, ttlBlockedContacts = 0;
  const deliveries = [];
  for (const contact of contacts) {
    for (let node = 0; node < nodeCount; node++) if (stored[node] && contact.at >= stored[node].expiresAtMs) {
      stored[node] = null; expiredStores++;
    }
    const envelope = stored[contact.from];
    if (!envelope) continue;
    if (envelope.outgoingTTL === undefined) envelope.outgoingTTL = relayTTL(envelope.ttl, contact.degree);
    const ttl = envelope.outgoingTTL;
    if (ttl === null) { ttlBlockedContacts++; continue; }
    directedAttempts++;
    if (stored[contact.to]) { duplicateArrivals++; continue; }
    stored[contact.to] = { ttl, expiresAtMs: envelope.expiresAtMs, payload: Buffer.from(envelope.payload) };
    if (deliveredAtMs[contact.to] === null) deliveredAtMs[contact.to] = contact.at;
    deliveries.push({ at: contact.at, from: contact.from, to: contact.to, ttl,
      expiresAtMs: envelope.expiresAtMs, payloadSHA256: sha256(envelope.payload) });
  }
  return { model: 'loc8.synthetic-contact-lifetime.v1', nodeCount, source, originTTL,
    bornAtMs, lifetimeMs, expiresAtMs, deliveredAtMs, deliveries, directedAttempts,
    duplicateArrivals, expiredStores, ttlBlockedContacts, payloadSHA256,
    payloadBytes: payload.length, storedTTL: stored.map(envelope => envelope?.ttl ?? null),
    storedOutgoingTTL: stored.map(envelope => envelope?.outgoingTTL ?? null),
    storedExpiresAtMs: stored.map(envelope => envelope?.expiresAtMs ?? null),
    evidenceClass: 'synthetic-contact-schedule; no persistent storage or live courier' };
}

module.exports = { MODEL_VERSION, POLICIES, TOPOLOGIES, FIXTURE_PAYLOAD: Buffer.from(FIXTURE_PAYLOAD),
  unit, sha256, makeTopology, structuralReachability, ttlEligibility, percentile,
  simulateRelay, simulateStoreCarryForward };
