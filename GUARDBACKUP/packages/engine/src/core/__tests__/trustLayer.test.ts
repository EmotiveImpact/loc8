import { TrustLayer } from '../trustLayer';
import type { Packet } from '../types';

const base: Packet = {
  type: 'position', senderId: 1, targetId: 0, latitude: 0, longitude: 0,
  headingDeg: 0, batteryPct: 50, timestampSec: 1000, accuracyM: 10,
};

describe('TrustLayer', () => {
  const now = () => 1060; // 60s after base packet

  it('accepts a fresh packet', () => {
    expect(new TrustLayer(600, now).accept(base)).toBe(true);
  });
  it('rejects packets older than maxAge (replay of stale capture)', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, timestampSec: 1060 - 601 })).toBe(false);
  });
  it('rejects future-dated packets and still accepts a later real packet from the same sender', () => {
    const t = new TrustLayer(600, now);
    // A forged/skewed packet dated far in the future must NOT be stored in lastSeen.
    expect(t.accept({ ...base, timestampSec: 1060 + 601 })).toBe(false);
    // A subsequent normal (in-window) packet from the same sender is still accepted.
    expect(t.accept({ ...base, timestampSec: 1055 })).toBe(true);
  });
  it('rejects an exact replay (same timestamp)', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept(base)).toBe(true);
    expect(t.accept(base)).toBe(false);
  });
  it('rejects out-of-order older packets (last-write-wins)', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, timestampSec: 1050 })).toBe(true);
    expect(t.accept({ ...base, timestampSec: 1040 })).toBe(false); // late relayed copy
  });
  it('accepts newer packets after older', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, timestampSec: 1040 })).toBe(true);
    expect(t.accept({ ...base, timestampSec: 1050 })).toBe(true);
  });
  it('tracks senders independently', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, senderId: 1, timestampSec: 1050 })).toBe(true);
    expect(t.accept({ ...base, senderId: 2, timestampSec: 1040 })).toBe(true);
  });
  it('tracks packet types independently (a ping never blocks a position)', () => {
    const t = new TrustLayer(600, now);
    expect(t.accept({ ...base, type: 'position', timestampSec: 1050 })).toBe(true);
    expect(t.accept({ ...base, type: 'pingWhere', timestampSec: 1040 })).toBe(true);
  });
});
