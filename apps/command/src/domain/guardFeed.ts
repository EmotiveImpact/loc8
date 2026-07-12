// src/domain/guardFeed.ts — a simulated Guard device replying over the mesh.
//
// This is the live counterpart to encodeDispatch: it proves the return leg of
// the two-way flow. It builds a real quickReply mesh frame with the engine
// codec, then DECODES it back through the same codec (as Command would off the
// air) before handing the result up. Nothing here special-cases the sim — the
// bytes make a full round-trip through @loc8/engine.

import { encodeGuardStatus, decodeGuardStatus, GUARD_STATUS } from './dispatch';
import { COMMAND_ID } from './sim';
import { nowSec } from './time';

export interface InboundStatus {
  fromId: number;
  code: number;
  label: string;
}

/**
 * Emit one Guard status for `staffId` with `code`, encode it to a mesh frame,
 * decode it back, and return the decoded status — or null if it didn't decode
 * (which would indicate a real wire-format problem).
 */
export function emitGuardStatus(staffId: number, code: number): InboundStatus | null {
  const frame = encodeGuardStatus(staffId, COMMAND_ID, code, nowSec());
  const decoded = decodeGuardStatus(frame);
  if (!decoded) return null;
  return { fromId: decoded.fromId, code: decoded.code, label: decoded.label };
}

/** A deterministic script of (staffId, statusCode) beats over the mesh. */
export function guardStatusScript(responderIds: number[]): Array<[number, number]> {
  const beats: Array<[number, number]> = [];
  // En route → On scene → Need backup → Clear, staggered per responder,
  // on the canonical GUARD_STATUS codes (20–23).
  for (const s of GUARD_STATUS) {
    for (const id of responderIds) beats.push([id, s.code]);
  }
  return beats;
}
