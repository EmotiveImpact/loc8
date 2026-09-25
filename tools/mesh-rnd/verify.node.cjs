'use strict';
// Run: node --test tools/mesh-rnd/verify.node.cjs (after npm ci).
// Real TypeScript source; only the native BLE and debug-store boundary is mocked.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = process.env.LOC8_SOURCE_ROOT || path.resolve(__dirname, '../..');
const core = 'packages/engine/src/core/';

function sourceLoader(mocks = {}, fallbackUtf8 = false) {
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const source = fs.readFileSync(file, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true },
      reportDiagnostics: true, fileName: file,
    });
    assert.equal((output.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
    const module = { exports: {} };
    cache.set(file, module);
    const requireSource = spec => {
      if (Object.hasOwn(mocks, spec)) return mocks[spec];
      assert.ok(spec.startsWith('.'), `Unexpected external dependency: ${spec}`);
      return load(path.resolve(path.dirname(file), spec + '.ts'));
    };
    const execute = vm.runInThisContext(`(function(require,module,exports,TextEncoder,TextDecoder){\n${output.outputText}\n})`, { filename: file });
    execute(requireSource, module, module.exports, fallbackUtf8 ? undefined : TextEncoder, fallbackUtf8 ? undefined : TextDecoder);
    return module.exports;
  }
  return load;
}

const load = sourceLoader();
const codec = load(core + 'packetCodec.ts');
const text = load(core + 'textFragments.ts');
const types = load(core + 'types.ts');
const sample = { type: 'position', senderId: 42, targetId: 9, latitude: 51.5,
  longitude: -0.1, headingDeg: 275, batteryPct: 81, timestampSec: 1783300000, accuracyM: 12 };
const fragments = (message = 'abcdefghijklmnop', extra = {}) => text.fragmentText({
  senderId: 7, targetId: 42, msgId: 1, text: message, timestampSec: 1000, ...extra,
});
const fragment = extra => ({ ...fragments('a')[0], ...extra });
const wire = (offset, value, kind = 'setUint8', p = sample) => {
  const buffer = codec.encodePacket(p); new DataView(buffer)[kind](offset, value); return buffer;
};
const assemble = (packets, Reassembler = text.TextReassembler) => {
  const r = new Reassembler(); let result = null;
  for (const packet of packets) result = r.add(packet) || result;
  return result;
};

test('strict type-check of the changed pure engine and real dependencies', () => {
  const names = ['packetCodec.ts', 'textFragments.ts'];
  if (fs.existsSync(path.join(root, core, 'fragmentValidation.ts'))) names.push('fragmentValidation.ts');
  const program = ts.createProgram(names.map(n => path.join(root, core, n)), {
    strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS, types: [],
  });
  const errors = ts.getPreEmitDiagnostics(program);
  assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
});

for (const type of ['position', 'pingWhere', 'pingComeFind', 'rally', 'sos']) {
  test(`legacy 25-byte ${type} and signed floors remain compatible`, () => {
    for (const floor of [-64, -1, 0, 63]) {
      const p = { ...sample, type, floor };
      assert.equal(codec.encodePacket(p).byteLength, 25);
      assert.deepEqual(codec.decodePacket(codec.encodePacket(p)), p);
    }
  });
}
for (const code of [0, 1, 7, 20, 21, 22, 23, 255]) {
  test(`quick-reply code ${code} is not reinterpreted as a heading`, () => {
    const result = codec.decodePacket(codec.encodePacket({ ...sample, type: 'quickReply', quickReplyCode: code }));
    assert.equal(result.quickReplyCode, code); assert.equal(result.headingDeg, 0);
  });
}
test('consumer and operational reply codes remain disjoint', () => {
  assert.equal(types.quickReplyLabel(1), 'On my way');
  assert.equal(types.quickReplyLabel(20), 'En route');
});
test('legacy heading normalisation and accuracy capping are unchanged', () => {
  assert.equal(codec.decodePacket(codec.encodePacket({ ...sample, headingDeg: -1 })).headingDeg, 359);
  assert.equal(codec.decodePacket(codec.encodePacket({ ...sample, headingDeg: 359.6, accuracyM: 900 })).accuracyM, 255);
});
test('exact coordinate boundaries remain valid', () => {
  for (const latitude of [-90, 90]) for (const longitude of [-180, 180])
    assert.equal(codec.decodePacket(codec.encodePacket({ ...sample, latitude, longitude })).longitude, longitude);
});
for (const [name, buf] of [
  ['short frame', new ArrayBuffer(24)], ['long frame', new ArrayBuffer(26)],
  ['unknown type', wire(0, 99)], ['battery overflow', wire(19, 101)],
  ['invalid latitude', wire(9, 900000001, 'setInt32')],
  ['invalid longitude', wire(13, -1800000001, 'setInt32')],
  ['invalid heading', wire(17, 511, 'setUint16')],
  ['oversized declared fragment', wire(13, 255, 'setUint8', fragment())],
  ['zero fragment total', wire(12, 0, 'setUint8', fragment())],
  ['excessive text total', wire(12, 16, 'setUint8', fragment())],
  ['excessive profile total', wire(12, 6, 'setUint8', fragment({ type: 'profile' }))],
  ['out-of-range sequence', wire(11, 1, 'setUint8', fragment())],
]) test(`reject ${name}`, () => assert.throws(() => codec.decodePacket(buf)));

