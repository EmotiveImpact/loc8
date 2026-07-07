//
// MeshConstants.swift
// Loc8Mesh
//
// Protocol constants for the Loc8 private BLE mesh.
// Wire semantics pinned to bitchat v1.5.4 / whitepaper v2.0 (spike brief §3).
// Adapted from bitchat (The Unlicense — public domain).
//

import CoreBluetooth
import Foundation

enum MeshConstants {
    // MARK: - UUIDs (Loc8 private mesh — same in DEBUG and Release)

    /// "LOC8-MESH" service.
    static let serviceUUID = CBUUID(string: "4C4F4338-4D45-5348-B1E5-4C4F43384D01")
    /// Single data characteristic: [notify, write, writeWithoutResponse, read].
    static let characteristicUUID = CBUUID(string: "4C4F4338-4D45-5348-B1E5-4C4F43384D02")

    // MARK: - Framing (bitchat v1, big-endian)

    static let protocolVersion: UInt8 = 0x01
    /// Loc8 location packet — clear of bitchat's 0x01–0x28 message-type range.
    static let messageType: UInt8 = 0x30
    /// Flags 0x00: broadcast (no recipient), unsigned, uncompressed.
    static let flags: UInt8 = 0x00
    /// version(1) + type(1) + ttl(1) + timestamp(8) + flags(1) + payloadLength(2).
    static let v1HeaderSize = 14
    static let senderIDSize = 8
    /// The 25-byte Loc8 packet (src/core/packetCodec.ts) rides unchanged as payload.
    static let payloadSize = 25
    /// Raw frame = 14 + 8 + 25 = 47 bytes. bitchat pads to 256 on the wire.
    static let paddedFrameSize = 256
    /// Egress padding policy. Raw 47-byte frames are the default for our
    /// PRIVATE mesh: they fit the 3-byte-overhead BLE default (23-byte MTU
    /// yields ~20-byte ATT writes is the floor, but iOS/Android negotiate far
    /// higher; 47 clears every real negotiated MTU while 256 does not, and
    /// long/prepared writes are broken cross-platform). Padding to 256 exists
    /// ONLY for the bitchat-network piggyback stretch goal, where frames must
    /// be indistinguishable from bitchat traffic. Decoders on both platforms
    /// accept BOTH raw-47 and padded-256 regardless of this flag.
    static let padEgressFrames = false
    /// senderID(8) = 0x4C4F4338 ("LOC8") ‖ uint32 senderId (BE).
    static let senderIDPrefix: [UInt8] = [0x4C, 0x4F, 0x43, 0x38] // "LOC8"

    // MARK: - Relay / flood control

    /// TTL at originate.
    static let originTTL: UInt8 = 7
    /// Degree at or above which the broadcast TTL clamp tightens to 5.
    static let highDegreeThreshold = 6

    // MARK: - Dedup & ingress guards

    static let dedupMaxCount = 1000
    static let dedupMaxAgeSeconds: TimeInterval = 300
    /// Reject frames stamped further than this into the future (clock skew).
    static let maxFutureSkewMs: UInt64 = 120_000
    /// Reject broadcasts older than this (stale flood suppression).
    static let maxAgeMs: UInt64 = 900_000

    // MARK: - BLE policy (from bitchat defaults)

    /// Max central-role links (we may also hold peripheral-role subscriber links).
    static let maxCentralLinks = 6
    /// Minimum interval between connect attempts.
    static let connectRateLimitSeconds: TimeInterval = 0.5
    /// Give up on a pending connect after this long so rescan can retry the peer.
    static let connectTimeoutSeconds: TimeInterval = 10
    /// Periodic scan restart (stop + start) — mirrors bitchat; iOS coalesces a
    /// long-lived scan aggressively and won't re-deliver known peripherals.
    static let scanRestartIntervalSeconds: TimeInterval = 20
    /// Per-peer bound for the write-without-response backpressure queue (drop-oldest).
    static let maxPendingWritesPerPeer = 16
    /// RSSI discovery gate; relaxed when we have zero links.
    static let rssiGate = -90
    static let rssiGateIsolated = -95

    // MARK: - State restoration

    static let centralRestoreID = "me.loc8.ble.central"
    static let peripheralRestoreID = "me.loc8.ble.peripheral"
}
