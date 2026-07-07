// MeshConstants.kt
// Loc8Mesh
//
// Protocol constants for the Loc8 private BLE mesh — the byte-for-byte twin of
// modules/loc8-mesh/ios/MeshConstants.swift. Wire semantics pinned to bitchat
// v1.5.4 / whitepaper v2.0 (spike brief §3). Clean-room: derived from the
// whitepaper + our own Unlicense-derived Swift only, never bitchat-android.

package expo.modules.loc8mesh

import java.util.UUID

object MeshConstants {
    // UUIDs (Loc8 private mesh — same in DEBUG and Release)

    /** "LOC8-MESH" service. */
    val SERVICE_UUID: UUID = UUID.fromString("4C4F4338-4D45-5348-B1E5-4C4F43384D01")

    /** Single data characteristic: [notify, write, writeWithoutResponse, read]. */
    val CHARACTERISTIC_UUID: UUID = UUID.fromString("4C4F4338-4D45-5348-B1E5-4C4F43384D02")

    /** Client Characteristic Configuration Descriptor (Bluetooth SIG assigned). */
    val CCCD_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")

    // Framing (bitchat v1, big-endian)

    const val PROTOCOL_VERSION: Byte = 0x01

    /** Loc8 location packet — clear of bitchat's 0x01–0x28 message-type range. */
    const val MESSAGE_TYPE: Byte = 0x30

    /** Flags 0x00: broadcast (no recipient), unsigned, uncompressed. */
    const val FLAGS: Byte = 0x00

    /** version(1) + type(1) + ttl(1) + timestamp(8) + flags(1) + payloadLength(2). */
    const val V1_HEADER_SIZE = 14
    const val SENDER_ID_SIZE = 8

    /** The 25-byte Loc8 packet (src/core/packetCodec.ts) rides unchanged as payload. */
    const val PAYLOAD_SIZE = 25

    /** Raw frame = 14 + 8 + 25 = 47 bytes, PKCS#7-padded to 256 on the wire. */
    const val PADDED_FRAME_SIZE = 256

    /** senderID(8) = 0x4C4F4338 ("LOC8") ‖ uint32 senderId (BE). */
    val SENDER_ID_PREFIX = byteArrayOf(0x4C, 0x4F, 0x43, 0x38) // "LOC8"

    // Relay / flood control

    /** TTL at originate. */
    const val ORIGIN_TTL = 7

    /** Degree at or above which the broadcast TTL clamp tightens to 5. */
    const val HIGH_DEGREE_THRESHOLD = 6

    // Dedup & ingress guards

    const val DEDUP_MAX_COUNT = 1000
    const val DEDUP_MAX_AGE_MS = 300_000L

    /** Reject frames stamped further than this into the future (clock skew). */
    const val MAX_FUTURE_SKEW_MS = 120_000L

    /** Reject broadcasts older than this (stale flood suppression). */
    const val MAX_AGE_MS = 900_000L

    // BLE policy (from bitchat defaults)

    /** Max central-role links (we may also hold peripheral-role subscriber links). */
    const val MAX_CENTRAL_LINKS = 6

    /** Minimum interval between connect attempts. */
    const val CONNECT_RATE_LIMIT_MS = 500L

    /** RSSI discovery gate; relaxed when we have zero links. */
    const val RSSI_GATE = -90
    const val RSSI_GATE_ISOLATED = -95

    /**
     * MTU we request as a GATT client: 256-byte frame + 3-byte ATT header.
     * Writes fall back to with-response when the negotiated MTU is smaller.
     */
    const val DESIRED_MTU = 259
}
