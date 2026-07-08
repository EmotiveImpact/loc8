// Proves Command speaks the SAME mesh wire format as Guard — dispatch and
// status round-trip through the shared engine codec, both directions.
import {
  encodeDispatch,
  DispatchInbox,
  encodeGuardStatus,
  decodeGuardStatus,
  guardStatusLabel,
  GUARD_STATUS,
} from '../dispatch';
import { PACKET_SIZE } from '../../engine';

describe('dispatch (Command → Guard, free-text over the mesh)', () => {
  it('encodes to raw 25-byte mesh frames', () => {
    const frames = encodeDispatch({ fromId: 999, toTag: 4242, text: 'Hi', msgId: 1, nowSec: 100 });
    expect(frames.length).toBeGreaterThanOrEqual(1);
    for (const f of frames) expect(f.byteLength).toBe(PACKET_SIZE);
  });

  it('round-trips a multi-fragment message a Guard device would reassemble', () => {
    // > 11 UTF-8 bytes → forced to fragment across several frames.
    const text = 'Converge on Gate C — SOS, two down, need medic now';
    const frames = encodeDispatch({ fromId: 999, toTag: 4242, text, msgId: 7, nowSec: 200 });
    expect(frames.length).toBeGreaterThan(1);

    const inbox = new DispatchInbox();
    let out: { fromId: number; toTag: number; text: string } | null = null;
    for (const f of frames) {
      const r = inbox.ingest(f);
      if (r) out = r;
    }
    expect(out).not.toBeNull();
    expect(out!.text).toBe(text);
    expect(out!.fromId).toBe(999);
    expect(out!.toTag).toBe(4242); // crew/team tag preserved end-to-end
  });

  it('tolerates out-of-order fragment delivery', () => {
    const text = 'All units hold position until further notice please';
    const frames = encodeDispatch({ fromId: 12, toTag: 88, text, msgId: 3, nowSec: 300 });
    const inbox = new DispatchInbox();
    let out: { text: string } | null = null;
    for (const f of [...frames].reverse()) {
      const r = inbox.ingest(f);
      if (r) out = r;
    }
    expect(out!.text).toBe(text);
  });
});

describe('status (Guard → Command, quickReply over the mesh)', () => {
  it('round-trips each Guard status verb', () => {
    for (const s of GUARD_STATUS) {
      const frame = encodeGuardStatus(505, 999, s.code, 400);
      const decoded = decodeGuardStatus(frame);
      expect(decoded).not.toBeNull();
      expect(decoded!.fromId).toBe(505);
      expect(decoded!.toId).toBe(999);
      expect(decoded!.label).toBe(s.label);
    }
  });

  it('maps the field vocabulary (not the consumer one)', () => {
    expect(guardStatusLabel(1)).toBe('En route');
    expect(guardStatusLabel(3)).toBe('Need backup');
    expect(guardStatusLabel(99)).toBe('…'); // unknown code
  });

  it('does not decode a non-status frame as a status', () => {
    const dispatchFrame = encodeDispatch({ fromId: 1, toTag: 2, text: 'x', msgId: 1, nowSec: 1 })[0];
    expect(decodeGuardStatus(dispatchFrame)).toBeNull();
  });
});
