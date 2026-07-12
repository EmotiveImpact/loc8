// MeshFrameCodec.kt
// Loc8Mesh
//
// bitchat v1 wire framing for Loc8 location packets (spike brief §3) — the
// byte-for-byte twin of modules/loc8-mesh/ios/MeshFrameCodec.swift. Only the
// exact frame shape Loc8 emits is supported: v1 header, type 0x30, flags 0x00,
// fixed 25-byte payload.
//
// Frame (big-endian):
//   version(1)=0x01 | type(1)=0x30 | ttl(1) | timestamp(8, UInt64 ms since epoch)
//   | flags(1)=0x00 | payloadLength(2)=25 | senderID(8) | payload(25)
// Raw frame = 14 + 8 + 25 = 47 bytes. Egress ships the raw frame by default
// (MeshConstants.PAD_EGRESS_FRAMES) so it fits any negotiated BLE MTU; decode
// accepts both raw-47 and PKCS#7-padded-256 forms.

package expo.modules.loc8mesh

/**
 * A decoded (or to-be-encoded) mesh frame. `ttl` is 0..255; `timestampMs` is
 * the unsigned 64-bit wire value carried in a Long (epoch ms fits comfortably;
 * hostile > 2^63 values decode negative and are dropped by the age guard
 * before any dedup-key formatting).
 */
class MeshFrame(
    var ttl: Int,
    /** Header timestamp, ms since epoch — stamped fresh at every originate (dedup keys on it). */
    val timestampMs: Long,
    /** 8 bytes: 0x4C4F4338 ("LOC8") ‖ uint32 senderId (BE). */
    val senderID: ByteArray,
    /** The 25-byte Loc8 packet, unchanged. */
    val payload: ByteArray
)

/** PKCS#7-style padding (port of bitchat MessagePadding, single 256-byte block). */
object MeshPadding {
    fun pad(data: ByteArray, targetSize: Int): ByteArray {
        if (data.size >= targetSize) return data
        val paddingNeeded = targetSize - data.size
        // Single-byte pad-length marker constrains padding to 255 bytes (47→256 = 209, fine).
        if (paddingNeeded > 255) return data
        val padded = data.copyOf(targetSize)
        val padByte = paddingNeeded.toByte()
        for (i in data.size until targetSize) padded[i] = padByte
        return padded
    }

    /** Returns null when the PKCS#7 padding is invalid. */
    fun unpad(data: ByteArray): ByteArray? {
        if (data.isEmpty()) return null
        val last = data[data.size - 1]
        val paddingLength = last.toInt() and 0xFF
        if (paddingLength == 0 || paddingLength > data.size) return null
        val start = data.size - paddingLength
        for (i in start until data.size) {
            if (data[i] != last) return null
        }
        return data.copyOf(start)
    }
}

object MeshFrameCodec {
    const val RAW_FRAME_SIZE =
        MeshConstants.V1_HEADER_SIZE + MeshConstants.SENDER_ID_SIZE + MeshConstants.PAYLOAD_SIZE // 47

    /**
     * Encode a frame for the wire: raw 47 bytes by default, PKCS#7-padded to
     * 256 only when MeshConstants.PAD_EGRESS_FRAMES is set (bitchat piggyback).
     */
    fun encode(frame: MeshFrame): ByteArray {
        val raw = ByteArray(RAW_FRAME_SIZE)
        raw[0] = MeshConstants.PROTOCOL_VERSION
        raw[1] = MeshConstants.MESSAGE_TYPE
        raw[2] = (frame.ttl and 0xFF).toByte()
        var shift = 56
        for (i in 3..10) {
            raw[i] = ((frame.timestampMs ushr shift) and 0xFF).toByte()
            shift -= 8
        }
        raw[11] = MeshConstants.FLAGS
        raw[12] = ((MeshConstants.PAYLOAD_SIZE shr 8) and 0xFF).toByte()
        raw[13] = (MeshConstants.PAYLOAD_SIZE and 0xFF).toByte()
        System.arraycopy(frame.senderID, 0, raw, 14, MeshConstants.SENDER_ID_SIZE)
        System.arraycopy(frame.payload, 0, raw, 22, MeshConstants.PAYLOAD_SIZE)
        if (!MeshConstants.PAD_EGRESS_FRAMES) return raw
        return MeshPadding.pad(raw, MeshConstants.PADDED_FRAME_SIZE)
    }

    /**
     * Decode a wire frame. Accepts either the padded 256-byte form (padding is
     * validated and stripped) or a raw 47-byte frame. Rejects wrong version,
     * type != 0x30, non-zero flags (we can't parse recipient/signature/compressed
     * layouts at fixed offsets), and payloadLength != 25.
     */
    fun decode(data: ByteArray): MeshFrame? {
        val raw: ByteArray = if (data.size == RAW_FRAME_SIZE) {
            data
        } else {
            val unpadded = MeshPadding.unpad(data) ?: return null
            if (unpadded.size != RAW_FRAME_SIZE) return null
            unpadded
        }
        if (raw[0] != MeshConstants.PROTOCOL_VERSION) return null
        if (raw[1] != MeshConstants.MESSAGE_TYPE) return null
        val ttl = raw[2].toInt() and 0xFF
        var timestampMs = 0L
        for (i in 3..10) {
            timestampMs = (timestampMs shl 8) or (raw[i].toLong() and 0xFF)
        }
        if (raw[11] != MeshConstants.FLAGS) return null
        val payloadLength = ((raw[12].toInt() and 0xFF) shl 8) or (raw[13].toInt() and 0xFF)
        if (payloadLength != MeshConstants.PAYLOAD_SIZE) return null
        val senderID = raw.copyOfRange(14, 22)
        val payload = raw.copyOfRange(22, 47)
        return MeshFrame(ttl, timestampMs, senderID, payload)
    }
}
