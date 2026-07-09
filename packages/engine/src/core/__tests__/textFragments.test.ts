// src/core/__tests__/textFragments.test.ts
import {
  fragmentText, fragmentProfile, TextReassembler, MAX_MESSAGE_BYTES, NAME_MAX_BYTES,
  encodeUtf8, decodeUtf8,
} from '../textFragments';
import type { Packet } from '../types';

const opts = (text: string, extra: Partial<Parameters<typeof fragmentText>[0]> = {}) =>
  fragmentText({ senderId: 7, targetId: 42, msgId: 1, text, timestampSec: 1000, ...extra });

function roundTrip(text: string, msgId = 1, senderId = 7): string | null {
  const frags = opts(text, { msgId, senderId });
  const r = new TextReassembler();
  let out: { text: string } | null = null;
  for (const f of frags) out = r.add(f) ?? out;
  return out ? out.text : null;
}

describe('textFragments', () => {
  it('round-trips a single-fragment message', () => {
    const frags = opts('hi');
    expect(frags.length).toBe(1);
    expect(frags[0].type).toBe('text');
    expect(frags[0].total).toBe(1);
    expect(frags[0].seq).toBe(0);
    expect(roundTrip('hi')).toBe('hi');
  });

  it('round-trips a multi-fragment message (>11 bytes)', () => {
    const msg = 'A'.repeat(100);
    const frags = opts(msg);
    expect(frags.length).toBe(Math.ceil(100 / 11)); // 10 fragments
    frags.forEach((f, i) => {
      expect(f.seq).toBe(i);
      expect(f.total).toBe(frags.length);
      expect((f.frag ?? []).length).toBeLessThanOrEqual(11);
    });
    expect(roundTrip(msg)).toBe(msg);
  });

  it('round-trips multibyte UTF-8 (emoji) split across fragment boundaries', () => {
    const msg = 'meet at 🎉🎉🎉 the flag 🚩 now!';
    expect(roundTrip(msg)).toBe(msg);
  });

  it('reassembles out-of-order fragment delivery', () => {
    const frags = opts('the quick brown fox jumps');
    expect(frags.length).toBeGreaterThan(1);
    const r = new TextReassembler();
    const shuffled = [...frags].reverse();
    let out: { text: string } | null = null;
    shuffled.forEach((f) => { out = r.add(f) ?? out; });
    expect(out!.text).toBe('the quick brown fox jumps');
  });

  it('tolerates duplicate fragments', () => {
    const frags = opts('duplicate me please');
    const r = new TextReassembler();
    let out: { text: string } | null = null;
    // feed each fragment twice
    [...frags, ...frags].forEach((f) => { out = r.add(f) ?? out; });
    expect(out!.text).toBe('duplicate me please');
  });

  it('returns null while a message is incomplete', () => {
    const frags = opts('A'.repeat(50)); // several fragments
    const r = new TextReassembler();
    // add all but the last
    for (let i = 0; i < frags.length - 1; i++) expect(r.add(frags[i])).toBeNull();
    expect(r.add(frags[frags.length - 1])).not.toBeNull();
  });

  it('clamps an over-cap message to MAX_MESSAGE_BYTES', () => {
    const huge = 'z'.repeat(500);
    const frags = opts(huge);
    // total bytes across fragments never exceeds the cap
    const totalBytes = frags.reduce((n, f) => n + (f.frag ?? []).length, 0);
    expect(totalBytes).toBeLessThanOrEqual(MAX_MESSAGE_BYTES);
    expect(frags.length).toBeLessThanOrEqual(Math.ceil(MAX_MESSAGE_BYTES / 11));
    expect(roundTrip(huge)).toBe('z'.repeat(MAX_MESSAGE_BYTES));
  });

  it('clamps on a code-point boundary (no split emoji)', () => {
    const msg = '🎉'.repeat(100); // 4 bytes each → clamps to whole emoji
    const text = roundTrip(msg)!;
    // decoded text contains only whole 🎉 (no replacement char / lone surrogate)
    expect(text).toBe('🎉'.repeat(Math.floor(MAX_MESSAGE_BYTES / 4)));
  });

  it('keeps concurrent messages separate by (senderId, msgId)', () => {
    const a = opts('alpha', { msgId: 1, senderId: 7 });
    const b = opts('bravo', { msgId: 2, senderId: 7 });
    const r = new TextReassembler();
    // interleave
    expect(r.add(a[0])).toEqual({ senderId: 7, targetId: 42, text: 'alpha' });
    expect(r.add(b[0])).toEqual({ senderId: 7, targetId: 42, text: 'bravo' });
  });

  it('evicts oldest partials past the cap without crashing', () => {
    const r = new TextReassembler(2); // tiny cap
    // start 5 distinct multi-fragment messages, only feeding the first fragment
    for (let m = 0; m < 5; m++) {
      const frags = fragmentText({ senderId: 1, targetId: 0, msgId: m, text: 'A'.repeat(30), timestampSec: 0 });
      expect(r.add(frags[0])).toBeNull();
    }
    // no throw; a fresh single-fragment message still completes
    const solo = fragmentText({ senderId: 2, targetId: 0, msgId: 99, text: 'ok', timestampSec: 0 });
    expect(r.add(solo[0])).toEqual({ senderId: 2, targetId: 0, text: 'ok' });
  });

  // Fix 10: a reused (senderId,msgId) with a lingering partial must not poison the
  // reused-id message. msgId is a rolling uint16, so ids get reused.
  it('resets a lingering partial when the msgId is reused with a different total', () => {
    const r = new TextReassembler();
    // Old message msgId=3, total=5: only seq0,seq1 arrive → never completes.
    const old = fragmentText({ senderId: 9, targetId: 0, msgId: 3, text: 'A'.repeat(50), timestampSec: 0 });
    expect(old.length).toBe(5);
    expect(r.add(old[0])).toBeNull();
    expect(r.add(old[1])).toBeNull();
    // New message reusing msgId=3, total=1 — its seq0 would collide with the stale
    // partial's seq0. It must reset and complete as the NEW message ('ok').
    const fresh = fragmentText({ senderId: 9, targetId: 0, msgId: 3, text: 'ok', timestampSec: 10 });
    expect(fresh.length).toBe(1);
    expect(r.add(fresh[0])).toEqual({ senderId: 9, targetId: 0, text: 'ok' });
  });

  it('ignores non-text packets', () => {
    const r = new TextReassembler();
    const notText: Packet = {
      type: 'position', senderId: 1, targetId: 0, latitude: 0, longitude: 0,
      headingDeg: 0, batteryPct: 0, timestampSec: 0, accuracyM: 0,
    };
    expect(r.add(notText)).toBeNull();
  });

  it('utf8 helpers round-trip', () => {
    const s = 'héllo 🌍';
    expect(decodeUtf8(encodeUtf8(s))).toBe(s);
  });
});

