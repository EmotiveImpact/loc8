package expo.modules.loc8mesh

/** Host checks compile the exact pure state embedded in MeshBleService.kt. */
private var assertions = 0
private fun expect(condition: Boolean, message: String) {
    assertions += 1
    check(condition) { message }
}

private fun frame(ttl: Int = 7, timestamp: Long = 1_700_000_000_000L, seed: Int = 0): MeshFrame =
    MeshFrame(ttl, timestamp, ByteArray(8) { (it + seed).toByte() }, ByteArray(25) { (it * 3 + seed).toByte() })

private fun modeSelection() {
    expect(MeshRelayMode.fromWireValue("current") == MeshRelayMode.CURRENT, "baseline wire value")
    expect(MeshRelayMode.fromWireValue("branch") == MeshRelayMode.BRANCH, "experimental wire value")
    for (current in MeshRelayMode.entries) for (running in listOf(false, true)) {
        for (invalid in listOf("", "Branch", "trickle", " branch ")) {
            expect(MeshRelayMode.configurationFailure(invalid, running, current) != null,
                "strict selection: $invalid / running=$running / current=$current")
        }
        for (selected in MeshRelayMode.entries) {
            val failure = MeshRelayMode.configurationFailure(selected.wireValue, running, current)
            val expected = if (running && selected != current) "Stop the mesh before changing relay mode" else null
            expect(failure == expected, "selection: $current -> $selected / running=$running")
        }
    }
}

private fun witnessOnlyIngressAndWireIdentity() {
    val state = MeshBranchRelayState(nowMs = { 0L })
    val original = frame()
    val pending = state.schedule("short-key", original, "A", 6)!!
    expect(state.observeDuplicate("short-key", frame(ttl = 5), "B"), "valid duplicate can have a different TTL")
    expect(state.observeDuplicate("short-key", frame(ttl = 1), "B"), "same MAC witness is idempotent")
    expect(state.pendingCount == 1, "duplicate must not whole-cancel the relay")
    val forward = state.take("short-key", pending.token)!!
    expect(forward.excludedLinks == setOf("A", "B"), "exclude only witnessed ingress branches")
    expect(MeshBranchRelayState.hasUnwitnessedEgress(listOf("A", "B", "C"), listOf("A", "D"), forward.excludedLinks), "C/D branches remain reachable")
    expect(!MeshBranchRelayState.hasUnwitnessedEgress(listOf("A", "B"), listOf("A"), forward.excludedLinks), "dual-role witness must suppress both roles")
    expect(!MeshBranchRelayState.hasUnwitnessedEgress(emptyList(), emptyList(), forward.excludedLinks), "no live peers means no forwarded event")
    expect(MeshBranchRelayState.hasUnwitnessedEgress(emptyList(), listOf("E"), forward.excludedLinks), "new subscriber is evaluated at timer fire")
    val before = MeshFrameCodec.encode(original)
    val after = MeshFrameCodec.encode(forward.frame)
    expect(before.size == 47 && after.size == 47, "native frame remains 47 bytes")
    expect(forward.frame.payload.size == 25, "application payload remains 25 bytes")
    expect(before.indices.filter { before[it] != after[it] } == listOf(2), "TTL is the only on-air change")
    expect((after[2].toInt() and 255) == 6 && forward.ttlBefore == 7, "TTL decremented once")
    expect(state.take("short-key", pending.token) == null, "callback cannot forward twice")
    expect(!state.observeDuplicate("short-key", original, "Z"), "no witness state persists after the one-shot callback")
}

private fun collisionAndDefensiveCopies() {
    val state = MeshBranchRelayState(nowMs = { 0L })
    val original = frame()
    val wireBefore = MeshFrameCodec.encode(original)
    val pending = state.schedule("forced-collision", original, "A", 6)!!
    val differentSender = frame().also { it.senderID[7] = 99 }
    val differentPayload = frame().also { it.payload[24] = 99 }
    expect(!state.observeDuplicate("forced-collision", differentSender, "B"), "short key cannot witness a different sender")
    expect(!state.observeDuplicate("forced-collision", frame(timestamp = original.timestampMs + 1), "C"), "short key cannot witness a different timestamp")
    expect(!state.observeDuplicate("forced-collision", differentPayload, "D"), "compare all payload bytes, not a truncated digest")
    original.senderID.fill(77)
    original.payload.fill(88)
    original.ttl = 1
    expect(state.observeDuplicate("forced-collision", frame(ttl = 3), "E"), "admission identity is independent of caller mutation")
    val forward = state.take("forced-collision", pending.token)!!
    expect(forward.excludedLinks == setOf("A", "E"), "collision does not exclude unrelated links")
    val expected = wireBefore.copyOf().also { it[2] = 6 }
    expect(MeshFrameCodec.encode(forward.frame).contentEquals(expected), "queued bytes are immutable copies")
    val wrongType = wireBefore.copyOf().also { it[1] = 0x31 }
    expect(MeshFrameCodec.decode(wrongType) == null, "fixed v1 type is validated before witness matching")
}

