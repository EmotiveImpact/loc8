import { GUARD_STATUS, guardStatusLabel } from '../guardStatus';
import { encodePacket, decodePacket } from '../packetCodec';
import type { Packet } from '../types';

describe('guard status vocabulary (shared Guard ↔ Command contract)', () => {
  it('defines the four field verbs on stable codes', () => {
    expect(GUARD_STATUS.map((s) => [s.code, s.label])).toEqual([
      [1, 'En route'],
      [2, 'On scene'],
      [3, 'Need backup'],
      [4, 'Clear'],
    ]);
  });

  it('resolves labels and falls back on unknown codes', () => {
    expect(guardStatusLabel(2)).toBe('On scene');
    expect(guardStatusLabel(99)).toBe('…');
  });

  it('rides the standard quickReply frame unchanged', () => {
    for (const s of GUARD_STATUS) {
      const p: Packet = {
        type: 'quickReply',
        senderId: 505,
        targetId: 0xc0,
        latitude: 0,
        longitude: 0,
        headingDeg: 0,
        batteryPct: 0,
        timestampSec: 123,
        accuracyM: 0,
        quickReplyCode: s.code,
      };
      const out = decodePacket(encodePacket(p));
      expect(out.type).toBe('quickReply');
      expect(guardStatusLabel(out.quickReplyCode!)).toBe(s.label);
    }
  });
});