describe('fragmentProfile', () => {
  const profileRoundTrip = (name: string): string | null => {
    const frags = fragmentProfile({ senderId: 831, targetId: 0, msgId: 1, text: name, timestampSec: 500 });
    const r = new TextReassembler();
    let out: { text: string } | null = null;
    for (const f of frags) out = r.add(f) ?? out;
    return out ? out.text : null;
  };

  it('emits profile-typed fragments and round-trips a short name (one fragment)', () => {
    const frags = fragmentProfile({ senderId: 831, targetId: 0, msgId: 1, text: 'Maya', timestampSec: 500 });
    expect(frags.length).toBe(1);
    expect(frags[0].type).toBe('profile');
    expect(frags[0].total).toBe(1);
    expect(profileRoundTrip('Maya')).toBe('Maya');
  });

  it('round-trips a multi-fragment long name (>11 bytes)', () => {
    const name = 'Maximiliana Featherstonehaugh'; // 29 bytes → several fragments
    const frags = fragmentProfile({ senderId: 1, targetId: 0, msgId: 2, text: name, timestampSec: 0 });
    expect(frags.length).toBeGreaterThan(1);
    expect(frags.every((f) => f.type === 'profile')).toBe(true);
    expect(profileRoundTrip(name)).toBe(name);
  });

  it('round-trips a name with an emoji split across fragment boundaries', () => {
    const name = 'DJ Sparkle 🎉✨🔥 Vibes';
    expect(profileRoundTrip(name)).toBe(name);
  });

  it('clamps an over-cap name to NAME_MAX_BYTES', () => {
    const huge = 'q'.repeat(200);
    const frags = fragmentProfile({ senderId: 1, targetId: 0, msgId: 3, text: huge, timestampSec: 0 });
    const totalBytes = frags.reduce((n, f) => n + (f.frag ?? []).length, 0);
    expect(totalBytes).toBeLessThanOrEqual(NAME_MAX_BYTES);
    expect(profileRoundTrip(huge)).toBe('q'.repeat(NAME_MAX_BYTES));
  });
});
