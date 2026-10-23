'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, root } = require('./source-test-loader.cjs');
const { createMeshStatusCoalescer } = createLoader()('src/research/meshStatusCoalescer.ts');
function harness() {
  const timers = new Map(); let id = 0; const output = [];
  const port = { setTimeout(fn, ms) { assert.equal(ms, 100); timers.set(++id, fn); return id; },
    clearTimeout(handle) { timers.delete(handle); } };
  const collector = createMeshStatusCoalescer((status) => output.push(status), port);
  return { timers, output, collector, flush() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); } };
}
test('burst of 2000 native statuses emits one screen update', () => {
  const h = harness();
  for (let i = 0; i < 2000; i++) h.collector.push({ nearbyCount: i, connected: true, degraded: i === 7,
    ...(i === 3 ? { relayMode: 'branch' } : {}) });
  assert.equal(h.timers.size, 1); h.flush();
  assert.deepEqual(h.output, [{ nearbyCount: 1999, connected: true, degraded: true, relayMode: 'branch' }]);
  h.collector.push({ nearbyCount: 3, connected: false }); h.flush();
  assert.equal(h.output[1].nearbyCount, 3); h.collector.close();
});
test('closed screens do not publish queued or subsequent callbacks', () => {
  const h = harness(); h.collector.push({ nearbyCount: 1, connected: true });
  const callback = [...h.timers.values()][0]; h.collector.close(); callback();
  h.collector.push({ nearbyCount: 2, connected: true }); h.flush();
  assert.deepEqual(h.output, []);
});
test('invalid link counts are not published', () => {
  const h = harness();
  for (const n of [-1, NaN, Infinity, 0.5]) h.collector.push({ nearbyCount: n, connected: true });
  assert.equal(h.timers.size, 0);
  h.collector.push({ nearbyCount: 0, connected: false }); h.flush();
  assert.equal(h.output[0].nearbyCount, 0); h.collector.close();
});

test('Consumer and Guard field screen really wires status batching with unmount cleanup', () => {
  const screen = fs.readFileSync(path.join(root, 'app/mesh-field.tsx'), 'utf8');
  const guard = fs.readFileSync(path.join(root, 'apps/guard/app/mesh-field.tsx'), 'utf8');
  assert.match(screen, /const screenStatus = createMeshStatusCoalescer\(/);
  assert.match(screen, /if \(active\) screenStatus\.push\(status\)/);
  assert.match(screen, /screenStatus\.close\(\)/);
  assert.match(screen, /addPacketListener\(/);
  assert.match(guard, /mesh-field/);
});
