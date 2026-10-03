// Host tests compile the actual native helper, codec, deduplicator and service.
// No BLE managers are started; these tests are not a phone/radio acceptance run.
import Foundation
import Darwin

private struct TestFailure: Error, CustomStringConvertible {
    let description: String
}

private func check(_ condition: @autoclosure () throws -> Bool, _ message: String) throws {
    if try condition() == false { throw TestFailure(description: message) }
}

private func link(_ value: Int) -> UUID {
    UUID(uuidString: String(format: "00000000-0000-0000-0000-%012x", value))!
}

private func frame(ttl: UInt8 = 7, timestamp: UInt64 = 1_800_000_000_000,
                   sender: UInt8 = 42, counter: UInt32 = 1) -> MeshFrame {
    var payload = Data(repeating: 0, count: 25)
    payload[0] = 1
    for (index, shift) in [24, 16, 8, 0].enumerated() {
        payload[21 + index] = UInt8(truncatingIfNeeded: counter >> UInt32(shift))
    }
    return MeshFrame(ttl: ttl, timestampMs: timestamp,
                     senderID: Data([0x4c, 0x4f, 0x43, 0x38, 0, 0, 0, sender]), payload: payload)
}

private func admit(_ store: MeshPendingRelays, key: String = "key", mode: MeshRelayMode = .branch,
                   original: MeshFrame = frame(), ingress: UUID = link(1), now: TimeInterval = 100) throws -> MeshPendingRelay {
    var outgoing = original
    outgoing.ttl = 6
    guard let entry = store.admit(key: key, mode: mode, originalFrame: original,
                                 relayFrame: outgoing, ingressLink: ingress, nowUptime: now) else {
        throw TestFailure(description: "unexpected failed admission for \(key)")
    }
    return entry
}

private func waitForString(_ request: (@escaping (String) -> Void) -> Void) throws -> String {
    let semaphore = DispatchSemaphore(value: 0)
    var received: String?
    request { value in received = value; semaphore.signal() }
    guard semaphore.wait(timeout: .now() + 5) == .success, let received else {
        throw TestFailure(description: "native callback timed out")
    }
    return received
}

private func waitForHostSnapshot(_ request: (@escaping (MeshHostServiceSnapshot) -> Void) -> Void) throws -> MeshHostServiceSnapshot {
    let semaphore = DispatchSemaphore(value: 0)
    var received: MeshHostServiceSnapshot?
    request { value in received = value; semaphore.signal() }
    guard semaphore.wait(timeout: .now() + 5) == .success, let received else {
        throw TestFailure(description: "host snapshot timed out")
    }
    return received
}

private func waitForMainStatus(_ ready: () -> Bool) throws {
    let deadline = Date().addingTimeInterval(5)
    while !ready() && Date() < deadline {
        _ = RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.01))
    }
    try check(ready(), "native main-queue status timed out")
}

@main
private enum NativeRelayTests {
    static func main() {
        var total = 0
        var failed = 0
        func test(_ name: String, _ body: () throws -> Void) {
            total += 1
            do { try body(); print("ok \(total) - \(name)") }
            catch { failed += 1; print("not ok \(total) - \(name): \(error)") }
        }

        test("current mode retains whole-relay cancellation on any duplicate") {
            let store = MeshPendingRelays()
            let entry = try admit(store, mode: .current)
            let work = DispatchWorkItem {}
            entry.workItem = work
            try check(store.duplicate(key: "key", frame: frame(ttl: 5), from: link(2)) == .cancelled, "current duplicate did not cancel")
            try check(work.isCancelled && store.count == 0, "current timer not cancelled/removed")
            try check(store.take(key: "key", token: entry.token, nowUptime: 100.1) == nil, "cancelled timer could forward")
        }

        test("same-ingress repeats preserve a bridge to an unseen peer") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            for _ in 0..<100 {
                try check(store.duplicate(key: "key", frame: frame(ttl: 4), from: link(1)) == .witnessed, "same-link arrival not recorded")
            }
            try check(entry.witnessedLinks == [link(1)] && store.count == 1, "same ingress multiplied witnesses or cancelled")
            let fired = store.take(key: "key", token: entry.token, nowUptime: 100.2)
            try check(fired?.eligibleLinks(centralLinks: [link(1)], subscriberLinks: [link(3)]) == [link(3)], "subscriber bridge was suppressed")
        }