for (const [name, value] of [
  ['empty', ''], ['ASCII', 'a'.repeat(100)], ['emoji', 'meet at 🎉🎉🎉 the flag 🚩 now!'],
  ['maximum text', 'A'.repeat(160)], ['text clamp', 'z'.repeat(500)],
]) test(`valid text round-trip: ${name}`, () => {
  const packets = fragments(value).map(p => codec.decodePacket(codec.encodePacket(p)));
  assert.equal(assemble(packets).text, value.length > 160 ? value.slice(0, 160) : value);
});
test('out-of-order fragments reassemble', () => assert.equal(assemble(fragments().reverse()).text, 'abcdefghijklmnop'));
test('UTF-8 clamping preserves complete emoji', () => assert.equal(assemble(fragments('🎉'.repeat(100))).text, '🎉'.repeat(40)));
test('profile limit stays at 48 bytes', () => {
  const packets = text.fragmentProfile({ senderId: 1, targetId: 2, msgId: 3, text: 'n'.repeat(80), timestampSec: 0 });
  assert.equal(assemble(packets).text, 'n'.repeat(48));
});
for (const [name, patch] of [
  ['negative seq', { seq: -1 }], ['fractional seq', { seq: 0.5 }], ['NaN seq', { seq: NaN }],
  ['zero total', { total: 0 }], ['excessive total', { total: 255 }],
  ['bad sender', { senderId: Infinity }], ['bad target', { targetId: -1 }], ['bad ID', { msgId: 65536 }],
  ['oversized fragment', { frag: Array(12).fill(65) }], ['non-byte', { frag: [256] }],
  ['negative byte', { frag: [-1] }], ['NaN byte', { frag: [NaN] }],
  ['sparse bytes', { frag: Array(2) }], ['missing fragment', { frag: undefined }],
]) test(`direct reassembler rejects ${name}`, () => assert.equal(new text.TextReassembler().add(fragment(patch)), null));

