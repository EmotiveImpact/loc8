'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');
const { createLoader, root } = require('./source-test-loader.cjs');
const { makeFrame, immutableKey } = require('./branch-simulation.cjs');
const { ExperimentalBranchRelayPolicy } = createLoader()('packages/engine/src/experimental/branchRelayPolicy.ts');
const { relayTTL } = createLoader()('packages/engine/src/experimental/relayPolicy.ts');
const observe = (policy, { key = 'message', frame = makeFrame(), degree = 2, ingressLink = 'a', senderIsSelf = false } = {}, at = 0) =>
  policy.observe({ key, frame, degree, ingressLink, senderIsSelf }, at);
const policy = options => new ExperimentalBranchRelayPolicy({ random: () => 0, ...options });

test('strict semantic TypeScript check of v2 and actual pure dependencies', () => {
  const program = ts.createProgram([path.join(root, 'packages/engine/src/experimental/branchRelayPolicy.ts')], {
    strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS, types: [],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
});
test('matching duplicates preserve deadline, TTL and uncovered live branches', () => {
  const p = policy({ random: () => 0.5 });
  assert.equal(observe(p, { degree: 6 }), true);
  const deadline = p.nextDeadline(); assert.equal(deadline, 130);
  assert.equal(observe(p, { frame: makeFrame(5), degree: 2, ingressLink: 'b' }, 2), false);
  assert.equal(p.nextDeadline(), deadline);
  const forwards = p.drain(deadline, ['a', 'b', 'c']);
  assert.equal(forwards.length, 1); assert.equal(forwards[0].ttl, 4);
  assert.deepEqual(forwards[0].links, ['c']); assert.equal(forwards[0].attempt, 1);
  assert.equal(forwards[0].frame[2], 4);
  const expected = makeFrame(4); assert.deepEqual(Buffer.from(forwards[0].frame), expected);
  assert.equal(p.nextDeadline(), null);
});
test('a supplied-key collision cannot suppress another branch or alter admitted bytes', () => {
  const p = policy(); observe(p);
  const different = makeFrame(); different[46] ^= 1;
  assert.equal(observe(p, { frame: different, ingressLink: 'b' }, 1), false);
  assert.equal(p.stats.identityConflicts, 1);
  assert.equal(p.stats.duplicates, 0);
  assert.deepEqual(p.drain(10, ['a', 'b', 'c'])[0].links, ['b', 'c']);
});
test('TTL changes are the sole witness-normalized field', () => {
  assert.equal(immutableKey(makeFrame(7)), immutableKey(makeFrame(3)));
  for (const offset of [0, 1, 3, 10, 11, 12, 13, 14, 21, 22, 46]) {
    const changed = makeFrame(); changed[offset] ^= 1;
    assert.notEqual(immutableKey(changed), immutableKey(makeFrame()));
  }
});
test('source input buffers are copied and output buffers cannot mutate retained witnesses', () => {
  const p = policy(), frame = makeFrame(); observe(p, { frame }); frame[46] ^= 1;
  const forwarded = p.drain(10, ['b'])[0];
  assert.equal(immutableKey(forwarded.frame), immutableKey(makeFrame()));
  forwarded.frame[46] ^= 1;
  assert.equal(observe(p, { frame: makeFrame(), ingressLink: 'b' }, 11), false);
  assert.equal(p.stats.identityConflicts, 0);
});
test('ingress overflow keeps forwarding unknown branches and never loses the original exclusion', () => {
  const p = policy({ maxIngressLinks: 2 }); observe(p);
  observe(p, { ingressLink: 'b' }, 1); observe(p, { ingressLink: 'c' }, 2);
  assert.equal(p.sizes().exclusions, 2); assert.equal(p.stats.ingressOverflow, 1);
  assert.deepEqual(p.drain(10, ['a', 'b', 'c', 'd'])[0].links, ['c', 'd']);
});
test('duplicate storms cannot inflate resident exclusions beyond the budget', () => {
  const p = policy(); observe(p);
  for (let i = 0; i < 10_000; i++) observe(p, { ingressLink: `link-${i}` }, 1);
  assert.deepEqual(p.sizes(), { seen: 1, pending: 1, exclusions: 64, witnessBytes: 47 });
  assert.equal(p.nextDeadline(), 10);
  assert.equal(p.stats.ingressOverflow, 10_000 - 63);
});
test('capacity rejection preserves first application admission and bounded seen state', () => {
  const p = policy({ maxSeen: 2, maxPending: 1 });
  assert.equal(observe(p, { key: 'one' }), true);
  assert.equal(observe(p, { key: 'two' }), true);
  assert.equal(p.stats.capacityDrops, 1);
  assert.deepEqual(p.sizes(), { seen: 2, pending: 1, exclusions: 1, witnessBytes: 94 });
  assert.equal(observe(p, { key: 'two' }, 1), false);
});
test('FIFO eviction removes only the evicted frame pending state', () => {
  const p = policy({ maxSeen: 2, maxPending: 2 });
  observe(p, { key: 'one' }); observe(p, { key: 'two' }, 1); observe(p, { key: 'three' }, 2);
  assert.equal(p.stats.evicted, 1);
  assert.deepEqual(p.drain(20, ['b']).map(frame => frame.key), ['two', 'three']);
  assert.equal(p.sizes().seen, 2);
});
test('active expiry rejects an overdue send while ordinary lateness emits at most one', () => {
  const late = policy(); observe(late);
  assert.equal(late.drain(500, ['b']).length, 1);
  assert.equal(late.drain(501, ['b']).length, 0);
  const expired = policy(); observe(expired);
  assert.equal(expired.drain(4550, ['b']).length, 0);
  assert.equal(expired.stats.expired, 1); assert.equal(expired.sizes().pending, 0);
});
test('duplicates do not renew seen lifetime; replay admission after expiry is explicit', () => {
  const p = policy(); observe(p); p.drain(10, ['b']);
  assert.equal(observe(p, { ingressLink: 'b' }, 299_999), false);
  assert.equal(observe(p, { ingressLink: 'b' }, 300_000), true);
  assert.equal(p.nextDeadline(), 300_010);
});
test('clock regression and invalid clocks reject work', () => {
  const p = policy(); observe(p, {}, 10);
  assert.throws(() => observe(p, {}, 9), /monotonic/);
  assert.throws(() => p.drain(NaN, ['b']), /monotonic/);
  assert.equal(p.sizes().pending, 1);
});
test('lifecycle reset clears witness, exclusion and timer state and allows a new clock origin', () => {
  const p = policy(); observe(p, {}, 100); observe(p, { ingressLink: 'b' }, 101); p.reset();
  assert.deepEqual(p.sizes(), { seen: 0, pending: 0, exclusions: 0, witnessBytes: 0 });
  assert.equal(p.nextDeadline(), null); assert.equal(p.drain(0, ['c']).length, 0);
  assert.equal(observe(p), true);
});
test('all wire TTL values use the existing clamp exactly and preserve immutable bytes', () => {
  for (const degree of [0, 2, 3, 6, 10]) for (let ttl = 0; ttl <= 255; ttl++) {
    const p = policy(), frame = makeFrame(ttl); observe(p, { frame, degree });
    const output = p.drain(500, ['b']), expected = relayTTL(ttl, degree);
    assert.equal(output.length, expected === null ? 0 : 1);
    if (expected !== null) {
      assert.equal(output[0].ttl, expected);
      assert.equal(immutableKey(output[0].frame), immutableKey(frame));
    }
  }
});
test('origin echoes are retained but never create a relay timer', () => {
  const p = policy(), frame = makeFrame(); p.markOrigin('self', frame, 0);
  assert.equal(observe(p, { key: 'self', frame, senderIsSelf: true }, 1), false);
  assert.equal(p.nextDeadline(), null); assert.equal(p.stats.accepted, 0);
  p.markOrigin('self', frame, 2); assert.equal(p.sizes().seen, 1);
});
test('invalid random values cannot consume cache or first delivery admission', () => {
  let value = 1; const p = policy({ random: () => value });
  assert.throws(() => observe(p), /random/);
  assert.deepEqual(p.sizes(), { seen: 0, pending: 0, exclusions: 0, witnessBytes: 0 });
  value = 0; assert.equal(observe(p), true);
});
test('drain uses only current live links, preserves caller order and deduplicates role repeats', () => {
  const p = policy(); observe(p);
  assert.deepEqual(p.drain(10, ['d', 'b', 'd', 'c'])[0].links, ['d', 'b', 'c']);
  assert.throws(() => p.drain(11, Array(1001).fill('x')), /1000/);
});
test('link incarnation reset forgets only that receipt and never moves the timer', () => {
  const p = policy(); observe(p); observe(p, { ingressLink: 'b' }, 1);
  const deadline = p.nextDeadline(); p.forgetLink('b', 2);
  assert.equal(p.nextDeadline(), deadline);
  assert.equal(p.sizes().exclusions, 1);
  assert.deepEqual(p.drain(10, ['a', 'b', 'c'])[0].links, ['b', 'c']);
});
test('malformed frames and inconsistent budgets fail without admission', () => {
  const p = policy();
  for (const frame of [Buffer.alloc(46), Buffer.alloc(48), Buffer.alloc(47)]) assert.throws(() => observe(p, { frame }), /47-byte/);
  assert.equal(p.sizes().seen, 0);
  assert.throws(() => policy({ maxSeen: 1, maxPending: 2 }), /budgets/);
  assert.throws(() => policy({ maxIngressLinks: 0 }), /maxIngress/);
  assert.throws(() => policy({ seenLifetimeMs: 1, activeLifetimeMs: 2 }), /budgets/);
});
