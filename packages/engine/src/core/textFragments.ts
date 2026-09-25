// src/core/textFragments.ts
//
// App-layer fragmentation for short free-text crew messages over the fixed
// 25-byte mesh frame. Each fragment is ONE ordinary 'text' Packet the existing
// transport already carries (bytes 14–24 hold up to 11 raw UTF-8 bytes).
//
// Splitting/joining is done on RAW BYTES, never on characters — a multibyte
// code point may straddle a fragment boundary, and that's fine: we only
// UTF-8-decode once every fragment of a message has been reassembled.
import type { Packet } from './types';
import {
  TEXT_FRAG_BYTES, MAX_MESSAGE_BYTES, NAME_MAX_BYTES, fragmentByteLimit, isValidFragment,
} from './fragmentValidation';
export { MAX_MESSAGE_BYTES, NAME_MAX_BYTES } from './fragmentValidation';

// Prefer the platform's TextEncoder/TextDecoder (Hermes/SDK57, Node) when
// present; fall back to a small, dependency-free UTF-8 codec otherwise so this
// module is portable across RN, web and jest without relying on Buffer.
const _TE: typeof TextEncoder | undefined =
  typeof TextEncoder !== 'undefined' ? TextEncoder : undefined;
const _TD: typeof TextDecoder | undefined =
  typeof TextDecoder !== 'undefined' ? TextDecoder : undefined;
const encoder = _TE ? new _TE() : null;
const decoder = _TD ? new _TD() : null;

function manualEncode(str: string): number[] {
  const out: number[] = [];
  for (const ch of str) {
    let code = ch.codePointAt(0)!;
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000)
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
  }
  return out;
}

function manualDecode(bytes: number[]): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    let code: number;
    if (b < 0x80) code = b;
    else if (b < 0xe0) code = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
    else if (b < 0xf0)
      code = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    else
      code =
        ((b & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
    out += String.fromCodePoint(code);
  }
  return out;
}

/** UTF-8-encode a string to a byte array. */
export function encodeUtf8(str: string): number[] {
  return encoder ? Array.from(encoder.encode(str)) : manualEncode(str);
}

/** UTF-8-decode a byte array back to a string. */
export function decodeUtf8(bytes: number[]): string {
  return decoder ? decoder.decode(new Uint8Array(bytes)) : manualDecode(bytes);
}

/**
 * Encode `text` to UTF-8, clamped to `maxBytes` on a code-point boundary (never
 * splits a multibyte sequence), so an over-long input is truncated cleanly
 * rather than corrupting the trailing character.
 */
function encodeClamped(text: string, maxBytes: number): number[] {
  const full = encodeUtf8(text);
  if (full.length <= maxBytes) return full;
  const out: number[] = [];
  for (const ch of text) {
    const chBytes = encodeUtf8(ch);
    if (out.length + chBytes.length > maxBytes) break;
    out.push(...chBytes);
  }
  return out;
}

export interface FragmentOpts {
  senderId: number;
  targetId: number;
  msgId: number;      // uint16
  text: string;
  timestampSec: number;
}

/** Fragment-carrying packet types (share the identical byte 9–24 layout). */
type FragType = 'text' | 'profile';

/**
 * Split `text` into one Packet of `type` per ≤11-byte UTF-8 chunk. Over-cap
 * input is clamped to `maxBytes` (see encodeClamped). Always returns ≥1 packet.
 */
function fragment(type: FragType, opts: FragmentOpts, maxBytes: number): Packet[] {
  const bytes = encodeClamped(opts.text, maxBytes);
  const chunks: number[][] = [];
  for (let i = 0; i < bytes.length; i += TEXT_FRAG_BYTES) {
    chunks.push(bytes.slice(i, i + TEXT_FRAG_BYTES));
  }
  if (chunks.length === 0) chunks.push([]); // empty payload → one empty fragment
  const total = chunks.length;
  const msgId = opts.msgId & 0xffff;
  return chunks.map((frag, seq) => ({
    type,
    senderId: opts.senderId,
    targetId: opts.targetId,
    latitude: 0, longitude: 0, headingDeg: 0, batteryPct: 0,
    timestampSec: opts.timestampSec, accuracyM: 0,
    msgId, seq, total, frag,
  }));
}

/**
 * Split a free-text message into 'text' fragments. Over-cap input is clamped to
 * MAX_MESSAGE_BYTES. Always returns ≥1 packet.
 */
export function fragmentText(opts: FragmentOpts): Packet[] {
  return fragment('text', opts, MAX_MESSAGE_BYTES);
}

/**
 * Split a display name into 'profile' fragments (metadata, not chat). Over-cap
 * input is clamped to NAME_MAX_BYTES (≤5 fragments; most names are 1).
 */
export function fragmentProfile(opts: FragmentOpts): Packet[] {
  return fragment('profile', opts, NAME_MAX_BYTES);
}

