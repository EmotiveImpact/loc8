// src/engine.ts — the ONE place Loc8 Command reaches into the shared engine.
//
// Command is a web app; it reuses @loc8/engine but ONLY its pure, RN-free
// modules (core/*, ui/theme). The barrel `@loc8/engine` is deliberately never
// imported: it re-exports the mesh service + crew store, which pull in
// react-native (AppState) and AsyncStorage and would not resolve on the web.
//
// What we reuse (and why it matters for the "one engine, four doors" rule):
//   - types + wire codec  → the SAME 25-byte mesh frame Guard speaks, so
//     dispatch/status flow both ways with Guard without a translation layer.
//   - textFragments       → dispatch messages fragment/reassemble identically
//     to consumer crew-chat and Guard team-comms.
//   - quick replies       → Guard's status responses ride the quickReply packet.
//   - geoMath             → zone distance math for coverage.
//   - theme               → shared design tokens (ops register derives from these).

export type { Coordinate, Packet, PacketType } from '@loc8/engine/core/types';
export { QUICK_REPLIES, quickReplyLabel } from '@loc8/engine/core/types';
export {
  encodePacket,
  decodePacket,
  PACKET_SIZE,
  TEXT_FRAG_BYTES,
} from '@loc8/engine/core/packetCodec';
export {
  fragmentText,
  TextReassembler,
  MAX_MESSAGE_BYTES,
} from '@loc8/engine/core/textFragments';
export { getHaversineDistance } from '@loc8/engine/core/geoMath';
export { colors as engineColors, fonts as engineFonts } from '@loc8/engine/ui/theme';