test('target IDs cannot cross-contaminate partial messages', () => {
  const r = new text.TextReassembler(); const a = fragments('a'.repeat(16)); const b = fragments('b'.repeat(16), { targetId: 99 });
  assert.equal(r.add(a[0]), null); assert.equal(r.add(b[1]), null);
  assert.equal(r.add(a[1]).text, 'a'.repeat(16)); assert.equal(r.add(b[0]).text, 'b'.repeat(16));
});
test('text and profile cannot cross-contaminate', () => {
  const r = new text.TextReassembler(); const a = fragments('a'.repeat(16)); const b = fragments('b'.repeat(16)).map(p => ({ ...p, type: 'profile' }));
  assert.equal(r.add(a[0]), null); assert.equal(r.add(b[1]), null);
  assert.equal(r.add(a[1]).text, 'a'.repeat(16)); assert.equal(r.add(b[0]).text, 'b'.repeat(16));
});
test('sender IDs cannot cross-contaminate', () => {
  const r = new text.TextReassembler(); const a = fragments(); const b = fragments('B'.repeat(16), { senderId: 8 });
  assert.equal(r.add(a[0]), null); assert.equal(r.add(b[1]), null); assert.equal(r.add(a[1]).text, 'abcdefghijklmnop');
});
test('first-receipt expiry is not refreshed by duplicates', () => {
  let now = 0; const r = new text.TextReassembler(32, 60, () => now); const p = fragments();
  r.add(p[0]); now = 59; r.add(p[0]); now = 60; assert.equal(r.add(p[1]), null);
});
test('fragments can complete just before the deadline despite sender clock skew', () => {
  let now = 0; const r = new text.TextReassembler(32, 60, () => now); const p = fragments();
  p[0].timestampSec = 1; p[1].timestampSec = 0xffffffff;
  r.add(p[0]); now = 59.99; assert.equal(r.add(p[1]).text, 'abcdefghijklmnop');
});
test('clock rollback clears stale partial state', () => {
  let now = 100; const r = new text.TextReassembler(32, 60, () => now); const p = fragments();
  r.add(p[0]); now = 99; assert.equal(r.add(p[1]), null);
});
test('invalid local clock fails closed', () => {
  const r = new text.TextReassembler(32, 60, () => NaN); assert.equal(r.add(fragment()), null);
});
test('explicit clear removes partials', () => {
  const r = new text.TextReassembler(); const p = fragments(); r.add(p[0]); r.clear(); assert.equal(r.add(p[1]), null);
});
test('bounded oldest-first eviction still works', () => {
  const r = new text.TextReassembler(2); const packets = [1, 2, 3].map(msgId => fragments('a'.repeat(16), { msgId }));
  for (const p of packets) r.add(p[0]); assert.equal(r.add(packets[0][1]), null);
});
test('invalid capacity and lifetime are rejected', () => {
  for (const cap of [0, -1, 1.5, Infinity, 1025]) assert.throws(() => new text.TextReassembler(cap));
  for (const age of [0, -1, NaN, Infinity]) assert.throws(() => new text.TextReassembler(32, age));
});
test('partial bytes are copied, not retained by reference', () => {
  const r = new text.TextReassembler(); const p = fragments(); r.add(p[0]); p[0].frag.fill(90);
  assert.equal(r.add(p[1]).text, 'abcdefghijklmnop');
});
test('contradictory duplicate invalidates partial, not silent hybrid', () => {
  const r = new text.TextReassembler(); const p = fragments(); r.add(p[0]); r.add({ ...p[0], frag: Array(11).fill(90) });
  assert.equal(r.add(p[1]), null);
});
test('identical duplicate does not block a valid completion', () => {
  const r = new text.TextReassembler(); const p = fragments(); r.add(p[0]); r.add(p[0]); assert.equal(r.add(p[1]).text, 'abcdefghijklmnop');
});
test('rolling message ID reuse with a different total is preserved', () => {
  const r = new text.TextReassembler(); r.add(fragments('a'.repeat(50))[0]); assert.equal(r.add(fragments('ok')[0]).text, 'ok');
});
for (const [type, total] of [['text', 15], ['profile', 5]]) test(`aggregate ${type} byte limit cannot be bypassed`, () => {
  const r = new text.TextReassembler();
  for (let seq = 0; seq < total; seq++) assert.equal(r.add(fragment({ type, seq, total, frag: Array(11).fill(65) })), null);
});
for (const fallback of [false, true]) test(`malformed UTF-8 rejected (fallback=${fallback})`, () => {
  const impl = sourceLoader({}, fallback)(core + 'textFragments.ts');
  for (const bytes of [[0xff], [0xc0, 0x80], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0xe2, 0x82], [0x80]]) {
    assert.equal(new impl.TextReassembler().add(fragment({ frag: bytes })), null);
  }
  assert.equal(assemble(fragments('valid 🌍 text'), impl.TextReassembler).text, 'valid 🌍 text');
});

