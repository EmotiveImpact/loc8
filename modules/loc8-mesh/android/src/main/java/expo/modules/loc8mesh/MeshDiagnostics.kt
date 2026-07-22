// MeshDiagnostics.kt
// Loc8Mesh
//
// Bounded, privacy-preserving evidence recorder for the preregistered MESH-01
// three-phone field experiment. Observation only: no routing or wire behavior.

package expo.modules.loc8mesh

import android.os.SystemClock
import java.security.MessageDigest

internal class MeshDiagnosticValidationException(message: String) : IllegalArgumentException(message)

object MeshDiagnostics {
    const val SCHEMA = "loc8.mesh-field-evidence.v1"
    const val MAX_EVENTS = 20_000

    private data class Context(
        val runId: String,
        val cohortId: String,
        val blockId: String,
        val deviceRole: String,
        val originRole: String
    )

    private var context: Context? = null
    private var active = false
    private val events = ArrayList<Map<String, Any?>>()
    private var nextEventIndex = 0
    private var nextOriginSequence = 0
    private var overflowCount = 0

    @Synchronized
    fun start(runId: String, cohortId: String, blockId: String, deviceRole: String, originRole: String) {
        if (!Regex("^[a-z0-9][a-z0-9-]{7,63}$").matches(runId)) {
            throw MeshDiagnosticValidationException("Invalid MESH-01 runId")
        }
        if (!Regex("^[a-z0-9][a-z0-9-]{0,47}$").matches(cohortId)) {
            throw MeshDiagnosticValidationException("Invalid MESH-01 cohortId")
        }
        if (!Regex("^[a-z0-9][a-z0-9-]{0,63}$").matches(blockId)) {
            throw MeshDiagnosticValidationException("Invalid MESH-01 blockId")
        }
        if (!isRole(deviceRole)) throw MeshDiagnosticValidationException("Invalid MESH-01 device role")
        if (!isRole(originRole)) throw MeshDiagnosticValidationException("Invalid MESH-01 origin role")

        if (context != null) {
            throw MeshDiagnosticValidationException("A MESH-01 snapshot is pending export/release")
        }
        context = Context(runId, cohortId, blockId, deviceRole, originRole)
        active = true
        events.clear()
        nextEventIndex = 0
        nextOriginSequence = 0
        overflowCount = 0
        append(action = "diagnostics-started")
    }

    @Synchronized
    fun stop() {
        if (!active || context == null) throw MeshDiagnosticValidationException("MESH-01 diagnostics are not active")
        append(action = "diagnostics-stopped")
        active = false
    }

    @Synchronized
    fun assertCanOriginate(sequence: Int, payload: ByteArray) {
        val ctx = context
        if (!active || ctx == null) throw MeshDiagnosticValidationException("MESH-01 diagnostics are not active")
        if (ctx.deviceRole != ctx.originRole) {
            throw MeshDiagnosticValidationException("Only the configured MESH-01 origin role may broadcast attempts")
        }
        if (sequence != nextOriginSequence) {
            throw MeshDiagnosticValidationException("MESH-01 attempts must be originated exactly once in ascending sequence")
        }
        if (!isFrozenFieldPacket(payload, ctx.originRole, sequence)) {
            throw MeshDiagnosticValidationException("MESH-01 field API accepts only the frozen zero-coordinate synthetic packet")
        }
        nextOriginSequence += 1
    }

    @Synchronized
    fun snapshot(): Map<String, Any> = mapOf(
        "events" to events.map { HashMap(it) },
        "overflowCount" to overflowCount,
        "active" to active
    )

    @Synchronized
    fun release() {
        if (active) throw MeshDiagnosticValidationException("Cannot release active MESH-01 diagnostics")
        context = null
        events.clear()
        nextEventIndex = 0
        nextOriginSequence = 0
        overflowCount = 0
    }

    @Synchronized
    fun recordLifecycle(action: String, rawLinkId: String? = null) {
        if (!active) return
        append(action = action, rawLinkId = rawLinkId)
    }

    @Synchronized
    fun recordMalformed(rawLinkId: String) {
        if (!active) return
        append(action = "malformed-drop", rawLinkId = rawLinkId, reason = "malformed")
    }

