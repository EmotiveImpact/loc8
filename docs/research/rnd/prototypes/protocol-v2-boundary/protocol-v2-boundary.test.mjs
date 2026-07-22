import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BoundedDedupStore,
  BoundedV2Reassembler,
  MigrationGuard,
  V2_CELL_MARKER,
  VerifiedTopology,
  classifyCarrierCell,
  decodeV2Cell,
  routeOrFlood,
  segmentV2Frame,
  selectFanout,
  verifyAndOpenLogicalFrame,
} from './protocol-v2-boundary.mjs';

const handle = (n) => Uint8Array.from([0, 0, 0, 0, 0, 0, n >> 8, n & 0xff]);
const pseudonym = (n = 1) => Uint8Array.from([0xa0, 0xb0, n >> 8, n & 0xff]);
const bytes = (length, seed = 0) => Uint8Array.from({ length }, (_, index) => (seed + index) & 0xff);
const v1 = (type = 0) => { const value = new Uint8Array(25); value[0] = type; return value; };

test('v1 and v2 are unambiguous across every valid legacy type', () => {
  for (let type = 0; type <= 7; type += 1) assert.equal(classifyCarrierCell(v1(type)).kind, 'v1');
  const cell = segmentV2Frame(bytes(1), { handle: handle(1), carrierPseudonym: pseudonym() })[0];
  assert.equal(cell[0], V2_CELL_MARKER);
  assert.equal(classifyCarrierCell(cell).kind, 'v2-cell');
  assert.equal(classifyCarrierCell(bytes(24)).kind, 'invalid');
  assert.equal(classifyCarrierCell(Uint8Array.from([99, ...bytes(24)])).kind, 'invalid');
});

test('25-byte cells reassemble out of order and ignore exact duplicates', () => {
  const payload = bytes(97, 11);
  const cells = segmentV2Frame(payload, { handle: handle(2), carrierPseudonym: pseudonym(7) });
  assert.ok(cells.every((cell) => cell.length === 25));
  const r = new BoundedV2Reassembler();
  assert.equal(r.ingest('peer-a', cells[2], 100).status, 'accepted');
  assert.equal(r.ingest('peer-a', cells[2], 101).status, 'duplicate');
  let result;
  for (const cell of cells.filter((_, index) => index !== 2).reverse()) result = r.ingest('peer-a', cell, 102);
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.payload, payload);
  assert.deepEqual(r.stats(), { assemblies: 0, bufferedBytes: 0 });
});

test('reassembly rejects malformed, conflicting and oversized fragment input', () => {
  const r = new BoundedV2Reassembler({ maxFrameBytes: 24 });
  const cells = segmentV2Frame(bytes(24), { handle: handle(3), carrierPseudonym: pseudonym() });
  assert.equal(r.ingest('p', cells[0], 0).status, 'accepted');
  const conflict = cells[0].slice(); conflict[16] ^= 0xff;
  assert.equal(r.ingest('p', conflict, 1).reason, 'conflicting-fragment');
  const tooLarge = segmentV2Frame(bytes(25), { handle: handle(4), carrierPseudonym: pseudonym() });
  assert.equal(r.ingest('p', tooLarge[0], 2).status, 'accepted');
  assert.equal(r.ingest('p', tooLarge[1], 2).status, 'accepted');
  assert.equal(r.ingest('p', tooLarge[2], 2).reason, 'frame-limit');
  const malformed = cells[0].slice(); malformed[15] = 10;
  assert.throws(() => decodeV2Cell(malformed));
});

