//
// MeshRelayController.swift
// Loc8Mesh
//
// Flood-control policy for relays — port of the broadcast branch of bitchat's
// RelayController.swift (The Unlicense — public domain), per spike brief §3.
// Loc8 frames are always unsigned broadcasts, so the handshake/fragment/
// directed branches are dropped entirely.
//

import Foundation

struct MeshRelayDecision {
    let shouldRelay: Bool
    /// TTL to stamp on the rebroadcast frame (already clamped and decremented).
    let newTTL: UInt8
    let delayMs: Int
}

enum MeshRelayController {
    /// - Parameters:
    ///   - ttl: TTL as it arrived on the wire.
    ///   - senderIsSelf: frame originated by this device (loopback / echo).
    ///   - degree: current count of distinct live links.
    static func decide(ttl: UInt8, senderIsSelf: Bool, degree: Int) -> MeshRelayDecision {
        // Cap at our origination TTL so a hostile peer can't mint long-lived floods.
        let ttlCap = min(ttl, MeshConstants.originTTL)

        if ttlCap <= 1 || senderIsSelf {
            return MeshRelayDecision(shouldRelay: false, newTTL: ttlCap, delayMs: 0)
        }

        // Degree-based TTL clamp:
        //   dense (>= 6 links)  -> min(ttl, 5): contain floods
        //   thin chains (<= 2)  -> full ttl: every hop counts
        //   otherwise           -> min(ttl, 6)
        let ttlLimit: UInt8 = {
            if degree >= MeshConstants.highDegreeThreshold {
                return max(2, min(ttlCap, 5))
            }
            if degree <= 2 {
                return ttlCap
            }
            return max(2, min(ttlCap, 6))
        }()
        let newTTL = ttlLimit &- 1

        // Jittered rebroadcast delay — wide enough that duplicate suppression
        // wins often; sparse graphs relay fast to avoid cancellation races.
        let delayMs: Int
        switch degree {
        case 0...2: delayMs = Int.random(in: 10...40)
        case 3...5: delayMs = Int.random(in: 60...150)
        case 6...9: delayMs = Int.random(in: 80...180)
        default:    delayMs = Int.random(in: 100...220)
        }
        return MeshRelayDecision(shouldRelay: true, newTTL: newTTL, delayMs: delayMs)
    }
}