    @Synchronized
    fun recordFrame(
        action: String,
        frame: MeshFrame,
        sequence: Int? = null,
        ttlBefore: Int? = null,
        ttlAfter: Int? = null,
        rawLinkId: String? = null,
        reason: String? = null,
        onlyWhenRelayRole: Boolean = false
    ) {
        val ctx = context
        if (!active || ctx == null) return
        if (onlyWhenRelayRole && ctx.deviceRole != "B") return
        append(
            action = action,
            frame = frame,
            sequence = sequence,
            ttlBefore = ttlBefore ?: frame.ttl,
            ttlAfter = ttlAfter ?: frame.ttl,
            rawLinkId = rawLinkId,
            reason = reason
        )
    }

    private fun append(
        action: String,
        frame: MeshFrame? = null,
        sequence: Int? = null,
        ttlBefore: Int? = null,
        ttlAfter: Int? = null,
        rawLinkId: String? = null,
        reason: String? = null
    ) {
        val ctx = context ?: return
        if (events.size >= MAX_EVENTS) {
            overflowCount += 1
            return
        }
        events += linkedMapOf(
            "schema" to SCHEMA,
            "runId" to ctx.runId,
            "cohortId" to ctx.cohortId,
            "blockId" to ctx.blockId,
            "deviceRole" to ctx.deviceRole,
            "eventIndex" to nextEventIndex,
            "monotonicNs" to SystemClock.elapsedRealtimeNanos().toString(),
            "wallTimeMs" to System.currentTimeMillis(),
            "action" to action,
            "frameId" to frame?.let(::frameId),
            "sequence" to sequence,
            "originRole" to if (frame == null) null else ctx.originRole,
            "ttlBefore" to ttlBefore,
            "ttlAfter" to ttlAfter,
            "linkHandle" to rawLinkId?.let { linkHandle(ctx.runId, it) },
            "reason" to reason,
            "payloadBytes" to if (frame == null) null else MeshConstants.PAYLOAD_SIZE,
            "wireBytes" to if (frame == null) null else MeshFrameCodec.RAW_FRAME_SIZE
        )
        nextEventIndex += 1
    }

    private fun frameId(frame: MeshFrame): String {
        val identity = ArrayList<Byte>()
        identity += "LOC8-MESH-FRAME-ID-V1\u0000".toByteArray(Charsets.UTF_8).toList()
        identity += MeshConstants.PROTOCOL_VERSION
        identity += MeshConstants.MESSAGE_TYPE
        identity += MeshConstants.FLAGS
        for (shift in 56 downTo 0 step 8) {
            identity += ((frame.timestampMs ushr shift) and 0xff).toByte()
        }
        identity += frame.senderID.toList()
        identity += ((frame.payload.size ushr 8) and 0xff).toByte()
        identity += (frame.payload.size and 0xff).toByte()
        identity += frame.payload.toList()
        return sha256(identity.toByteArray())
    }

    private fun linkHandle(runId: String, rawLinkId: String): String {
        val input = runId.toByteArray(Charsets.UTF_8) + byteArrayOf(0) + rawLinkId.toByteArray(Charsets.UTF_8)
        return sha256(input).substring(0, 16)
    }

    private fun sha256(input: ByteArray): String = MessageDigest.getInstance("SHA-256")
        .digest(input)
        .joinToString("") { "%02x".format(it.toInt() and 0xff) }

    private fun isRole(value: String): Boolean = value == "A" || value == "B" || value == "C"

    private fun isFrozenFieldPacket(payload: ByteArray, role: String, sequence: Int): Boolean {
        val roleByte = when (role) {
            "A" -> 0xa1
            "B" -> 0xb1
            "C" -> 0xc1
            else -> return false
        }
        if (payload.size != MeshConstants.PAYLOAD_SIZE ||
            (payload[0].toInt() and 0xff) != 0 ||
            (payload[1].toInt() and 0xff) != 0x4c ||
            (payload[2].toInt() and 0xff) != 0x38 ||
            (payload[3].toInt() and 0xff) != 0 ||
            (payload[4].toInt() and 0xff) != roleByte ||
            (payload[19].toInt() and 0xff) != 100 ||
            (payload[24].toInt() and 0xff) != sequence
        ) return false
        for (index in 5..18) if (payload[index].toInt() != 0) return false
        return true
    }
}
