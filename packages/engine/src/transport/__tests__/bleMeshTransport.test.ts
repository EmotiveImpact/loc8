// src/transport/__tests__/bleMeshTransport.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Packet } from '../../core/types';
import { encodePacket, PACKET_SIZE } from '../../core/packetCodec';

// Fake the loc8-mesh native module with an in-memory emitter so the transport
// can be exercised without any native code (mirrors how jest runs everywhere).
jest.mock('../../../../../modules/loc8-mesh', () => {
  const packetListeners: Array<(e: unknown) => void> = [];
  const statusListeners: Array<(e: unknown) => void> = [];
  const makeSub = (arr: Array<(e: unknown) => void>, cb: (e: unknown) => void) => ({
    remove: () => {
      const i = arr.indexOf(cb);
      if (i >= 0) arr.splice(i, 1);
    },
  });
  return {
    __esModule: true,
    start: jest.fn(async () => {}),
    stop: jest.fn(async () => {}),
    broadcast: jest.fn(async () => {}),
    addPacketListener: jest.fn((cb: (e: unknown) => void) => {
      packetListeners.push(cb);
      return makeSub(packetListeners, cb);
    }),
    addStatusListener: jest.fn((cb: (e: unknown) => void) => {
      statusListeners.push(cb);
      return makeSub(statusListeners, cb);
    }),
    // test-only hooks
    __emitPacket: (e: unknown) => packetListeners.slice().forEach((cb) => cb(e)),
    __emitStatus: (e: unknown) => statusListeners.slice().forEach((cb) => cb(e)),
    __listenerCounts: () => ({ packet: packetListeners.length, status: statusListeners.length }),
    __reset: () => {
      packetListeners.length = 0;
      statusListeners.length = 0;
    },
  };
});

import * as Loc8MeshImport from '../../../../../modules/loc8-mesh';
import { BleMeshTransport } from '../BleMeshTransport';

type AnyMock = ReturnType<typeof jest.fn>;

const mesh = Loc8MeshImport as unknown as {
  start: AnyMock;
  stop: AnyMock;
  broadcast: AnyMock;
  __emitPacket: (e: unknown) => void;
  __emitStatus: (e: unknown) => void;
  __listenerCounts: () => { packet: number; status: number };
  __reset: () => void;
};

const SAMPLE: Packet = {
  type: 'position', senderId: 101, targetId: 0,
  latitude: 37.7694, longitude: -122.4862,
  headingDeg: 90, batteryPct: 80,
  timestampSec: 1751850000, accuracyM: 12,
};

