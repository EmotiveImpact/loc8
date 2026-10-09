'use strict';
// R5 synthetic, no radio access. Prints machine-readable comparisons for R&D.
const { createLoader } = require('./source-test-loader.cjs');
const { analyseGattSchedule } = createLoader()('packages/engine/src/experimental/gattScheduleRisk.ts');

function scenarios() {
  const link = (id, phaseMs, driftPpm = 0, active = {}) => ({
    id, intervalMs:100, phaseMs, eventMs:4, driftPpm, ...active,
  });
  return {
    separated: {horizonMs:240_000,bucketMs:10_000,links:[link('a',0),link('b',10)]},
    drift: {horizonMs:240_000,bucketMs:10_000,links:[link('a',0,50),link('b',10,-50)]},
    dense: {horizonMs:120_000,bucketMs:10_000,links:Array.from({length:8}, (_,i) => link('link'+i,i*10, (i-4)*35))},
    churn: {horizonMs:20_000,bucketMs:5_000,links:[
      link('a',0,20,{activeUntilMs:10_000}),
      link('b',10,-20,{activeFromMs:10_000}),
      link('c',20,10),
    ]},
  };
}
function run(name) {
  const input = scenarios()[name];
  if (!input) throw new RangeError('Scenario must be separated, drift, dense or churn');
  return {scenario:name,parameters:input,result:analyseGattSchedule(input),
    interpretation:'Synthetic single-controller schedule overlap opportunities only; neither BLE RF losses nor battery/coverage estimates.'};
}
if (require.main === module) {
  const name=process.argv[2] || 'drift';
  if (process.argv.length>3) {console.error('Usage: node tools/mesh-rnd/gatt-schedule.cjs [separated|drift|dense|churn]');process.exitCode=2;}
  else {try{console.log(JSON.stringify(run(name),null,2));}catch(error){console.error(error.message);process.exitCode=2;}}
}
module.exports={scenarios,run};