/** Validate complete UTF-8 before either native or fallback decoding. */
function validUtf8(bytes: number[]): boolean {
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i++];
    if (b <= 0x7f) continue;
    let following: number;
    let code: number;
    let minimum: number;
    if (b >= 0xc2 && b <= 0xdf) { following = 1; code = b & 0x1f; minimum = 0x80; }
    else if (b >= 0xe0 && b <= 0xef) { following = 2; code = b & 0x0f; minimum = 0x800; }
    else if (b >= 0xf0 && b <= 0xf4) { following = 3; code = b & 0x07; minimum = 0x10000; }
    else return false;
    if (i + following > bytes.length) return false;
    for (let j = 0; j < following; j++) {
      const next = bytes[i++];
      if ((next & 0xc0) !== 0x80) return false;
      code = (code << 6) | (next & 0x3f);
    }
    if (code < minimum || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return false;
  }
  return true;
}

interface Partial {
  total: number;
  parts: Map<number, number[]>;
  senderId: number;
  targetId: number;
  byteCount: number;
  createdAtSec: number;
}

/** Local assembly budget, not sender-clock freshness, radio TTL or a delivery SLA. */
export const REASSEMBLY_MAX_AGE_SEC = 60;
const elapsedSeconds = () => typeof performance !== 'undefined' && typeof performance.now === 'function'
  ? performance.now() / 1000 : Date.now() / 1000;

/**
 * Bounded, out-of-order reassembly for the existing 25-byte logical packets.
 * Buffers are isolated by type/sender/target/message ID and expire relative to
 * first local receipt. Duplicate fragments never extend that lifetime.
 * Completed-message replay suppression remains the mesh service's responsibility.
 * These checks are not sender authentication or encryption.
 */
export class TextReassembler {
  private bufs = new Map<string, Partial>();
  private lastNow: number | null = null;

  constructor(
    private cap = 32,
    private maxAgeSec = REASSEMBLY_MAX_AGE_SEC,
    private nowSec: () => number = elapsedSeconds,
  ) {
    if (!Number.isInteger(cap) || cap < 1 || cap > 1024) throw new Error('Invalid reassembly capacity');
    if (!Number.isFinite(maxAgeSec) || maxAgeSec <= 0) throw new Error('Invalid reassembly lifetime');
  }

  /** Explicit cleanup hook for an owner with a timer; add() also prunes lazily. */
  pruneExpired(): void { this.readClockAndPrune(); }

  clear(): void { this.bufs.clear(); this.lastNow = null; }

  private readClockAndPrune(): number | null {
    const now = this.nowSec();
    if (!Number.isFinite(now)) { this.clear(); return null; }
    // A clock rollback/restart cannot give old partials a fresh lease of life.
    if (this.lastNow !== null && now < this.lastNow) this.bufs.clear();
    this.lastNow = now;
    for (const [key, buf] of this.bufs) {
      if (now - buf.createdAtSec >= this.maxAgeSec) this.bufs.delete(key);
    }
    return now;
  }

  add(p: Packet): { senderId: number; targetId: number; text: string } | null {
    const now = this.readClockAndPrune();
    if (now === null || !isValidFragment(p)) return null;
    const key = `${p.type}:${p.senderId}:${p.targetId}:${p.msgId}`;
    let buf = this.bufs.get(key);
    // Preserve legacy rolling-ID reuse when the new fragment count differs.
    // Reuse with the same count is inherently ambiguous without protocol-v2 IDs.
    if (buf && buf.total !== p.total) {
      this.bufs.delete(key);
      buf = undefined;
    }
    if (!buf) {
      if (this.bufs.size >= this.cap) this.bufs.delete(this.bufs.keys().next().value!);
      buf = {
        total: p.total, parts: new Map(), senderId: p.senderId, targetId: p.targetId,
        byteCount: 0, createdAtSec: now,
      };
      this.bufs.set(key, buf);
    }
    const existing = buf.parts.get(p.seq);
    if (existing !== undefined) {
      if (existing.length !== p.frag.length || existing.some((b, i) => b !== p.frag[i])) {
        this.bufs.delete(key); // contradictory bytes: never silently assemble a hybrid
      }
      return null;
    }
    if (buf.byteCount + p.frag.length > fragmentByteLimit(p.type)) {
      this.bufs.delete(key);
      return null;
    }
    buf.parts.set(p.seq, p.frag.slice()); // ownership: later caller mutation is harmless
    buf.byteCount += p.frag.length;
    if (buf.parts.size < buf.total) return null;

    const bytes: number[] = [];
    for (let i = 0; i < buf.total; i++) bytes.push(...buf.parts.get(i)!);
    this.bufs.delete(key);
    if (!validUtf8(bytes)) return null;
    return { senderId: buf.senderId, targetId: buf.targetId, text: decodeUtf8(bytes) };
  }
}
