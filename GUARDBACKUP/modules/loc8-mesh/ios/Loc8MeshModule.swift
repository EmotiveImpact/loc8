//
// Loc8MeshModule.swift
// Loc8Mesh
//
// Expo module definition — the thin bridge over MeshService (spike brief §2).
// Contract (mirrored by modules/loc8-mesh/index.ts):
//   - Events "onPacket"  -> { data: Uint8Array(25) — framing already stripped, relayVia?: String }
//   - Events "onMeshStatus" -> { nearbyCount: Int, connected: Bool }
//   - AsyncFunction start()/stop() — idempotent
//   - AsyncFunction broadcast(Data) — exactly 25 bytes
//

import ExpoModulesCore

internal final class InvalidPacketSizeException: GenericException<Int> {
    override var reason: String {
        "Loc8 mesh packets must be exactly \(MeshConstants.payloadSize) bytes, got \(param)"
    }
}

public class Loc8MeshModule: Module {
    public func definition() -> ModuleDefinition {
        Name("Loc8Mesh")

        Events("onPacket", "onMeshStatus")

        OnCreate {
            // MeshService invokes these on the main queue; sendEvent handles
            // scheduling onto the JS runtime from there.
            MeshService.shared.onPacket = { [weak self] payload, relayVia in
                var body: [String: Any?] = ["data": payload]
                if let relayVia {
                    body["relayVia"] = relayVia
                }
                self?.sendEvent("onPacket", body)
            }
            MeshService.shared.onStatus = { [weak self] nearbyCount, connected in
                self?.sendEvent("onMeshStatus", [
                    "nearbyCount": nearbyCount,
                    "connected": connected,
                ])
            }
        }

        OnDestroy {
            MeshService.shared.onPacket = nil
            MeshService.shared.onStatus = nil
            MeshService.shared.stop()
        }

        AsyncFunction("start") {
            MeshService.shared.start()
        }

        AsyncFunction("stop") {
            MeshService.shared.stop()
        }

        AsyncFunction("broadcast") { (packet: Data) in
            guard packet.count == MeshConstants.payloadSize else {
                throw InvalidPacketSizeException(packet.count)
            }
            MeshService.shared.broadcast(payload: packet)
        }
    }
}
