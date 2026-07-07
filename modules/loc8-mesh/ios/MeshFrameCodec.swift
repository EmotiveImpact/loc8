//
// MeshFrameCodec.swift
// Loc8Mesh
//
// bitchat v1 wire framing for Loc8 location packets (spike brief §3).
// Ported/simplified from bitchat's BinaryProtocol.swift + MessagePadding.swift
// (The Unlicense — public domain). Only the exact frame shape Loc8 emits is
// supported: v1 header, type 0x30, flags 0x00, fixed 25-byte payload.
//
// Frame (big-endian):
//   version(1)=0x01 | type(1)=0x30 | ttl(1) | timestamp(8, UInt64 ms since epoch)
//   | flags(1)=0x00 | payloadLength(2)=25 | senderID(8) | payload(25)
// Raw frame = 14 + 8 + 25 = 47 bytes, PKCS#7-padded to 256 on the wire.
//

import Foundation

struct MeshFrame {
    var ttl: UInt8
    /// Header timestamp, ms since epoch — stamped fresh at every originate (dedup keys on it).
    let timestampMs: UInt64
    /// 8 bytes: 0x4C4F4338 ("LOC8") ‖ uint32 senderId (BE).
    let senderID: Data
    /// The 25-byte Loc8 packet, unchanged.
    let payload: Data
}

/// PKCS#7-style padding (port of bitchat MessagePadding, single 256-byte block).
enum MeshPadding {
    static func pad(_ data: Data, toSize targetSize: Int) -> Data {
        guard data.count < targetSize else { return data }
        let paddingNeeded = targetSize - data.count
        // Single-byte pad-length marker constrains padding to 255 bytes (47→256 = 209, fine).
        guard paddingNeeded > 0 && paddingNeeded <= 255 else { return data }
        var padded = data
        padded.append(contentsOf: Array(repeating: UInt8(paddingNeeded), count: paddingNeeded))
        return padded
    }

    /// Returns nil when the PKCS#7 padding is invalid.
    static func unpad(_ data: Data) -> Data? {
        guard let last = data.last else { return nil }
        let paddingLength = Int(last)
        guard paddingLength > 0 && paddingLength <= data.count else { return nil }
        let start = data.count - paddingLength
        for b in data[(data.startIndex + start)...] where b != last { return nil }
        return data.prefix(start)
    }
}

enum MeshFrameCodec {
    static let rawFrameSize = MeshConstants.v1HeaderSize + MeshConstants.senderIDSize + MeshConstants.payloadSize // 47

    /// Encode a frame and PKCS#7-pad it to 256 bytes for the wire.
    static func encode(_ frame: MeshFrame) -> Data {
        var data = Data(capacity: MeshConstants.paddedFrameSize)
        data.append(MeshConstants.protocolVersion)
        data.append(MeshConstants.messageType)
        data.append(frame.ttl)
        for shift in stride(from: 56, through: 0, by: -8) {
            data.append(UInt8((frame.timestampMs >> UInt64(shift)) & 0xFF))
        }
        data.append(MeshConstants.flags)
        let length = UInt16(MeshConstants.payloadSize)
        data.append(UInt8((length >> 8) & 0xFF))
        data.append(UInt8(length & 0xFF))
        data.append(frame.senderID.prefix(MeshConstants.senderIDSize))
        data.append(frame.payload.prefix(MeshConstants.payloadSize))
        return MeshPadding.pad(data, toSize: MeshConstants.paddedFrameSize)
    }

    /// Decode a wire frame. Accepts either the padded 256-byte form (padding is
    /// validated and stripped) or a raw 47-byte frame. Rejects wrong version,
    /// type != 0x30, non-zero flags (we can't parse recipient/signature/compressed
    /// layouts at fixed offsets), and payloadLength != 25.
    static func decode(_ data: Data) -> MeshFrame? {
        let raw: Data
        if data.count == rawFrameSize {
            raw = data
        } else {
            guard let unpadded = MeshPadding.unpad(data), unpadded.count == rawFrameSize else { return nil }
            raw = unpadded
        }
        let bytes = [UInt8](raw)
        guard bytes[0] == MeshConstants.protocolVersion else { return nil }
        guard bytes[1] == MeshConstants.messageType else { return nil }
        let ttl = bytes[2]
        var timestampMs: UInt64 = 0
        for i in 3..<11 {
            timestampMs = (timestampMs << 8) | UInt64(bytes[i])
        }
        guard bytes[11] == MeshConstants.flags else { return nil }
        let payloadLength = (UInt16(bytes[12]) << 8) | UInt16(bytes[13])
        guard payloadLength == UInt16(MeshConstants.payloadSize) else { return nil }
        let senderID = Data(bytes[14..<22])
        let payload = Data(bytes[22..<47])
        return MeshFrame(ttl: ttl, timestampMs: timestampMs, senderID: senderID, payload: payload)
    }
}