private fun pendingIdentityOutlivesDedupEviction() {
    val state = MeshBranchRelayState(nowMs = { 0L })
    val dedup = MeshDeduplicator(maxCount = 4)
    val pending = state.schedule("evicted-short-key", frame(), "A", 6)!!
    expect(!dedup.isDuplicate("evicted-short-key"), "initial dedup admission")
    for (i in 0..10) dedup.isDuplicate("burst-$i")
    expect(!dedup.isDuplicate("evicted-short-key"), "small external LRU really evicted the pending key")
    expect(state.hasPending("evicted-short-key"), "pending identity survives independent LRU eviction")
    val conflict = frame().also { it.payload[24] = 99 }
    expect(!state.observeDuplicate("evicted-short-key", conflict, "B"), "conflicting bytes cannot become a witness after LRU eviction")
    expect(state.hasPending("evicted-short-key"), "pending key still vetoes conflicting application admission")
    expect(state.take("evicted-short-key", pending.token)!!.excludedLinks == setOf("A"), "conflict neither cancels relay nor excludes B")
}

private fun capacityAndFailOpen() {
    val state = MeshBranchRelayState(nowMs = { 0L })
    val admitted = (0 until 128).map { state.schedule("p$it", frame(seed = it), "A", 6)!! }
    expect(state.pendingCount == 128, "pending state capped at 128")
    expect(state.schedule("overflow", frame(), "Z", 6) == null, "129th relay work rejected")
    expect(state.pendingCount == 128 && state.capacityDrops == 1, "overflow does not evict another pending relay")
    expect(state.take("p0", admitted[0].token) != null, "capacity pressure preserves admitted relay")
    expect(state.schedule("overflow", frame(), "Z", 6) != null, "capacity becomes available after fire")
    state.clear()
    expect(state.pendingCount == 0 && state.capacityDrops == 0, "stop/radio-off reset state and counters")

    val witnessState = MeshBranchRelayState(nowMs = { 0L })
    val witnessPending = witnessState.schedule("dense", frame(), "L0", 6)!!
    for (i in 1..100) expect(witnessState.observeDuplicate("dense", frame(ttl = 4), "L$i"), "valid dense witness $i")
    val forward = witnessState.take("dense", witnessPending.token)!!
    expect(forward.excludedLinks.size == 64 && "L0" in forward.excludedLinks && "L63" in forward.excludedLinks, "witness storage capped at 64 incl first ingress")
    expect("L64" !in forward.excludedLinks && "L100" !in forward.excludedLinks, "witness overflow fails open to additional branches")
    expect(MeshBranchRelayState.hasUnwitnessedEgress(listOf("L64"), emptyList(), forward.excludedLinks), "overflow must not whole-cancel relay")
}

private fun timerTokensExpiryAndReconnect() {
    var clockMs = 100L
    val state = MeshBranchRelayState(nowMs = { clockMs })
    val previous = state.schedule("same", frame(), "A", 6)!!
    state.clear()
    val current = state.schedule("same", frame(), "B", 6)!!
    expect(state.take("same", previous.token) == null && state.pendingCount == 1, "stale callback cannot consume a newer entry")
    expect(state.observeDuplicate("same", frame(), "C"), "duplicate recorded before reconnect")
    state.forgetLink("B")
    state.forgetLink("C")
    state.forgetLink("unrelated")
    expect(state.pendingCount == 1, "link churn retains pending timer")
    clockMs += 4_549L
    val forward = state.take("same", current.token)!!
    expect(!forward.expired && forward.excludedLinks.isEmpty(), "forgotten peer incarnations fail open without resetting deadline")
    expect(forward.frame.ttl == 6 && forward.ttlBefore == 7 && forward.firstIngress == "B", "churn preserves packet, TTL and diagnostic admission metadata")

    val expired = state.schedule("expiry", frame(), "A", 6)!!
    clockMs += 4_500L
    expect(state.observeDuplicate("expiry", frame(ttl = 2), "B"), "late duplicate cannot extend lifetime")
    clockMs += 50L
    val discarded = state.take("expiry", expired.token)!!
    expect(discarded.expired && state.pendingCount == 0, "late OS callback at 4550ms discards relay and consumes state")
    expect(state.take("expiry", expired.token) == null, "expired callback cannot repeat")
    val overdue = state.schedule("overdue", frame(), "A", 6)!!
    clockMs += 60_000L
    expect(state.take("overdue", overdue.token)!!.expired, "long suspension cannot emit overdue relay")
}

fun main() {
    modeSelection()
    witnessOnlyIngressAndWireIdentity()
    collisionAndDefensiveCopies()
    pendingIdentityOutlivesDedupEviction()
    capacityAndFailOpen()
    timerTokensExpiryAndReconnect()
    println("Android branch relay host harness: PASS ($assertions deterministic assertions)")
    println("Coverage boundary: production pure state and mode policy; no Android Handler/Bluetooth execution or device delivery measured")
}
