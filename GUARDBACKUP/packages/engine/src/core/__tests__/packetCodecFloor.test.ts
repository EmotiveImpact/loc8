import { encodePacket, decodePacket, packHeadingFloor, unpackFloor } from '../packetCodec';
import type { Packet } from '../types';

const base: Packet = {
  type: 'position',
  senderId: 12345,
  targetId: 0,
  latitude: 51.4934,
  longitude: -0.0098,
  headingDeg: 200,
  batteryPct: 80,
  timestampSec: 1_700_000_000,
  accuracyM: 10,
};

describe('packet floor round-trip (bit-packed with heading)', () => {
  it('preserves heading AND floor together', () => {
    for (const floor of [0, 1, 2, 5, 12, 63, -1, -3, -64]) {
      const p = decodePacket(encodePacket({ ...base, floor }));
      expect(p.headingDeg).toBe(200);
      expect(p.floor).toBe(floor);
    }
  });

  it('defaults missing floor to ground (0)', () => {
    const p = decodePacket(encodePacket({ ...base })); // no floor field
    expect(p.floor).toBe(0);
  });

  it('clamps out-of-range floors to the wire bounds', () => {
    expect(decodePacket(encodePacket({ ...base, floor: 999 })).floor).toBe(63);
    expect(decodePacket(encodePacket({ ...base, floor: -999 })).floor).toBe(-64);
  });

  it('carries floor on rally / ping packets too', () => {
    const rally = decodePacket(encodePacket({ ...base, type: 'rally', floor: 4 }));
    expect(rally.floor).toBe(4);
  });

  it('does not corrupt heading for the full 0–359 range', () => {
    for (const h of [0, 1, 90, 179, 180, 270, 359]) {
      expect(decodePacket(encodePacket({ ...base, headingDeg: h, floor: 7 })).headingDeg).toBe(h);
    }
  });

  it('quickReply still decodes (no floor, code intact)', () => {
    const qr = decodePacket(encodePacket({ ...base, type: 'quickReply', quickReplyCode: 22 }));
    expect(qr.quickReplyCode).toBe(22);
    expect(qr.headingDeg).toBe(0);
  });

  it('pack/unpack helpers are inverse for heading and floor', () => {
    const packed = packHeadingFloor(359, -5);
    expect(packed & 0x1ff).toBe(359);
    expect(unpackFloor(packed)).toBe(-5);
  });
});
