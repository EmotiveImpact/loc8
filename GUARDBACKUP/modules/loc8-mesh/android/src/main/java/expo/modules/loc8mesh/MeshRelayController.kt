// MeshRelayController.kt
// Loc8Mesh
//
// Flood-control policy for relays — the behavioral twin of
// modules/loc8-mesh/ios/MeshRelayController.swift (a port of the broadcast
// branch of bitchat's RelayController, The Unlicense), per spike brief §3.
// Loc8 frames are always unsigned broadcasts, so the handshake/fragment/
// directed branches are dropped entirely.

package expo.modules.loc8mesh

import kotlin.random.Random

class MeshRelayDecision(
    val shouldRelay: Boolean,
    /** TTL to stamp on the rebroadcast frame (already clamped and decremented). */
    val newTTL: Int,
    val delayMs: Int
)

object MeshRelayController {
    /**
     * @param ttl TTL as it arrived on the wire (0..255).
     * @param senderIsSelf frame originated by this device (loopback / echo).
     * @param degree current count of distinct live links.
     */
    fun decide(ttl: Int, senderIsSelf: Boolean, degree: Int): MeshRelayDecision {
        // Cap at our origination TTL so a hostile peer can't mint long-lived floods.
        val ttlCap = minOf(ttl, MeshConstants.ORIGIN_TTL)

        if (ttlCap <= 1 || senderIsSelf) {
            return MeshRelayDecision(shouldRelay = false, newTTL = ttlCap, delayMs = 0)
        }

        // Degree-based TTL clamp:
        //   dense (>= 6 links)  -> min(ttl, 5): contain floods
        //   thin chains (<= 2)  -> full ttl: every hop counts
        //   otherwise           -> min(ttl, 6)
        val ttlLimit = when {
            degree >= MeshConstants.HIGH_DEGREE_THRESHOLD -> maxOf(2, minOf(ttlCap, 5))
            degree <= 2 -> ttlCap
            else -> maxOf(2, minOf(ttlCap, 6))
        }
        val newTTL = ttlLimit - 1

        // Jittered rebroadcast delay — wide enough that duplicate suppression
        // wins often; sparse graphs relay fast to avoid cancellation races.
        // Ranges are inclusive: 10–40 / 60–150 / 80–180 / 100–220 ms.
        val delayMs = when {
            degree <= 2 -> Random.nextInt(10, 41)
            degree <= 5 -> Random.nextInt(60, 151)
            degree <= 9 -> Random.nextInt(80, 181)
            else -> Random.nextInt(100, 221)
        }
        return MeshRelayDecision(shouldRelay = true, newTTL = newTTL, delayMs = delayMs)
    }
}
