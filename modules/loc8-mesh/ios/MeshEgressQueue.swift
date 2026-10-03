// Loc8-authored bounded, expiring backpressure queue. BLE queue confined.
import Foundation

struct MeshQueuedEgress {
    let data: Data
    var recipients: [UUID]
    let expiresAt: TimeInterval
}

struct MeshEgressDrop {
    enum Reason: String {
        case overflow, expired, disconnected, invalidEntry, invalidClock
    }
    let entry: MeshQueuedEgress
    let reason: Reason
}

final class MeshEgressQueue {
    static let maxLifetimeSeconds: TimeInterval = 4.55
    static let maxRecipients = 64
    private let capacity: Int
    private var entries: [MeshQueuedEgress] = []
    private var lastNow: TimeInterval = 0

    init(capacity: Int) {
        precondition((1...128).contains(capacity))
        self.capacity = capacity
    }

    var count: Int { entries.count }
    var isEmpty: Bool { entries.isEmpty }

    /// Copies canonical raw frames without rewriting any byte. External relay
    /// deadlines can shorten admission; they can never extend the local budget.
    func enqueue(_ data: Data, recipients: [UUID], expiresAt deadline: TimeInterval,
                 now: TimeInterval = MeshRelayContinuousClock.nowSeconds()) -> [MeshEgressDrop] {
        let incoming = MeshQueuedEgress(data: data, recipients: recipients, expiresAt: deadline)
        guard now.isFinite, now >= lastNow else {
            return rejectClock() + [MeshEgressDrop(entry: incoming, reason: .invalidClock)]
        }
        lastNow = now
        var dropped = prune(now: now)
        guard data.count == 47, MeshFrameCodec.decode(data) != nil,
              !recipients.isEmpty, recipients.count <= Self.maxRecipients, deadline.isFinite else {
            return dropped + [MeshEgressDrop(entry: incoming, reason: .invalidEntry)]
        }
        guard deadline > now else {
            return dropped + [MeshEgressDrop(entry: incoming, reason: .expired)]
        }
        if entries.count == capacity {
            dropped.append(MeshEgressDrop(entry: entries.removeFirst(), reason: .overflow))
        }
        var seen = Set<UUID>()
        entries.append(MeshQueuedEgress(data: Data(data),
            recipients: recipients.filter { seen.insert($0).inserted },
            expiresAt: min(deadline, now + Self.maxLifetimeSeconds)))
        return dropped
    }

    /// `send` returns true only after OS acceptance or deliberate live-target
    /// filtering. A busy channel leaves the same frame and deadline at the head.
    /// Check time before every attempt, including after an OS callback stalls.
    func drain(now: () -> TimeInterval = MeshRelayContinuousClock.nowSeconds,
               send: (MeshQueuedEgress) -> Bool) -> [MeshEgressDrop] {
        var dropped: [MeshEgressDrop] = []
        while !entries.isEmpty {
            let time = now()
            guard time.isFinite, time >= lastNow else { return dropped + rejectClock() }
            lastNow = time
            dropped += prune(now: time)
            guard let entry = entries.first else { break }
            guard send(entry) else { break }
            entries.removeFirst()
        }
        return dropped
    }

    /// Clear only the departed incarnation's targets. A surviving subscriber
    /// still receives its copy; a later reuse of the UUID inherits no old work.
    @discardableResult
    func removeRecipient(_ id: UUID) -> [MeshEgressDrop] {
        var dropped: [MeshEgressDrop] = []
        for index in entries.indices where entries[index].recipients.contains(id) {
            let entry = entries[index]
            dropped.append(MeshEgressDrop(entry: MeshQueuedEgress(data: entry.data,
                recipients: [id], expiresAt: entry.expiresAt), reason: .disconnected))
            entries[index].recipients.removeAll { $0 == id }
        }
        entries.removeAll { $0.recipients.isEmpty }
        return dropped
    }

    func clear() { entries.removeAll(); lastNow = 0 }

    private func prune(now: TimeInterval) -> [MeshEgressDrop] {
        let dropped = entries.filter { now >= $0.expiresAt }
            .map { MeshEgressDrop(entry: $0, reason: .expired) }
        entries.removeAll { now >= $0.expiresAt }
        return dropped
    }

    private func rejectClock() -> [MeshEgressDrop] {
        let dropped = entries.map { MeshEgressDrop(entry: $0, reason: .invalidClock) }
        entries.removeAll()
        return dropped
    }
}
