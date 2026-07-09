// src/domain/dispatch.ts — two-way dispatch/status with Guard, on the shared engine.
//
// This is the concrete proof of the "one engine" rule: Command does NOT invent a
// message format. It emits and ingests the exact same 25-byte mesh frames Guard
// speaks, using the engine's own codec + fragmenter + quick-reply vocabulary.
//
//   Command → Guard : a free-text dispatch order, fragmented across mesh frames
//                     (engine.fragmentText → engine.encodePacket).
//   Guard   → Command: a status response on the quickReply packet
//                     (engine.quickReply codec), reskinned to Guard's verbs.
//
// Both directions round-trip through the engine primitives, so a Guard device
// can decode what Command sends and vice versa — see dispatch.test.ts.

import {
  encodePacket,
  decodePacket,
  fragmentText,
  TextReassembler,
  guardStatusLabel,
  type Packet,
} from '../engine';

// Guard's status vocabulary (En route / On scene / Need backup / Clear) is the
// Guard ↔ Command wire contract, so it lives in the engine — re-exported here
// for the store and tests.
export { GUARD_STATUS, guardStatusLabel } from '../engine';
export type { GuardStatus } from '../engine';

export interface DispatchInput {
  fromId: number; // Command console's mesh id
  toTag: number; // crew/team tag or a specific guard's targetId
  text: string;
  msgId: number; // uint16, rolling per outgoing message
  nowSec: number;
}

/**
 * Encode a dispatch order to the raw mesh frames that actually ride the mesh —
 * exactly what a Guard device receives and reassembles.
 */
export function encodeDispatch(input: DispatchInput): ArrayBuffer[] {
  const frags = fragmentText({
    senderId: input.fromId,
    targetId: input.toTag,
    msgId: input.msgId,
    text: input.text,
    timestampSec: input.nowSec,
  });
  return frags.map(encodePacket);
}

/**
 * Reassemble inbound dispatch frames into whole messages — the same path Guard
 * uses for team comms. Wraps the engine's TextReassembler over decoded packets.
 */
export class DispatchInbox {
  private reassembler = new TextReassembler();

  /** Feed one raw mesh frame; returns the completed message once, else null. */
  ingest(buf: ArrayBuffer): { fromId: number; toTag: number; text: string } | null {
    const p = decodePacket(buf);
    if (p.type !== 'text') return null;
    const done = this.reassembler.add(p);
    if (!done) return null;
    return { fromId: done.senderId, toTag: done.targetId, text: done.text };
  }
}

/** Encode a Guard status response (Guard → Command) as a quickReply frame. */
export function encodeGuardStatus(
  fromId: number,
  toId: number,
  code: number,
  nowSec: number,
): ArrayBuffer {
  const p: Packet = {
    type: 'quickReply',
    senderId: fromId,
    targetId: toId,
    latitude: 0,
    longitude: 0,
    headingDeg: 0,
    batteryPct: 0,
    timestampSec: nowSec,
    accuracyM: 0,
    quickReplyCode: code,
  };
  return encodePacket(p);
}

/** Decode a Guard status frame (Command side). Returns null if not a status. */
export function decodeGuardStatus(
  buf: ArrayBuffer,
): { fromId: number; toId: number; code: number; label: string } | null {
  const p = decodePacket(buf);
  if (p.type !== 'quickReply' || p.quickReplyCode == null) return null;
  return {
    fromId: p.senderId,
    toId: p.targetId,
    code: p.quickReplyCode,
    label: guardStatusLabel(p.quickReplyCode),
  };
}
