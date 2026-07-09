// src/core/packetCodec.ts
import type { Packet, PacketType } from './types';

export const PACKET_SIZE = 25;

const TYPE_TO_CODE: Record<PacketType, number> = {
  position: 0, pingWhere: 1, pingComeFind: 2, rally: 3, quickReply: 4, text: 5, profile: 6, sos: 7,
};
const CODE_TO_TYPE: PacketType[] = ['position', 'pingWhere', 'pingComeFind', 'rally', 'quickReply', 'text', 'profile', 'sos'];

/** Max UTF-8 bytes a single fragment ('text' or 'profile') carries (bytes 14–24). */
export const TEXT_FRAG_BYTES = 11;

/** Fragment-carrying packet types share the identical bytes 9–24 layout. */
function isFragmentType(t: PacketType): boolean {
  return t === 'text' || t === 'profile';
}

export function encodePacket(p: Packet): ArrayBuffer {
  const buf = new ArrayBuffer(PACKET_SIZE);
  const v = new DataView(buf);
  v.setUint8(0, TYPE_TO_CODE[p.type]);
  v.setUint32(1, p.senderId);
  v.setUint32(5, p.targetId);
  if (isFragmentType(p.type)) {
    // A fragment overlays the whole geo/aux region (bytes 9–24): it carries
    // no position/battery/timestamp — those are meaningless per-fragment. Layout:
    //   9-10 msgId(u16), 11 seq(u8), 12 total(u8), 13 fragLen(u8), 14-24 frag bytes.
    v.setUint16(9, (p.msgId ?? 0) & 0xffff);
    v.setUint8(11, (p.seq ?? 0) & 0xff);
    v.setUint8(12, (p.total ?? 0) & 0xff);
    const frag = p.frag ?? [];
    const len = Math.min(TEXT_FRAG_BYTES, frag.length);
    v.setUint8(13, len);
    for (let i = 0; i < TEXT_FRAG_BYTES; i++) v.setUint8(14 + i, i < len ? (frag[i] & 0xff) : 0);
    return buf;
  }
  if (p.type === 'quickReply') {
    // Replies carry no geo/heading — zero the position region and stash the
    // canned-reply code (uint8) at byte 17, reusing the heading slot.
    v.setInt32(9, 0);
    v.setInt32(13, 0);
    v.setUint8(17, Math.min(255, Math.max(0, Math.round(p.quickReplyCode ?? 0))));
    v.setUint8(18, 0);
  } else {
    v.setInt32(9, Math.round(p.latitude * 1e7));
    v.setInt32(13, Math.round(p.longitude * 1e7));
    v.setUint16(17, ((Math.round(p.headingDeg) % 360) + 360) % 360);
  }
  v.setUint8(19, Math.min(100, Math.max(0, Math.round(p.batteryPct))));
  v.setUint32(20, p.timestampSec);
  v.setUint8(24, Math.min(255, Math.max(0, Math.round(p.accuracyM))));
  return buf;
}

export function decodePacket(buf: ArrayBuffer): Packet {
  if (buf.byteLength !== PACKET_SIZE) {
    throw new Error(`Invalid packet length: ${buf.byteLength}, expected ${PACKET_SIZE}`);
  }
  const v = new DataView(buf);
  const typeCode = v.getUint8(0);
  const type = CODE_TO_TYPE[typeCode];
  if (!type) throw new Error(`Unknown packet type code: ${typeCode}`);
  if (isFragmentType(type)) {
    const fragLen = Math.min(TEXT_FRAG_BYTES, v.getUint8(13));
    const frag: number[] = [];
    for (let i = 0; i < fragLen; i++) frag.push(v.getUint8(14 + i));
    return {
      type,
      senderId: v.getUint32(1),
      targetId: v.getUint32(5),
      latitude: 0, longitude: 0, headingDeg: 0, batteryPct: 0,
      timestampSec: 0, accuracyM: 0,
      msgId: v.getUint16(9),
      seq: v.getUint8(11),
      total: v.getUint8(12),
      frag,
    };
  }
  const packet: Packet = {
    type,
    senderId: v.getUint32(1),
    targetId: v.getUint32(5),
    latitude: v.getInt32(9) / 1e7,
    longitude: v.getInt32(13) / 1e7,
    headingDeg: v.getUint16(17),
    batteryPct: v.getUint8(19),
    timestampSec: v.getUint32(20),
    accuracyM: v.getUint8(24),
  };
  if (type === 'quickReply') packet.quickReplyCode = v.getUint8(17);
  return packet;
}
