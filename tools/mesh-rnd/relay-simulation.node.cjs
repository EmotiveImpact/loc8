'use strict';
// Run after npm ci: node --test tools/mesh-rnd/relay-simulation.node.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { POLICIES, TOPOLOGIES, FIXTURE_PAYLOAD, unit, sha256, makeTopology,
  structuralReachability, simulateRelay, simulateStoreCarryForward } = require('./relay-simulation.cjs');

for (const policy of POLICIES) {
  test(`${policy}: zero-loss seven-hop sparse line delivers every TTL-eligible peer once`, () => {
    const topology = makeTopology('line', 10, 7, 1);
    const result = simulateRelay({ ...topology, loss: 0, policy, seed: 1 });
    assert.equal(result.targetDelivered, true);
    assert.equal(result.targetShortestHops, 7);
    assert.equal(result.usefulDeliveries, 7);
    assert.equal(result.eligibleNodes, 7);
    assert.equal(result.ttlEligibleDeliveryRate, 1);
    assert.equal(result.allNodeDeliveryRate, 7 / 9);
    assert.equal(result.ttlIneligibleNodes, 2);
    assert.equal(result.eligibleUndeliveredNodes, 0);
    assert.equal(result.structurallyUnreachableNodes, 0);
    assert.equal(result.horizonDroppedEvents, 0);
    assert.equal(result.policyStats.accepted, result.usefulDeliveries);
    assert.ok(result.transmissionsByNode.every((n, i) => n <= (i === 0 ? 1 : policy === 'trickle' ? 3 : 1)));
    assert.ok(result.payloadBytes === 25);
  });
}

test('stateless common loss samples are independent of policy draw count', () => {
  const sample = unit('paired-seed', 'loss', 4, 5, 1);
  for (let draw = 0; draw < 1000; draw++) unit('paired-seed', 'timer', 4, draw);
  assert.equal(unit('paired-seed', 'loss', 4, 5, 1), sample);
  assert.notEqual(unit('paired-seed', 'loss', 4, 5, 2), sample);
  assert.ok(sample >= 0 && sample < 1);
});

for (const kind of TOPOLOGIES) for (const hops of [1, 3, 7]) {
  test(`${kind}: requested ${hops}-hop target stays exact under density construction`, () => {
    for (const nodeCount of [10, 25, 50, 100, 250]) {
      const a = makeTopology(kind, nodeCount, hops, 41);
      const b = makeTopology(kind, nodeCount, hops, 41);
      assert.deepEqual(a, b);
      assert.equal(structuralReachability(a.adjacency, a.source)[a.target], hops);
      assert.ok(structuralReachability(a.adjacency, a.source).every(distance => distance !== null));
      assert.equal(a.digest, sha256(JSON.stringify(a.adjacency)));
    }
  });
}

test('sole-bridge topology has exactly one link pair crossing its frozen layer boundary', () => {
  for (const hops of [1, 3, 7]) {
    const topology = makeTopology('sole-bridge', 50, hops, 3);
    const leftEnd = Math.floor((hops - 1) / 2), rightStart = leftEnd + 1;
    const layerOf = Array.from({ length: 50 }, (_, node) => node <= hops ? node : (node - hops - 1) % (hops + 1));
    const crossings = [];
    topology.adjacency.forEach((peers, from) => peers.forEach(to => {
      if (layerOf[from] <= leftEnd && layerOf[to] >= rightStart) crossings.push([from, to]);
    }));
    assert.deepEqual(crossings, [[leftEnd, rightStart]]);
  }
});

test('directed asymmetry separates structural unreachability from erased eligible deliveries', () => {
  const adjacency = [[1], [2], [], [2]];
  const result = simulateRelay({ adjacency, source: 0, target: 3, policy: 'trickle', loss: 0 });
  assert.deepEqual(result.deliveredAtMs.map(value => value !== null), [true, true, true, false]);
  assert.equal(result.structurallyUnreachableNodes, 1);
  assert.equal(result.ttlIneligibleNodes, 0);
  assert.equal(result.eligibleUndeliveredNodes, 0);
  assert.equal(result.targetTTLEligible, false);
  assert.equal(result.targetShortestHops, null);
});

