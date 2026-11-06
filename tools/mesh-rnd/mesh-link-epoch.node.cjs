'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./source-test-loader.cjs');
const { analyseMeshLinkEpochEvidence: analyse } = createLoader()('src/research/meshLinkEpochEvidence.ts');
const row = (eventIndex, action, ms, linkHandle = null, extra = {}) => ({
  eventIndex, action, monotonicNs: String(BigInt(ms) * 1000000n),
  frameId: null, linkHandle, runId: 'loc8-epoch-test', cohortId: 'three-phones',
  blockId: 'relay-a-c-1', deviceRole: 'B', ...extra
});
const snap = (events, extra = {}) => ({ events, overflowCount: 0, active: false, ...extra });

test('reconnection counts sessions without exposing native hashed handles', () => {
  const r = analyse(snap([
    row(0, 'diagnostics-started', 0),
    row(1, 'link-up', 10, 'hidden'),
    row(2, 'ingress', 20, 'hidden'),
    row(3, 'link-down', 30, 'hidden'),
    row(4, 'link-up', 40, 'hidden'),
    row(5, 'ingress', 50, 'hidden'),
    row(6, 'diagnostics-stopped', 60)
  ]));
  assert.equal(r.quality, 'RECORDED');
  assert.equal(r.observedReopenedLinkHandles, 1);
  assert.equal(r.observedInboundWithOpenLink, 2);
  assert.equal(r.observedOpenAtExport, 1);
  assert.equal(JSON.stringify(r).includes('hidden'), false);
});

test('link event ordering is a review flag, not a stale packet or RF claim', () => {
  const r = analyse(snap([
    row(0, 'diagnostics-started', 0),
    row(1, 'ingress', 10, 'p'),
    row(2, 'link-up', 20, 'p'),
    row(3, 'link-down', 30, 'p'),
    row(4, 'duplicate-drop', 40, 'p'),
    row(5, 'diagnostics-stopped', 50)
  ]));
  assert.equal(r.observedInboundWithoutPriorUp, 1);
  assert.equal(r.observedInboundAfterLastDown, 1);
  assert.equal(r.reviewSuggested, true);
  assert.equal(r.quality, 'RECORDED');
  assert.equal(Object.hasOwn(r, 'stalePackets'), false);
  assert.equal(r.productionRelayRecommendation, 'NO_CHANGE');
});

test('bounded recorders, link identity caps and local clocks fail closed', () => {
  const rows = [row(0, 'diagnostics-started', 0)];
  for (let i = 1; i <= 513; i++) rows.push(row(i, 'link-up', i, 'handle-' + i));
  rows.push(row(514, 'diagnostics-stopped', 600));
  const r = analyse(snap(rows));
  assert.equal(r.observedDistinctLinkHandles, 512);
  assert.equal(r.quality, 'INCOMPLETE');
  assert.equal(r.untrackedLinkEvents, 1);
  assert.equal(analyse(snap([row(0, 'diagnostics-started', 10), row(1, 'diagnostics-stopped', 5)])).invalidLocalClockEvents, 1);
  assert.throws(() => analyse(snap(Array(20001).fill(rows[0]))), /invalid link epoch/);
});
