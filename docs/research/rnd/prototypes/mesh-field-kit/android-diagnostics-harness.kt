package expo.modules.loc8mesh

private fun requireHarness(condition: Boolean, message: String) {
    if (!condition) error(message)
}

@Suppress("UNCHECKED_CAST")
private fun events(snapshot: Map<String, Any>): List<Map<String, Any?>> =
    snapshot["events"] as? List<Map<String, Any?>> ?: error("snapshot events are not maps")

fun main() {
    val payload = ByteArray(MeshConstants.PAYLOAD_SIZE)
    val fieldPayload = payload.copyOf().apply {
        this[1] = 0x4c
        this[2] = 0x38
        this[4] = 0xa1.toByte()
        this[19] = 100
    }
    val senderId = byteArrayOf(0x4c, 0x4f, 0x43, 0x38, 0, 0, 0, 1)
    val frame = MeshFrame(7, 1_800_000_000_000, senderId, payload)
    val rawLinkId = "AA:BB:CC:DD:EE:FF"

    MeshDiagnostics.start("mesh01-harness-001", "android-android-android", "relay-a-c-1", "B", "A")
    try {
        MeshDiagnostics.assertCanOriginate(0, fieldPayload)
        error("non-origin relay device was allowed to originate")
    } catch (_: MeshDiagnosticValidationException) {
        // Expected fail-closed behavior.
    }
    MeshDiagnostics.recordFrame("ingress", frame, rawLinkId = rawLinkId)
    MeshDiagnostics.recordFrame(
        "relay-scheduled",
        frame,
        ttlBefore = 7,
        ttlAfter = 6,
        rawLinkId = rawLinkId,
        onlyWhenRelayRole = true
    )
    val forwarded = MeshFrame(6, frame.timestampMs, frame.senderID, frame.payload)
    MeshDiagnostics.recordFrame(
        "relay-forwarded",
        forwarded,
        ttlBefore = 7,
        ttlAfter = 6,
        rawLinkId = rawLinkId,
        onlyWhenRelayRole = true
    )
    MeshDiagnostics.stop()

    val firstSnapshot = MeshDiagnostics.snapshot()
    val firstEvents = events(firstSnapshot)
    requireHarness(firstEvents.size == 5, "unexpected first-run event count")
    requireHarness(firstSnapshot["overflowCount"] == 0, "first run overflowed")
    firstEvents.forEachIndexed { index, event ->
        requireHarness(event["eventIndex"] == index, "event indexes are not contiguous")
        requireHarness(event["runId"] == "mesh01-harness-001", "run ID drifted")
    }
    val frameEvents = firstEvents.filter { it["frameId"] is String }
    val frameIds = frameEvents.mapNotNull { it["frameId"] as? String }.toSet()
    requireHarness(frameIds.size == 1, "same frame did not retain one ID across TTL change")
    requireHarness(frameIds.single().length == 64, "frame ID is not full SHA-256")
    requireHarness(
        frameIds.single() == "057993d7b79a05396ace22f88f40a0e77b6c9c89a5e88c9c4ec7a4c3b373bfe5",
        "frame ID differs from the independent canonical-byte vector"
    )
    val firstHandles = frameEvents.mapNotNull { it["linkHandle"] as? String }.toSet()
    requireHarness(firstHandles.size == 1 && firstHandles.single().length == 16, "bad link handle")
    requireHarness(!firstSnapshot.toString().contains(rawLinkId), "raw radio identifier escaped")
    MeshDiagnostics.release()

    MeshDiagnostics.start("mesh01-harness-002", "android-android-android", "near-a-b", "A", "A")
    MeshDiagnostics.assertCanOriginate(0, fieldPayload)
    try {
        MeshDiagnostics.assertCanOriginate(0, fieldPayload)
        error("duplicate field sequence was allowed")
    } catch (_: MeshDiagnosticValidationException) {
        // Expected.
    }
    val locationBearingPayload = fieldPayload.copyOf().apply { this[9] = 1 }
    try {
        MeshDiagnostics.assertCanOriginate(1, locationBearingPayload)
        error("non-zero-coordinate field packet was allowed")
    } catch (_: MeshDiagnosticValidationException) {
        // Rejected sequence must remain available.
    }
    fieldPayload[24] = 1
    MeshDiagnostics.assertCanOriginate(1, fieldPayload)
    MeshDiagnostics.recordLifecycle("link-up", rawLinkId)
    MeshDiagnostics.recordFrame("origin", frame, sequence = 0)
    MeshDiagnostics.stop()
    val secondHandle = events(MeshDiagnostics.snapshot()).mapNotNull { it["linkHandle"] as? String }.first()
    requireHarness(secondHandle != firstHandles.single(), "link handles were not run-scoped")
    MeshDiagnostics.release()

    MeshDiagnostics.start("mesh01-harness-overflow", "android-android-android", "near-a-b", "A", "A")
    repeat(20_005) { MeshDiagnostics.recordLifecycle("link-up", rawLinkId) }
    MeshDiagnostics.stop()
    val overflow = MeshDiagnostics.snapshot()
    requireHarness(events(overflow).size == MeshDiagnostics.MAX_EVENTS, "event bound was not enforced")
    requireHarness((overflow["overflowCount"] as Int) > 0, "overflow was not surfaced")
    MeshDiagnostics.release()

    println("MESH-01 Android diagnostics harness PASS: privacy, synthetic-only origin, sequence, canonical ID, TTL identity, lifecycle, bound")
}
