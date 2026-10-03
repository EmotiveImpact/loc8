// Experimental branch-preserving GATT relay bookkeeping. Authored for Loc8;
// no third-party implementation is incorporated. All access is on the BLE queue.

import Foundation
import Darwin

/// Darwin's continuous ticks advance while the device sleeps. Ordinary system
/// uptime excludes sleep and could let an old relay survive a long suspension.
/// mach_continuous_time is available on iOS 10+, preserving the module's target.
enum MeshRelayContinuousClock {
    private static let secondsPerTick: Double = {
        var info = mach_timebase_info_data_t()
        let status = mach_timebase_info(&info)
        precondition(status == KERN_SUCCESS && info.denom != 0, "Mach timebase unavailable")
        return Double(info.numer) / Double(info.denom) / 1_000_000_000
    }()

    static func nowSeconds() -> TimeInterval {
        Double(mach_continuous_time()) * secondsPerTick
    }
}

enum MeshRelayMode: String {
    case current
    case branch
}

/// Every accepted frame has the same validated version, type, flags and length
/// (MeshFrameCodec.decode). Compare all remaining immutable bytes, rather than
/// treating the deduplicator's truncated payload hash as evidence of receipt.
/// TTL alone may change at a relay and is deliberately absent from this identity.
private struct MeshRelayFrameIdentity: Equatable {
    let timestampMs: UInt64
    let senderID: Data
    let payload: Data

    init(_ frame: MeshFrame) {
        timestampMs = frame.timestampMs
        senderID = frame.senderID
        payload = frame.payload
    }
}

final class MeshPendingRelay {
    let token = UUID()
    let mode: MeshRelayMode
    let originalFrame: MeshFrame
    let relayFrame: MeshFrame
    let ingressLink: UUID
    let admittedUptime: TimeInterval
    private let identity: MeshRelayFrameIdentity
    private(set) var witnessedLinks: Set<UUID>
    var workItem: DispatchWorkItem?

    init(mode: MeshRelayMode, originalFrame: MeshFrame, relayFrame: MeshFrame,
         ingressLink: UUID, admittedUptime: TimeInterval) {
        self.mode = mode
        self.originalFrame = originalFrame
        self.relayFrame = relayFrame
        self.ingressLink = ingressLink
        self.admittedUptime = admittedUptime
        identity = MeshRelayFrameIdentity(originalFrame)
        witnessedLinks = [ingressLink]
    }

    /// Only an actual matching arrival on this UUID is a witness. Repeated
    /// observations of one link do not affect another branch. At the bound we
    /// retain the first witnesses and send to any additional, unrecorded links.
    func observe(_ frame: MeshFrame, from linkID: UUID) -> Bool {
        guard identity == MeshRelayFrameIdentity(frame) else { return false }
        if witnessedLinks.count < MeshPendingRelays.maxWitnessedLinks {
            witnessedLinks.insert(linkID)
        }
        return true
    }

    var excludedLinks: Set<UUID> {
        mode == .branch ? witnessedLinks : [ingressLink]
    }

    func eligibleLinks(centralLinks: Set<UUID>, subscriberLinks: Set<UUID>) -> Set<UUID> {
        centralLinks.union(subscriberLinks).subtracting(excludedLinks)
    }

    func forgetLink(_ linkID: UUID) {
        guard mode == .branch else { return }
        witnessedLinks.remove(linkID)
    }
}

enum MeshPendingDuplicate: Equatable {
    case absent
    case cancelled
    case witnessed
    /// The existing short dedup key collided; this is never receipt evidence.
    case identityMismatch
}

/// The work item's token guards the lookup, including after stop/radio-off and
/// reuse of the same short key. Cancelling a DispatchWorkItem alone is not the
/// authority for whether a queued callback may forward a frame.
final class MeshPendingRelays {
    static let maxPendingBranchRelays = 128
    static let maxWitnessedLinks = 64
    static let maxBranchLifetimeSeconds: TimeInterval = 4.55
    private var entries: [String: MeshPendingRelay] = [:]

    var count: Int { entries.count }

    func admit(key: String, mode: MeshRelayMode, originalFrame: MeshFrame,
               relayFrame: MeshFrame, ingressLink: UUID,
               nowUptime: TimeInterval = MeshRelayContinuousClock.nowSeconds()) -> MeshPendingRelay? {
        guard entries[key] == nil else { return nil }
        // Preserve the current policy's admission behavior for comparison.
        if mode == .branch, entries.count >= Self.maxPendingBranchRelays { return nil }
        let entry = MeshPendingRelay(mode: mode, originalFrame: originalFrame,
                                     relayFrame: relayFrame, ingressLink: ingressLink,
                                     admittedUptime: nowUptime)
        entries[key] = entry
        return entry
    }

    func duplicate(key: String, frame: MeshFrame, from linkID: UUID) -> MeshPendingDuplicate {
        guard let entry = entries[key] else { return .absent }
        if entry.mode == .current {
            entries.removeValue(forKey: key)
            entry.workItem?.cancel()
            return .cancelled
        }
        return entry.observe(frame, from: linkID) ? .witnessed : .identityMismatch
    }

    func take(key: String, token: UUID,
              nowUptime: TimeInterval = MeshRelayContinuousClock.nowSeconds()) -> MeshPendingRelay? {
        guard let entry = entries[key], entry.token == token else { return nil }
        entries.removeValue(forKey: key)
        // OS suspension may delay the normal 10–220 ms jitter callback. The
        // experimental policy cannot forward that stale pending state on resume.
        if entry.mode == .branch,
           nowUptime < entry.admittedUptime || nowUptime >= entry.admittedUptime + Self.maxBranchLifetimeSeconds {
            return nil
        }
        return entry
    }

    /// A UUID is a link identity, not a durable receipt across reconnects. Link
    /// churn makes previous receipt evidence uncertain, so branch mode fails open.
    func forgetLink(_ linkID: UUID) {
        for entry in entries.values { entry.forgetLink(linkID) }
    }

    func clear() {
        for entry in entries.values { entry.workItem?.cancel() }
        entries.removeAll()
    }
}
