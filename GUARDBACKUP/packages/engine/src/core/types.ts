export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type PacketType = 'position' | 'pingWhere' | 'pingComeFind' | 'rally' | 'quickReply' | 'text' | 'profile';

export interface Packet {
  type: PacketType;
  senderId: number;    // uint32
  targetId: number;    // uint32, 0 = broadcast to all
  latitude: number;
  longitude: number;
  headingDeg: number;  // 0–359
  batteryPct: number;  // 0–100
  timestampSec: number; // unix seconds
  accuracyM: number;   // 0–255 (GPS reported accuracy, meters)
  // Floor / level relative to the venue baseline (0 = ground, +up / -down).
  // Bit-packed alongside heading on the wire, so it costs no extra bytes.
  // Optional + defaults to 0, so older/other-app packets read as ground.
  floor?: number;      // signed, roughly -64..+63
  quickReplyCode?: number; // 0–255, only present on 'quickReply' packets
  // Fragmentation fields, shared by 'text' (free-text chat) and 'profile' (a
  // crew member's display name). One such packet = one fragment.
  msgId?: number;      // uint16, groups fragments of one message from a sender
  seq?: number;        // uint8, 0-based fragment index
  total?: number;      // uint8, total fragment count in this message
  frag?: number[];     // this fragment's raw UTF-8 bytes, length ≤ 11
}

/** A canned, tap-to-send reply that closes the ping loop. */
export interface QuickReply { code: number; label: string; }

export const QUICK_REPLIES: QuickReply[] = [
  { code: 1, label: 'On my way' },
  { code: 2, label: 'Stay there' },
  { code: 3, label: 'Come to me' },
  { code: 4, label: '5 min' },
  { code: 5, label: 'At the flag' },
  { code: 6, label: '👍' },
  { code: 7, label: '🎉' },
];

/**
 * Ops status responses (Guard / Command) — the same quick-reply mechanism as the
 * consumer, reskinned for a dispatch loop. Codes live in a separate 20+ block so
 * they never collide with the consumer set above; both share one wire format and
 * one `quickReplyLabel()` lookup. Additive on purpose: the engine is never forked.
 */
export const STATUS_EN_ROUTE = 20;
export const STATUS_ON_SCENE = 21;
export const STATUS_NEED_BACKUP = 22;
export const STATUS_CLEAR = 23;

export const STATUS_REPLIES: QuickReply[] = [
  { code: STATUS_EN_ROUTE, label: 'En route' },
  { code: STATUS_ON_SCENE, label: 'On scene' },
  { code: STATUS_NEED_BACKUP, label: 'Need backup' },
  { code: STATUS_CLEAR, label: 'Clear' },
];

/** Every known quick reply, consumer + ops, for a single code→label lookup. */
const ALL_QUICK_REPLIES: QuickReply[] = [...QUICK_REPLIES, ...STATUS_REPLIES];

/** Resolve a quick-reply code (consumer or ops status) to its label, or '…'. */
export function quickReplyLabel(code: number): string {
  return ALL_QUICK_REPLIES.find((q) => q.code === code)?.label ?? '…';
}
