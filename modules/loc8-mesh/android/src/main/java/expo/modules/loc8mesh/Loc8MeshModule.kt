// Loc8MeshModule.kt
// Loc8Mesh
//
// Expo module definition — the thin bridge over MeshBleService (spike brief
// §2), the platform twin of modules/loc8-mesh/ios/Loc8MeshModule.swift.
// Contract (mirrored by modules/loc8-mesh/index.ts):
//   - Events "onPacket"  -> { data: Uint8Array(25) — framing already stripped, relayVia?: String }
//   - Events "onMeshStatus" -> { nearbyCount: Int, connected: Boolean }
//   - AsyncFunction start()/stop() — idempotent
//   - AsyncFunction broadcast(ByteArray) — exactly 25 bytes
//
// start() CHECKS runtime BLE permissions and rejects with the missing list;
// requesting them is the app UI's job (spike scope).

package expo.modules.loc8mesh

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

internal class InvalidPacketSizeException(size: Int) : CodedException(
    "Loc8 mesh packets must be exactly ${MeshConstants.PAYLOAD_SIZE} bytes, got $size"
)

internal class MissingBlePermissionsException(missing: List<String>) : CodedException(
    "Cannot start the Loc8 mesh — missing runtime permissions: ${missing.joinToString(", ")}. " +
        "Request them from the app UI before calling start()."
)

class Loc8MeshModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    override fun definition() = ModuleDefinition {
        Name("Loc8Mesh")

        Events("onPacket", "onMeshStatus")

        OnCreate {
            // MeshBleService invokes these on its handler thread; sendEvent is
            // safe to call from any thread and hops onto the JS runtime.
            MeshBleService.shared.onPacket = { payload, relayVia ->
                val body = mutableMapOf<String, Any?>("data" to payload)
                if (relayVia != null) {
                    body["relayVia"] = relayVia
                }
                sendEvent("onPacket", body)
            }
            MeshBleService.shared.onStatus = { nearbyCount, connected ->
                sendEvent(
                    "onMeshStatus",
                    mapOf(
                        "nearbyCount" to nearbyCount,
                        "connected" to connected
                    )
                )
            }
        }

        OnDestroy {
            MeshBleService.shared.onPacket = null
            MeshBleService.shared.onStatus = null
            MeshBleService.shared.stop()
            appContext.reactContext?.let { Loc8MeshService.stop(it) }
        }

        AsyncFunction<Unit>("start") {
            val ctx = context
            val missing = missingPermissions(ctx)
            if (missing.isNotEmpty()) {
                throw MissingBlePermissionsException(missing)
            }
            // FGS first (must start while foregrounded), then the mesh itself.
            Loc8MeshService.start(ctx)
            MeshBleService.shared.start(ctx)
        }

        AsyncFunction<Unit>("stop") {
            MeshBleService.shared.stop()
            appContext.reactContext?.let { Loc8MeshService.stop(it) }
        }

        AsyncFunction("broadcast") { packet: ByteArray ->
            if (packet.size != MeshConstants.PAYLOAD_SIZE) {
                throw InvalidPacketSizeException(packet.size)
            }
            MeshBleService.shared.broadcast(packet)
        }
    }

    /** BLE runtime permissions we require but do not request (spike scope). */
    private fun missingPermissions(context: Context): List<String> {
        val required = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            listOf(
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_ADVERTISE,
                Manifest.permission.BLUETOOTH_CONNECT
            )
        } else {
            // Pre-31: scanning requires location; BLUETOOTH/BLUETOOTH_ADMIN are
            // install-time and covered by the merged manifest.
            listOf(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        return required.filter {
            context.checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED
        }
    }
}