        test("distinct matching links are excluded across both GATT roles") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            _ = store.duplicate(key: "key", frame: frame(ttl: 6), from: link(2))
            try check(entry.eligibleLinks(centralLinks: [link(1), link(3)], subscriberLinks: [link(2), link(4)]) == [link(3), link(4)], "witness exclusions did not cover both roles")
        }

        test("all witnessed targets cause no outgoing relay attempt") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            _ = store.duplicate(key: "key", frame: frame(), from: link(2))
            try check(entry.eligibleLinks(centralLinks: [link(1)], subscriberLinks: [link(2)]).isEmpty, "fully witnessed targets remained eligible")
            try check(entry.eligibleLinks(centralLinks: [], subscriberLinks: []).isEmpty, "disconnected targets remained eligible")
        }

        test("real truncated-SHA256 collision cannot create a receipt witness") {
            // Deterministic 25-byte fixture: payload type1, trailing BE counter.
            // SHA256(payload).prefix(4) is 04b28d01 for both 9598 and 54738.
            let first = frame(counter: 9598)
            let colliding = frame(counter: 54738)
            let key = MeshDeduplicator.key(for: first)
            try check(first.payload != colliding.payload && key == MeshDeduplicator.key(for: colliding), "fixture no longer demonstrates native short-key collision")
            let store = MeshPendingRelays()
            let entry = try admit(store, key: key, original: first)
            try check(store.duplicate(key: key, frame: colliding, from: link(2)) == .identityMismatch, "collision accepted as witness")
            try check(entry.eligibleLinks(centralLinks: [link(2)], subscriberLinks: []) == [link(2)], "colliding link incorrectly excluded")
            try check(store.take(key: key, token: entry.token, nowUptime: 100.1)?.relayFrame.payload == first.payload, "collision replaced the original frame")
        }

        test("sender and timestamp mismatch cannot create receipt witnesses") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            try check(store.duplicate(key: "key", frame: frame(sender: 43), from: link(2)) == .identityMismatch, "different sender was a witness")
            try check(store.duplicate(key: "key", frame: frame(timestamp: 1_800_000_000_001), from: link(3)) == .identityMismatch, "different timestamp was a witness")
            try check(entry.witnessedLinks == [link(1)], "mismatch changed witness set")
        }

        test("TTL may differ in receipt evidence without changing outgoing TTL") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            try check(store.duplicate(key: "key", frame: frame(ttl: 1), from: link(2)) == .witnessed, "TTL-only difference rejected")
            try check(entry.originalFrame.ttl == 7 && entry.relayFrame.ttl == 6, "duplicate changed fixed outgoing TTL")
        }

        test("64-link witness overflow leaves additional branches eligible") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            for index in 2...100 { _ = store.duplicate(key: "key", frame: frame(), from: link(index)) }
            try check(entry.witnessedLinks.count == 64 && entry.witnessedLinks.contains(link(1)), "witness state exceeded its bound or lost ingress")
            try check(entry.eligibleLinks(centralLinks: [link(64), link(65), link(100)], subscriberLinks: []) == [link(65), link(100)], "overflow did not fail open")
        }

        test("branch pending capacity is128 and does not evict admitted frames") {
            let store = MeshPendingRelays()
            var first: MeshPendingRelay?
            for index in 0..<128 {
                let entry = try admit(store, key: "\(index)")
                if index == 0 { first = entry }
            }
            try check(store.admit(key: "overflow", mode: .branch, originalFrame: frame(), relayFrame: frame(ttl: 6), ingressLink: link(1), nowUptime: 100) == nil, "129th branch relay admitted")
            try check(store.count == 128, "capacity evicted retained state")
            try check(store.take(key: "0", token: first!.token, nowUptime: 100.1) != nil, "first admitted frame was lost")
            _ = try admit(store, key: "replacement")
            try check(store.count == 128, "freed slot could not be reused")
        }

        test("current policy admission remains available above branch capacity") {
            let store = MeshPendingRelays()
            for index in 0..<129 { _ = try admit(store, key: "\(index)", mode: .current) }
            try check(store.count == 129, "current baseline admission changed")
        }

        test("stale timer tokens cannot remove a replacement using the same key") {
            let store = MeshPendingRelays()
            let old = try admit(store)
            _ = store.take(key: "key", token: old.token, nowUptime: 100.1)
            let replacement = try admit(store)
            try check(store.take(key: "key", token: old.token, nowUptime: 100.2) == nil && store.count == 1, "old callback consumed replacement")
            try check(store.take(key: "key", token: replacement.token, nowUptime: 100.2) != nil, "replacement no longer claimable")
            try check(store.take(key: "key", token: replacement.token, nowUptime: 100.3) == nil, "same callback forwarded twice")
        }

        test("stop/radio reset cancels work and invalidates retained callbacks") {
            let store = MeshPendingRelays()
            let old = try admit(store)
            let work = DispatchWorkItem {}
            old.workItem = work
            store.clear()
            try check(work.isCancelled && store.count == 0, "reset did not cancel/clear")
            let replacement = try admit(store)
            try check(store.take(key: "key", token: old.token, nowUptime: 100.2) == nil && store.count == 1, "pre-reset callback consumed new relay")
            try check(store.take(key: "key", token: replacement.token, nowUptime: 100.2) != nil, "new relay invalidated by old reset token")
        }

        test("link churn invalidates branch witnesses including original ingress") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            _ = store.duplicate(key: "key", frame: frame(), from: link(2))
            store.forgetLink(link(1))
            store.forgetLink(link(2))
            try check(entry.eligibleLinks(centralLinks: [link(1)], subscriberLinks: [link(2)]) == [link(1), link(2)], "reconnected links inherited stale receipt evidence")
            try check(entry.relayFrame.ttl == 6 && entry.admittedUptime == 100, "link churn reset TTL or lifetime")
            _ = store.duplicate(key: "key", frame: frame(), from: link(2))
            try check(entry.excludedLinks == [link(2)], "fresh arrival on reincarnated link not recorded")
        }

        test("current split horizon remains original ingress after link churn") {
            let store = MeshPendingRelays()
            let entry = try admit(store, mode: .current)
            store.forgetLink(link(1))
            try check(entry.excludedLinks == [link(1)], "current split horizon changed")
        }

        test("branch callbacks expire at4.55s without renewing on duplicates") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            _ = store.duplicate(key: "key", frame: frame(), from: link(2))
            try check(store.take(key: "key", token: entry.token, nowUptime: 100 + MeshPendingRelays.maxBranchLifetimeSeconds) == nil && store.count == 0, "deadline callback was allowed or retained")
            let live = try admit(store, key: "live")
            try check(store.take(key: "live", token: live.token, nowUptime: 104.549) != nil, "callback before deadline expired")
            let overdue = try admit(store, key: "overdue")
            try check(store.take(key: "overdue", token: overdue.token, nowUptime: 1000) == nil, "suspended callback revived stale relay")
        }

        test("continuous default clock is nondecreasing and used by admission and take") {
            let first = MeshRelayContinuousClock.nowSeconds()
            var previous = first
            for _ in 0..<1000 {
                let current = MeshRelayContinuousClock.nowSeconds()
                try check(current.isFinite && current >= previous, "continuous clock regressed or was not finite")
                previous = current
            }
            let store = MeshPendingRelays()
            let original = frame()
            guard let entry = store.admit(key: "default-clock", mode: .branch, originalFrame: original,
                                          relayFrame: frame(ttl: 6), ingressLink: link(1)) else {
                throw TestFailure(description: "default clock admission failed")
            }
            let after = MeshRelayContinuousClock.nowSeconds()
            try check(entry.admittedUptime >= first && entry.admittedUptime <= after, "admission used another clock epoch")
            try check(store.take(key: "default-clock", token: entry.token) != nil, "default take did not share admission clock")
        }

        test("overdue relay cannot resume when continuous time advanced through suspension") {
            let store = MeshPendingRelays()
            let beforeSuspension: TimeInterval = 100
            let resumedAt: TimeInterval = 160
            let entry = try admit(store, now: beforeSuspension)
            _ = store.duplicate(key: "key", frame: frame(ttl: 2), from: link(2))
            try check(store.take(key: "key", token: entry.token, nowUptime: resumedAt) == nil, "sleep-inclusive deadline did not reject resumed relay")
            try check(store.count == 0 && entry.admittedUptime == beforeSuspension, "expired callback retained state or duplicate renewed admission")
        }

        test("current callbacks retain baseline lifetime behavior") {
            let store = MeshPendingRelays()
            let entry = try admit(store, mode: .current)
            try check(store.take(key: "key", token: entry.token, nowUptime: 1000) != nil, "current callback was given experimental lifetime")
        }

        test("wire remains25-byte payload47-byte frame with only TTL changed") {
            let store = MeshPendingRelays()
            let entry = try admit(store)
            let before = MeshFrameCodec.encode(entry.originalFrame)
            let after = MeshFrameCodec.encode(entry.relayFrame)
            try check(before.count == 47 && after.count == 47 && entry.relayFrame.payload.count == 25, "wire dimensions changed")
            var withoutTTL = before
            withoutTTL[2] = after[2]
            try check(withoutTTL == after, "relay changed immutable wire bytes")
            try check(MeshFrameCodec.decode(after)?.payload == entry.originalFrame.payload, "payload no longer decodes unchanged")
        }

        test("actual stopped MeshService mode API defaults current and rejects invalid modes") {
            let service = MeshService.shared
            try check(try waitForString { service.getRelayMode(completion: $0) } == "current", "native default is not current")
            let configured = try waitForString { callback in
                service.configureRelayMode("branch", onConfigured: callback, onFailure: { callback("ERROR:\($0)") })
            }
            try check(configured == "branch", "native configure did not select branch")
            let rejected = try waitForString { callback in
                service.configureRelayMode("trickle", onConfigured: { callback("OK:\($0)") }, onFailure: callback)
            }
            try check(rejected == "Relay mode must be current or branch", "invalid native mode was accepted")
            try check(try waitForString { service.getRelayMode(completion: $0) } == "branch", "invalid mode changed prior selection")
            _ = try waitForString { callback in service.configureRelayMode("current", onConfigured: callback, onFailure: callback) }
        }

        for mode in [MeshRelayMode.current, .branch] {
            test("active \(mode.rawValue) reattachment retains state and reports actual selection") {
                let service = MeshService.shared
                let original = frame(timestamp: mode == .current ? 1_800_000_000_100 : 1_800_000_000_200)
                let key = MeshDeduplicator.key(for: original)
                defer {
                    service.onStatus = nil
                    service.stop()
                    _ = try? waitForHostSnapshot { service.hostSnapshot(key: key, completion: $0) }
                }
                // Drain earlier queued status closures before installing this
                // test's callback, which reflects the current module listener.
                var drained = false
                DispatchQueue.main.async { drained = true }
                try waitForMainStatus { drained }
                let owner = Data([0x4c, 0x4f, 0x43, 0x38, 0, 0, 0, 77])
                let before = try waitForHostSnapshot { callback in
                    service.hostSeedActiveState(mode: mode, key: key, frame: original,
                                                ingress: link(1), otherIngress: link(2),
                                                senderID: owner, completion: callback)
                }
                try check(before.running && before.mode == mode && !before.hasManagers, "active fixture started BLE or selected another mode")
                try check(before.pendingCount == 1 && before.pendingToken != nil && before.workCancelled == false && before.dedupSeen, "fixture lacks retained relay/dedup")
                try check(before.witnesses == (mode == .branch ? [link(1), link(2)] : [link(1)]), "fixture lacks expected ingress witnesses")
                try check(before.originalWire?[2] == 7 && before.relayWire?[2] == 6 && before.senderID == owner, "fixture TTL or own sender differs")
                var statuses: [(Int, Bool, String)] = []
                service.onStatus = { statuses.append(($0, $1, $2)) }
                for repetition in 1...3 {
                    let selected = try waitForString { callback in
                        service.configureRelayMode(mode.rawValue, onConfigured: callback,
                                                   onFailure: { callback("ERROR:\($0)") })
                    }
                    try check(selected == mode.rawValue, "matching active reattachment rejected")
                    try waitForMainStatus { statuses.count == repetition }
                    try check(statuses.last!.0 == 0 && statuses.last!.1 == false && statuses.last!.2 == mode.rawValue, "status did not report actual native mode")
                    let after = try waitForHostSnapshot { service.hostSnapshot(key: key, completion: $0) }
                    try check(after == before, "same-mode reattachment changed pending token/witness/TTL/dedup/sender/lifecycle state")
                }
                let other = mode == .current ? MeshRelayMode.branch : .current
                let changed = try waitForString { callback in
                    service.configureRelayMode(other.rawValue, onConfigured: { callback("OK:\($0)") }, onFailure: callback)
                }
                try check(changed == "Stop the mesh before configuring relay mode", "active cross-mode change accepted")
                let invalid = try waitForString { callback in
                    service.configureRelayMode("Branch", onConfigured: { callback("OK:\($0)") }, onFailure: callback)
                }
                try check(invalid == "Relay mode must be current or branch", "active invalid mode accepted")
                try check(try waitForString { service.getRelayMode(completion: $0) } == mode.rawValue, "rejected selection changed actual mode")
                try check(try waitForHostSnapshot { service.hostSnapshot(key: key, completion: $0) } == before, "rejected selection changed retained state")
                try check(statuses.count == 3, "rejected selections emitted acceptance status")
                service.stop()
                let stopped = try waitForHostSnapshot { service.hostSnapshot(key: key, completion: $0) }
                try check(!stopped.running && !stopped.hasManagers && stopped.centralLinkCount == 0 && stopped.subscriberCount == 0, "actual stop did not clean up lifecycle")
                try check(stopped.pendingCount == 0 && stopped.pendingToken == nil && !stopped.dedupSeen, "actual stop did not clear pending/seen state")
                try waitForMainStatus { statuses.count == 4 }
                try check(statuses.last!.2 == mode.rawValue, "stop status lost actual selection")
            }
        }

        print("1..\(total)")
        print("iOS native host tests: \(total - failed) passed, \(failed) failed; no BLE radio started")
        exit(failed == 0 ? 0 : 1)
    }
}