test('one-way sole bridge is cancelled by baseline duplicate but preserved by thin-chain Trickle', () => {
  // The same origin frame arrives twice: e.g. redundant GATT roles. This does
  // not model a new source broadcast, which would have a fresh native timestamp.
  const options = { adjacency: [[1], [2], []], source: 0, target: 2,
    originRepeatAtMs: [2], seed: 5, loss: 0 };
  const current = simulateRelay({ ...options, policy: 'current' });
  const jitter = simulateRelay({ ...options, policy: 'jitter' });
  const trickle = simulateRelay({ ...options, policy: 'trickle' });
  assert.equal(current.targetDelivered, false);
  assert.equal(current.cancelledRelays, 1);
  assert.equal(current.eligibleUndeliveredNodes, 1);
  assert.equal(jitter.targetDelivered, true);
  assert.equal(trickle.targetDelivered, true);
  assert.ok(trickle.transmissionsByNode[1] <= 3);
});

test('TTL clamp is shared: dense seven-hop target is explicitly budget-ineligible', () => {
  const topology = makeTopology('crowd', 100, 7, 6);
  const result = simulateRelay({ ...topology, policy: 'jitter', loss: 0 });
  assert.equal(result.targetShortestHops, 7);
  assert.equal(result.targetTTLEligible, false);
  assert.equal(result.targetDelivered, false);
  assert.ok(result.ttlIneligibleNodes > 0);
  assert.equal(result.structurallyUnreachableNodes, 0);
});

test('loss-one drops all directed origin attempts without false delivery', () => {
  const topology = makeTopology('crowd', 25, 3, 17);
  const result = simulateRelay({ ...topology, policy: 'trickle', loss: 1 });
  assert.equal(result.directedAttempts, topology.adjacency[0].length);
  assert.equal(result.erasedAttempts, result.directedAttempts);
  assert.equal(result.usefulDeliveries, 0);
  assert.equal(result.receivedCopies, 0);
  assert.equal(result.eligibleUndeliveredNodes, result.eligibleNodes);
});

test('origin repetition control isolates initial-hop loss from relay-policy retries', () => {
  for (const policy of POLICIES) {
    const options = { adjacency: [[1], []], seed: 3, loss: 0.5, policy };
    const single = simulateRelay(options);
    const repeated = simulateRelay({ ...options, originRepeatAtMs: [500] });
    assert.deepEqual(single.deliveredAtMs, [0, null]);
    assert.equal(single.directedAttempts, 1);
    assert.deepEqual(repeated.deliveredAtMs, [0, 501]);
    assert.equal(repeated.directedAttempts, 2);
    assert.equal(repeated.transmissionsByNode[0], 2);
    assert.equal(repeated.usefulDeliveries, 1);
  }
});

test('paired simulation is byte-reproducible with fractional deadlines and seeded losses', () => {
  const topology = makeTopology('sole-bridge', 50, 3, 99);
  const options = { ...topology, policy: 'trickle', seed: 'reproducible', loss: 0.3 };
  assert.equal(JSON.stringify(simulateRelay(options)), JSON.stringify(simulateRelay(options)));
  assert.equal(simulateRelay(options).horizonDroppedEvents, 0);
});

test('split horizon excludes the admitted ingress peer on repeated forwards', () => {
  const options = { adjacency: [[1], [0, 2], []], source: 0, target: 2, loss: 0 };
  const current = simulateRelay({ ...options, policy: 'current' });
  const trickle = simulateRelay({ ...options, policy: 'trickle' });
  assert.equal(current.directedAttempts, 2);
  assert.equal(trickle.directedAttempts, 4); // one originate + three relay attempts
  assert.equal(trickle.receivedCopies, 4);
  assert.equal(trickle.duplicateArrivals, 2);
  assert.equal(trickle.deliveredAtMs[0], 0);
});

test('event and horizon bounds are explicit instead of silent successful completion', () => {
  const topology = makeTopology('line', 10, 7);
  assert.throws(() => simulateRelay({ ...topology, maxEvents: 1 }), /event bound/);
  const result = simulateRelay({ ...topology, horizonMs: 1 });
  assert.ok(result.horizonDroppedEvents > 0);
  assert.equal(result.targetDelivered, false);
});

test('synthetic carry-forward crosses a later contact without renewing TTL or source lifetime', () => {
  const result = simulateStoreCarryForward({ nodeCount: 3, lifetimeMs: 1000,
    contacts: [{ at: 10, from: 0, to: 1 }, { at: 900, from: 1, to: 2 }] });
  assert.deepEqual(result.deliveredAtMs, [0, 10, 900]);
  assert.deepEqual(result.deliveries.map(delivery => delivery.ttl), [7, 6]);
  assert.deepEqual(result.storedExpiresAtMs, [1000, 1000, 1000]);
  assert.ok(result.deliveries.every(delivery => delivery.payloadSHA256 === sha256(FIXTURE_PAYLOAD)));
  assert.equal(result.payloadBytes, 25);
});

