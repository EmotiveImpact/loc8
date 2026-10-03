'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeTopology } = require('./relay-simulation.cjs');
const { compareBranch, simulateBranch } = require('./branch-simulation.cjs');

test('zero-loss seven-hop line matches reliable jitter and preserves TTL exclusions', () => {
  const result = compareBranch({ ...makeTopology('line', 25, 7, 7), seed: 7 });
  assert.equal(result.exactlyMatchedJitterArrivals, true);
  assert.equal(result.branchAttemptsNoGreaterThanJitter, true);
  assert.equal(result.attemptsSavedAgainstJitter, 0);
  assert.equal(result.branch.usefulDeliveries, 7); assert.equal(result.branch.ttlIneligibleNodes, 17);
  assert.equal(result.branch.targetDelivered, true);
});
test('same-frame duplicate cannot cancel a sole bridge', () => {
  const result = compareBranch({ adjacency: [[1], [2], []], source: 0, target: 2,
    seed: 5, loss: 0, originRepeatAtMs: [2] });
  assert.equal(result.current.targetDelivered, false);
  assert.equal(result.jitter.targetDelivered, true); assert.equal(result.branch.targetDelivered, true);
  assert.equal(result.exactlyMatchedJitterArrivals, true);
  assert.equal(result.branch.cancelledRelays, 0);
});
test('branch prunes only an already-observed reverse branch in a bidirectional triangle', () => {
  const result = compareBranch({ adjacency: [[1, 2], [0, 2], [0, 1, 3], []], target: 3, seed: 12, loss: 0 });
  assert.equal(result.exactlyMatchedJitterArrivals, true);
  assert.ok(result.attemptsSavedAgainstJitter > 0);
  assert.equal(result.branch.targetDelivered, true);
});
test('directed asymmetry does not invent a reverse link or downstream knowledge', () => {
  const result = compareBranch({ adjacency: [[1, 2], [2], [3], [], [0]], target: 4, seed: 8, loss: 0.3 });
  assert.equal(result.exactlyMatchedJitterArrivals, true);
  assert.equal(result.branchAttemptsNoGreaterThanJitter, true);
  assert.equal(result.branch.structurallyUnreachableNodes, 1);
  assert.equal(result.branch.targetDelivered, false);
});
for (const topology of ['crowd', 'sole-bridge']) for (const loss of [0, 0.1, 0.3, 0.5]) {
  test(`${topology} / ${loss}: every paired seed exactly matches first-arrival jitter`, () => {
    for (let repetition = 0; repetition < 10; repetition++) {
      const seed = `unit:${topology}:${loss}:${repetition}`;
      const result = compareBranch({ ...makeTopology(topology, 50, 3, seed), seed, loss });
      assert.equal(result.exactlyMatchedJitterArrivals, true, seed);
      assert.equal(result.branchAttemptsNoGreaterThanJitter, true, seed);
      assert.equal(result.branch.horizonDroppedEvents, 0);
      assert.ok(result.branch.transmissionsByNode.every(attempts => attempts <= 1));
    }
  });
}
test('source-first-hop loss limitation is retained; optional repeated origin is a separate control', () => {
  const a = compareBranch({ adjacency: [[1], []], target: 1, seed: 3, loss: 0.5 });
  const b = compareBranch({ adjacency: [[1], []], target: 1, seed: 3, loss: 0.5, originRepeatAtMs: [500] });
  assert.deepEqual(a.branch.deliveredAtMs, [0, null]);
  assert.deepEqual(b.branch.deliveredAtMs, [0, 501]); assert.equal(b.branch.directedAttempts, 2);
  assert.equal(b.exactlyMatchedJitterArrivals, true);
});
test('branch simulator is deterministic and explicitly bounds events/horizon', () => {
  const options = { ...makeTopology('sole-bridge', 25, 3, 42), seed: 42, loss: 0.3 };
  assert.deepEqual(simulateBranch(options), simulateBranch(options));
  assert.throws(() => simulateBranch({ ...options, maxEvents: 1 }), /event bound/);
  assert.ok(simulateBranch({ ...options, horizonMs: 1 }).horizonDroppedEvents > 0);
});
