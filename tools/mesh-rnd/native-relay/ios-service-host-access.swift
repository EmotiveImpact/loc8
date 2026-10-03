// Host-only access fixture, appended to unchanged copies of the actual service
// and pending helper in a temporary compilation unit. Never a pod source or BLE
// replacement. No manager is constructed and start() is never invoked.
import Foundation

struct MeshHostServiceSnapshot: Equatable {
    let running: Bool
    let mode: MeshRelayMode
    let hasManagers: Bool
    let centralLinkCount: Int
    let subscriberCount: Int
    let senderID: Data?
    let pendingCount: Int
    let pendingToken: UUID?
    let admittedUptime: TimeInterval?
    let originalWire: Data?
    let relayWire: Data?
    let witnesses: Set<UUID>?
    let workCancelled: Bool?
    let dedupSeen: Bool
}

extension MeshPendingRelays {
    fileprivate func hostEntry(_ key: String) -> MeshPendingRelay? { entries[key] }
}

extension MeshService {
    func hostSeedActiveState(mode: MeshRelayMode, key: String, frame: MeshFrame,
                             ingress: UUID, otherIngress: UUID, senderID: Data,
                             completion: @escaping (MeshHostServiceSnapshot) -> Void) {
        queue.async { [self] in
            precondition(!running && central == nil && peripheralManager == nil)
            precondition(centralLinks.isEmpty && subscribers.isEmpty && pendingRelays.count == 0)
            relayMode = mode
            running = true
            mySenderID = senderID
            dedup.markProcessed(key)
            var forwarded = frame
            forwarded.ttl = 6
            let pending = pendingRelays.admit(key: key, mode: mode, originalFrame: frame,
                                              relayFrame: forwarded, ingressLink: ingress)!
            pending.workItem = DispatchWorkItem {}
            if mode == .branch { _ = pending.observe(frame, from: otherIngress) }
            completion(hostSnapshotOnQueue(key: key))
        }
    }

    func hostSnapshot(key: String, completion: @escaping (MeshHostServiceSnapshot) -> Void) {
        queue.async { [self] in completion(hostSnapshotOnQueue(key: key)) }
    }

    private func hostSnapshotOnQueue(key: String) -> MeshHostServiceSnapshot {
        let pending = pendingRelays.hostEntry(key)
        return MeshHostServiceSnapshot(
            running: running, mode: relayMode,
            hasManagers: central != nil || peripheralManager != nil,
            centralLinkCount: centralLinks.count, subscriberCount: subscribers.count,
            senderID: mySenderID, pendingCount: pendingRelays.count,
            pendingToken: pending?.token, admittedUptime: pending?.admittedUptime,
            originalWire: pending.map { MeshFrameCodec.encode($0.originalFrame) },
            relayWire: pending.map { MeshFrameCodec.encode($0.relayFrame) },
            witnesses: pending?.witnessedLinks, workCancelled: pending?.workItem?.isCancelled,
            // Existing public probe is non-renewing for retained keys. On the
            // final stop assertion a missing key is re-recorded by this probe.
            dedupSeen: dedup.isDuplicate(key))
    }
}
