'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./source-test-loader.cjs');
const { analyseGattSchedule } = createLoader()('packages/engine/src/experimental/gattScheduleRisk.ts');
const base = (id, phaseMs=0, driftPpm=0) => ({id,intervalMs:100,phaseMs,eventMs:4,driftPpm});
const run = (links,horizonMs=10_000,bucketMs=1000) => analyseGattSchedule({links,horizonMs,bucketMs});

test('one link has zero simultaneous connection opportunities and no invented RF packets', () => {
  const result = run([base('a')]);
  assert.equal(result.totalEvents,100);
  assert.equal(result.overlappingEvents,0);
  assert.equal(result.overlappingPairs,0);
  assert.equal(result.productionRelayRecommendation,'NO_CHANGE');
  assert.equal(result.evidenceClass,'synthetic-single-controller-conflict-opportunities');
});
test('co-phased links have overlapping events on every interval and one pair per slot', () => {
  const result = run([base('a'),base('b')]);
  assert.equal(result.totalEvents,200);
  assert.equal(result.overlappingEvents,200);
  assert.equal(result.overlappingPairs,100);
  assert.equal(result.maximumSimultaneousEvents,2);
  assert.deepEqual(result.byPair,[{a:'a',b:'b',overlappingPairs:100}]);
});
test('separated stable clocks never overlap, even after many events', () => {
  const result = run([base('a'),base('b',50)],60_000);
  assert.equal(result.overlappingPairs,0);
  assert.ok(result.buckets.every(b => b.overlappingEventCount === 0));
});
test('relative oscillator drift eventually creates recurrent overlap opportunities', () => {
  const separated = run([base('a'),base('b',10)] ,240_000,10_000);
  const drifted = run([base('a',0,50),base('b',10,-50)],240_000,10_000);
  assert.equal(separated.overlappingPairs,0);
  assert.ok(drifted.overlappingPairs > 0);
  assert.ok(drifted.buckets.slice(0,5).every(b => b.overlappingEventCount === 0));
  assert.ok(drifted.buckets.slice(6).some(b => b.overlappingEventCount > 0));
});
test('connection churn bounds the event opportunity window and has no cross-lifetime overlap', () => {
  const result = run([{...base('a'),activeUntilMs:1000},{...base('b'),activeFromMs:1000}],10_000);
  assert.equal(result.byLink[0].eventCount,10);
  assert.equal(result.byLink[1].eventCount,90);
  assert.equal(result.overlappingPairs,0);
});
test('touching event windows are not overlaps', () => {
  const result = run([base('a'),base('b',4)]);
  assert.equal(result.overlappingPairs,0);
});
test('three co-phased links count three pairs per event, each event only once', () => {
  const result = run([base('a'),base('b'),base('c')]);
  assert.equal(result.totalEvents,300);
  assert.equal(result.overlappingPairs,300);
  assert.equal(result.overlappingEvents,300);
  assert.equal(result.maximumSimultaneousEvents,3);
});
test('single-controller schedule analysis is deterministic and does not mutate input', () => {
  const links=[base('b',2,12),base('a',4,-22)];
  const original=JSON.parse(JSON.stringify(links));
  assert.deepEqual(run(links),run(links));
  assert.deepEqual(links,original);
});
test('reject malformed, duplicate, unbounded or implausible schedules', () => {
  for (const links of [[],[base('a'),base('a')],[{...base('a'),driftPpm:Infinity}],
    [{...base('a'),phaseMs:100}],[{...base('a'),intervalMs:5}],[{...base('a'),eventMs:101}],
    [{...base('a'),activeUntilMs:0}],[{...base('a'),id:'00:11:22:33:44:55:66:77'}]]) {
    assert.throws(() => run(links));
  }
  assert.throws(() => analyseGattSchedule({links:[base('a')],horizonMs:3600000,maxEvents:10}),/event budget/);
  assert.throws(() => analyseGattSchedule({links:[base('a')],horizonMs:100000,bucketMs:1}),/bucket count/);
});
test('R5 CLI scenario has no unexplained packet-loss metric and is repeatable', () => {
  const {run} = require('./gatt-schedule.cjs');
  const stable=run('separated'), drift=run('drift');
  assert.equal(stable.result.overlappingPairs,0);
  assert.ok(drift.result.overlappingPairs>0);
  assert.deepEqual(run('dense'),run('dense'));
  for(const id of ['separated','drift','dense','churn']) {
    const r=run(id);
    assert.equal(r.result.totalEvents,r.result.byLink.reduce((s,x)=>s+x.eventCount,0));
    assert.equal(r.result.overlappingEvents,r.result.byLink.reduce((s,x)=>s+x.overlappingEventCount,0));
    assert.ok(r.result.overlappingEvents <= r.result.totalEvents);
    assert.equal(Object.hasOwn(r.result,'packetLoss'),false);
  }
  assert.throws(()=>run('radio-measurement'),/Scenario/);
});
