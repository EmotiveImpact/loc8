//
// MeshDiagnostics.swift
// Loc8Mesh
//
// Bounded, privacy-preserving evidence recorder for the preregistered MESH-01
// three-phone field experiment. This is observation-only: it never changes
// routing, timing, deduplication or packet bytes.
//

import CryptoKit
import Foundation

private struct MeshDiagnosticContext {
    let runID: String
    let cohortID: String
    let blockID: String
    let deviceRole: String
    let originRole: String
}

enum MeshDiagnosticValidationError: Error {
    case invalidRunID
    case invalidCohortID
    case invalidBlockID
    case invalidDeviceRole
    case invalidOriginRole
    case inactive
    case notOrigin
    case invalidOriginSequence
    case invalidFieldPacket
    case snapshotPending
}

final class MeshDiagnostics {
    static let shared = MeshDiagnostics()

    static let schema = "loc8.mesh-field-evidence.v1"
    static let maxEvents = 20_000

    private let lock = NSLock()
    private var context: MeshDiagnosticContext?
    private var active = false
    private var events: [[String: Any]] = []
    private var nextEventIndex = 0
    private var nextOriginSequence = 0
    private var overflowCount = 0

    private init() {}

    func start(runID: String, cohortID: String, blockID: String, deviceRole: String, originRole: String) throws {
        guard Self.matches(runID, pattern: "^[a-z0-9][a-z0-9-]{7,63}$") else {
            throw MeshDiagnosticValidationError.invalidRunID
        }
        guard Self.matches(cohortID, pattern: "^[a-z0-9][a-z0-9-]{0,47}$") else {
            throw MeshDiagnosticValidationError.invalidCohortID
        }
        guard Self.matches(blockID, pattern: "^[a-z0-9][a-z0-9-]{0,63}$") else {
            throw MeshDiagnosticValidationError.invalidBlockID
        }
        guard Self.isRole(deviceRole) else { throw MeshDiagnosticValidationError.invalidDeviceRole }
        guard Self.isRole(originRole) else { throw MeshDiagnosticValidationError.invalidOriginRole }

        lock.lock()
        defer { lock.unlock() }
        guard context == nil else { throw MeshDiagnosticValidationError.snapshotPending }
        context = MeshDiagnosticContext(
            runID: runID,
            cohortID: cohortID,
            blockID: blockID,
            deviceRole: deviceRole,
            originRole: originRole
        )
        active = true
        events.removeAll(keepingCapacity: true)
        nextEventIndex = 0
        nextOriginSequence = 0
        overflowCount = 0
        appendLocked(action: "diagnostics-started")
    }

    func stop() throws {
        lock.lock()
        defer { lock.unlock() }
        guard active, context != nil else { throw MeshDiagnosticValidationError.inactive }
        appendLocked(action: "diagnostics-stopped")
        active = false
    }

    func assertCanOriginate(sequence: Int, payload: Data) throws {
        lock.lock()
        defer { lock.unlock() }
        guard active, let context else { throw MeshDiagnosticValidationError.inactive }
        guard context.deviceRole == context.originRole else { throw MeshDiagnosticValidationError.notOrigin }
        guard sequence == nextOriginSequence else { throw MeshDiagnosticValidationError.invalidOriginSequence }
        guard Self.isFrozenFieldPacket(payload, role: context.originRole, sequence: sequence) else {
            throw MeshDiagnosticValidationError.invalidFieldPacket
        }
        nextOriginSequence += 1
    }

