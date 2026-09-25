'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');
const { createLoader, stateMock, flush, deferred, root } = require('./source-test-loader.cjs');
const corePath = 'packages/engine/src/core/sourceLocation.ts';
const sampleTime = 1_800_000_000_123;
const c = { latitude: 51.5, longitude: -0.1 };
const input = (patch = {}) => ({ coords: { ...c, accuracy: 12.25 }, timestamp: sampleTime, ...patch });
const clock = (seconds = 100, epoch = 'test') => ({ seconds, epoch });
const core = createLoader()(corePath);

test('strict semantic TypeScript for sample and watcher with their actual core dependencies', () => {
  const files = [corePath, 'packages/engine/src/services/sourceLocationWatch.ts'];
  const p = ts.createProgram(files.map(f => path.join(root, f)), {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true, noEmit: true, skipLibCheck: true, types: [],
  });
  const ds = ts.getPreEmitDiagnostics(p);
  assert.equal(ds.length, 0, ts.formatDiagnosticsWithColorAndContext(ds, {
    getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
});
test('preserve provider epoch milliseconds, full accuracy and separate receipt time', () => {
  const s = core.captureSourceLocation(input(), sampleTime + 4000, clock());
  assert.equal(s.observedAtMs, sampleTime); assert.equal(s.receivedAtMs, sampleTime + 4000);
  assert.equal(s.accuracyM, 12.25); assert.equal(s.mocked, null);
});
test('provider data and clock cannot mutate a retained sample', () => {
  const raw = input(); const time = clock(); const s = core.captureSourceLocation(raw, sampleTime, time);
  raw.coords.latitude = 60; raw.coords.accuracy = 0; time.seconds = 900;
  assert.deepEqual(s.coordinate, c); assert.equal(s.accuracyM, 12.25); assert.equal(s.elapsedClock.seconds, 100);
});
for (const bad of [null, {}, input({ timestamp: 0 }), input({ timestamp: NaN }), input({ timestamp: Infinity }),
  input({ timestamp: sampleTime + 1 }), input({ coords: { latitude: 91, longitude: 0 } }),
  input({ coords: { latitude: 0, longitude: NaN } })]) {
  test(`reject invalid/future provider input ${JSON.stringify(bad)}`, () => assert.equal(core.captureSourceLocation(bad, sampleTime, clock()), null));
}
for (const accuracy of [undefined, null, -1, NaN, Infinity]) {
  test(`unknown provider accuracy ${accuracy} is not invented as 10m`, () => {
    const s = core.captureSourceLocation(input({ coords: { ...c, accuracy } }), sampleTime, clock());
    assert.equal(s.accuracyM, null); assert.equal(core.legacySourceAccuracy(c, s), 255);
  });
}
for (const [accuracy, encoded] of [[0, 0], [0.1, 1], [12.25, 13], [254.1, 255], [255, 255], [932.4, 255]]) {
  test(`accuracy ${accuracy} retained locally, conservatively encoded as ${encoded}`, () => {
    const s = core.captureSourceLocation(input({ coords: { ...c, accuracy } }), sampleTime, clock());
    assert.equal(s.accuracyM, accuracy); assert.equal(core.legacySourceAccuracy(c, s), encoded);
  });
}
test('legacy coordinate-only setter cannot inherit another sample accuracy', () => {
  assert.equal(core.legacySourceAccuracy(c, null), 255);
  const s = core.captureSourceLocation(input(), sampleTime, clock());
  assert.equal(core.legacySourceAccuracy({ ...c, latitude: 52 }, s), 255);
});
test('device-reported mock status is retained and never labelled a current real fix', () => {
  const s = core.captureSourceLocation(input({ mocked: true }), sampleTime, clock());
  assert.equal(core.sourceLocationView(c, s, sampleTime, clock()).state, 'mocked');
  assert.equal(core.legacySourceAccuracy(c, s), 255);
});
test('explicit demo sample stays a demo rather than a source-time claim', () => {
  const s = core.captureSourceLocation(input(), sampleTime, clock(), 'demo');
  const v = core.sourceLocationView(c, s, sampleTime, clock()); assert.equal(v.state, 'demo'); assert.equal(v.isCurrent, false);
});
for (const [age, expected] of [[0, 'recent'], [30000, 'recent'], [30001, 'ageing'], [90000, 'ageing'], [90001, 'stale'], [300000, 'stale']]) {
  test(`sample age ${age}ms has state ${expected}`, () => {
    const s = core.captureSourceLocation(input(), sampleTime, clock());
    const v = core.sourceLocationView(c, s, sampleTime + age, clock(100 + age / 1000));
    assert.equal(v.state, expected); assert.ok(Math.abs(v.ageMs - age) < 0.001);
  });
}
test('late callback preserves five-minute sample age on arrival', () => {
  const s = core.captureSourceLocation(input(), sampleTime + 300000, clock());
  const v = core.sourceLocationView(c, s, sampleTime + 300000, clock()); assert.equal(v.ageMs, 300000); assert.equal(v.isCurrent, false);
});
for (const [time, elapsed, epoch] of [[sampleTime - 10000, 110, 'test'], [sampleTime + 100000, 100, 'test'],
  [sampleTime, 99, 'test'], [sampleTime, 100, 'restarted'], [sampleTime, null, 'test']]) {
  test(`clock discontinuity fails closed ${time}/${elapsed}/${epoch}`, () => {
    const s = core.captureSourceLocation(input(), sampleTime, clock());
    const v = core.sourceLocationView(c, s, time, clock(elapsed, epoch)); assert.equal(v.isCurrent, false); assert.equal(v.ageMs, null);
  });
}
test('duplicate/older sample cannot acquire a new receipt', () => {
  const old = core.captureSourceLocation(input(), sampleTime, clock());
  const dup = core.captureSourceLocation(input(), sampleTime + 10000, clock(110));
  const prev = core.captureSourceLocation(input({ timestamp: sampleTime - 100 }), sampleTime, clock());
  assert.equal(core.shouldReplaceSourceLocation(old, dup), false); assert.equal(core.shouldReplaceSourceLocation(old, prev), false);
});
test('stationary same-coordinate newer fix is still a new sample', () => {
  const old = core.captureSourceLocation(input(), sampleTime, clock());
  const next = core.captureSourceLocation(input({ timestamp: sampleTime + 1 }), sampleTime + 1, clock());
  assert.equal(core.shouldReplaceSourceLocation(old, next), true);
});

function fixture() {
  const time = { wall: sampleTime + 4877, elapsed: 100 };
  const mocks = { zustand: stateMock(), '@react-native-async-storage/async-storage': { default: { setItem: async () => {} } },
    '../ui/theme': { FRIEND_COLORS: ['test'] },
    'react-native': { AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } },
    './haptics': { haptics: {} },
  };
  const load = createLoader(mocks, time); const store = load('packages/engine/src/state/crewStore.ts').useCrewStore;
  store.getState().setProfile({ id: 1, name: 'Local', color: 'test' });
  store.getState().startSession(1, Math.floor(time.wall / 1000));
  const out = []; const transport = { broadcast: p => out.push(p), start() {}, stop() {}, clearListeners() {}, onPacket() {}, onMeshStatus() {} };
  const TrustLayer = load('packages/engine/src/core/trustLayer.ts').TrustLayer;
  const trust = new TrustLayer(undefined, () => Math.floor(time.wall / 1000));
  const service = load('packages/engine/src/services/meshService.ts').createMeshService(transport, trust, () => Math.floor(time.wall / 1000));
  return { time, load, store, out, service, TrustLayer };
}
test('actual crew store preserves and owns one source sample', () => {
  const x = fixture(); const raw = input(); assert.equal(x.store.getState().setMyLocationSample(raw), true);
  raw.coords.latitude = 60; assert.deepEqual(x.store.getState().myLocation, c);
  assert.equal(x.store.getState().myLocationSample.observedAtMs, sampleTime);
});
test('actual store ignores sample duplicates, older updates and invalid inputs', () => {
  const x = fixture(); x.store.getState().setMyLocationSample(input()); const before = x.store.getState().myLocationSample;
  for (const raw of [input(), input({ timestamp: sampleTime - 1 }), input({ coords: { latitude: NaN, longitude: 0 } })]) {
    assert.equal(x.store.getState().setMyLocationSample(raw), false); assert.equal(x.store.getState().myLocationSample, before);
  }
});
test('legacy setter clears sample binding, clear resets both, demo is explicit', () => {
  const x = fixture(); x.store.getState().setMyLocationSample(input()); x.store.getState().setMyLocation(c);
  assert.equal(x.store.getState().myLocationSample, null); x.store.getState().setDemoLocation(c);
  assert.equal(x.store.getState().myLocationSample.source, 'demo'); x.store.getState().clearMyLocation();
  assert.equal(x.store.getState().myLocation, null); assert.equal(x.store.getState().myLocationSample, null);
});
test('actual publisher: stationary 5-minute cached fix does not reset observation time or break heartbeat dedup', () => {
  const x = fixture(); x.store.getState().setMyLocationSample(input()); const original = x.store.getState().myLocationSample;
  const codec = x.load('packages/engine/src/core/packetCodec.ts'); const receiver = new x.TrustLayer(undefined, () => Math.floor(x.time.wall / 1000));
  for (let i = 0; i <= 60; i++) {
    x.service.broadcastTick(); x.time.wall += 5000; x.time.elapsed += 5;
  }
  const reports = x.out.filter(p => p.type === 'position'); assert.equal(reports.length, 61);
  for (const p of reports) {
    const frame = codec.encodePacket(p); assert.equal(frame.byteLength, 25);
    const received = codec.decodePacket(frame); assert.equal(receiver.accept(received), true);
    assert.equal(received.accuracyM, 13); assert.equal(received.latitude, c.latitude);
  }
  assert.equal(x.store.getState().myLocationSample, original);
  assert.equal(original.observedAtMs, sampleTime); assert.equal(original.accuracyM, 12.25);
  assert.equal(reports[60].timestampSec - reports[0].timestampSec, 300);
  const view = x.load(corePath).sourceLocationView(x.store.getState().myLocation, original);
  assert.equal(view.state, 'stale'); assert.ok(view.ageMs >= 300000);
  // Demonstrate why replacing the v1 report clock with sample time is NOT done.
  const badReceiver = new x.TrustLayer(undefined, () => Math.floor(x.time.wall / 1000));
  const bad = { ...reports[0], timestampSec: Math.floor(sampleTime / 1000) };
  assert.equal(badReceiver.accept(bad), true); assert.equal(badReceiver.accept(bad), false);
});
test('beacon cadence remains 60s and does not mutate retained sample provenance', () => {
  const x = fixture(); x.store.getState().setMyLocationSample(input()); x.store.getState().setBeacon(true);
  x.service.broadcastTick(); x.time.wall += 59000; x.time.elapsed += 59; x.service.broadcastTick();
  assert.equal(x.out.filter(p => p.type === 'position').length, 1);
  x.time.wall += 1000; x.time.elapsed++; x.service.broadcastTick();
  assert.equal(x.out.filter(p => p.type === 'position').length, 2);
  assert.equal(x.store.getState().myLocationSample.observedAtMs, sampleTime);
});
test('late sample publication carries real accuracy but does not claim source time on wire', () => {
  const x = fixture(); x.store.getState().setMyLocationSample(input({ timestamp: sampleTime - 300000, coords: { ...c, accuracy: 82.1 } }));
  x.service.broadcastTick(); const p = x.out.find(p => p.type === 'position');
  assert.equal(p.timestampSec, Math.floor(x.time.wall / 1000)); assert.equal(p.accuracyM, 83);
  assert.equal(x.store.getState().myLocationSample.observedAtMs, sampleTime - 300000);
  const decoded = x.load('packages/engine/src/core/packetCodec.ts').decodePacket(x.load('packages/engine/src/core/packetCodec.ts').encodePacket(p));
  const remote = x.load('packages/engine/src/core/positionFreshness.ts').friendPositionFreshness({ lastPacket: decoded }, p.timestampSec);
  assert.equal(remote.isCurrent, false); assert.equal(remote.ageSec, null);
});
test('new stationary provider fix changes sample time and measured accuracy without changing cadence', () => {
  const x = fixture(); x.store.getState().setMyLocationSample(input()); x.service.broadcastTick();
  x.time.wall += 5000; x.time.elapsed += 5;
  x.store.getState().setMyLocationSample(input({ timestamp: x.time.wall - 1, coords: { ...c, accuracy: 37.8 } }));
  x.service.broadcastTick(); assert.equal(x.out.filter(p => p.type === 'position').at(-1).accuracyM, 38);
});
test('GPS absence stops coordinate publications but preserves geo-free status replies and text', () => {
  const x = fixture(); x.store.getState().clearMyLocation(); x.service.broadcastTick();
  assert.equal(x.out.length, 0); x.service.sendQuickReply(7, 20);
  const p = x.out[0]; assert.equal(p.type, 'quickReply'); assert.equal(p.quickReplyCode, 20);
  const codec = x.load('packages/engine/src/core/packetCodec.ts'); const decoded = codec.decodePacket(codec.encodePacket(p));
  assert.equal(decoded.latitude, 0); assert.equal(decoded.longitude, 0); assert.equal(decoded.quickReplyCode, 20);
  x.service.sendCrewMessage('still available'); assert.ok(x.out.some(p => p.type === 'text'));
});
test('privacy and session gates still suppress coordinate heartbeat', () => {
  const x = fixture(); x.store.getState().setMyLocationSample(input()); x.store.getState().setPrivacy('invisible');
  x.service.broadcastTick(); assert.equal(x.out.length, 0); x.store.getState().setPrivacy('live');
  x.store.getState().endSession(); x.service.broadcastTick(); assert.equal(x.out.length, 0);
});

function watcherFixture() {
  const got = []; const statuses = []; let cleared = 0;
  const api = createLoader()('packages/engine/src/services/sourceLocationWatch.ts');
  const sink = { accept: s => { got.push(s); return true; }, unavailable: () => cleared++, status: s => statuses.push(s) };
  return { api, sink, got, statuses, get cleared() { return cleared; } };
}
test('watcher denial never subscribes or invents a sample', async () => {
  const x = watcherFixture(); let watched = 0;
  const task = x.api.startSourceLocationWatch({ permitted: async () => false, watch: async () => watched++ }, x.sink);
  await task.ready; assert.equal(watched, 0); assert.equal(x.cleared, 1); assert.equal(x.got.length, 0); assert.equal(x.statuses.at(-1), 'denied');
});
test('permission and watcher promise failures are explicit, not unhandled rejections', async () => {
  for (const mode of ['permission', 'watch']) {
    const x = watcherFixture(); const task = x.api.startSourceLocationWatch({
      permitted: async () => { if (mode === 'permission') throw Error('denied'); return true; },
      watch: async () => { throw Error('no provider'); },
    }, x.sink);
    await task.ready; assert.equal(x.cleared, 1); assert.equal(x.statuses.at(-1), 'unavailable');
  }
});
test('cancel during permission lookup starts no subscription or late fallback', async () => {
  const x = watcherFixture(); const permission = deferred(); let watched = 0;
  const task = x.api.startSourceLocationWatch({ permitted: () => permission.promise, watch: async () => watched++ }, x.sink);
  task.stop(); permission.resolve(false); await task.ready;
  assert.equal(watched, 0); assert.equal(x.cleared, 0); assert.deepEqual(x.statuses, ['pending']);
});
test('late subscription resolves after stop and is removed exactly once; callbacks ignored', async () => {
  const x = watcherFixture(); const setup = deferred(); let cb, error, removed = 0;
  const task = x.api.startSourceLocationWatch({ permitted: async () => true, watch: (a, b) => { cb = a; error = b; return setup.promise; } }, x.sink);
  await flush(); task.stop(); cb(input()); error('late'); setup.resolve({ remove() { removed++; } }); await task.ready; task.stop();
  assert.equal(removed, 1); assert.equal(x.cleared, 0); assert.equal(x.got.length, 0);
});
test('active watcher reports recoverable errors and only accepted samples restore status', async () => {
  const x = watcherFixture(); let cb, err; let accept = false;
  x.sink.accept = () => accept;
  const task = x.api.startSourceLocationWatch({ permitted: async () => true, watch: async (a, b) => { cb = a; err = b; return { remove() {} }; } }, x.sink);
  await task.ready; err('provider offline'); cb(input()); assert.equal(x.statuses.at(-1), 'unavailable');
  accept = true; cb(input()); assert.equal(x.statuses.at(-1), 'granted'); task.stop();
});
for (const hook of ['src/hooks/useMyLocation.ts', 'apps/guard/src/hooks/useMyLocation.ts']) {
  for (const sim of [false, true]) test(`${hook}: denied permission fallback is ${sim ? 'explicit demo' : 'absent on real transport'}`, async () => {
    const x = fixture(); let clean, fallback = 0; const status = []; const calls = [];
    const engine = {
      useCrewStore: x.store, FALLBACK_ORIGIN: c, getSimTransport: () => sim ? { setOrigin() { fallback++; } } : null,
      startSourceLocationWatch: x.load('packages/engine/src/services/sourceLocationWatch.ts').startSourceLocationWatch,
    };
    const l = createLoader({ react: { useState: () => ['pending', s => status.push(s)], useEffect: f => { clean = f(); } },
      'expo-location': { getForegroundPermissionsAsync: async () => ({ status: 'denied' }), watchPositionAsync: () => calls.push(1), Accuracy: { Balanced: 3 } },
      '@loc8/engine': engine,
    }, x.time);
    l(hook).useMyLocation(); await flush();
    assert.equal(calls.length, 0); assert.equal(status.at(-1), 'denied'); assert.equal(fallback, sim ? 1 : 0);
    assert.equal(x.store.getState().myLocationSample?.source ?? null, sim ? 'demo' : null); clean();
  });
  test(`${hook}: source timestamp and accuracy cross real hook/store seam without filtering them out`, async () => {
    const x = fixture(); let clean, callback, options; let removed = 0;
    const engine = { useCrewStore: x.store, FALLBACK_ORIGIN: c, getSimTransport: () => null,
      startSourceLocationWatch: x.load('packages/engine/src/services/sourceLocationWatch.ts').startSourceLocationWatch };
    const l = createLoader({ react: { useState: () => ['pending', () => {}], useEffect: fn => { clean = fn(); } },
      'expo-location': { getForegroundPermissionsAsync: async () => ({ status: 'granted' }), Accuracy: { Balanced: 3 },
        watchPositionAsync: async (o, cb) => { options = o; callback = cb; return { remove() { removed++; } }; } }, '@loc8/engine': engine,
    }, x.time);
    l(hook).useMyLocation(); await flush(); callback(input());
    assert.equal(x.store.getState().myLocationSample.observedAtMs, sampleTime); assert.equal(x.store.getState().myLocationSample.accuracyM, 12.25);
    assert.deepEqual(options, { accuracy: 3, timeInterval: 3000, distanceInterval: 2 }); clean(); callback(input({ timestamp: sampleTime + 1 }));
    assert.equal(removed, 1); assert.equal(x.store.getState().myLocationSample.observedAtMs, sampleTime);
  });
}

for (const hasFix of [false, true]) test(`Guard SOS retains alert path and uses ${hasFix ? 'provider accuracy' : 'wire ceiling, not invented 10m'} without a new frame type`, () => {
  const x = fixture(); if (hasFix) x.store.getState().setMyLocationSample(input({ coords: { ...c, accuracy: 64.1 } }));
  const sent = []; let raised = 0, rallied = 0, text = 0;
  const guard = { badge: 1, shift: { zone: 'Zone' }, raiseSos() { raised++; } };
  const l = createLoader({ '@loc8/engine': {
    useCrewStore: x.store, getTransport: () => ({ broadcast: p => sent.push(p) }),
    getMeshService: () => ({ dropRally() { rallied++; }, sendCrewMessage() { text++; } }),
    haptics: { sos() {} }, opsMsg: { sos: () => 'SOS' }, legacySourceAccuracy: x.load(corePath).legacySourceAccuracy,
  }, './guardStore': { useGuardStore: { getState: () => guard }, badgeLabel: n => String(n) } }, x.time);
  l('apps/guard/src/state/sos.ts').raiseSosNow();
  assert.equal(sent.length, 1); assert.equal(sent[0].type, 'sos'); assert.equal(sent[0].accuracyM, hasFix ? 65 : 255);
  assert.equal(raised, 1); assert.equal(rallied, 1); assert.equal(text, 1);
});
test('actual BLE diagnostic component exposes source sample state, age and full accuracy separately from attempts', () => {
  const x = fixture(); x.store.getState().setMyLocationSample(input());
  const jsx = (type, props) => ({ type, props });
  const diagnostics = { sent: 10, received: 1, dropped: 0, nearbyCount: 1, connected: true, lastRxSec: 0 };
  const l = createLoader({
    react: { useState: () => [true, () => {}] }, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: v => v } },
    '@loc8/engine': { useCrewStore: x.store, useMeshDebugStore: () => diagnostics,
      sourceLocationView: x.load(corePath).sourceLocationView, colors: {} },
    'lucide-react-native': { ChevronDown: 'ChevronDown', TriangleAlert: 'TriangleAlert' },
    '../hooks/useNowSec': { useNowSec: () => Math.floor(x.time.wall / 1000) },
  }, x.time);
  const before = process.env.EXPO_PUBLIC_TRANSPORT; process.env.EXPO_PUBLIC_TRANSPORT = 'ble';
  try {
    const component = l('src/ui/MeshDebugOverlay.tsx').MeshDebugOverlay();
    const output = component.type(component.props);
    const rows = output.props.children.filter(n => n?.props?.label);
    assert.equal(rows.find(n => n.props.label === 'attempts').props.value, '10');
    assert.equal(rows.find(n => n.props.label === 'fix accuracy').props.value, '12.3m');
    assert.equal(rows.find(n => n.props.label === 'fix age').props.value, '4s');
  } finally { if (before === undefined) delete process.env.EXPO_PUBLIC_TRANSPORT; else process.env.EXPO_PUBLIC_TRANSPORT = before; }
});
