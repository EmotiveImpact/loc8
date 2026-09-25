'use strict';
// Real TypeScript source with declared platform boundaries mocked. No RF claim.
// Run after npm ci: node --test tools/mesh-rnd/freshness.node.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = process.env.LOC8_SOURCE_ROOT || path.resolve(__dirname, '../..');
const core = 'packages/engine/src/core/positionFreshness.ts';
const coord = { latitude: 51.5, longitude: -0.1 };
const packet = (patch = {}) => ({ type: 'position', senderId: 7, targetId: 42, ...coord,
  headingDeg: 100, batteryPct: 80, timestampSec: 1000, accuracyM: 15, floor: 2, ...patch });
const clock = (seconds, epoch = 'test') => ({ seconds, epoch });

function loader(mocks = {}, time = { wall: 1000, elapsed: 100 }) {
  const cache = new Map();
  const ClockDate = class extends Date { static now() { return time.wall * 1000; } };
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const source = fs.readFileSync(file, 'utf8');
    const output = ts.transpileModule(source, { fileName: file, reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
    assert.equal((output.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, file);
    const module = { exports: {} }; cache.set(file, module);
    const requireSource = spec => {
      if (Object.hasOwn(mocks, spec)) {
        const mock = mocks[spec];
        // Explicit default-export mocks represent an ES module namespace.
        // Preserve that shape across TypeScript interop modes, like real modules.
        return mock != null &&
          (typeof mock === 'object' || typeof mock === 'function') &&
          Object.hasOwn(mock, 'default') && !Object.hasOwn(mock, '__esModule')
          ? { ...mock, __esModule: true }
          : mock;
      }
      assert.ok(spec.startsWith('.'), `Unexpected dependency ${spec} in ${file}`);
      const base = path.resolve(path.dirname(file), spec);
      const target = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(fs.existsSync);
      assert.ok(target, `Missing real source ${base}`); return load(target);
    };
    vm.runInThisContext(`(function(require,module,exports,Date,performance){\n${output.outputText}\n})`, { filename: file })(
      requireSource, module, module.exports, ClockDate, { now: () => time.elapsed * 1000 });
    return module.exports;
  }
  return load;
}
const f = loader()(core);
const record = (reported = 1000, received = 1000, basis = 'verified') => ({
  location: coord, reportedAtSec: reported,
  receipt: f.makePositionReceipt(coord, reported, received, basis, clock(100)),
});
const project = (r = record(), elapsed = 100, wall = 1000) => f.positionFreshness(r, wall, clock(elapsed));

test('strict TypeScript check: projection and actual protocol types', () => {
  const program = ts.createProgram([path.join(root, core)], {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true,
    noEmit: true, skipLibCheck: true, types: [],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: p => p, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
});
for (const [age, state, current, ghost] of [
  [0, 'recent', true, false], [30, 'recent', true, false], [31, 'ageing', false, false],
  [90, 'ageing', false, false], [91, 'stale', false, false], [240, 'stale', false, false], [241, 'stale', false, true],
]) test(`established report age ${age}s has explicit state ${state}`, () => {
  const result = project(record(), 100 + age, 1000 + age);
  assert.equal(result.state, state); assert.equal(result.isCurrent, current); assert.equal(result.ghost, ghost);
});
test('delayed five-minute report remains five minutes old on arrival', () => {
  const result = project(record(700), 100);
  assert.equal(result.ageSec, 300); assert.equal(result.state, 'stale'); assert.equal(result.receivedAgoSec, 0);
});
test('arrival is never a substitute for an unverified source timestamp', () => {
  const result = project(record(700, 1000, 'unverified'), 100);
  assert.equal(result.ageSec, null); assert.equal(result.reportedAgeSec, 300);
  assert.equal(result.state, 'clock-uncertain'); assert.match(result.label, /received 0s/); assert.equal(result.isCurrent, false);
});
test('unverified timestamps never become current as time passes', () => {
  for (const seconds of [0, 1, 30, 90, 10000]) assert.equal(project(record(1000, 1000, 'unverified'), 100 + seconds, 1000 + seconds).isCurrent, false);
});
test('known simulation clock is visibly a demo, not live evidence', () => assert.match(project(record(1000, 1000, 'simulation')).label, /^Demo/));
test('a future source claim remains uncertain even after wall time catches up', () => {
  const r = record(1100, 1000); assert.equal(project(r).state, 'clock-uncertain');
  assert.equal(project(r, 300, 1200).state, 'clock-uncertain');
});
test('wall-clock rollback cannot freshen an established report', () => {
  const r = record(); assert.equal(project(r, 190, 1090).ageSec, 90);
  assert.equal(project(r, 191, 800).ageSec, 91);
});
test('wall-clock jump does not manufacture elapsed report age', () => assert.equal(project(record(), 105, 900000).ageSec, 5));
test('a different local clock epoch cannot reuse an old receipt', () => {
  const result = f.positionFreshness(record(), 1000, clock(100, 'new-process'));
  assert.equal(result.isCurrent, false); assert.equal(result.receivedAgoSec, null);
});
test('monotonic-clock rollback fails closed', () => assert.equal(project(record(), 99).state, 'clock-uncertain'));
for (const seconds of [null, NaN, Infinity, -1]) test(`invalid elapsed clock ${seconds} fails closed`, () => {
  assert.equal(project(record(), seconds).isCurrent, false);
});
for (const wall of [NaN, Infinity, -1]) test(`invalid wall clock ${wall} fails closed`, () => assert.equal(project(record(), 100, wall).isCurrent, false));
for (const location of [undefined, null, { latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) {
  test(`missing/invalid location ${JSON.stringify(location)} is not plottable`, () => {
    const result = project({ ...record(), location }); assert.equal(result.state, 'missing'); assert.equal(result.location, null);
  });
}
test('boundary coordinates and equator/prime meridian are legitimate', () => {
  for (const location of [{ latitude: 0, longitude: 0 }, { latitude: -90, longitude: 180 }]) assert.equal(f.validPosition(location), true);
});
test('withheld projection removes coordinates and ages', () => {
  const result = project({ ...record(), visible: false });
  assert.equal(result.state, 'withheld'); assert.equal(result.location, null); assert.equal(result.ageSec, null);
});
test('consent expiry at its exact boundary removes the point', () => {
  assert.equal(project({ ...record(), visibleUntilSec: 1001 }).isCurrent, true);
  assert.equal(project({ ...record(), visibleUntilSec: 1000 }).state, 'withheld');
});
test('invalid expiry cannot grant visibility', () => {
  for (const visibleUntilSec of [NaN, Infinity]) assert.equal(project({ ...record(), visibleUntilSec }).location, null);
});
test('metadata from different coordinates cannot authorise fresh display', () => {
  assert.equal(project({ ...record(), location: { ...coord, latitude: 52 } }).state, 'clock-uncertain');
});
test('metadata from a different reported time cannot authorise fresh display', () => {
  assert.equal(project({ ...record(), reportedAtSec: 1001 }).state, 'clock-uncertain');
});
test('legacy records without receipt metadata remain unknown', () => assert.equal(project({ location: coord, reportedAtSec: 1000 }).state, 'clock-uncertain'));
test('projection emits coordinates only and does not mutate input', () => {
  const location = Object.freeze({ ...coord, secret: 'not a coordinate' });
  const result = project({ ...record(), location }); assert.deepEqual(result.location, coord); assert.equal(location.secret, 'not a coordinate');
});
for (const timestamp of [0, -1, NaN, Infinity, 1.5, 0x100000000]) test(`invalid report time ${timestamp} is rejected`, () => {
  assert.equal(f.makePositionReceipt(coord, timestamp, 1000), undefined); assert.equal(f.newerPosition(timestamp), false);
});
test('equal/older source timestamps are not newer', () => {
  assert.equal(f.newerPosition(1000, 1000), false); assert.equal(f.newerPosition(999, 1000), false);
  assert.equal(f.newerPosition(1001, 1000), true);
});
test('receipt owns its scalar fields and clock snapshot', () => {
  const pos = { ...coord }; const c = clock(100); const receipt = f.makePositionReceipt(pos, 1000, 1000, 'verified', c);
  pos.latitude = 60; c.seconds = 0; assert.equal(receipt.latitude, coord.latitude); assert.equal(receipt.elapsedClock.seconds, 100);
});
test('friend adapter does not treat a status or text packet as a position', () => {
  for (const type of ['quickReply', 'text', 'profile']) assert.equal(f.friendPositionFreshness({ lastPacket: packet({ type }) }, 1000, clock(100)).location, null);
});
test('friend visibility is applied ahead of packet display', () => assert.equal(f.friendPositionFreshness({ lastPacket: packet(), positionVisible: false }, 1000).state, 'withheld'));

function mockZustand() {
  return { create(init) {
    let state;
    const listeners = [];
    const get = () => state;
    const set = (next, replace = false) => {
      const partial = typeof next === 'function' ? next(state) : next;
      state = replace ? partial : { ...state, ...partial }; listeners.forEach(cb => cb(state));
    };
    const use = (selector = s => s) => selector(state);
    state = init(set, get);
    Object.assign(use, { getState: get, setState: set, subscribe: cb => { listeners.push(cb); return () => {}; } });
    return use;
  } };
}
function crewFixture() {
  const time = { wall: 1000, elapsed: 100 };
  const load = loader({ zustand: mockZustand(), '@react-native-async-storage/async-storage': { default: { setItem: () => Promise.resolve() } },
    '../ui/theme': { FRIEND_COLORS: ['red', 'blue'] } }, time);
  const module = load('packages/engine/src/state/crewStore.ts');
  const store = module.useCrewStore;
  store.getState().registerFriends([{ id: 7, name: 'Peer', color: 'red' }]);
  return { store, time, api: load(core), module };
}
test('actual crew store captures first local receipt without trusting its timestamp', () => {
  const { store, api, time } = crewFixture(); store.getState().applyPacket(packet());
  const friend = store.getState().friends[7]; assert.equal(friend.positionReceipt.receivedAtSec, 1000);
  assert.equal(friend.positionReceipt.clockBasis, 'unverified');
  time.elapsed += 5; const view = api.friendPositionFreshness(friend, 1005);
  assert.equal(view.receivedAgoSec, 5); assert.equal(view.ageSec, null);
});
test('duplicate and out-of-order reports cannot refresh crew receipt or position', () => {
  const { store, time } = crewFixture(); store.getState().applyPacket(packet()); const original = store.getState().friends[7];
  time.wall += 20; time.elapsed += 20;
  for (const timestampSec of [999, 1000]) store.getState().applyPacket(packet({ timestampSec, latitude: 60 }));
  assert.equal(store.getState().friends[7], original);
});
test('newer crew position replaces the old report, copies it and preserves floor', () => {
  const { store, time } = crewFixture(); store.getState().applyPacket(packet()); time.wall++; time.elapsed++;
  const p = packet({ timestampSec: 1001, floor: -3 }); store.getState().applyPacket(p); p.latitude = 70;
  const friend = store.getState().friends[7]; assert.equal(friend.lastPacket.latitude, coord.latitude);
  assert.equal(friend.lastPacket.floor, -3); assert.equal(friend.positionReceipt.receivedAtSec, 1001);
});
test('mesh reconnect/contact count does not alter position provenance', () => {
  const { store, time } = crewFixture(); store.getState().applyPacket(packet()); const receipt = store.getState().friends[7].positionReceipt;
  time.wall += 10; store.getState().setMeshNearby(0); store.getState().setMeshNearby(20);
  assert.equal(store.getState().friends[7].positionReceipt, receipt);
});
test('profile, message, status and session actions cannot freshen position receipts', () => {
  const { store } = crewFixture(); store.getState().setProfile({ id: 99, name: 'Me', color: 'blue' });
  store.getState().applyPacket(packet()); const receipt = store.getState().friends[7].positionReceipt;
  store.getState().setFriendName(7, 'New name'); store.getState().receiveMessage(7, 'hello');
  store.getState().applyPacket(packet({ type: 'quickReply', targetId: 99, timestampSec: 1001, quickReplyCode: 20 }));
  store.getState().startSession(1, 1001); store.getState().endSession();
  assert.equal(store.getState().friends[7].positionReceipt, receipt);
});
test('existing crew tag isolation and self-echo rejection remain intact', () => {
  const { store } = crewFixture(); store.getState().setProfile({ id: 99, name: 'Me', color: 'blue' });
  store.getState().setAutoAddPeers(true); store.getState().joinCrew('TEST-42'); const tag = store.getState().crew.tag;
  store.getState().applyPacket(packet()); assert.equal(store.getState().friends[7].lastPacket, undefined);
  store.getState().applyPacket(packet({ targetId: tag })); assert.ok(store.getState().friends[7].lastPacket);
  store.getState().applyPacket(packet({ senderId: 99, targetId: tag })); assert.equal(store.getState().friends[99], undefined);
});
test('invalid direct-store geography does not replace an existing report', () => {
  const { store } = crewFixture(); store.getState().applyPacket(packet()); const original = store.getState().friends[7];
  store.getState().applyPacket(packet({ latitude: 91, timestampSec: 1001 })); assert.equal(store.getState().friends[7], original);
});
test('legacy numeric freshness helper cannot return a negative or NaN age', () => {
  const { module } = crewFixture(); assert.equal(module.freshnessSec({ lastPacket: packet({ timestampSec: 2000 }) }, 1000), null);
  assert.equal(module.freshnessSec({ lastPacket: packet() }, NaN), null);
});

const command = loader({ '../engine': f })('apps/command/src/domain/position.ts');
const member = (extra = {}) => ({ id: 7, name: 'Guard', zoneId: 'zone', status: 'on_post', onSinceSec: 900,
  lastPingSec: 1000, consent: 'on_duty_staff', location: { ...coord }, ...extra });
test('Command heartbeat timestamp is never used as a position timestamp', () => {
  const view = command.staffPositionFreshness(member(), 1000, clock(100));
  assert.equal(view.state, 'clock-uncertain'); assert.equal(view.ageSec, null); assert.equal(view.reportedAgeSec, null);
});
test('Command status/muster heartbeat cannot change established position age', () => {
  const staff = member({ positionReceipt: record(700).receipt }); staff.lastPingSec = 1000;
  assert.equal(command.staffPositionFreshness(staff, 1000, clock(100)).ageSec, 300);
});
test('Command position display respects visibility/expiry without erasing incident data', () => {
  assert.equal(command.staffPositionFreshness(member({ positionVisible: false }), 1000).location, null);
  assert.equal(command.staffPositionFreshness(member({ positionVisibleUntilSec: 1000 }), 1000).location, null);
});
test('unknown consent category cannot expose coordinates in the new Command view', () => {
  assert.equal(command.staffPositionFreshness(member({ consent: 'unknown' }), 1000).location, null);
});
test('live Command preparation rejects repeats and regressions', () => {
  const staff = member({ positionReceipt: record().receipt });
  for (const timestampSec of [999, 1000]) assert.equal(command.prepareStaffPosition(staff, packet({ timestampSec }), 1100), undefined);
  assert.equal(command.prepareStaffPosition(staff, packet({ timestampSec: 1001 }), 1100).clockBasis, 'unverified');
});
test('live Command cannot import clock-trust metadata from a received packet', () => {
  const p = packet({ clockBasis: 'verified', positionReceipt: record().receipt });
  assert.equal(command.prepareStaffPosition(undefined, p, 1000).clockBasis, 'unverified');
});
for (const patch of [{ senderId: -1 }, { senderId: Infinity }, { latitude: 95 }, { timestampSec: 0 }, { type: 'quickReply' }]) {
  test(`Command rejects malformed position ${JSON.stringify(patch)}`, () => assert.equal(command.prepareStaffPosition(undefined, packet(patch), 1000), undefined));
}

function bridgeFixture() {
  const time = { wall: 1000, elapsed: 100 }; const instances = []; let sink = null;
  const calls = { position: 0, status: 0, sos: 0, duress: 0 };
  let state = { staff: { 7: member() }, incidents: [], liveConnected: false,
    applyLivePosition(id, location, at) { calls.position++; state = { ...state, staff: { ...state.staff, [id]: { ...state.staff[id], location, lastPingSec: at } } }; },
    setLiveConnected(value) { state = { ...state, liveConnected: value }; },
    applyGuardStatus(id) { calls.status++; state = { ...state, staff: { ...state.staff, [id]: { ...state.staff[id], lastPingSec: time.wall } } }; },
    raiseLiveSos() { calls.sos++; }, raiseDuress() { calls.duress++; },
  };
  const store = { getState: () => state, setState(update) { state = { ...state, ...(typeof update === 'function' ? update(state) : update) }; } };
  class Bridge {
    constructor() { this.sent = []; instances.push(this); }
    onPacket(cb) { this.packet = cb; } onMeshStatus(cb) { this.status = cb; }
    start() {} stop() { this.stopped = true; } clearListeners() { this.cleared = true; }
    sendFrame(frame) { this.sent.push(frame); }
  }
  const engine = { ...loader({}, time)(core), BridgedTransport: Bridge,
    TextReassembler: class { add() { return null; } }, DURESS_CODE: 250, parseOpsMessage: () => null };
  const load = loader({ '../engine': engine, '../store/commandStore': { useCommandStore: store, setFrameSink: value => { sink = value; } } }, time);
  const service = load('apps/command/src/services/liveBridge.ts');
  service.connectLiveBridge('ws://test.invalid');
  return { service, instances, store, calls, time, get sink() { return sink; } };
}
test('actual Command bridge stores position receipt alongside current staff record', () => {
  const b = bridgeFixture(); b.instances[0].packet(packet());
  assert.equal(b.calls.position, 1); assert.equal(b.store.getState().staff[7].positionReceipt.receivedAtSec, 1000);
  assert.equal(b.store.getState().staff[7].positionReceipt.clockBasis, 'unverified'); b.service.disconnectLiveBridge();
});
test('Command reconnect and replay cannot give an old position a new receipt', () => {
  const b = bridgeFixture(); b.instances[0].packet(packet()); const receipt = b.store.getState().staff[7].positionReceipt;
  b.service.disconnectLiveBridge(); b.time.wall = 1020; b.time.elapsed = 120; b.service.connectLiveBridge('ws://test.invalid');
  b.instances[1].packet(packet()); b.instances[1].packet(packet({ timestampSec: 999, latitude: 60 }));
  assert.equal(b.calls.position, 1); assert.equal(b.store.getState().staff[7].positionReceipt, receipt); b.service.disconnectLiveBridge();
});
test('late callbacks on old Command bridge cannot reanimate data or connection status', () => {
  const b = bridgeFixture(); const old = b.instances[0]; b.service.disconnectLiveBridge();
  old.packet(packet()); old.status({ connected: true }); assert.equal(b.calls.position, 0); assert.equal(b.store.getState().liveConnected, false);
  assert.equal(b.sink, null); assert.equal(old.cleared, true); assert.equal(old.stopped, true);
});
test('Guard status through Command bridge keeps the position receipt unchanged', () => {
  const b = bridgeFixture(); b.instances[0].packet(packet()); const receipt = b.store.getState().staff[7].positionReceipt;
  b.time.wall = 1100; b.instances[0].packet(packet({ type: 'quickReply', quickReplyCode: 20 }));
  assert.equal(b.calls.status, 1); assert.equal(b.store.getState().staff[7].positionReceipt, receipt); b.service.disconnectLiveBridge();
});
test('existing SOS and covert duress paths still delegate without sending an acknowledgement', () => {
  const b = bridgeFixture(); b.instances[0].packet(packet({ type: 'sos' }));
  b.instances[0].packet(packet({ type: 'quickReply', quickReplyCode: 250 }));
  assert.equal(b.calls.sos, 1); assert.equal(b.calls.duress, 1); assert.equal(b.calls.status, 0); assert.equal(b.instances[0].sent.length, 0);
  b.service.disconnectLiveBridge();
});

// These checks compile real UI source, not native/browser layout or a React renderer.
for (const relative of [
  'src/ui/Blip.tsx', 'src/ui/CrewSheet.tsx', 'src/ui/RadarCrewSheet.tsx', 'src/ui/RadarView.tsx',
  'apps/guard/src/ui/TeamMap.tsx', 'apps/command/src/dashboards/OperationsOverview.tsx',
  'apps/command/src/dashboards/RosterShift.tsx', 'apps/command/src/ui/hooks.ts',
]) test(`TS/JSX syntax validation: ${relative}`, () => {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const output = ts.transpileModule(source, { fileName: relative, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
  assert.equal((output.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  assert.ok(output.outputText.length > 100);
});

test('real clock provider retires a reset clock epoch permanently', () => {
  const time = { wall: 1000, elapsed: 100 }; const api = loader({}, time)(core);
  const receipt = api.makePositionReceipt(coord, 1000, 1000, 'verified');
  time.elapsed = 99; assert.equal(api.positionFreshness({ location: coord, receipt }, 1000).isCurrent, false);
  time.elapsed = 101; assert.equal(api.positionFreshness({ location: coord, receipt }, 1001).isCurrent, false);
});
test('real clock provider retires temporarily unavailable clocks', () => {
  const time = { wall: 1000, elapsed: 100 }; const api = loader({}, time)(core);
  const receipt = api.makePositionReceipt(coord, 1000, 1000, 'verified');
  time.elapsed = NaN; api.positionElapsedClock(); time.elapsed = 110;
  assert.equal(api.positionFreshness({ location: coord, receipt }, 1010).isCurrent, false);
});
test('source epoch and enormous elapsed values cannot produce a finite-looking fresh report', () => {
  const r = record(1, 1e308); const result = project(r, 1e308, 1e308);
  assert.equal(result.isCurrent, false); assert.equal(result.ageSec, null);
});
test('crew ingress never trusts a simulation flag inside the packet', () => {
  const { store } = crewFixture(); store.getState().applyPacket(packet({ source: 'simulation', clockBasis: 'verified' }));
  assert.equal(store.getState().friends[7].positionReceipt.clockBasis, 'unverified');
});
test('explicit local simulator callback metadata preserves delayed report time', () => {
  const { store, api, time } = crewFixture(); time.wall = 1010;
  store.getState().applyPacket(packet(), undefined, { source: 'simulation', receivedAtSec: 1010 });
  const result = api.friendPositionFreshness(store.getState().friends[7], 1010);
  assert.equal(result.ageSec, 10); assert.match(result.label, /^Demo/);
});
test('malformed simulator receipt time cannot establish current position', () => {
  const { store, api } = crewFixture(); store.getState().applyPacket(packet(), undefined, { source: 'simulation', receivedAtSec: NaN });
  assert.equal(api.friendPositionFreshness(store.getState().friends[7], 1000).isCurrent, false);
});
test('invalid direct-store sender IDs cannot create or move peers', () => {
  const { store } = crewFixture(); store.getState().setAutoAddPeers(true);
  for (const senderId of [-1, 1.5, Infinity]) store.getState().applyPacket(packet({ senderId }));
  assert.deepEqual(Object.keys(store.getState().friends), ['7']);
});

test('real simulator emits out-of-band provenance and retains relay delay', () => {
  const time = { wall: 1000, elapsed: 100 }; const emitted = [];
  const load = loader({ '../core/geoMath': {
    movePoint: p => ({ ...p }), getAbsoluteBearing: () => 0, getHaversineDistance: () => 10,
  }, './seededRandom': { mulberry32: () => () => 0.5 } }, time);
  const { SimulatedTransport } = load('packages/engine/src/transport/SimulatedTransport.ts');
  const transport = new SimulatedTransport({ seed: 1, origin: coord, nowSec: () => time.wall,
    friends: [{ id: 7, name: 'Peer', color: 'red', startBearingDeg: 0, startDistanceM: 10, lagTicks: 2 }] });
  transport.onPacket((p, via, context) => emitted.push({ p, context }));
  transport.tick(); time.wall += 2; transport.tick(); time.wall += 2; transport.tick();
  assert.equal(emitted.length, 1); assert.equal(emitted[0].p.timestampSec, 1000);
  assert.deepEqual(emitted[0].context, { source: 'simulation', receivedAtSec: 1004 });
  assert.equal(emitted[0].p.source, undefined);
});
test('real mesh service forwards local callback provenance but not packet claims', () => {
  const time = { wall: 1000, elapsed: 100 }; const applied = []; let cb;
  const transport = { onPacket(fn) { cb = fn; }, onMeshStatus() {}, start() {}, stop() {}, clearListeners() {}, broadcast() {} };
  const store = { applyPacket(...args) { applied.push(args); }, setMeshNearby() {} };
  const load = loader({
    'react-native': { AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } },
    '../state/crewStore': { useCrewStore: { getState: () => store } }, './haptics': { haptics: {} },
  }, time);
  const { createMeshService } = load('packages/engine/src/services/meshService.ts');
  const service = createMeshService(transport, { accept: () => true }, () => time.wall);
  service.start();
  try {
    const context = { source: 'simulation', receivedAtSec: 1000 };
    cb(packet(), 'relay', context); assert.equal(applied[0][2], context);
    cb(packet({ source: 'simulation' }), undefined); assert.equal(applied[1][2], undefined);
  } finally { service.stop(); }
});

// Minimal element/hook evaluator. It exercises component branches and props,
// NOT React reconciliation, actual native views, browser layout or accessibility.
function componentFixture(friend, options = {}) {
  const time = { wall: 1000, elapsed: 100 }; const states = []; const effects = []; let cursor = 0;
  const events = { found: 0, pulses: 0, marked: 0 }; let selectedId = 7;
  const state = { friends: { 7: friend }, myLocation: coord, rallyPin: null, myFloor: 0, meshNearby: 2,
    celebrated: {}, markCelebrated(id) { state.celebrated[id] = true; events.marked++; }, clearCelebrated() {} };
  const jsx = (type, props) => ({ type, props: props || {} });
  const names = new Proxy({}, { get: (_, key) => String(key) });
  const react = {
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef: current => ({ current }), useEffect: fn => { effects.push(fn); },
  };
  const rn = { View: 'View', Text: 'Text', Pressable: 'Pressable', Modal: 'Modal',
    StyleSheet: { create: styles => styles, absoluteFill: {} },
    Animated: { Value: class { interpolate() { return 1; } }, timing() {}, loop: () => ({ start() {}, stop() {} }) },
    Easing: { out: fn => fn, ease: () => {} },
  };
  const animated = { default: { View: 'AnimatedView', createAnimatedComponent: () => 'AnimatedComponent' },
    useSharedValue: value => ({ value }), useAnimatedStyle: fn => fn(), withTiming: v => v, withRepeat: v => v,
    Easing: { linear: () => {}, out: f => f, ease: () => {} },
    FadeIn: { duration: () => null }, FadeOut: { duration: () => null }, SlideInDown: { duration: () => null }, SlideOutDown: { duration: () => null } };
  const api = loader({}, time)(core);
  const engine = { ...api, colors: names, fonts: names, gradients: { sunset: ['a', 'b'] },
    useCrewStore: fn => fn(state), getHaversineDistance: () => 5, getAbsoluteBearing: () => 0,
    isFound: distance => distance !== null && distance <= 10, proximityRadiusM: () => 20, shouldRearmCelebration: () => false,
    haptics: { found() { events.found++; }, proximityPulse() { events.pulses++; }, tap() {} },
    getMeshService: () => ({}), calculateRadarPoint: () => ({ x: 0, y: 0, distanceMeters: 5 }),
    LINEAR_MAX_M: 150, OUTER_MAX_M: 1000, venueLevelName: (levels, floor) => `Floor ${floor}`, venueLevelShort: (levels, floor) => `${floor}` };
  const staff = options.staff || member();
  const commandState = { staff: { 7: staff }, zones: [], zoneDensity: [], incidents: [], siteName: 'Test', shiftLabel: 'Shift',
    muster: { active: false }, onDutyCount: () => 1, respondingCount: () => 0, sosCount: () => 0, venueCoveragePct: () => 0 };
  const mocks = {
    'react': react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' }, 'react-native': rn,
    'react-native-reanimated': animated, 'react-native-svg': { ...names, default: 'Svg' },
    'expo-blur': { BlurView: 'BlurView' }, 'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
    'expo-router': { useLocalSearchParams: () => ({ id: String(selectedId) }), useRouter: () => ({ push() {}, back() {} }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) }, 'lucide-react-native': names,
    '@loc8/engine': { ...engine, QUICK_REPLIES: [] }, '../engine': engine,
    '../../src/hooks/useSmoothedHeading': { useSmoothedHeading: () => 0 },
    '../../src/hooks/useNowSec': { useNowSec: () => time.wall }, '../hooks/useNowSec': { useNowSec: () => time.wall },
    '../../src/ui/ShareSheet': { ShareSheet: 'ShareSheet' }, './ShareSheet': { ShareSheet: 'ShareSheet' },
    '../../src/ui/AuroraBackground': { AuroraBackground: 'AuroraBackground' }, './Blip': { Blip: 'Blip' }, './CrewSheet': { CrewSheet: 'CrewSheet' },
    '../state/guardStore': { useGuardStore: fn => fn({ badge: 1, viewFloor: 9, setViewFloor() {} }), badgeLabel: n => String(n) },
    '../state/guardTeam': { guardFor: () => ({ status: 'caution', badge: 7 }), friendFloor: f => f.lastPacket?.floor ?? 0, VENUE_LEVELS: [{ floor: 0 }] },
    './opsTheme': { ops: names, fonts: names }, './FloorStrip': { FloorStrip: 'FloorStrip' },
    '../store/commandStore': { useCommandStore: () => commandState },
    '../ui/hooks': { useNowSec: () => time.wall }, '../ui/primitives': names, '../ui/Icon': { Icon: 'Icon' },
    '../ui/map': names, '../ui/CommsStatus': { CommsStatus: 'CommsStatus' },
    '../ui/status': { staffTone: () => 'ok', staffStatusLabel: v => v, staffDotTone: () => 'ok', incidentTone: () => 'ok' },
    '../domain/time': { fmtHM: v => String(v) }, '../domain/zones': { zoneName: () => 'Zone' },
    '../domain/coverage': { projectToCanvas: () => ({ x: 50, y: 50 }) },
  };
  const load = loader(mocks, time);
  return { state, states, events, effects, time, engine, load,
    setId(value) { selectedId = value; },
    render(relative, name, props = {}) { cursor = 0; effects.length = 0; return load(relative)[name](props); },
    runEffects() { for (const effect of effects) { const cleanup = effect(); if (typeof cleanup === 'function') cleanup(); } },
  };
}
function nodes(root) {
  if (Array.isArray(root)) return root.flatMap(nodes);
  if (!root || typeof root !== 'object') return [];
  return [root, ...nodes(root.props?.children)];
}
function words(root) {
  if (Array.isArray(root)) return root.map(words).join(' ');
  if (root == null || typeof root === 'boolean') return '';
  if (typeof root !== 'object') return String(root);
  return words(root.props?.children);
}
const friend = extra => ({ id: 7, name: 'Peer', color: 'red', lastPacket: packet(), ...extra });
test('Consumer crew output labels unknown report age and no longer calls members online', () => {
  const h = componentFixture(friend()); const output = h.render('src/ui/CrewSheet.tsx', 'CrewSheet');
  assert.match(words(output), /Age unverified/); assert.doesNotMatch(words(output), /online|nullm/);
});
test('Consumer crew Find action is disabled when its position is withheld', () => {
  const h = componentFixture(friend({ positionVisible: false })); const output = h.render('src/ui/CrewSheet.tsx', 'CrewSheet');
  const button = nodes(output).find(n => n.type === 'Pressable' && /Find/.test(words(n)));
  assert.equal(button.props.disabled, true); assert.match(words(output), /Position withheld/);
});
test('Legacy blip null freshness cannot render as zero seconds ago', () => {
  const h = componentFixture(friend()); const output = h.render('src/ui/Blip.tsx', 'Blip', {
    x: 0, y: 0, name: 'Peer', color: 'red', distanceM: 5, freshness: null, stale: true, ghost: false, onPress() {},
  });
  assert.match(words(output), /Age unverified/); assert.doesNotMatch(words(output), /0s/);
});
test('Consumer radar hands uncertain state and caption to each visible blip', () => {
  const h = componentFixture(friend()); h.states[0] = 400;
  const output = h.render('src/ui/RadarView.tsx', 'RadarView'); const blip = nodes(output).find(n => n.type === 'Blip');
  assert.equal(blip.props.stale, true); assert.equal(blip.props.freshness, null); assert.match(blip.props.freshnessLabel, /unverified/);
});
test('Guard excludes uncertain positions from recent count but preserves caution and last-known floor', () => {
  const h = componentFixture(friend({ lastPacket: packet({ floor: 9 }) })); h.states[0] = { w: 400, h: 400 };
  const output = h.render('apps/guard/src/ui/TeamMap.tsx', 'TeamMap'); const strip = nodes(output).find(n => n.type === 'FloorStrip');
  const row = strip.props.rows.find(r => r.floor === 9);
  assert.equal(row.count, 0); assert.equal(row.hasCaution, true); assert.match(words(output), /Age unverified/);
  assert.doesNotMatch(words(output), /No one on/);
});
test('Command roster exposes position age separately from contact/report time', () => {
  const h = componentFixture(friend()); const output = h.render('apps/command/src/dashboards/RosterShift.tsx', 'RosterShift');
  assert.match(words(output), /Last contact \/ report/); assert.match(words(output), /Position report age/); assert.match(words(output), /Age unverified/);
});
test('Command operational map does not render an unknown-age on-post guard as a current dot', () => {
  const h = componentFixture(friend()); const output = h.render('apps/command/src/dashboards/OperationsOverview.tsx', 'OperationsOverview', { nav: { open() {} } });
  const dot = nodes(output).find(n => n.type === 'GuardDot'); assert.equal(dot.props.tone, 'off'); assert.match(dot.props.title, /unverified/);
});
test('Compass unknown close position cannot trigger automatic found, heartbeat or near-arrival claims', () => {
  const h = componentFixture(friend()); const output = h.render('app/compass/[id].tsx', 'default'); h.runEffects();
  assert.equal(h.events.found, 0); assert.equal(h.events.pulses, 0); assert.equal(h.events.marked, 0);
  assert.match(words(output), /last reported position/); assert.doesNotMatch(words(output), /basically there|getting warmer|You found each other/);
});
test('Compass withholding removes share coordinates and live navigation', () => {
  const h = componentFixture(friend({ positionVisible: false })); const output = h.render('app/compass/[id].tsx', 'default');
  const share = nodes(output).find(n => n.type === 'ShareSheet'); assert.equal(share.props.location, null); assert.equal(share.props.visible, false);
  assert.doesNotMatch(share.props.title, /exact spot/);
});
test('Compass permits explicit human confirmation without pretending the radio proved arrival', () => {
  const h = componentFixture(friend()); let output = h.render('app/compass/[id].tsx', 'default');
  const button = nodes(output).find(n => n.props?.accessibilityLabel === 'I have found this person'); button.props.onPress();
  output = h.render('app/compass/[id].tsx', 'default'); h.runEffects();
  assert.equal(h.events.found, 1); assert.equal(h.events.marked, 1); assert.match(words(output), /You confirmed your reunion/);
  h.state.friends[8] = friend({ id: 8, name: 'Another person' }); h.setId(8);
  output = h.render('app/compass/[id].tsx', 'default'); assert.doesNotMatch(words(output), /You confirmed your reunion/);
});
test('Recent explicitly simulated Compass point retains automatic demo celebration', () => {
  const h = componentFixture(friend()); h.state.friends[7].positionReceipt = h.engine.makePositionReceipt(coord, 1000, 1000, 'simulation');
  h.render('app/compass/[id].tsx', 'default'); h.runEffects();
  const output = h.render('app/compass/[id].tsx', 'default'); assert.equal(h.events.found, 1);
  assert.match(words(output), /Demo/); assert.match(words(output), /You found each other/);
});
test('Old simulated Compass report cannot trigger a fresh reunion', () => {
  const h = componentFixture(friend({ lastPacket: packet({ timestampSec: 700 }) }));
  h.state.friends[7].positionReceipt = h.engine.makePositionReceipt(coord, 700, 1000, 'simulation');
  const output = h.render('app/compass/[id].tsx', 'default'); h.runEffects();
  assert.equal(h.events.found, 0); assert.match(words(output), /Last known/);
});