    func snapshot() -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        return [
            "events": events,
            "overflowCount": overflowCount,
            "active": active,
        ]
    }

    func release() throws {
        lock.lock()
        defer { lock.unlock() }
        guard !active else { throw MeshDiagnosticValidationError.snapshotPending }
        context = nil
        events.removeAll(keepingCapacity: false)
        nextEventIndex = 0
        nextOriginSequence = 0
        overflowCount = 0
    }

    func recordLifecycle(action: String, rawLinkID: String? = nil) {
        lock.lock()
        defer { lock.unlock() }
        guard active else { return }
        appendLocked(action: action, rawLinkID: rawLinkID)
    }

    func recordMalformed(rawLinkID: String) {
        lock.lock()
        defer { lock.unlock() }
        guard active else { return }
        appendLocked(action: "malformed-drop", rawLinkID: rawLinkID, reason: "malformed")
    }

    func recordFrame(
        action: String,
        frame: MeshFrame,
        sequence: Int? = nil,
        ttlBefore: UInt8? = nil,
        ttlAfter: UInt8? = nil,
        rawLinkID: String? = nil,
        reason: String? = nil,
        onlyWhenRelayRole: Bool = false
    ) {
        lock.lock()
        defer { lock.unlock() }
        guard active, let context else { return }
        if onlyWhenRelayRole && context.deviceRole != "B" { return }
        appendLocked(
            action: action,
            frame: frame,
            sequence: sequence,
            ttlBefore: ttlBefore ?? frame.ttl,
            ttlAfter: ttlAfter ?? frame.ttl,
            rawLinkID: rawLinkID,
            reason: reason
        )
    }

    private func appendLocked(
        action: String,
        frame: MeshFrame? = nil,
        sequence: Int? = nil,
        ttlBefore: UInt8? = nil,
        ttlAfter: UInt8? = nil,
        rawLinkID: String? = nil,
        reason: String? = nil
    ) {
        guard let context else { return }
        guard events.count < Self.maxEvents else {
            overflowCount += 1
            return
        }

        let event: [String: Any] = [
            "schema": Self.schema,
            "runId": context.runID,
            "cohortId": context.cohortID,
            "blockId": context.blockID,
            "deviceRole": context.deviceRole,
            "eventIndex": nextEventIndex,
            "monotonicNs": String(DispatchTime.now().uptimeNanoseconds),
            "wallTimeMs": Int64(Date().timeIntervalSince1970 * 1_000),
            "action": action,
            "frameId": frame.map(Self.frameID) ?? NSNull(),
            "sequence": sequence ?? NSNull(),
            "originRole": frame == nil ? NSNull() : context.originRole,
            "ttlBefore": ttlBefore.map { Int($0) } ?? NSNull(),
            "ttlAfter": ttlAfter.map { Int($0) } ?? NSNull(),
            "linkHandle": rawLinkID.map { Self.linkHandle(runID: context.runID, rawLinkID: $0) } ?? NSNull(),
            "reason": reason ?? NSNull(),
            "payloadBytes": frame == nil ? NSNull() : MeshConstants.payloadSize,
            "wireBytes": frame == nil ? NSNull() : MeshFrameCodec.rawFrameSize,
        ]
        events.append(event)
        nextEventIndex += 1
    }

    private static func frameID(_ frame: MeshFrame) -> String {
        var identity = Data("LOC8-MESH-FRAME-ID-V1\0".utf8)
        identity.append(contentsOf: [
            MeshConstants.protocolVersion,
            MeshConstants.messageType,
            MeshConstants.flags,
        ])
        for shift in stride(from: 56, through: 0, by: -8) {
            identity.append(UInt8(truncatingIfNeeded: frame.timestampMs >> UInt64(shift)))
        }
        identity.append(frame.senderID)
        let payloadLength = UInt16(frame.payload.count)
        identity.append(UInt8(payloadLength >> 8))
        identity.append(UInt8(payloadLength & 0xff))
        identity.append(frame.payload)
        return hex(SHA256.hash(data: identity))
    }

    private static func linkHandle(runID: String, rawLinkID: String) -> String {
        var input = Data(runID.utf8)
        input.append(0)
        input.append(Data(rawLinkID.utf8))
        return String(hex(SHA256.hash(data: input)).prefix(16))
    }

    private static func hex<S: Sequence>(_ bytes: S) -> String where S.Element == UInt8 {
        bytes.map { String(format: "%02x", $0) }.joined()
    }

    private static func matches(_ value: String, pattern: String) -> Bool {
        value.range(of: pattern, options: .regularExpression) != nil
    }

    private static func isRole(_ value: String) -> Bool {
        value == "A" || value == "B" || value == "C"
    }

    private static func isFrozenFieldPacket(_ payload: Data, role: String, sequence: Int) -> Bool {
        let roleByte: UInt8
        switch role {
        case "A": roleByte = 0xa1
        case "B": roleByte = 0xb1
        case "C": roleByte = 0xc1
        default: return false
        }
        guard payload.count == MeshConstants.payloadSize,
              payload[0] == 0,
              Array(payload[1..<5]) == [0x4c, 0x38, 0x00, roleByte],
              payload[5..<19].allSatisfy({ $0 == 0 }),
              payload[19] == 100,
              payload[24] == UInt8(sequence) else {
            return false
        }
        return true
    }
}
