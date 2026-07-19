// MeshDeduplicator.kt
// Loc8Mesh
//
// Thread-safe deduplicator with LRU eviction and time-based expiry — the
// behavioral twin of modules/loc8-mesh/ios/MeshDeduplicator.swift (a port of
// bitchat's MessageDeduplicator, The Unlicense), configured LRU 1000 entries
// / 300 s per spike brief §3.
//
// Dedup key format (must match iOS char-for-char):
//   "<senderHex(16, lowercase)>-<timestampMs(decimal)>-<type(decimal)>-<first 4 bytes of SHA256(payload), lowercase hex>"
// For type 0x30 the decimal segment is "48".

package expo.modules.loc8mesh

import java.security.MessageDigest

class MeshDeduplicator(
    private val maxAgeMs: Long = MeshConstants.DEDUP_MAX_AGE_MS,
    private val maxCount: Int = MeshConstants.DEDUP_MAX_COUNT
) {
    private class Entry(val id: String, val timestampMs: Long)

    private val entries = ArrayDeque<Entry>()
    private val lookup = HashMap<String, Long>()
    private val lock = Any()

    companion object {
        fun key(frame: MeshFrame): String {
            val senderHex = buildString {
                for (b in frame.senderID) append("%02x".format(b.toInt() and 0xFF))
            }
            val digest = MessageDigest.getInstance("SHA-256").digest(frame.payload)
            val payloadHash = buildString {
                for (i in 0 until 4) append("%02x".format(digest[i].toInt() and 0xFF))
            }
            val type = MeshConstants.MESSAGE_TYPE.toInt() and 0xFF // 48
            // toUnsignedString matches Swift's UInt64 decimal formatting even for
            // (already-guarded) > 2^63 wire values.
            val timestamp = java.lang.Long.toUnsignedString(frame.timestampMs)
            return "$senderHex-$timestamp-$type-$payloadHash"
        }
    }

    /** Check if the ID was already seen and record it if not. */
    fun isDuplicate(id: String): Boolean {
        synchronized(lock) {
            val now = System.currentTimeMillis()
            cleanupOldEntries(now - maxAgeMs)

            if (lookup.containsKey(id)) return true

            entries.addLast(Entry(id, now))
            lookup[id] = now
            trimIfNeeded()
            return false
        }
    }

    /** Record an ID without checking (marks our own originations so loopback is dropped). */
    fun markProcessed(id: String) {
        synchronized(lock) {
            if (!lookup.containsKey(id)) {
                val now = System.currentTimeMillis()
                entries.addLast(Entry(id, now))
                lookup[id] = now
                trimIfNeeded()
            }
        }
    }

    fun reset() {
        synchronized(lock) {
            entries.clear()
            lookup.clear()
        }
    }

    private fun trimIfNeeded() {
        if (entries.size <= maxCount) return
        // Trim down to 75% of maxCount for amortization (bitchat behavior).
        val targetCount = (maxCount * 3) / 4
        while (entries.size > targetCount) {
            val removed = entries.removeFirst()
            lookup.remove(removed.id)
        }
    }

    private fun cleanupOldEntries(cutoffMs: Long) {
        while (entries.isNotEmpty() && entries.first().timestampMs < cutoffMs) {
            val removed = entries.removeFirst()
            lookup.remove(removed.id)
        }
    }
}
