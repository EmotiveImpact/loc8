// src/engine.ts — the ONE place Loc8 Command reaches into the shared engine.
//
// Command is a web app; it reuses @loc8/engine but ONLY its pure, RN-free
// modules (core/*). The barrel `@loc8/engine` is deliberately never imported:
// it re-exports the mesh service + crew store, which pull in react-native
// (AppState) and AsyncStorage and would not resolve on the web.
//
// This list is the HONEST reuse surface — every symbol here is consumed by the
// app (or its tests). What it buys, concretely:
//   - Packet/Coordinate + encodePacket/decodePacket → Command emits and ingests
//     the SAME 25-byte mesh frames Guard speaks (PACKET_SIZE proves it in
//     tests), so dispatch/status flow both ways with no translation layer.
//   - fragmentText/TextReassembler → dispatch orders fragment/reassemble
//     identically to consumer crew-chat and Guard team-comms.
//   - getHaversineDistance → real nearest-responder distances and zone
//     coverage, on the same geo math as the radar.

export type { Coordinate, Packet } from '@loc8/engine/core/types';
export { encodePacket, decodePacket, PACKET_SIZE } from '@loc8/engine/core/packetCodec';
export { fragmentText, TextReassembler } from '@loc8/engine/core/textFragments';
export { getHaversineDistance } from '@loc8/engine/core/geoMath';
export { GUARD_STATUS, guardStatusLabel } from '@loc8/engine/core/guardStatus';
export type { GuardStatus } from '@loc8/engine/core/guardStatus';
// Live mode: the console becomes a bridge client and renders REAL mesh frames
// relayed from a Guard gateway phone (pure module — WebSocket is platform-global).
export { BridgedTransport } from '@loc8/engine/transport/BridgedTransport';
