// src/core/guardStatus.ts — the Guard door's status vocabulary.
//
// Wire-identical to a consumer quickReply packet (same 'quickReply' type, same
// code byte); only the code→label mapping differs per door. This mapping is
// the CONTRACT between Guard (which sends a status) and Command (which renders
// it), so it lives in the engine — never fork it per app.
//
// The canonical codes are STATUS_REPLIES in core/types.ts (20–23), deliberately
// OUTSIDE the consumer quick-reply range (1–7) so both vocabularies share one
// wire and one quickReplyLabel() without collision. This module aliases them
// under the Guard/Command naming and adds the covert duress code.

import { STATUS_REPLIES, type QuickReply } from './types';

export type GuardStatus = QuickReply;

/** En route (20) · On scene (21) · Need backup (22) · Clear (23). */
export const GUARD_STATUS: GuardStatus[] = STATUS_REPLIES;

/** Resolve a Guard status code to its label, or '…' if unknown. */
export function guardStatusLabel(code: number): string {
  return GUARD_STATUS.find((s) => s.code === code)?.label ?? '…';
}

/**
 * Silent duress — deliberately NOT in GUARD_STATUS (never rendered as a chip,
 * never labelled on the sending device). On the wire it is an ordinary
 * quickReply frame, indistinguishable from a routine status tap to anyone
 * watching the guard or sniffing traffic; only the control room decodes its
 * meaning. Code 9 sits outside both the consumer (1–7) and ops (20–23) ranges.
 */
export const DURESS_CODE = 9;
