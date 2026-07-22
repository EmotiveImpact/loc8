import Foundation

private enum HarnessFailure: Error {
    case assertion(String)
}

private func require(_ condition: @autoclosure () -> Bool, _ message: String) throws {
    if !condition() { throw HarnessFailure.assertion(message) }
}

@main
struct MeshDiagnosticsHarness {
    static func main() throws {
        let diagnostics = MeshDiagnostics.shared
        let payload = Data([UInt8](repeating: 0, count: MeshConstants.payloadSize))
        var fieldPayload = payload
        fieldPayload[1] = 0x4c
        fieldPayload[2] = 0x38
        fieldPayload[4] = 0xa1
        fieldPayload[19] = 100
        let senderID = Data([0x4c, 0x4f, 0x43, 0x38, 0, 0, 0, 1])
        let frame = MeshFrame(ttl: 7, timestampMs: 1_800_000_000_000, senderID: senderID, payload: payload)
        let rawLinkID = "AA:BB:CC:DD:EE:FF"

        try diagnostics.start(
            runID: "mesh01-harness-001",
            cohortID: "ios-ios-ios",
            blockID: "relay-a-c-1",
            deviceRole: "B",
            originRole: "A"
        )
        do {
            try diagnostics.assertCanOriginate(sequence: 0, payload: fieldPayload)
            throw HarnessFailure.assertion("non-origin relay device was allowed to originate")
        } catch MeshDiagnosticValidationError.notOrigin {
            // Expected fail-closed behavior.
        }
        diagnostics.recordFrame(action: "ingress", frame: frame, rawLinkID: rawLinkID)
        diagnostics.recordFrame(
            action: "relay-scheduled",
            frame: frame,
            ttlBefore: 7,
            ttlAfter: 6,
            rawLinkID: rawLinkID,
            onlyWhenRelayRole: true
        )
        var forwarded = frame
        forwarded.ttl = 6
        diagnostics.recordFrame(
            action: "relay-forwarded",
            frame: forwarded,
            ttlBefore: 7,
            ttlAfter: 6,
            rawLinkID: rawLinkID,
            onlyWhenRelayRole: true
        )
        try diagnostics.stop()

        let first = diagnostics.snapshot()
        let firstEvents = try requireEvents(first)
        try require(firstEvents.count == 5, "unexpected first-run event count")
        try require(first["overflowCount"] as? Int == 0, "first run overflowed")
        for (index, event) in firstEvents.enumerated() {
            try require(event["eventIndex"] as? Int == index, "event indexes are not contiguous")
            try require(event["runId"] as? String == "mesh01-harness-001", "run ID drifted")
        }
        let frameEvents = firstEvents.filter { $0["frameId"] is String }
        let frameIDs = Set(frameEvents.compactMap { $0["frameId"] as? String })
        try require(frameIDs.count == 1, "the same frame did not retain one frame ID across TTL change")
        try require(frameIDs.first?.count == 64, "frame ID is not full SHA-256")
        try require(
            frameIDs.first == "057993d7b79a05396ace22f88f40a0e77b6c9c89a5e88c9c4ec7a4c3b373bfe5",
            "frame ID differs from the independent canonical-byte test vector"
        )
        let linkHandles = Set(frameEvents.compactMap { $0["linkHandle"] as? String })
        try require(linkHandles.count == 1, "one raw link produced unstable handles inside a run")
        try require(linkHandles.first?.count == 16, "link handle is not 16 lowercase hex")
        let serialized = try JSONSerialization.data(withJSONObject: first, options: [.sortedKeys])
        let serializedText = String(decoding: serialized, as: UTF8.self)
        try require(!serializedText.contains(rawLinkID), "raw radio identifier escaped into the export")
        try diagnostics.release()

        try diagnostics.start(
            runID: "mesh01-harness-002",
            cohortID: "ios-ios-ios",
            blockID: "near-a-b",
            deviceRole: "A",
            originRole: "A"
        )
        try diagnostics.assertCanOriginate(sequence: 0, payload: fieldPayload)
        do {
            try diagnostics.assertCanOriginate(sequence: 0, payload: fieldPayload)
            throw HarnessFailure.assertion("duplicate field sequence was allowed")
        } catch MeshDiagnosticValidationError.invalidOriginSequence {
            // Expected fail-closed behavior.
        }
        var locationBearingPayload = fieldPayload
        locationBearingPayload[9] = 1
        do {
            try diagnostics.assertCanOriginate(sequence: 1, payload: locationBearingPayload)
            throw HarnessFailure.assertion("a non-zero-coordinate field packet was allowed")
        } catch MeshDiagnosticValidationError.invalidFieldPacket {
            // Expected fail-closed behavior; rejected sequence remains available.
        }
        fieldPayload[24] = 1
        try diagnostics.assertCanOriginate(sequence: 1, payload: fieldPayload)
        diagnostics.recordLifecycle(action: "link-up", rawLinkID: rawLinkID)
        diagnostics.recordFrame(action: "origin", frame: frame, sequence: 0)
        try diagnostics.stop()
        let secondEvents = try requireEvents(diagnostics.snapshot())
        let secondHandle = secondEvents.compactMap { $0["linkHandle"] as? String }.first
        try require(secondHandle != linkHandles.first, "link handles were not run-scoped")
        try diagnostics.release()

        try diagnostics.start(
            runID: "mesh01-harness-overflow",
            cohortID: "ios-ios-ios",
            blockID: "near-a-b",
            deviceRole: "A",
            originRole: "A"
        )
        for _ in 0..<20_005 {
            diagnostics.recordLifecycle(action: "link-up", rawLinkID: rawLinkID)
        }
        try diagnostics.stop()
        let overflow = diagnostics.snapshot()
        let overflowEvents = try requireEvents(overflow)
        try require(overflowEvents.count == MeshDiagnostics.maxEvents, "diagnostic bound was not enforced")
        try require((overflow["overflowCount"] as? Int ?? 0) > 0, "overflow was not surfaced")

        print("MESH-01 iOS diagnostics harness PASS: privacy, synthetic-only origin, sequence, canonical ID, TTL identity, lifecycle, bound")
    }

    private static func requireEvents(_ snapshot: [String: Any]) throws -> [[String: Any]] {
        guard let events = snapshot["events"] as? [[String: Any]] else {
            throw HarnessFailure.assertion("snapshot events did not bridge as JSON objects")
        }
        return events
    }
}
