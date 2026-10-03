// Deterministic host checks of production egress code. No Bluetooth manager,
// virtual radio or copied implementation; time and OS acceptance are injected.
import Foundation

private struct EgressFailure: Error { let message: String }
private func expect(_ value: @autoclosure () -> Bool, _ message: String) throws {
    if !value() { throw EgressFailure(message: message) }
}
private func peer(_ n: Int) -> UUID {
    UUID(uuidString: String(format: "00000000-0000-0000-0000-%012x", n))!
}
private func wire(_ n: Int) -> Data {
    var payload = Data(repeating: 0, count: 25)
    payload[0] = 1
    payload[23] = UInt8(truncatingIfNeeded: n >> 8)
    payload[24] = UInt8(truncatingIfNeeded: n)
    return MeshFrameCodec.encode(MeshFrame(ttl: 6, timestampMs: UInt64(1_800_000_000_000 + n),
        senderID: Data([0x4c, 0x4f, 0x43, 0x38, 0, 0, 0, 42]), payload: payload))
}

func runEgressTests(_ test: (String, () throws -> Void) -> Void) {
    for capacity in [16, 128] {
        test("egress \(capacity)-frame queue stays bounded through 10,000 blocked frames") {
            let queue = MeshEgressQueue(capacity: capacity)
            var overflow = 0
            for n in 0..<10_000 {
                let drops = queue.enqueue(wire(n), recipients: [peer(1)], expiresAt: 104.55, now: 100)
                overflow += drops.filter { $0.reason == .overflow }.count
                try expect(queue.count <= capacity, "queue exceeded capacity")
            }
            try expect(overflow == 10_000 - capacity, "overflow accounting differs")
            var sent: [Data] = []
            _ = queue.drain(now: { 100.1 }) { sent.append($0.data); return true }
            try expect(sent == ((10_000 - capacity)..<10_000).map(wire), "retained FIFO/bytes differ")
            try expect(queue.isEmpty, "drained queue is not empty")
        }
    }

    test("egress busy callbacks retain FIFO and cannot renew deadline") {
        let queue = MeshEgressQueue(capacity: 16)
        _ = queue.enqueue(wire(1), recipients: [peer(1)], expiresAt: 104.55, now: 100)
        _ = queue.enqueue(wire(2), recipients: [peer(1)], expiresAt: 104.55, now: 100)
        var attempts: [Data] = []
        for now in [100.1, 101, 102, 104.54] {
            let drops = queue.drain(now: { now }) { attempts.append($0.data); return false }
            try expect(drops.isEmpty && queue.count == 2, "busy callback removed work")
        }
        try expect(attempts == Array(repeating: wire(1), count: 4), "new frame overtook busy head")
        var staleAttempts = 0
        let expired = queue.drain(now: { 104.55 }) { _ in staleAttempts += 1; return true }
        try expect(staleAttempts == 0 && expired.count == 2 && expired.allSatisfy { $0.reason == .expired }, "exact-boundary expiry failed")
    }

    test("egress suspension expires frames before any OS send attempt") {
        let queue = MeshEgressQueue(capacity: 128)
        _ = queue.enqueue(wire(1), recipients: [peer(1)], expiresAt: 104.55, now: 100)
        var attempts = 0
        let drops = queue.drain(now: { 86_500 }) { _ in attempts += 1; return true }
        try expect(attempts == 0 && drops.count == 1 && queue.isEmpty, "sleep revived an expired frame")
    }

    test("egress uses original branch deadline and clamps extended local deadlines") {
        let queue = MeshEgressQueue(capacity: 16)
        _ = queue.enqueue(wire(1), recipients: [peer(1)], expiresAt: 104.55, now: 104)
        _ = queue.enqueue(wire(2), recipients: [peer(1)], expiresAt: 999, now: 104)
        var sent: [MeshQueuedEgress] = []
        let dropped = queue.drain(now: { 104.55 }) { sent.append($0); return true }
        try expect(dropped.count == 1 && dropped[0].entry.data == wire(1), "branch jitter time was renewed")
        try expect(sent.count == 1 && sent[0].data == wire(2) && sent[0].expiresAt == 108.55, "local deadline not capped")
    }

    test("egress rechecks clock between successful submissions") {
        let queue = MeshEgressQueue(capacity: 16)
        for n in 0..<3 { _ = queue.enqueue(wire(n), recipients: [peer(1)], expiresAt: 104.55, now: 100) }
        var now = 100.0, sent = 0
        let dropped = queue.drain(now: { now }) { _ in sent += 1; now = 105; return true }
        try expect(sent == 1 && dropped.count == 2 && queue.isEmpty, "stalled submission allowed stale successors")
    }

    test("egress clock regression fails closed and reset permits fresh admission") {
        let queue = MeshEgressQueue(capacity: 16)
        _ = queue.enqueue(wire(1), recipients: [peer(1)], expiresAt: 104.55, now: 100)
        var attempts = 0
        let drops = queue.drain(now: { 99 }) { _ in attempts += 1; return true }
        try expect(attempts == 0 && drops.count == 1 && drops[0].reason == .invalidClock, "clock regression sent retained data")
        try expect(queue.enqueue(wire(2), recipients: [peer(1)], expiresAt: 100, now: 99).first?.reason == .invalidClock, "clock regression admitted work")
        queue.clear()
        try expect(queue.enqueue(wire(3), recipients: [peer(1)], expiresAt: 5, now: 1).isEmpty && queue.count == 1, "clear did not reset local clock")
        let invalid = queue.drain(now: { .nan }) { _ in attempts += 1; return true }
        try expect(invalid.count == 1 && queue.isEmpty && attempts == 0, "NaN clock leaked work")
    }

    test("egress removes departed recipients without dropping surviving branches") {
        let queue = MeshEgressQueue(capacity: 128)
        _ = queue.enqueue(wire(1), recipients: [peer(1), peer(2)], expiresAt: 104.55, now: 100)
        _ = queue.enqueue(wire(2), recipients: [peer(1)], expiresAt: 104.55, now: 100)
        let drops = queue.removeRecipient(peer(1))
        try expect(drops.count == 2 && drops.allSatisfy { $0.entry.recipients == [peer(1)] }, "disconnect accounting is not per target")
        _ = queue.enqueue(wire(3), recipients: [peer(1)], expiresAt: 104.65, now: 100.1)
        var sent: [MeshQueuedEgress] = []
        _ = queue.drain(now: { 100.2 }) { sent.append($0); return true }
        try expect(sent.map { $0.data } == [wire(1), wire(3)], "disconnect dropped an unrelated branch or replayed old work")
        try expect(sent.map { $0.recipients } == [[peer(2)], [peer(1)]], "replacement link inherited an old target")
    }

    test("egress unrelated blocked write queues do not block a ready peer") {
        let blocked = MeshEgressQueue(capacity: 16), ready = MeshEgressQueue(capacity: 16)
        _ = blocked.enqueue(wire(1), recipients: [peer(1)], expiresAt: 104.55, now: 100)
        _ = ready.enqueue(wire(2), recipients: [peer(2)], expiresAt: 104.55, now: 100)
        _ = blocked.drain(now: { 100.1 }) { _ in false }
        var sent: [Data] = []
        _ = ready.drain(now: { 100.1 }) { sent.append($0.data); return true }
        try expect(sent == [wire(2)] && blocked.count == 1 && ready.isEmpty, "one busy peer blocked another")
    }

    test("egress owns bytes and leaves all native frame fields unchanged") {
        let queue = MeshEgressQueue(capacity: 16)
        var original = wire(1)
        let expected = original
        _ = queue.enqueue(original, recipients: [peer(1), peer(1)], expiresAt: 104.55, now: 100)
        original[2] = 0; original[46] ^= 0xff
        var sent: [MeshQueuedEgress] = []
        _ = queue.drain(now: { 100.1 }) { sent.append($0); return true }
        try expect(sent.count == 1 && sent[0].data == expected && sent[0].recipients == [peer(1)], "input mutation or duplicate destination leaked")
        try expect(sent[0].data.count == 47 && MeshFrameCodec.decode(sent[0].data)?.payload.count == 25, "wire dimensions changed")
    }

    test("egress rejects malformed frames, unbounded recipients and invalid deadlines") {
        let queue = MeshEgressQueue(capacity: 16)
        var invalidWire = wire(1); invalidWire[0] = 255
        for data in [Data(), Data(repeating: 0, count: 48), invalidWire] {
            try expect(queue.enqueue(data, recipients: [peer(1)], expiresAt: 104, now: 100).first?.reason == .invalidEntry, "invalid wire admitted")
        }
        for recipients in [[], (1...65).map(peer)] {
            try expect(queue.enqueue(wire(1), recipients: recipients, expiresAt: 104, now: 100).first?.reason == .invalidEntry, "invalid target list admitted")
        }
        for deadline in [Double.nan, Double.infinity] {
            try expect(queue.enqueue(wire(1), recipients: [peer(1)], expiresAt: deadline, now: 100).first?.reason == .invalidEntry, "invalid deadline admitted")
        }
        try expect(queue.enqueue(wire(1), recipients: [peer(1)], expiresAt: 100, now: 100).first?.reason == .expired, "already expired frame admitted")
        try expect(queue.isEmpty, "rejections retained state")
    }

    test("egress prunes expired tail entries before overflow accounting") {
        let queue = MeshEgressQueue(capacity: 2)
        _ = queue.enqueue(wire(1), recipients: [peer(1)], expiresAt: 104, now: 100)
        _ = queue.enqueue(wire(2), recipients: [peer(1)], expiresAt: 101, now: 100)
        let drops = queue.enqueue(wire(3), recipients: [peer(1)], expiresAt: 104, now: 101)
        try expect(drops.count == 1 && drops[0].reason == .expired && drops[0].entry.data == wire(2), "expired tail evicted valid head")
        var sent: [Data] = []
        _ = queue.drain(now: { 101 }) { sent.append($0.data); return true }
        try expect(sent == [wire(1), wire(3)], "tail expiry broke FIFO")
    }
}
