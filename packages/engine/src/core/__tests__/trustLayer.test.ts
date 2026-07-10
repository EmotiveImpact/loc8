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
  it('rejects an ABSURD far-future packet and still accepts a later real packet from the same sender', () => {
    // Offline meshes have unsynced clocks, so the future window is generous (24h);
    // only an absurd far-future timestamp (which would poison the monotonic
    // baseline) is rejected — and it must NOT be stored in lastSeen.
    const t = new TrustLayer(24 * 3600, now, 24 * 3600);
    expect(t.accept({ ...base, timestampSec: 1060 + 48 * 3600 })).toBe(false);
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

  // Fix 5: offline meshes have unsynced clocks — a realistically-skewed peer's
  // live packets must be accepted, not silently dropped by an absolute age gate.
  describe('offline-clock skew tolerance', () => {
    const nowFixed = () => 1_000_000; // default 24h windows
    it('accepts a packet dated 15 minutes in the future (peer clock skew)', () => {
      const t = new TrustLayer(undefined, nowFixed);
      expect(t.accept({ ...base, timestampSec: 1_000_000 + 15 * 60 })).toBe(true);
    });
    it('still rejects an absurd far-future packet (+48h)', () => {
      const t = new TrustLayer(undefined, nowFixed);
      expect(t.accept({ ...base, timestampSec: 1_000_000 + 48 * 3600 })).toBe(false);
    });
    it('monotonic last-write-wins still holds under skew', () => {
      const t = new TrustLayer(undefined, nowFixed);
      expect(t.accept({ ...base, timestampSec: 1_000_000 + 15 * 60 })).toBe(true);
      expect(t.accept({ ...base, timestampSec: 1_000_000 + 10 * 60 })).toBe(false); // older relayed copy
      expect(t.accept({ ...base, timestampSec: 1_000_000 + 20 * 60 })).toBe(true);  // newer wins
    });
  });

  // Fix 11: directed packets to DIFFERENT targets in the same second are not
  // replays of each other — targetId is part of the trust key for directed types.
  describe('directed-packet keying', () => {
    it('two same-second replies to DIFFERENT targets are both accepted', () => {
      const t = new TrustLayer(600, now);
      expect(t.accept({ ...base, type: 'quickReply', targetId: 10, timestampSec: 1050 })).toBe(true);
      expect(t.accept({ ...base, type: 'quickReply', targetId: 20, timestampSec: 1050 })).toBe(true);
    });
    it('a same-second reply to the SAME target is still deduped (replay)', () => {
      const t = new TrustLayer(600, now);
      expect(t.accept({ ...base, type: 'quickReply', targetId: 10, timestampSec: 1050 })).toBe(true);
      expect(t.accept({ ...base, type: 'quickReply', targetId: 10, timestampSec: 1050 })).toBe(false);
    });
    it('non-directed types (position) are NOT split by targetId', () => {
      const t = new TrustLayer(600, now);
      expect(t.accept({ ...base, type: 'position', targetId: 10, timestampSec: 1050 })).toBe(true);
      // same sender+type at the same second, different target — still a replay for position
      expect(t.accept({ ...base, type: 'position', targetId: 20, timestampSec: 1050 })).toBe(false);
    });
  });
});
