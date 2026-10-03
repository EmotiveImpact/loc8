'use strict';
// Evaluate the registered exploratory gate, never a production certification.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'docs/research/rnd/results/evidence/2026-10-03-ble-density/relay-matrix.json');
const result = JSON.parse(fs.readFileSync(file));
const groups = new Map();
for (const row of result.aggregates) {
  const key = JSON.stringify([row.topology, row.nodeCount, row.targetHops, row.loss]);
  if (!groups.has(key)) groups.set(key, {});
  groups.get(key)[row.policy] = row;
}
const cohorts = [...groups.values()];
for (const group of cohorts) if (!group.current || !group.jitter || !group.trickle) throw new Error('incomplete policy cohort');
// Native dense degree is >=6. Cohort-level mean canonical degree is descriptive;
// it does not infer platform peer count or replace per-node raw evidence.
const dense = cohorts.filter(group => group.current.meanDirectedLinks / group.current.nodeCount >= 6);
const report = {
  evidenceClass: 'registered-exploratory-software-gate', runs: result.runs,
  graphCohorts: cohorts.length, repetitionsPerPolicyCohort: result.matrix.repetitions,
  deliveryRegressionsOverOnePoint: cohorts.filter(g => g.trickle.ttlEligibleDeliveryRate < g.current.ttlEligibleDeliveryRate - 0.01).length,
  targetRegressionsOverOnePoint: cohorts.filter(g => g.trickle.targetDeliveryRate < g.current.targetDeliveryRate - 0.01).length,
  targetCompletelyTTLIneligibleCohorts: cohorts.filter(g => g.current.targetTTLEligibleRate === 0).length,
  denseCohorts: dense.length,
  denseSavingAtLeast20PercentVsJitter: dense.filter(g => g.trickle.meanDirectedAttempts <= g.jitter.meanDirectedAttempts * 0.8).length,
  denseExceedingTwiceCurrentAttempts: dense.filter(g => g.trickle.meanDirectedAttempts > g.current.meanDirectedAttempts * 2).length,
  worstDeliveredP95Ms: Math.max(...result.aggregates.map(row => row.p95LatencyMs ?? 0)),
  worstTargetDeliveredP95Ms: Math.max(...result.aggregates.map(row => row.targetP95LatencyMs ?? 0)),
  horizonDroppedEvents: result.aggregates.reduce((sum, row) => sum + row.horizonDroppedEvents, 0),
  denseDefinition: 'mean canonical directed-link degree >=6; descriptive cohort grouping',
  limitations: '10 paired seeds, one message/source attempt, ideal static GATT erasures. Missing delivery is excluded from delivered-latency quantiles; inspect success separately.',
};
const candidatePass = report.deliveryRegressionsOverOnePoint === 0 && report.targetRegressionsOverOnePoint === 0 &&
  report.worstDeliveredP95Ms <= 10_000 && report.denseCohorts > 0 &&
  report.denseSavingAtLeast20PercentVsJitter === report.denseCohorts && report.denseExceedingTwiceCurrentAttempts === 0;
report.decision = candidatePass ? 'REPEAT_NATIVE_SHADOW_ONLY' : 'HOLD_CANDIDATE';
report.productionPromotion = false;
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
