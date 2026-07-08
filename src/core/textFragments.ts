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
import { TEXT_FRAG_BYTES } from './packetCodec';

/** Hard cap on a message's UTF-8 byte length. ceil(160/11)=15 fragments max. */
export const MAX_MESSAGE_BYTES = 160;

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

/**
 * Split `text` into one 'text' Packet per ≤11-byte UTF-8 chunk. Over-cap input
 * is clamped to MAX_MESSAGE_BYTES (see encodeClamped). Always returns ≥1 packet.
 */
export function fragmentText(opts: FragmentOpts): Packet[] {
  const bytes = encodeClamped(opts.text, MAX_MESSAGE_BYTES);
  const chunks: number[][] = [];
  for (let i = 0; i < bytes.length; i += TEXT_FRAG_BYTES) {
    chunks.push(bytes.slice(i, i + TEXT_FRAG_BYTES));
  }
  if (chunks.length === 0) chunks.push([]); // empty message → one empty fragment
  const total = chunks.length;
  const msgId = opts.msgId & 0xffff;
  return chunks.map((frag, seq) => ({
    type: 'text' as const,
    senderId: opts.senderId,
    targetId: opts.targetId,
    latitude: 0, longitude: 0, headingDeg: 0, batteryPct: 0,
    timestampSec: opts.timestampSec, accuracyM: 0,
    msgId, seq, total, frag,
  }));
}

interface Partial {
  total: number;
  parts: Map<number, number[]>; // seq → bytes
  senderId: number;
  targetId: number;
  order: number;                // insertion order, for oldest-first eviction
}

/**
 * Reassembles 'text' fragments into whole messages.
 *  - Keyed by `${senderId}:${msgId}` so concurrent messages don't collide.
 *  - Tolerates out-of-order delivery and duplicate fragments (dedup by seq).
 *  - Caps buffered partial messages (default 32); evicts the oldest partial
 *    when exceeded so a permanently-missing fragment can't leak memory.
 *  - `add()` returns the completed message once, then drops its buffer; null
 *    until then.
 */
export class TextReassembler {
  private bufs = new Map<string, Partial>();
  private nextOrder = 0;

  constructor(private cap = 32) {}

  add(p: Packet): { senderId: number; targetId: number; text: string } | null {
    if (p.type !== 'text' || p.msgId == null || p.seq == null || p.total == null) return null;
    const key = `${p.senderId}:${p.msgId}`;
    let buf = this.bufs.get(key);
    if (!buf) {
      buf = {
        total: p.total,
        parts: new Map(),
        senderId: p.senderId,
        targetId: p.targetId,
        order: this.nextOrder++,
      };
      this.bufs.set(key, buf);
      this.evict();
    }
    if (!buf.parts.has(p.seq)) buf.parts.set(p.seq, p.frag ?? []);
    if (buf.parts.size < buf.total) return null;

    // All fragments present — concatenate in seq order and decode.
    const bytes: number[] = [];
    for (let i = 0; i < buf.total; i++) {
      const part = buf.parts.get(i);
      if (!part) return null; // defensive: a gap despite size===total
      for (const b of part) bytes.push(b);
    }
    this.bufs.delete(key);
    return { senderId: buf.senderId, targetId: buf.targetId, text: decodeUtf8(bytes) };
  }

  private evict(): void {
    while (this.bufs.size > this.cap) {
      let oldestKey: string | null = null;
      let oldestOrder = Infinity;
      for (const [k, b] of this.bufs) {
        if (b.order < oldestOrder) { oldestOrder = b.order; oldestKey = k; }
      }
      if (oldestKey == null) break;
      this.bufs.delete(oldestKey);
    }
  }
}
