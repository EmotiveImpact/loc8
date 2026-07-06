// src/core/packetCodec.ts
import type { Packet, PacketType } from './types';

export const PACKET_SIZE = 25;

const TYPE_TO_CODE: Record<PacketType, number> = {
  position: 0, pingWhere: 1, pingComeFind: 2, rally: 3,
};
const CODE_TO_TYPE: PacketType[] = ['position', 'pingWhere', 'pingComeFind', 'rally'];

export function encodePacket(p: Packet): ArrayBuffer {
  const buf = new ArrayBuffer(PACKET_SIZE);
  const v = new DataView(buf);
  v.setUint8(0, TYPE_TO_CODE[p.type]);
  v.setUint32(1, p.senderId);
  v.setUint32(5, p.targetId);
  v.setInt32(9, Math.round(p.latitude * 1e7));
  v.setInt32(13, Math.round(p.longitude * 1e7));
  v.setUint16(17, ((Math.round(p.headingDeg) % 360) + 360) % 360);
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
  return {
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
}
