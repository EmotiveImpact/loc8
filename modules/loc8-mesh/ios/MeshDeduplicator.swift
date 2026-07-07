//
// MeshDeduplicator.swift
// Loc8Mesh
//
// Thread-safe deduplicator with LRU eviction and time-based expiry.
// Port of bitchat's MessageDeduplicator (The Unlicense — public domain),
// configured LRU 1000 entries / 300 s per spike brief §3.
//
// Dedup key format (must match Android byte-for-byte):
//   "<senderHex(16, lowercase)>-<timestampMs(decimal)>-<type(decimal)>-<first 4 bytes of SHA256(payload), lowercase hex>"
//

import CryptoKit
import Foundation

final class MeshDeduplicator {
    private struct Entry {
        let id: String
        let timestamp: Date
    }

    private var entries: [Entry] = []
    private var head = 0
    private var lookup: [String: Date] = [:]
    private let lock = NSLock()
    private let maxAge: TimeInterval
    private let maxCount: Int

    init(maxAge: TimeInterval = MeshConstants.dedupMaxAgeSeconds,
         maxCount: Int = MeshConstants.dedupMaxCount) {
        self.maxAge = maxAge
        self.maxCount = maxCount
    }

    static func key(for frame: MeshFrame) -> String {
        let senderHex = frame.senderID.map { String(format: "%02x", $0) }.joined()
        let digest = SHA256.hash(data: frame.payload)
        let payloadHash = digest.prefix(4).map { String(format: "%02x", $0) }.joined()
        return "\(senderHex)-\(frame.timestampMs)-\(MeshConstants.messageType)-\(payloadHash)"
    }

    /// Check if the ID was already seen and record it if not.
    func isDuplicate(_ id: String) -> Bool {
        lock.lock()
        defer { lock.unlock() }

        let now = Date()
        cleanupOldEntries(before: now.addingTimeInterval(-maxAge))

        if lookup[id] != nil { return true }

        entries.append(Entry(id: id, timestamp: now))
        lookup[id] = now
        trimIfNeeded()
        return false
    }

    /// Record an ID without checking (marks our own originations so loopback is dropped).
    func markProcessed(_ id: String) {
        lock.lock()
        defer { lock.unlock() }
        if lookup[id] == nil {
            let now = Date()
            entries.append(Entry(id: id, timestamp: now))
            lookup[id] = now
            trimIfNeeded()
        }
    }

    func reset() {
        lock.lock()
        defer { lock.unlock() }
        entries.removeAll()
        head = 0
        lookup.removeAll()
    }

    private func trimIfNeeded() {
        let activeCount = entries.count - head
        guard activeCount > maxCount else { return }
        // Trim down to 75% of maxCount for amortization (bitchat behavior).
        let targetCount = (maxCount * 3) / 4
        let removeCount = activeCount - targetCount
        for i in head..<(head + removeCount) {
            lookup.removeValue(forKey: entries[i].id)
        }
        head += removeCount
        if head > entries.count / 2 {
            entries.removeFirst(head)
            head = 0
        }
    }

    private func cleanupOldEntries(before cutoff: Date) {
        while head < entries.count, entries[head].timestamp < cutoff {
            lookup.removeValue(forKey: entries[head].id)
            head += 1
        }
        if head > 0 && head > entries.count / 2 {
            entries.removeFirst(head)
            head = 0
        }
    }
}
