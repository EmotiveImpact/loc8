'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./source-test-loader.cjs');
const { analyseMeshFieldTelemetry: analyse } = createLoader()('src/research/meshFieldTelemetry.ts');
const event=(eventIndex,action,at,patch={})=>({
 eventIndex,action,monotonicNs:String(at*1e6),frameId:null,linkHandle:null,
 runId:'run-01',cohortId:'test',blockId:'relay-a-c-1',deviceRole:'B',...patch});
const snap=(events,extra={})=>({events,overflowCount:0,active:false,...extra});
test('observes link pressure and relay timer without exposing handles',()=>{
 const rows=[event(0,'diagnostics-started',0),event(1,'link-up',1,{linkHandle:'a'}),
 event(2,'link-up',2,{linkHandle:'b'}),event(3,'relay-scheduled',5,{frameId:'f'}),
 event(4,'relay-forwarded',20,{frameId:'f'}),event(5,'application-delivery',25),
 event(6,'diagnostics-stopped',50)];
 const r=analyse(snap(rows));
 assert.equal(r.quality,'RECORDED');assert.equal(r.observedMaxLinkHandles,2);
 assert.equal(r.pendingRelayP95Ms,15);assert.equal(r.applicationDeliveries,1);
 assert.equal(r.productionRelayRecommendation,'NO_CHANGE');
 assert.equal(JSON.stringify(r).includes('"linkHandle"'),false);
 assert.equal(Object.hasOwn(r,'packetLoss'),false);
});
test('overflow and incomplete evidence never passes boundary check',()=>{
 const base=[event(0,'diagnostics-started',0),event(1,'diagnostics-stopped',1)];
 assert.equal(analyse(snap(base,{overflowCount:1})).quality,'INCOMPLETE');
 assert.equal(analyse(snap(base,{active:true})).quality,'INCOMPLETE');
 assert.equal(analyse(snap(base.slice(0,1))).quality,'INCOMPLETE');
 assert.equal(analyse(snap([base[0],{...base[1],eventIndex:3}])).quality,'INCOMPLETE');
});
test('cancelled timer cannot be treated as observed forwarded wait',()=>{
 const rows=[event(0,'diagnostics-started',0),event(1,'relay-scheduled',5,{frameId:'f'}),
 event(2,'relay-cancelled',7,{frameId:'f'}),event(3,'relay-forwarded',10,{frameId:'f'}),
 event(4,'diagnostics-stopped',11)];
 const r=analyse(snap(rows));
 assert.equal(r.relayCancelled,1);assert.equal(r.unmatchedRelayForwarded,1);
 assert.equal(r.pendingRelayP50Ms,null);
});
test('rejects invalid and unbounded snapshots',()=>{
 for(const x of [null,{events:[],overflowCount:-1,active:false},
 {events:new Array(20001).fill({}),overflowCount:0,active:false}]) {
  assert.throws(()=>analyse(x),/invalid field snapshot/);
 }
});

test('reports one-second recorder bursts without interpreting them as radio throughput',()=>{
 const actions=[
  ['diagnostics-started',0], ['ingress',100], ['ingress',200], ['ingress',300],
  ['relay-forwarded',350], ['relay-forwarded',375],
  ['duplicate-drop',400], ['duplicate-drop',425], ['duplicate-drop',450],
  ['ingress',1500], ['relay-forwarded',1800], ['diagnostics-stopped',2400],
 ];
 const r=analyse(snap(actions.map(([action,ms],i)=>event(i,action,ms))));
 assert.equal(r.quality,'RECORDED');
 assert.equal(r.observedPeakIngressEventsPer1s,3);
 assert.equal(r.observedPeakRelayForwardEventsPer1s,2);
 assert.equal(r.observedPeakDuplicateDropsPer1s,3);
 assert.equal(r.loadEvidenceScope,'native-recorder-events-not-gatt-queue-or-rf');
 assert.equal(Object.hasOwn(r,'controllerCollisionRate'),false);
});

test('burst metrics on empty and malformed timestamps do not manufacture rates',()=>{
 const base=snap([event(0,'diagnostics-started',0),event(1,'diagnostics-stopped',5000)]);
 assert.equal(analyse(base).observedPeakIngressEventsPer1s,0);
 const bad=snap([event(0,'diagnostics-started',0),
  {...event(1,'ingress',10),monotonicNs:'not-a-clock'},
  event(2,'diagnostics-stopped',100)]);
 const result=analyse(bad);
 assert.equal(result.quality,'INCOMPLETE');
 assert.equal(result.observedPeakIngressEventsPer1s,0);
});
