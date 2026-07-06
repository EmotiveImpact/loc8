export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type PacketType = 'position' | 'pingWhere' | 'pingComeFind' | 'rally';

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
}