test('reassembly enforces per-peer, global assembly, byte and timeout bounds', () => {
  const peerBound = new BoundedV2Reassembler({ maxAssemblies: 3, maxAssembliesPerPeer: 1 });
  const first = segmentV2Frame(bytes(13), { handle: handle(10), carrierPseudonym: pseudonym(10) })[0];
  const second = segmentV2Frame(bytes(13), { handle: handle(11), carrierPseudonym: pseudonym(11) })[0];
  assert.equal(peerBound.ingest('p', first, 0).status, 'accepted');
  assert.equal(peerBound.ingest('p', second, 0).reason, 'peer-assembly-limit');

  const globalBound = new BoundedV2Reassembler({ maxAssemblies: 2, maxAssembliesPerPeer: 2 });
  assert.equal(globalBound.ingest('p1', first, 0).status, 'accepted');
  assert.equal(globalBound.ingest('p2', second, 0).status, 'accepted');
  assert.equal(globalBound.ingest('p3', segmentV2Frame(bytes(13), { handle: handle(12), carrierPseudonym: pseudonym(12) })[0], 0).reason, 'assembly-limit');

  const byteBound = new BoundedV2Reassembler({ maxBufferedBytes: 12, maxAssemblies: 2 });
  assert.equal(byteBound.ingest('p1', first, 0).status, 'accepted');
  assert.equal(byteBound.ingest('p2', second, 0).reason, 'buffer-limit');
  assert.ok(byteBound.stats().bufferedBytes <= 12);

  const timed = new BoundedV2Reassembler({ assemblyTimeoutMs: 10 });
  timed.ingest('p', first, 0);
  timed.prune(10);
  assert.deepEqual(timed.stats(), { assemblies: 0, bufferedBytes: 0 });
});

test('logical frames cannot cross the security boundary without the reviewed provider', () => {
  assert.equal(verifyAndOpenLogicalFrame(bytes(8), {}, null).reason, 'no-reviewed-provider');
  assert.equal(verifyAndOpenLogicalFrame(bytes(8), {}, { verifyAndOpen: () => ({ authenticated: false }) }).reason, 'authentication');
  assert.equal(verifyAndOpenLogicalFrame(bytes(8), {}, { verifyAndOpen: () => { throw new Error('malformed'); } }).reason, 'provider-error');
  const accepted = verifyAndOpenLogicalFrame(bytes(8), {}, {
    verifyAndOpen: () => ({ authenticated: true, plaintext: bytes(2), claims: { role: 'guard' } }),
  });
  assert.equal(accepted.status, 'accepted');
  assert.equal(accepted.claims.role, 'guard');
});

test('migration guard rejects unverified, stale, conflicting and regressive policy', () => {
  const guard = new MigrationGuard({ siteId: 's', shiftId: 'night' });
  const dual = { siteId: 's', shiftId: 'night', epoch: 2, mode: 'dual', allowedLegacyTypes: [4] };
  assert.equal(guard.applyPolicy(dual, false).reason, 'unverified');
  assert.equal(guard.applyPolicy(dual, true).accepted, true);
  assert.equal(guard.applyPolicy({ ...dual, allowedLegacyTypes: [7] }, true).reason, 'same-epoch-conflict');
  assert.equal(guard.acceptCarrier(v1(4)).accepted, true);
  assert.equal(guard.acceptCarrier(v1(7)).reason, 'legacy-type-blocked');
  assert.equal(guard.applyPolicy({ ...dual, epoch: 1 }, true).reason, 'stale-epoch');
  assert.equal(guard.applyPolicy({ ...dual, mode: 'v2-required' }, true).reason, 'same-epoch-conflict');
  assert.equal(guard.applyPolicy({ ...dual, epoch: 3, mode: 'v2-required' }, true).accepted, true);
  assert.equal(guard.acceptCarrier(v1(4)).reason, 'v2-required');
  assert.equal(guard.applyPolicy({ ...dual, epoch: 4, mode: 'dual' }, true).reason, 'mode-regression');
  assert.equal(guard.observePeerCapability('attacker', { version: 'v1' }, false), false);
  assert.equal(guard.mode, 'v2-required');
});

