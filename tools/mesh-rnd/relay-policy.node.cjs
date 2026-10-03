'use strict';
// Safety contracts for the real detached TypeScript experiment, not native RF tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');
const { createLoader, root } = require('./source-test-loader.cjs');
const modulePath = 'packages/engine/src/experimental/relayPolicy.ts';
const { ExperimentalRelayPolicy, relayTTL, nativeJitterMs } = createLoader()(modulePath);
const observation = (extra = {}) => ({ key: 'frame', ttl: 7, degree: 4, ingressLink: 'a', ...extra });
const policy = (name = 'trickle', extra = {}) => new ExperimentalRelayPolicy({ policy: name, random: () => 0, ...extra });
function run(p, end = 5000) {
  const out = []; let deadline;
  while ((deadline = p.nextDeadline()) !== null && deadline <= end) out.push(...p.drain(deadline));
  return out;
}

test('experimental policy passes strict semantic TypeScript checking', () => {
  const program = ts.createProgram([path.join(root, modulePath)], {
    strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS, types: [],
  });
  assert.equal(ts.getPreEmitDiagnostics(program).length, 0);
});
test('all 256 incoming hop budgets retain native caps; no retry can mint hops', () => {
  for (let ttl = 0; ttl < 256; ttl++) for (const degree of [0, 1, 2, 3, 5, 6, 9, 10, 1000]) {
    const out = relayTTL(ttl, degree);
    if (ttl <= 1) assert.equal(out, null);
    else {
      assert.ok(out >= 1 && out < ttl);
      assert.ok(out <= 6);
      if (degree >= 6) assert.ok(out <= 4);
    }
  }
});
test('current-policy delay retains sparse and dense native jitter endpoints', () => {
  for (const [degree, low, high] of [[0,10,40], [2,10,40], [3,60,150], [5,60,150], [6,80,180], [9,80,180], [10,100,220]]) {
    assert.equal(nativeJitterMs(degree, 0), low);
    assert.equal(nativeJitterMs(degree, 1 - Number.EPSILON), high);
  }
});
test('first packet still reaches application at TTL one; loopback never does', () => {
  const p = policy();
  assert.equal(p.observe(observation({ ttl: 1 }), 0), true);
  assert.equal(p.nextDeadline(), null);
  assert.equal(p.observe(observation({ key: 'self', senderIsSelf: true }), 1), false);
  assert.equal(p.nextDeadline(), null);
});
test('current cancels on same-link duplicate while jitter ablation forwards once', () => {
  for (const mode of ['current', 'jitter']) {
    const p = policy(mode);
    assert.equal(p.observe(observation(), 0), true);
    assert.equal(p.observe(observation(), 1), false);
    assert.equal(run(p).length, mode === 'current' ? 0 : 1);
  }
});
test('repeats retain once-decremented TTL, ingress exclusion and immutable frame key', () => {
  const p = policy(); p.observe(observation({ ttl: 3 }), 0);
  // Better TTL duplicates cannot increase budget or re-deliver the application packet.
  assert.equal(p.observe(observation({ ttl: 255 }), 1), false);
  const out = run(p);
  assert.equal(out.length, 3);
  assert.deepEqual(out.map(x => x.attempt), [1,2,3]);
  assert.ok(out.every(x => x.ttl === 2 && x.key === 'frame' && x.excludeLink === 'a'));
});
test('a same-link duplicate storm does not simulate independent redundant paths', () => {
  const p = policy(); p.observe(observation(), 0);
  for (let time = 1; time <= 20; time++) p.observe(observation(), time);
  assert.equal(p.drain(40).length, 1);
  assert.equal(p.stats.duplicates, 20);
});
test('distinct links suppress only their current interval and suppressed intervals are bounded', () => {
  const p = policy('trickle', { maxIntervals: 2 }); p.observe(observation({ degree: 3 }), 0);
  p.observe(observation({ ingressLink: 'b' }), 1);
  p.observe(observation({ ingressLink: 'c' }), 2);
  assert.equal(p.drain(40).length, 0);
  assert.equal(p.stats.suppressed, 1);
  assert.equal(p.drain(80).length, 0); // reset count at interval boundary
  assert.equal(p.drain(160).length, 1);
  p.drain(240);
  assert.equal(p.nextDeadline(), null);
});
test('thin chain keeps relaying despite repeated copies through many local link handles', () => {
  const p = policy(); p.observe(observation({ degree: 2 }), 0);
  for (let time = 1; time < 30; time++) p.observe(observation({ degree: 2, ingressLink: String(time) }), time);
  assert.equal(run(p).length, 3);
  assert.equal(p.stats.suppressed, 0);
});
test('active lifetime ends at first-receipt deadline; duplicates cannot renew it', () => {
  const p = policy('trickle', { activeLifetimeMs: 100 }); p.observe(observation(), 0);
  assert.equal(p.drain(40).length, 1);
  p.observe(observation(), 99);
  assert.deepEqual(p.drain(100), []);
  assert.equal(p.nextDeadline(), null);
  assert.equal(p.observe(observation(), 101), false);
});
test('paused timer skips elapsed intervals without a retransmission burst', () => {
  const p = policy(); p.observe(observation(), 0);
  assert.ok(p.drain(1500).length <= 1);
  assert.ok(p.stats.lateDrops > 0);
  assert.deepEqual(p.drain(5000), []);
  assert.equal(p.nextDeadline(), null);
});
test('origin echoes never arm forwarding or renew a seen lifetime', () => {
  const p = policy('trickle', { seenLifetimeMs: 5000 });
  p.markOrigin('frame', 0);
  assert.equal(p.observe(observation(), 4999), false);
  assert.equal(p.nextDeadline(), null);
  assert.equal(p.observe(observation(), 5000), true);
});
test('admission pressure preserves first delivery while bounding seen and pending state', () => {
  const p = policy('trickle', { maxSeen: 8, maxPending: 2 });
  for (let i = 0; i < 5000; i++) {
    assert.equal(p.observe(observation({ key: `frame-${i}` }), 0), true);
    assert.ok(p.sizes().seen <= 8); assert.ok(p.sizes().pending <= 2);
  }
  assert.ok(p.stats.capacityDrops > 0); assert.ok(p.stats.evicted > 0);
  assert.ok(run(p).length <= 6); // no orphan timers after seen-cache evictions
});
test('duplicate receipt after completion does not rearm forwarding', () => {
  const p = policy(); p.observe(observation(), 0); run(p);
  assert.equal(p.observe(observation(), 1000), false);
  assert.equal(p.nextDeadline(), null);
});
test('bounded-cache eviction explicitly permits readmission rather than claiming permanent replay protection', () => {
  const p = policy('current', { maxSeen: 2, maxPending: 2 });
  assert.equal(p.observe(observation({ key: 'first' }), 0), true);
  p.observe(observation({ key: 'second' }), 0);
  p.observe(observation({ key: 'third' }), 0);
  assert.equal(p.observe(observation({ key: 'first' }), 1), true);
  assert.equal(p.sizes().seen, 2);
});
test('invalid clock, unbounded identities and invalid hop/density inputs fail closed', () => {
  for (const input of [{ ttl: -1 }, { ttl: 256 }, { ttl: NaN }, { degree: 1.5 }, { degree: 1001 },
    { key: '' }, { key: 'x'.repeat(129) }, { ingressLink: '' }]) {
    const p = policy(); assert.throws(() => p.observe(observation(input), 0), RangeError);
    assert.equal(p.sizes().seen, 0);
  }
  const p = policy(); p.observe(observation(), 10);
  for (const now of [9, NaN, Infinity, -1]) assert.throws(() => p.drain(now), RangeError);
  p.reset(); assert.equal(p.observe(observation(), 0), true);
});
test('inconsistent and unbounded experimental budgets are rejected', () => {
  for (const options of [{ maxSeen: 0 }, { maxIntervals: Infinity }, { maxPending: 1001 },
    { minIntervalMs: 1000 }, { seenLifetimeMs: 100 }]) assert.throws(() => policy('trickle', options), RangeError);
  assert.throws(() => nativeJitterMs(2, 1), RangeError);
  assert.throws(() => nativeJitterMs(2, -0.1), RangeError);
});
test('an invalid injected random source cannot consume first admission', () => {
  let random = 1;
  const p = policy('trickle', { random: () => random });
  assert.throws(() => p.observe(observation(), 0), RangeError);
  assert.deepEqual(p.sizes(), { seen: 0, pending: 0 });
  assert.equal(p.stats.accepted, 0);
  random = 0;
  assert.equal(p.observe(observation(), 0), true);
  assert.equal(p.drain(40).length, 1);
});