test('duplicates cannot extend source lifetime, including expiry exactly at the late contact', () => {
  const result = simulateStoreCarryForward({ nodeCount: 3, lifetimeMs: 1000,
    contacts: [{ at: 10, from: 0, to: 1 }, { at: 999, from: 0, to: 1 },
      { at: 1000, from: 1, to: 2 }] });
  assert.equal(result.duplicateArrivals, 1);
  assert.deepEqual(result.deliveredAtMs, [0, 10, null]);
  assert.equal(result.expiredStores, 2);
  assert.deepEqual(result.storedExpiresAtMs, [null, null, null]);
});

test('carry-forward retries preserve one-decremented TTL and isolated payload ownership', () => {
  const payload = Buffer.from(FIXTURE_PAYLOAD), before = Buffer.from(payload);
  const result = simulateStoreCarryForward({ nodeCount: 4, lifetimeMs: 1000, payload,
    contacts: [{ at: 10, from: 0, to: 1 }, { at: 20, from: 1, to: 2 },
      { at: 30, from: 1, to: 2 }, { at: 40, from: 1, to: 3 }] });
  assert.deepEqual(result.deliveries.map(delivery => delivery.ttl), [7, 6, 6]);
  assert.deepEqual(result.storedTTL, [7, 7, 6, 6]);
  assert.deepEqual(payload, before);
  assert.equal(result.duplicateArrivals, 1);
});

test('carry-forward hop TTL and elapsed lifetime independently reject forwarding', () => {
  const result = simulateStoreCarryForward({ nodeCount: 4, originTTL: 1, lifetimeMs: 10_000,
    contacts: [{ at: 1, from: 0, to: 1 }, { at: 2, from: 1, to: 2 },
      { at: 3, from: 1, to: 3 }] });
  assert.deepEqual(result.deliveredAtMs, [0, 1, null, null]);
  assert.equal(result.ttlBlockedContacts, 2);
  assert.equal(result.expiredStores, 0);
});

test('carry-forward freezes first-contact degree clamp across later sparse contacts', () => {
  const result = simulateStoreCarryForward({ nodeCount: 4, lifetimeMs: 1000,
    contacts: [{ at: 10, from: 0, to: 1 },
      { at: 20, from: 1, to: 2, degree: 6 }, { at: 30, from: 1, to: 3, degree: 2 }] });
  assert.deepEqual(result.deliveries.map(delivery => delivery.ttl), [7, 4, 4]);
  assert.deepEqual(result.storedOutgoingTTL, [7, 4, null, null]);
  assert.deepEqual(result.storedExpiresAtMs, [1000, 1000, 1000, 1000]);
});

test('model rejects ambiguous topology or malformed synthetic payload', () => {
  assert.throws(() => simulateRelay({ adjacency: [[1, 1], []] }), /duplicate/);
  assert.throws(() => simulateRelay({ adjacency: [[0], []] }), /self links/);
  assert.throws(() => simulateRelay({ adjacency: [[1], []], loss: NaN }), /loss/);
  assert.throws(() => makeTopology('unknown', 10, 3), /topology/);
  assert.throws(() => simulateStoreCarryForward({ nodeCount: 2, lifetimeMs: 100,
    payload: Buffer.alloc(24), contacts: [] }), /25-byte/);
});

test('benchmark artifacts retain paired trials and reproduce exact hashes in separate directories', () => {
  const { benchmarkRelay, writeArtifacts } = require('./benchmark-relay.cjs');
  const matrix = { nodeCounts: [10], targetHops: [3], losses: [0.3], repetitions: 2, seed: 'artifact-test' };
  const a = benchmarkRelay(matrix), b = benchmarkRelay(matrix);
  assert.deepEqual(a, b);
  assert.equal(a.runs, 18);
  assert.equal(a.aggregates.length, 9);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'loc8-relay-artifacts-'));
  try {
    const first = path.join(temp, 'first'), second = path.join(temp, 'second');
    const ma = writeArtifacts(a, first), mb = writeArtifacts(b, second);
    assert.deepEqual(ma, mb);
    for (const entry of ma.artifacts) {
      assert.equal(sha256(fs.readFileSync(path.join(first, entry.path))), entry.sha256);
      assert.deepEqual(fs.readFileSync(path.join(first, entry.path)), fs.readFileSync(path.join(second, entry.path)));
    }
    const trials = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(first, 'relay-trials.json.gz'))));
    assert.equal(trials.length, 18);
    assert.ok(trials.every(trial => trial.topologyDigest && trial.seed && trial.payloadBytes === 25));
    assert.ok(a.aggregates.every(row => row.horizonDroppedEvents === 0));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
