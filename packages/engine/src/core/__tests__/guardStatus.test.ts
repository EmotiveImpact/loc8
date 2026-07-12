import { GUARD_STATUS, guardStatusLabel, DURESS_CODE } from '../guardStatus';
import { QUICK_REPLIES, quickReplyLabel } from '../types';
import { encodePacket, decodePacket } from '../packetCodec';
import type { Packet } from '../types';

describe('guard status vocabulary (shared Guard ↔ Command contract)', () => {
  it('defines the four field verbs on the canonical ops codes (20–23)', () => {
    expect(GUARD_STATUS.map((s) => [s.code, s.label])).toEqual([
      [20, 'En route'],
      [21, 'On scene'],
      [22, 'Need backup'],
      [23, 'Clear'],
    ]);
  });

  it('never collides with the consumer quick-reply range or duress', () => {
    const consumerCodes = new Set(QUICK_REPLIES.map((q) => q.code));
    for (const s of GUARD_STATUS) expect(consumerCodes.has(s.code)).toBe(false);
    expect(consumerCodes.has(DURESS_CODE)).toBe(false);
    expect(GUARD_STATUS.some((s) => s.code === DURESS_CODE)).toBe(false);
  });

  it('resolves labels via both lookups and falls back on unknown codes', () => {
    expect(guardStatusLabel(21)).toBe('On scene');
    expect(quickReplyLabel(21)).toBe('On scene'); // one wire, one resolver
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
