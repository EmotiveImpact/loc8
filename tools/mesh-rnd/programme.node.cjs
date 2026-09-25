"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const p=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../../docs/programme/roadmap.json"),"utf8"));
const ids=xs=>xs.map(x=>x.id);
test("programme IDs and source references are unique and complete",()=>{
 for(const xs of [p.sources,p.concepts,p.workstreams]) assert.equal(new Set(ids(xs)).size,xs.length);
 const source=new Set(ids(p.sources));
 for(const w of p.workstreams) {assert.ok(w.deliverable&&w.gate&&w.products);assert.ok(w.sources.length);for(const id of w.sources)assert.ok(source.has(id),id);}
});
test("every meaning relation resolves without becoming a runtime dependency",()=>{
 const concepts=new Set(ids(p.concepts)); for(const e of p.relations){assert.ok(concepts.has(e.from));assert.ok(concepts.has(e.to));assert.ok(e.meaning);}
});
test("workstream dependency graph is acyclic and all dependencies exist",()=>{
 const byId=new Map(p.workstreams.map(w=>[w.id,w])); const active=new Set(),done=new Set();
 function visit(id){assert.ok(byId.has(id),id);assert.ok(!active.has(id),"Cycle at "+id);if(done.has(id))return;active.add(id);for(const dep of byId.get(id).depends_on)visit(dep);active.delete(id);done.add(id);}
 for(const id of byId.keys())visit(id);
});
test("programme preserves wire, consumer, Gateway and no-deployment boundaries",()=>{
 assert.equal(p.constraints.wire_bytes,25);assert.equal(p.constraints.wire_timestamp,"publication-time");
 assert.equal(p.constraints.consumer_infrastructure_required,false);assert.equal(p.constraints.logical_gateway_per_site,1);
 assert.equal(p.constraints.merge_authorised,false);assert.equal(p.constraints.deployment_authorised,false);
 assert.deepEqual(p.constraints.loc8os_daemons,["meshd","relayd","sited","syncd","provisiond","supervisord"]);
});
test("hardware/provider gates are not labelled implemented or proven",()=>{
 const byId=new Map(p.workstreams.map(w=>[w.id,w]));assert.equal(byId.get("MESH").state,"experiment-required");
 assert.equal(byId.get("SEC").state,"held-provider");assert.equal(byId.get("MEANING").state,"research-only");
 assert.equal(byId.get("R1c").state,"design-required");assert.equal(byId.get("R1b").state,"implemented-review");
});