test('v2-required migration floor survives restart', () => {
  const before = new MigrationGuard({ siteId: 's', shiftId: 'day' });
  before.applyPolicy({ siteId: 's', shiftId: 'day', epoch: 8, mode: 'v2-required' }, true);
  const after = new MigrationGuard({ siteId: 's', shiftId: 'day', snapshot: before.snapshot() });
  assert.equal(after.acceptCarrier(v1(0)).accepted, false);
  assert.equal(after.applyPolicy({ siteId: 's', shiftId: 'day', epoch: 9, mode: 'legacy' }, true).reason, 'mode-regression');
  assert.throws(() => new MigrationGuard({
    siteId: 's', shiftId: 'day',
    snapshot: { version: 1, siteId: 's', shiftId: 'day', epoch: 8, mode: 'v2-required', allowedLegacyTypes: [0] },
  }), /legacy types/);
});

test('dedup stays bounded, reserves control slots and expires entries', () => {
  const store = new BoundedDedupStore({ capacity: 10, maxAgeMs: 100, controlReserve: 0.2 });
  for (let i = 0; i < 40; i += 1) store.checkAndRemember(`bulk-${i}`, 'bulk', 0);
  assert.equal(store.stats().bulk, 8);
  assert.equal(store.checkAndRemember('control-a', 'control', 0).status, 'accepted');
  assert.equal(store.checkAndRemember('control-b', 'control', 0).status, 'accepted');
  assert.equal(store.stats().total, 10);
  assert.equal(store.checkAndRemember('control-a', 'control', 1).status, 'duplicate');
  store.prune(100);
  assert.equal(store.stats().total, 0);
});

test('dedup restart preserves only the unexpired bounded replay window', () => {
  const before = new BoundedDedupStore({ capacity: 10, maxAgeMs: 100 });
  before.checkAndRemember('x', 'control', 0);
  const snapshot = before.snapshot(40);
  const after = new BoundedDedupStore({ capacity: 10, maxAgeMs: 100 });
  after.restore(snapshot, 1_000, 20);
  assert.equal(after.checkAndRemember('x', 'control', 1_001).status, 'duplicate');
  after.prune(1_040);
  assert.equal(after.stats().total, 0);
});

test('only fresh verified bidirectional topology yields a bounded source route', () => {
  const topology = new VerifiedTopology({ maxObservationAgeMs: 100 });
  assert.equal(topology.update({ nodeId: 'a', neighbors: ['b'], observedAtMs: 0 }, false, 0).reason, 'unverified');
  for (const [nodeId, neighbors] of [
    ['a', ['b', 'd']], ['b', ['a', 'c']], ['c', ['b', 'd']], ['d', ['a', 'c']],
  ]) {
    assert.equal(topology.update({ nodeId, neighbors, observedAtMs: 0 }, true, 0).accepted, true);
  }
  assert.deepEqual(topology.sourceRoute('a', 'c', 1), ['a', 'b', 'c']);
  assert.equal(topology.sourceRoute('a', 'c', 1, 1), null);
  assert.deepEqual(routeOrFlood(topology, 'a', 'c', 1, 7, [['a', 'b']]).route, ['a', 'd', 'c']);
  assert.equal(routeOrFlood(topology, 'a', 'c', 1, 7, [['a', 'b'], ['a', 'd']]).mode, 'controlled-flood');
  assert.equal(topology.update({ nodeId: 'a', neighbors: ['b'], observedAtMs: -1 }, true, 1).reason, 'observation-regression');
  assert.equal(topology.update({ nodeId: 'a', neighbors: ['b'], observedAtMs: 0 }, true, 1).reason, 'observation-conflict');
  assert.equal(routeOrFlood(topology, 'a', 'c', 101).mode, 'controlled-flood');
});

test('controlled fanout is deterministic and critical classes use full fanout', () => {
  const neighbors = Array.from({ length: 16 }, (_, i) => `n${i}`);
  const a = selectFanout(neighbors, handle(88), { nodeId: 'origin' });
  const b = selectFanout([...neighbors].reverse(), handle(88), { nodeId: 'origin' });
  assert.deepEqual(a, b);
  assert.equal(a.length, Math.ceil(Math.log2(neighbors.length + 1)));
  assert.equal(selectFanout(neighbors, handle(88), { trafficClass: 'control' }).length, 16);
  assert.equal(selectFanout(neighbors, handle(88), { trafficClass: 'fragment' }).length, 16);
});
