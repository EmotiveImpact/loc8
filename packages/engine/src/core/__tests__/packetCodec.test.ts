// src/core/__tests__/packetCodec.test.ts
import { encodePacket, decodePacket, PACKET_SIZE } from '../packetCodec';
import type { Packet } from '../types';
import { quickReplyLabel, QUICK_REPLIES } from '../types';

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
  it('normalizes headings into [0,359] (negative and >=360 rounding)', () => {
    // JS % is remainder not modulo: -1 must wrap to 359, not a huge uint16.
    const neg = decodePacket(encodePacket({ ...sample, headingDeg: -1 }));
    expect(neg.headingDeg).toBe(359);
    expect(neg.headingDeg).toBeGreaterThanOrEqual(0);
    expect(neg.headingDeg).toBeLessThanOrEqual(359);
    // 359.6 rounds up to 360 which must normalize to 0, not be stored as 360.
    const wrap = decodePacket(encodePacket({ ...sample, headingDeg: 359.6 }));
    expect(wrap.headingDeg).toBe(0);
    expect(wrap.headingDeg).toBeGreaterThanOrEqual(0);
    expect(wrap.headingDeg).toBeLessThanOrEqual(359);
  });
  it('round-trips every packet type', () => {
    (['position', 'pingWhere', 'pingComeFind', 'rally', 'quickReply'] as const).forEach((type) => {
      expect(decodePacket(encodePacket({ ...sample, type })).type).toBe(type);
    });
  });
  it('round-trips a text fragment losslessly (msgId/seq/total/frag preserved)', () => {
    const frag: Packet = {
      type: 'text', senderId: 7, targetId: 42,
      latitude: 0, longitude: 0, headingDeg: 0, batteryPct: 0,
      timestampSec: 0, accuracyM: 0,
      msgId: 40000, seq: 3, total: 9, frag: [72, 101, 108, 108, 111, 33, 240, 159, 142, 137, 1],
    };
    const d = decodePacket(encodePacket(frag));
    expect(d.type).toBe('text');
    expect(d.senderId).toBe(7);
    expect(d.targetId).toBe(42);
    expect(d.msgId).toBe(40000);
    expect(d.seq).toBe(3);
    expect(d.total).toBe(9);
    expect(d.frag).toEqual([72, 101, 108, 108, 111, 33, 240, 159, 142, 137, 1]);
    expect(encodePacket(frag).byteLength).toBe(PACKET_SIZE);
  });
  it('text fragment with a short (0-padded) frag decodes only the real bytes', () => {
    const frag: Packet = {
      type: 'text', senderId: 1, targetId: 0,
      latitude: 0, longitude: 0, headingDeg: 0, batteryPct: 0,
      timestampSec: 0, accuracyM: 0, msgId: 1, seq: 0, total: 1, frag: [65, 66],
    };
    const d = decodePacket(encodePacket(frag));
    expect(d.frag).toEqual([65, 66]);
  });
  it('round-trips a quickReply packet losslessly (code + type preserved)', () => {
    const reply: Packet = {
      type: 'quickReply', senderId: 7, targetId: 42,
      latitude: 0, longitude: 0, headingDeg: 0, batteryPct: 55,
      timestampSec: 1783300000, accuracyM: 3, quickReplyCode: 5,
    };
    const d = decodePacket(encodePacket(reply));
    expect(d.type).toBe('quickReply');
    expect(d.senderId).toBe(7);
    expect(d.targetId).toBe(42);
    expect(d.quickReplyCode).toBe(5);
    expect(d.timestampSec).toBe(1783300000);
  });
});

describe('quickReplyLabel', () => {
  it('resolves known codes to their labels', () => {
    expect(quickReplyLabel(1)).toBe('On my way');
    expect(quickReplyLabel(QUICK_REPLIES[QUICK_REPLIES.length - 1].code))
      .toBe(QUICK_REPLIES[QUICK_REPLIES.length - 1].label);
  });
  it('falls back to … for unknown codes', () => {
    expect(quickReplyLabel(999)).toBe('…');
    expect(quickReplyLabel(0)).toBe('…');
  });
});
