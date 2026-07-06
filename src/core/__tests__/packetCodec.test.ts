// src/core/__tests__/packetCodec.test.ts
import { encodePacket, decodePacket, PACKET_SIZE } from '../packetCodec';
import type { Packet } from '../types';

const sample: Packet = {
  type: 'position', senderId: 42, targetId: 0,
  latitude: 37.7749295, longitude: -122.4194155,
  headingDeg: 275, batteryPct: 81, timestampSec: 1783300000, accuracyM: 12,
};

describe('PacketCodec', () => {
  it('round-trips a packet exactly (to 1e-7 degrees)', () => {
    const decoded = decodePacket(encodePacket(sample));
    expect(decoded.type).toBe('position');
    expect(decoded.senderId).toBe(42);
    expect(decoded.targetId).toBe(0);
    expect(decoded.latitude).toBeCloseTo(sample.latitude, 6);
    expect(decoded.longitude).toBeCloseTo(sample.longitude, 6);
    expect(decoded.headingDeg).toBe(275);
    expect(decoded.batteryPct).toBe(81);
    expect(decoded.timestampSec).toBe(1783300000);
    expect(decoded.accuracyM).toBe(12);
  });
  it('is exactly PACKET_SIZE bytes', () => {
    expect(encodePacket(sample).byteLength).toBe(PACKET_SIZE);
    expect(PACKET_SIZE).toBe(25);
  });
  it('round-trips boundary coordinates', () => {
    const edge = { ...sample, latitude: -90, longitude: 179.9999999 };
    const d = decodePacket(encodePacket(edge));
    expect(d.latitude).toBeCloseTo(-90, 6);
    expect(d.longitude).toBeCloseTo(179.9999999, 6);
  });
  it('caps accuracy at 255', () => {
    expect(decodePacket(encodePacket({ ...sample, accuracyM: 900 })).accuracyM).toBe(255);
  });
  it('rejects wrong-length buffers', () => {
    expect(() => decodePacket(new Uint8Array(10).buffer)).toThrow(/length/i);
  });
  it('rejects unknown packet types', () => {
    const buf = encodePacket(sample);
    new DataView(buf).setUint8(0, 99);
    expect(() => decodePacket(buf)).toThrow(/type/i);
  });
  it('round-trips every packet type', () => {
    (['position', 'pingWhere', 'pingComeFind', 'rally'] as const).forEach((type) => {
      expect(decodePacket(encodePacket({ ...sample, type })).type).toBe(type);
    });
  });
});
