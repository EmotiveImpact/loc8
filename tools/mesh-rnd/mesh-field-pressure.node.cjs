'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./source-test-loader.cjs');
const { analyseMeshFieldPressure: analyse } = createLoader()('src/research/meshFieldPressure.ts');

const row = (eventIndex, action, ms, extra = {}) => ({
  eventIndex, action, monotonicNs: String(BigInt(ms) * 1000000n),
  frameId: null, linkHandle: null, runId: 'loc8-test-01', cohortId: 'crowd',
  blockId: 'relay-a-c-1', deviceRole: 'B', ...extra,
});
const snap = (events, extra = {}) => ({ events, overflowCount: 0, active: false, ...extra });

test('one-second link churn and same-frame schedule pressure remain device local', () => {
  const rows = [row(0, 'diagnostics-started', 0),
    row(1, 'link-up', 100, {linkHandle:'secret-peer'}),
    row(2, 'link-down', 200, {linkHandle:'secret-peer'}),
    row(3, 'link-up', 1100, {linkHandle:'secret-peer'}),
    row(4, 'relay-scheduled', 1200, {frameId:'secret-frame'}),
    row(5, 'relay-scheduled', 1300, {frameId:'secret-frame'}),
    row(6, 'relay-cancelled', 1400, {frameId:'secret-frame'}),
    row(7, 'relay-forwarded', 1500, {frameId:'secret-frame'}),
    row(8, 'diagnostics-stopped', 2000)];
  const r = analyse(snap(rows));
  assert.equal(r.quality, 'RECORDED');
  assert.equal(r.observedPeakLinkTransitionsPer1s, 2);
  assert.equal(r.observedPeakOutstandingRelayScheduleRecords, 2);
  assert.equal(r.observedUnresolvedRelayScheduleRecords, 0);
  assert.equal(r.observedLocalDurationMs, 2000);
  assert.equal(JSON.stringify(r).includes('secret'), false);
});

test('incomplete scheduled work and spurious completions are counted without treating them as native queue telemetry', () => {
  const rows = [row(0, 'diagnostics-started', 0),
    row(1, 'relay-scheduled', 20, {frameId:'a'}),
    row(2, 'relay-forwarded', 30, {frameId:'b'}),
    row(3, 'diagnostics-stopped', 40)];
  const r = analyse(snap(rows));
  assert.equal(r.observedUnresolvedRelayScheduleRecords, 1);
  assert.equal(r.unmatchedRelayResolutionEvents, 1);
  assert.equal(r.evidenceClass, 'device-local-native-recorder-not-rf');
  assert.equal(r.productionRelayRecommendation, 'NO_CHANGE');
});

test('huge native uptime and sender wall-clock skew never create cross-device latency', () => {
  const big = 9999999999999990000n;
  const rows = [row(0, 'diagnostics-started', 0, {monotonicNs:String(big)}),
    row(1, 'link-up', 100, {monotonicNs:String(big+123000000n),senderTimestampSec:-140}),
    row(2, 'diagnostics-stopped', 1000, {monotonicNs:String(big+1000000000n)})];
  const r = analyse(snap(rows));
  assert.equal(r.quality, 'RECORDED');
  assert.equal(r.observedLocalDurationMs, 1000);
  assert.equal(Object.hasOwn(r, 'crossDeviceLatencyMs'), false);
});

test('regressed or malformed local timestamps cannot inflate churn peaks', () => {
  const rows = [row(0, 'diagnostics-started', 0), row(1, 'link-up', 100),
    row(2, 'link-down', 900), row(3, 'link-up', 200),
    row(4, 'link-up', 0, {monotonicNs:'n/a'}),
    row(5, 'diagnostics-stopped', 1200)];
  const r = analyse(snap(rows));
  assert.equal(r.quality, 'INCOMPLETE');
  assert.equal(r.localClockRegressions, 1);
  assert.equal(r.invalidLocalTimestamps, 1);
  assert.equal(r.observedPeakLinkTransitionsPer1s, 2);
});

test('closed evidence, context and bounded snapshots are mandatory', () => {
  const rows = [row(0, 'diagnostics-started', 0), row(1, 'diagnostics-stopped', 1)];
  assert.equal(analyse(snap(rows, {overflowCount:1})).quality, 'INCOMPLETE');
  assert.equal(analyse(snap(rows, {active:true})).quality, 'INCOMPLETE');
  assert.equal(analyse(snap([rows[0], {...rows[1], deviceRole:'C'}])).invalidContextOrIndexRows, 1);
  assert.throws(() => analyse(snap(Array(20001).fill(rows[0]))), /invalid field pressure snapshot/);
});
