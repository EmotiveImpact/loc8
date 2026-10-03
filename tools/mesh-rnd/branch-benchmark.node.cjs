'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sha256 } = require('./relay-simulation.cjs');
const { benchmarkBranch, writeArtifacts } = require('./branch-benchmark.cjs');

test('small v2 matrix preserves frozen v1 baselines and per-trial gate evidence', () => {
  const result = benchmarkBranch({ nodeCounts: [25], targetHops: [3], losses: [0, 0.3], repetitions: 2 });
  assert.equal(result.runs, 36); assert.equal(result.comparisons.length, 12);
  assert.equal(result.historicalBaselineMismatches, 0);
  assert.equal(result.gates.exactJitterArrivalMismatches, 0);
  assert.equal(result.gates.branchAttemptRegressions, 0);
  assert.equal(result.gates.soleBridgeDuplicateRepair, true);
  assert.equal(result.gates.productionPromotion, false);
});
test('new v2 artifacts and full source manifest are byte-reproducible', () => {
  const matrix = { nodeCounts: [25], targetHops: [3], losses: [0.3], repetitions: 1 };
  const a = benchmarkBranch(matrix), b = benchmarkBranch(matrix); assert.deepEqual(a, b);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'loc8-branch-artifacts-'));
  try {
    const first = path.join(temporary, 'first'), second = path.join(temporary, 'second');
    const ma = writeArtifacts(a, first), mb = writeArtifacts(b, second); assert.deepEqual(ma, mb);
    for (const entry of ma.artifacts) {
      const data = fs.readFileSync(path.join(first, entry.path)); assert.equal(sha256(data), entry.sha256);
      assert.deepEqual(data, fs.readFileSync(path.join(second, entry.path)));
    }
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