describe('BleMeshTransport', () => {
  let transport: BleMeshTransport;

  beforeEach(() => {
    jest.clearAllMocks();
    mesh.__reset();
    transport = new BleMeshTransport();
  });

  it('broadcast encodes a Packet to a 25-byte Uint8Array and hands it to the module', () => {
    transport.broadcast(SAMPLE);
    expect(mesh.broadcast).toHaveBeenCalledTimes(1);
    const sent = mesh.broadcast.mock.calls[0][0] as Uint8Array;
    expect(sent).toBeInstanceOf(Uint8Array);
    expect(sent.byteLength).toBe(PACKET_SIZE);
    expect(Array.from(sent)).toEqual(Array.from(new Uint8Array(encodePacket(SAMPLE))));
  });

  it('a valid incoming onPacket event decodes and reaches a registered callback with relayVia', () => {
    const cb = jest.fn();
    transport.onPacket(cb);
    transport.start();
    mesh.__emitPacket({ data: new Uint8Array(encodePacket(SAMPLE)), relayVia: 'Maya' });
    expect(cb).toHaveBeenCalledTimes(1);
    const [packet, relayVia] = cb.mock.calls[0] as [Packet, string | undefined];
    expect(relayVia).toBe('Maya');
    expect(packet.type).toBe('position');
    expect(packet.senderId).toBe(101);
    expect(packet.timestampSec).toBe(SAMPLE.timestampSec);
    expect(packet.latitude).toBeCloseTo(SAMPLE.latitude, 6);
    expect(packet.longitude).toBeCloseTo(SAMPLE.longitude, 6);
  });

  it('a malformed (wrong-length) packet event is dropped without throwing', () => {
    const cb = jest.fn();
    transport.onPacket(cb);
    transport.start();
    expect(() => mesh.__emitPacket({ data: new Uint8Array(10) })).not.toThrow();
    expect(cb).not.toHaveBeenCalled();
  });

  it('onMeshStatus events fan out to status callbacks', () => {
    const cb = jest.fn();
    transport.onMeshStatus(cb);
    transport.start();
    mesh.__emitStatus({ nearbyCount: 3, connected: true });
    expect(cb).toHaveBeenCalledWith({ nearbyCount: 3, connected: true });
  });

  it('clearListeners replaces app callbacks while stop owns native subscriptions', () => {
    const oldPacket = jest.fn();
    const oldStatus = jest.fn();
    transport.onPacket(oldPacket);
    transport.onMeshStatus(oldStatus);
    transport.start();
    transport.clearListeners();
    // R0 contract: a running transport keeps its receive path. Only app
    // callbacks are cleared; stop() detaches the native subscriptions.
    expect(mesh.__listenerCounts()).toEqual({ packet: 1, status: 1 });
    const event = { data: new Uint8Array(encodePacket(SAMPLE)) };
    const status = { nearbyCount: 3, connected: true };
    mesh.__emitPacket(event);
    mesh.__emitStatus(status);
    expect(oldPacket).not.toHaveBeenCalled();
    expect(oldStatus).not.toHaveBeenCalled();

    const nextPacket = jest.fn();
    const nextStatus = jest.fn();
    transport.onPacket(nextPacket);
    transport.onMeshStatus(nextStatus);
    mesh.__emitPacket(event);
    mesh.__emitStatus(status);
    expect(nextPacket).toHaveBeenCalledTimes(1);
    expect(nextStatus).toHaveBeenCalledWith(status);
    expect(mesh.start).toHaveBeenCalledTimes(1);

    transport.stop();
    expect(mesh.__listenerCounts()).toEqual({ packet: 0, status: 0 });
    mesh.__emitPacket(event);
    mesh.__emitStatus(status);
    expect(nextPacket).toHaveBeenCalledTimes(1);
    expect(nextStatus).toHaveBeenCalledTimes(1);
  });

  it('start is idempotent — module.start called once for two start() calls', () => {
    transport.start();
    transport.start();
    expect(mesh.start).toHaveBeenCalledTimes(1);
    expect(mesh.__listenerCounts()).toEqual({ packet: 1, status: 1 });
  });

  it('a failed native start un-latches, emits a zeroed status, and allows a retry', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const statusCb = jest.fn();
    transport.onMeshStatus(statusCb);
    mesh.start.mockImplementationOnce(() => Promise.reject(new Error('Bluetooth off')));
    transport.start();
    await new Promise((r) => setTimeout(r, 0));   // let the rejection handler run
    // Un-latched: status listeners told the mesh is down, native subs detached.
    expect(statusCb).toHaveBeenCalledWith({ nearbyCount: 0, connected: false });
    expect(mesh.__listenerCounts()).toEqual({ packet: 0, status: 0 });
    expect(warn).toHaveBeenCalled();
    // A second start() really retries (no swallow-and-latch).
    transport.start();
    expect(mesh.start).toHaveBeenCalledTimes(2);
    expect(mesh.__listenerCounts()).toEqual({ packet: 1, status: 1 });
    warn.mockRestore();
  });

  it('stop after start tears down subscriptions and allows a clean restart', () => {
    transport.start();
    transport.stop();
    expect(mesh.stop).toHaveBeenCalledTimes(1);
    expect(mesh.__listenerCounts()).toEqual({ packet: 0, status: 0 });
    transport.start();   // restart re-attaches
    expect(mesh.start).toHaveBeenCalledTimes(2);
    expect(mesh.__listenerCounts()).toEqual({ packet: 1, status: 1 });
  });
});
