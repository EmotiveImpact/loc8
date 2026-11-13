'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./source-test-loader.cjs');

const { analyseMeshRecoveryEvidence } =
  createLoader()('src/research/meshRecoveryEvidence.ts');
function record(index, action, ms, handle = null, extra = {}) {
  return {
    eventIndex: index, action, monotonicNs: String(BigInt(ms) * 1_000_000n),
    linkHandle: handle, frameId: null,
    runId: 'rnd-r10-field', cohortId: 'phones', blockId: 'relay-a-c-1',
    deviceRole: 'B', ...extra,
  };
}
const capture = (rows, extra = {}) =>
  ({ events: rows, active: false, overflowCount: 0, ...extra });

test('R10 same-handle up/down timing uses local monotonic clocks only', () => {
  const result = analyseMeshRecoveryEvidence(capture([
    record(0, 'diagnostics-started', 0),
    record(1, 'link-up', 10, 'hidden'),
    record(2, 'link-down', 20, 'hidden'),
    record(3, 'link-up', 120, 'hidden', { senderTimestampSec: -999999 }),
    record(4, 'application-delivery', 145, 'hidden'),
    record(5, 'diagnostics-stopped', 150),
  ]));
  assert.equal(result.quality, 'RECORDED');
  assert.equal(result.observedSameHandleReopens, 1);
  assert.equal(result.observedSameHandleReconnectP95Ms, 100);
  assert.equal(result.observedReopenToFirstInboundP95Ms, 25);
  assert.ok(!JSON.stringify(result).includes('hidden'));
  assert.ok(!JSON.stringify(result).includes('senderTimestampSec'));
});

test('R10 cannot claim continuity across changed handles or silent phone links', () => {
  const result = analyseMeshRecoveryEvidence(capture([
    record(0, 'diagnostics-started', 0),
    record(1, 'link-up', 10, 'A'),
    record(2, 'link-down', 20, 'A'),
    record(3, 'link-up', 30, 'B'),
    record(4, 'diagnostics-stopped', 40),
  ]));
  assert.equal(result.observedSameHandleReopens, 0);
  assert.equal(result.observedDownWithoutSameHandleReopen, 1);
  assert.equal(result.observedReopenFirstInboundCount, 0);
  assert.equal(result.observedSameHandleReconnectP95Ms, null);
  assert.equal(result.productionRelayRecommendation, 'NO_CHANGE');
  assert.equal(Object.hasOwn(result, 'scanRecovered'), false);
});

test('R10 marks broken capture evidence incomplete', () => {
  const rows = [record(0, 'diagnostics-started', 10), record(1, 'diagnostics-stopped', 20)];
  assert.equal(analyseMeshRecoveryEvidence(capture(rows, { overflowCount: 1 })).quality, 'INCOMPLETE');
  assert.equal(analyseMeshRecoveryEvidence(capture(rows, { active: true })).quality, 'INCOMPLETE');
  assert.equal(analyseMeshRecoveryEvidence(capture([rows[0], { ...rows[1], monotonicNs: '1' }])).quality, 'INCOMPLETE');
  assert.throws(() => analyseMeshRecoveryEvidence(capture(new Array(20001).fill(rows[0]))));
});

test('R10 caps per-run handles at 512 and never returns identifiers', () => {
  const rows = [record(0, 'diagnostics-started', 0)];
  for (let i = 1; i <= 513; i++) rows.push(record(i, 'link-up', i, 'hidden-' + i));
  rows.push(record(514, 'diagnostics-stopped', 600));
  const result = analyseMeshRecoveryEvidence(capture(rows));
  assert.equal(result.observedDistinctHandles, 512);
  assert.equal(result.untrackedLinkEvents, 1);
  assert.equal(result.quality, 'INCOMPLETE');
  assert.ok(!JSON.stringify(result).includes('hidden-'));
});