function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function transportFixture() {
  const starts = []; const packets = []; const statuses = []; let stops = 0; let nextBroadcast = Promise.resolve();
  const subscribe = (list, cb) => { const entry = { cb, removed: false }; list.push(entry); return { remove: () => { entry.removed = true; } }; };
  const debug = { sent: 0, received: 0, dropped: 0, errors: [], statuses: [],
    markSent() { this.sent++; }, markReceived() { this.received++; }, markDropped() { this.dropped++; },
    setStatus(s) { this.statuses.push(s); }, setError(s) { this.errors.push(s); },
  };
  const native = {
    start() { const task = deferred(); starts.push(task); return task.promise; },
    stop() { stops++; return Promise.resolve(); }, broadcast() { return nextBroadcast; },
    addPacketListener(cb) { return subscribe(packets, cb); }, addStatusListener(cb) { return subscribe(statuses, cb); },
  };
  const { BleMeshTransport } = sourceLoader({ '../../../../modules/loc8-mesh': native,
    '../state/meshDebugStore': { useMeshDebugStore: { getState: () => debug } },
  })('packages/engine/src/transport/BleMeshTransport.ts');
  const transport = new BleMeshTransport();
  const event = { data: new Uint8Array(codec.encodePacket(sample)), relayVia: 'test-relay' };
  return { transport, starts, packets, statuses, debug, event, get stops() { return stops; },
    failBroadcast(error) { nextBroadcast = Promise.reject(error); },
  };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
test('transport starts/stops idempotently and detaches native listeners', () => {
  const f = transportFixture(); f.transport.start(); f.transport.start(); assert.equal(f.starts.length, 1);
  f.transport.stop(); f.transport.stop(); assert.equal(f.stops, 1); assert.ok(f.packets[0].removed);
});
test('late rejection of old start cannot tear down replacement session', async () => {
  const f = transportFixture(); let received = 0; f.transport.onPacket(() => received++);
  f.transport.start(); f.transport.stop(); f.transport.start(); f.starts[1].resolve();
  f.starts[0].reject(new Error('old start')); await tick();
  assert.equal(f.packets[1].removed, false); f.packets[1].cb(f.event); assert.equal(received, 1);
  assert.equal(f.debug.errors.length, 0);
});
test('current start rejection is visible and retry works', async () => {
  const f = transportFixture(); f.transport.start(); f.starts[0].reject(new Error('Bluetooth unavailable')); await tick();
  assert.ok(f.packets[0].removed); assert.equal(f.debug.statuses.at(-1).connected, false);
  f.transport.start(); assert.equal(f.starts.length, 2); assert.equal(f.packets[1].removed, false);
});
test('stale native callbacks after stop are ignored', () => {
  const f = transportFixture(); f.transport.start(); f.transport.stop(); f.packets[0].cb(f.event);
  f.statuses[0].cb({ nearbyCount: 42, connected: true }); assert.equal(f.debug.received, 0); assert.equal(f.debug.statuses.length, 0);
});
test('clearListeners allows app listeners to be replaced while running', () => {
  const f = transportFixture(); let old = 0, next = 0;
  f.transport.onPacket(() => old++); f.transport.start(); f.transport.clearListeners(); f.transport.onPacket(() => next++);
  assert.equal(f.packets[0].removed, false); f.packets[0].cb(f.event); assert.equal(old, 0); assert.equal(next, 1);
});
test('malformed native packet is dropped before app callbacks', () => {
  const f = transportFixture(); let delivered = false; f.transport.onPacket(() => { delivered = true; }); f.transport.start();
  f.packets[0].cb({ data: new Uint8Array(wire(19, 255)) }); assert.equal(f.debug.dropped, 1); assert.equal(delivered, false);
});
test('native packet byteOffset/byteLength are respected', () => {
  const f = transportFixture(); let received = null; f.transport.onPacket(p => { received = p; }); f.transport.start();
  const bytes = new Uint8Array(40); bytes.set(f.event.data, 5); f.packets[0].cb({ data: bytes.subarray(5, 30) });
  assert.equal(received.senderId, sample.senderId);
});
test('broadcast failure becomes visible; attempt count is not delivery evidence', async () => {
  const f = transportFixture(); f.transport.start(); f.failBroadcast(new Error('queue unavailable')); f.transport.broadcast(sample); await tick();
  assert.equal(f.debug.sent, 1); assert.match(f.debug.errors[0], /broadcast failed/i);
});
test('old broadcast failure cannot overwrite replacement-session diagnostics', async () => {
  const f = transportFixture(); f.transport.start(); f.failBroadcast(new Error('old queue')); f.transport.broadcast(sample);
  f.transport.stop(); f.transport.start(); await tick(); assert.equal(f.debug.errors.length, 0);
});

test('25,000 seeded wire mutations reject or produce bounded valid ingress', () => {
  let seed = 0x10882026; const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed; };
  const r = new text.TextReassembler(32, 60, () => 0);
  for (let i = 0; i < 25000; i++) {
    const bytes = new Uint8Array(25); for (let j = 0; j < 25; j++) bytes[j] = random() >>> 24;
    if (i % 2 === 0) bytes[0] = random() % 8;
    let p; try { p = codec.decodePacket(bytes.buffer); } catch (error) { assert.ok(error instanceof Error); continue; }
    if (p.type === 'text' || p.type === 'profile') {
      assert.ok(p.total >= 1 && p.total <= (p.type === 'text' ? 15 : 5)); assert.ok(p.seq < p.total); assert.ok(p.frag.length <= 11);
      const result = r.add(p); if (result) assert.ok(Buffer.byteLength(result.text) <= (p.type === 'text' ? 160 : 48));
    } else {
      assert.ok(p.batteryPct <= 100);
      if (p.type !== 'quickReply') { assert.ok(Math.abs(p.latitude) <= 90); assert.ok(Math.abs(p.longitude) <= 180); assert.ok(p.headingDeg < 360); }
    }
  }
});

test('byte-for-byte compatibility with 14 pinned legacy encoder fixtures', () => {
  const golden = JSON.parse(fs.readFileSync(path.join(__dirname, 'wire-v1-golden.json'), 'utf8'));
  assert.equal(golden.baseCommit, 'f6b09a492c362f1c73b775d67721da1cc345fe91');
  assert.equal(golden.fixtures.length, 14);
  for (const { packet, hex } of golden.fixtures) {
    assert.equal(Buffer.from(codec.encodePacket(packet)).toString('hex'), hex);
    assert.equal(codec.decodePacket(codec.encodePacket(packet)).type, packet.type);
  }
});
