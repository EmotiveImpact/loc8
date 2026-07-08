export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type PacketType = 'position' | 'pingWhere' | 'pingComeFind' | 'rally' | 'quickReply' | 'text';

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
  quickReplyCode?: number; // 0–255, only present on 'quickReply' packets
  // Free-text fragmentation ('text' packets only). One 'text' packet = one fragment.
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

/** Resolve a quick-reply code to its label, or '…' if unknown. */
export function quickReplyLabel(code: number): string {
  return QUICK_REPLIES.find((q) => q.code === code)?.label ?? '…';
}
