import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runBenchmark } from "./benchmark.mjs";
import { canonicalEvents, canonicalManifest, clone } from "./fixtures.mjs";
import {
  ACTIONS,
  EVENT_SCHEMA,
  MANIFEST_SCHEMA,
  decodeJsonLines,
  encodeJsonLines,
  evaluateMeshRun,
  validateBundle,
  validateManifest,
} from "./mesh-field-kit.mjs";
import { deriveClockSync } from "./derive-clock-sync.mjs";
import { createPhysicalManifest } from "./create-physical-manifest.mjs";

const prototypeDirectory = dirname(fileURLToPath(import.meta.url));

function canonicalBundle() {
  return { manifest: canonicalManifest(), events: canonicalEvents() };
}

function findEvent(events, predicate) {
  const index = events.findIndex(predicate);
  assert.notEqual(index, -1, "fixture event must exist");
  return { event: events[index], index };
}

function sortAndReindex(events) {
  const roleOrder = new Map([["A", 0], ["B", 1], ["C", 2]]);
  events.sort((left, right) => {
    const roleDifference = roleOrder.get(left.deviceRole) - roleOrder.get(right.deviceRole);
    if (roleDifference !== 0) return roleDifference;
    const leftNs = BigInt(left.monotonicNs);
    const rightNs = BigInt(right.monotonicNs);
    if (leftNs !== rightNs) return leftNs < rightNs ? -1 : 1;
    return left.action.localeCompare(right.action);
  });
  const nextByExport = new Map();
  for (const event of events) {
    const key = `${event.deviceRole}:${event.blockId}`;
    const next = nextByExport.get(key) ?? 0;
    event.eventIndex = next;
    nextByExport.set(key, next + 1);
  }
}

function physicalise(manifest) {
  const output = clone(manifest);
  output.evidenceClass = "physical";
  output.devices = output.devices.map((device, index) => ({
    ...device,
    model: index === 0 ? "iPhone 17 Pro" : index === 1 ? "iPhone 16" : "iPhone 15",
    osName: "iOS",
    osVersion: "26.4",
    nativeBuildId: "loc8-field-29938c4-001",
  }));
  output.geometry.barrier = "two shielded rooms with measured corridor relay position";
  output.geometry.isolationMethod = "B disabled and bracketed A C zero delivery controls";
  output.privacy.rawBundleUri = "research://mesh-01/physical-run-001";
  return output;
}

test("canonical MESH-01 manifest and 2,444-event bundle validate", () => {
  const { manifest, events } = canonicalBundle();
  assert.deepEqual(validateManifest(manifest), []);
  assert.deepEqual(validateBundle(manifest, events), []);
  assert.equal(events.length, 2444);
  assert.equal(new Set(events.map((event) => event.frameId).filter(Boolean)).size, 660);
});

test("JSONL codec is deterministic and round-trips exactly", () => {
  const events = canonicalEvents();
  const first = encodeJsonLines(events);
  const second = encodeJsonLines(events);
  assert.equal(first, second);
  assert.deepEqual(decodeJsonLines(first), events);
  assert.throws(() => decodeJsonLines("{}\nnot-json\n"), /line 2/u);
  assert.throws(() => decodeJsonLines(null), /string/u);
});

test("synthetic pass fixture is held from physical decision while exposing GO counterfactual", () => {
  const result = evaluateMeshRun(canonicalManifest(), canonicalEvents());
  assert.equal(result.decision, "HOLD-PHYSICAL");
  assert.equal(result.counterfactualDecision, "GO");
  assert.equal(result.nearPass, true);
  assert.deepEqual(result.isolation, { blocks: 4, unexpectedDirectDeliveries: 0, linkUps: 0 });
  for (const direction of ["A-C", "C-A"]) {
    assert.equal(result.relayDirections[direction].attempted, 200);
    assert.equal(result.relayDirections[direction].deliveredWithinDeadline, 200);
    assert.equal(result.relayDirections[direction].relayProved, 200);
    assert.equal(result.relayDirections[direction].applicationDuplicates, 0);
    assert.equal(result.relayDirections[direction].latencyMs.p95, 90);
  }
  assert.equal(result.resultFingerprintSha256, "b445abe6269e49fa9887d7aa100d94e78c7fb6ad62ce8879867e85424d55fdfe");
});

test("physical-labelled canonical evidence reaches GO only after physical manifest requirements", () => {
  const result = evaluateMeshRun(physicalise(canonicalManifest()), canonicalEvents());
  assert.equal(result.issues.length, 0);
  assert.equal(result.evidenceClass, "physical");
  assert.equal(result.decision, "GO");
  assert.equal(result.counterfactualDecision, "GO");
});

test("180 of 200 path-proved deliveries per direction classify LIMITED", () => {
  const result = evaluateMeshRun(canonicalManifest(), canonicalEvents({ relayDeliveryCount: 180 }));
  assert.equal(result.decision, "HOLD-PHYSICAL");
  assert.equal(result.counterfactualDecision, "LIMITED");
  assert.equal(result.relayDirections["A-C"].deliveryRatio, 0.9);
  assert.equal(result.relayDirections["C-A"].deliveryRatio, 0.9);
});

test("zero bidirectional isolated deliveries classify NO-GO counterfactual", () => {
  const result = evaluateMeshRun(canonicalManifest(), canonicalEvents({ relayDeliveryCount: 0 }));
  assert.equal(result.counterfactualDecision, "NO-GO");
  assert.equal(result.relayDirections["A-C"].deliveredWithinDeadline, 0);
  assert.equal(result.relayDirections["C-A"].deliveredWithinDeadline, 0);
});

test("one-directional path-proved relay classifies LIMITED", () => {
  const manifest = canonicalManifest();
  const events = canonicalEvents().filter((event) => !(
    event.blockId.startsWith("relay-c-a-") &&
    event.deviceRole === "A" &&
    (event.action === "ingress" || event.action === "application-delivery")
  ));
  sortAndReindex(events);
  const result = evaluateMeshRun(manifest, events);
  assert.equal(result.counterfactualDecision, "LIMITED");
  assert.equal(result.relayDirections["A-C"].deliveredWithinDeadline, 200);
  assert.equal(result.relayDirections["C-A"].deliveredWithinDeadline, 0);
});

test("duplicate delivery is a NO-GO condition", () => {
  const result = evaluateMeshRun(canonicalManifest(), canonicalEvents({ duplicate: true }));
  assert.equal(result.counterfactualDecision, "NO-GO");
  assert.equal(result.relayDirections["A-C"].applicationDuplicates, 1);
});

test("delivery without B forward/TTL proof is a NO-GO condition", () => {
  const result = evaluateMeshRun(canonicalManifest(), canonicalEvents({ omitRelayProof: true }));
  assert.equal(result.counterfactualDecision, "NO-GO");
  assert.equal(result.relayDirections["A-C"].relayProved, 0);
  assert.equal(result.relayDirections["C-A"].relayProved, 0);
});

test("bracketed direct delivery leakage classifies CONFOUNDED", () => {
  const result = evaluateMeshRun(canonicalManifest(), canonicalEvents({ directLeak: true }));
  assert.equal(result.counterfactualDecision, "CONFOUNDED");
  assert.equal(result.isolation.unexpectedDirectDeliveries, 1);
});

test("clock uncertainty over 100 ms classifies INCOMPLETE", () => {
  const manifest = canonicalManifest();
  manifest.clockSync[2].uncertaintyNs = "100000001";
  const result = evaluateMeshRun(manifest, canonicalEvents());
  assert.equal(result.counterfactualDecision, "INCOMPLETE");
  assert.equal(result.latencyUsable, false);
});

test("two sub-100 ms device uncertainties cannot hide over-100 ms pair uncertainty", () => {
  const manifest = clone(canonicalManifest());
  manifest.clockSync.find((clock) => clock.role === "A").uncertaintyNs = "60000000";
  manifest.clockSync.find((clock) => clock.role === "B").uncertaintyNs = "0";
  manifest.clockSync.find((clock) => clock.role === "C").uncertaintyNs = "60000000";
  const result = evaluateMeshRun(manifest, canonicalEvents());
  assert.equal(result.latencyUsable, false);
  assert.equal(result.maxPairClockUncertaintyNs, "120000000");
  assert.equal(result.counterfactualDecision, "INCOMPLETE");
});

test("missing an expected origin classifies INCOMPLETE rather than improving loss", () => {
  const { manifest, events } = canonicalBundle();
  const { index } = findEvent(events, (event) =>
    event.blockId === "relay-a-c-1" && event.action === "origin" && event.sequence === 99,
  );
  events.splice(index, 1);
  sortAndReindex(events);
  const result = evaluateMeshRun(manifest, events);
  assert.equal(result.counterfactualDecision, "INCOMPLETE");
  assert.ok(result.issues.some((issue) => issue.code === "ORPHAN_FRAME_EVENT"));
});

test("path proof requires temporal ingress-forward-ingress-delivery order", () => {
  const events = canonicalEvents();
  const { event: destinationIngress } = findEvent(events, (event) =>
    event.blockId === "relay-a-c-1" && event.action === "ingress" && event.deviceRole === "C" && event.frameId,
  );
  const origin = events.find((event) => event.blockId === destinationIngress.blockId && event.action === "origin" && event.frameId === destinationIngress.frameId);
  destinationIngress.monotonicNs = String(BigInt(origin.monotonicNs) + 30_000_000n);
  const result = evaluateMeshRun(canonicalManifest(), events);
  assert.equal(result.counterfactualDecision, "NO-GO");
  assert.equal(result.relayDirections["A-C"].relayProved, 199);
});

test("nearest-rank latency quantiles and exact deadline are stable", () => {
  const events = canonicalEvents();
  const relayOrigins = events.filter((event) => event.action === "origin" && event.blockId.startsWith("relay-a-c"));
  const lateFrameIds = new Set(relayOrigins.slice(0, 10).map((event) => event.frameId));
  for (const event of events) {
    if (lateFrameIds.has(event.frameId) && event.deviceRole === "C") {
      event.monotonicNs = String(BigInt(event.monotonicNs) + 9_911_000_000n);
    }
  }
  sortAndReindex(events);
  const result = evaluateMeshRun(canonicalManifest(), events);
  assert.equal(result.relayDirections["A-C"].deliveredWithinDeadline, 190);
  assert.equal(result.relayDirections["A-C"].deliveryRatio, 0.95);
  assert.equal(result.counterfactualDecision, "GO");
});

test("benchmark evaluates more than 50,000 events deterministically under five seconds", () => {
  const result = runBenchmark({ iterations: 25 });
  assert.equal(result.eventsPerIteration, 2444);
  assert.equal(result.totalEventEvaluations, 61_100);
  assert.equal(result.uniqueResultFingerprints, 1);
  assert.equal(result.decision, "HOLD-PHYSICAL");
  assert.equal(result.counterfactualDecision, "GO");
  assert.equal(result.underFiveSeconds, true);
});

const malformedCases = [
  ["manifest unknown field", "UNKNOWN_FIELD", ({ manifest }) => { manifest.secret = "x"; }],
  ["wrong manifest schema", "MANIFEST_SCHEMA", ({ manifest }) => { manifest.schema = "v0"; }],
  ["wrong protocol", "PROTOCOL", ({ manifest }) => { manifest.protocol = "mesh-01.e01.v0"; }],
  ["short run ID", "STRING_LENGTH", ({ manifest }) => { manifest.runId = "short"; }],
  ["invalid run ID characters", "STRING_PATTERN", ({ manifest }) => { manifest.runId = "mesh_01_invalid"; }],
  ["unknown evidence class", "ENUM", ({ manifest }) => { manifest.evidenceClass = "claimed"; }],
  ["invalid created-at", "STRING_PATTERN", ({ manifest }) => { manifest.createdAt = "2026-07-22 12:00:00Z"; }],
  ["short Git commit", "STRING_LENGTH", ({ manifest }) => { manifest.build.gitCommit = "29938c4"; }],
  ["wrong diagnostic schema", "DIAGNOSTIC_SCHEMA", ({ manifest }) => { manifest.build.diagnosticSchema = "v0"; }],
  ["invalid service UUID", "STRING_LENGTH", ({ manifest }) => { manifest.build.serviceUuid = "uuid"; }],
  ["non-identical device build", "BOOLEAN_POLICY", ({ manifest }) => { manifest.build.identicalOnAllDevices = false; }],
  ["missing physical device", "DEVICE_COUNT", ({ manifest }) => { manifest.devices.pop(); }],
  ["duplicate device role", "DUPLICATE_ROLE", ({ manifest }) => { manifest.devices[2].role = "A"; }],
  ["duplicate synthetic sender ID", "DUPLICATE_SENDER_ID", ({ manifest }) => { manifest.devices[2].syntheticSenderId = manifest.devices[0].syntheticSenderId; }],
  ["physical manifest with synthetic OS", "SYNTHETIC_DEVICE", ({ manifest }) => { manifest.evidenceClass = "physical"; }],
  ["missing Bluetooth permission", "BOOLEAN_POLICY", ({ manifest }) => { manifest.devices[0].permissions.bluetooth = false; }],
  ["duplicate cohort", "DUPLICATE_COHORT", ({ manifest }) => { manifest.cohorts.push(clone(manifest.cohorts[0])); }],
  ["unknown block cohort", "UNKNOWN_COHORT", ({ manifest }) => { manifest.blocks[0].cohortId = "missing"; }],
  ["duplicate block", "DUPLICATE_BLOCK", ({ manifest }) => { manifest.blocks.push(clone(manifest.blocks[0])); }],
  ["unknown block kind", "ENUM", ({ manifest }) => { manifest.blocks[0].kind = "moving"; }],
  ["direction mismatch", "DIRECTION_MISMATCH", ({ manifest }) => { manifest.blocks[0].direction = "B-A"; }],
  ["same block endpoint", "SAME_ENDPOINT", ({ manifest }) => { manifest.blocks[0].destinationRole = "A"; manifest.blocks[0].direction = "A-A"; }],
  ["relay topology without B", "RELAY_TOPOLOGY", ({ manifest }) => { manifest.blocks.find((block) => block.kind === "relay").relayRole = "A"; }],
  ["wrong relay attempt count", "RELAY_ATTEMPTS", ({ manifest }) => { manifest.blocks.find((block) => block.kind === "relay").expectedAttempts = 99; }],
  ["wrong near attempt count", "NEAR_ATTEMPTS", ({ manifest }) => { manifest.blocks[0].expectedAttempts = 9; }],
  ["wrong isolation attempt count", "ISOLATION_ATTEMPTS", ({ manifest }) => { manifest.blocks.find((block) => block.kind === "isolation-pre").expectedAttempts = 49; }],
  ["wrong interval", "INTERVAL_POLICY", ({ manifest }) => { manifest.blocks[0].intervalMs = 999; }],
  ["wrong deadline", "DEADLINE_POLICY", ({ manifest }) => { manifest.blocks[0].deliveryDeadlineMs = 9_999; }],
  ["missing required matrix block", "BLOCK_MATRIX", ({ manifest }) => { manifest.blocks.pop(); }],
  ["clock record count", "CLOCK_COUNT", ({ manifest }) => { manifest.clockSync.pop(); }],
  ["duplicate clock role", "DUPLICATE_CLOCK", ({ manifest }) => { manifest.clockSync[2].role = "A"; }],
  ["invalid signed offset", "DECIMAL_INT", ({ manifest }) => { manifest.clockSync[0].offsetNs = "+1"; }],
  ["invalid uncertainty", "DECIMAL_UINT", ({ manifest }) => { manifest.clockSync[0].uncertaintyNs = "01"; }],
  ["geometry not fixed", "BOOLEAN_POLICY", ({ manifest }) => { manifest.geometry.fixedAcrossBlocks = false; }],
  ["missing site authority", "BOOLEAN_POLICY", ({ manifest }) => { manifest.privacy.siteAuthorised = false; }],
  ["GPS capture prohibited", "BOOLEAN_POLICY", ({ manifest }) => { manifest.privacy.gpsCaptured = true; }],
  ["raw radio ID capture prohibited", "BOOLEAN_POLICY", ({ manifest }) => { manifest.privacy.rawRadioIdentifiersCaptured = true; }],
  ["invalid raw URI", "STRING_PATTERN", ({ manifest }) => { manifest.privacy.rawBundleUri = "/tmp/raw"; }],
  ["retention too long", "INTEGER_RANGE", ({ manifest }) => { manifest.privacy.retentionDays = 367; }],
  ["wrong diagnostic bound", "DIAGNOSTIC_BOUND", ({ manifest }) => { manifest.diagnostics.maxEventsPerDevice = 19_999; }],
  ["diagnostic overflow", "DIAGNOSTIC_OVERFLOW", ({ manifest }) => { manifest.diagnostics.overflowCounts.B = 1; }],
  ["non-run-scoped links", "BOOLEAN_POLICY", ({ manifest }) => { manifest.diagnostics.linkHandlesRunScoped = false; }],
  ["raw identifiers exported", "BOOLEAN_POLICY", ({ manifest }) => { manifest.diagnostics.rawIdentifiersExported = true; }],
  ["event unknown field", "UNKNOWN_FIELD", ({ events }) => { events[0].payloadHex = "00"; }],
  ["wrong event schema", "EVENT_SCHEMA", ({ events }) => { events[0].schema = "v0"; }],
  ["event run mismatch", "RUN_MISMATCH", ({ events }) => { events[0].runId = "different-run-id"; }],
  ["unknown event cohort", "UNKNOWN_COHORT", ({ events }) => { events[0].cohortId = "missing"; }],
  ["unknown event block", "UNKNOWN_BLOCK", ({ events }) => { events[0].blockId = "missing"; }],
  ["block cohort mismatch", "BLOCK_COHORT", ({ events }) => { events[0].cohortId = "other"; }],
  ["invalid event role", "ENUM", ({ events }) => { events[0].deviceRole = "D"; }],
  ["event index duplicate", "EVENT_INDEX_ORDER", ({ events }) => { events[1].eventIndex = events[0].eventIndex; }],
  ["event index gap", "EVENT_INDEX_GAP", ({ events }) => { events[0].eventIndex = 10; }],
  ["monotonic time decrease", "MONOTONIC_ORDER", ({ events }) => { events[1].monotonicNs = "0"; }],
  ["unsafe wall time", "TYPE_SAFE_INTEGER", ({ events }) => { events[0].wallTimeMs = Number.MAX_SAFE_INTEGER + 1; }],
  ["unknown action", "ENUM", ({ events }) => { events[0].action = "pretend-forward"; }],
  ["bad frame ID", "STRING_LENGTH", ({ events }) => { findEvent(events, (event) => event.action === "origin").event.frameId = "abc"; }],
  ["origin sequence out of range", "INTEGER_RANGE", ({ events }) => { findEvent(events, (event) => event.action === "origin").event.sequence = 100; }],
  ["wrong origin role", "ORIGIN_ROLE", ({ events }) => { findEvent(events, (event) => event.action === "origin" && event.deviceRole === "A").event.originRole = "C"; }],
  ["wrong origin TTL", "ORIGIN_TTL", ({ events }) => { findEvent(events, (event) => event.action === "origin").event.ttlAfter = 6; }],
  ["origin with ingress link", "ORIGIN_LINK", ({ events }) => { findEvent(events, (event) => event.action === "origin").event.linkHandle = "aaaaaaaaaaaaaaaa"; }],
  ["sequence outside origin", "SEQUENCE_SCOPE", ({ events }) => { findEvent(events, (event) => event.action === "ingress").event.sequence = 1; }],
  ["forward on wrong role", "FORWARD_ROLE", ({ events }) => { findEvent(events, (event) => event.action === "relay-forwarded").event.deviceRole = "A"; }],
  ["forward without TTL decrement", "FORWARD_TTL", ({ events }) => { findEvent(events, (event) => event.action === "relay-forwarded").event.ttlAfter = 7; }],
  ["ingress missing link", "MISSING_LINK", ({ events }) => { findEvent(events, (event) => event.action === "ingress").event.linkHandle = null; }],
  ["invalid link handle", "STRING_LENGTH", ({ events }) => { findEvent(events, (event) => event.action === "ingress").event.linkHandle = "a"; }],
  ["unexpected reason", "UNEXPECTED_REASON", ({ events }) => { findEvent(events, (event) => event.action === "origin").event.reason = "duplicate"; }],
  ["wrong payload byte count", "PAYLOAD_BYTES", ({ events }) => { findEvent(events, (event) => event.action === "origin").event.payloadBytes = 24; }],
  ["wrong wire byte count", "WIRE_BYTES", ({ events }) => { findEvent(events, (event) => event.action === "origin").event.wireBytes = 256; }],
  ["block source mismatch", "BLOCK_SOURCE", ({ events }) => { findEvent(events, (event) => event.action === "origin").event.deviceRole = "C"; }],
  ["block destination mismatch", "BLOCK_DESTINATION", ({ events }) => { findEvent(events, (event) => event.action === "application-delivery" && event.blockId === "near-a-b").event.deviceRole = "C"; }],
  ["block origin role mismatch", "BLOCK_ORIGIN_ROLE", ({ events }) => { findEvent(events, (event) => event.action === "ingress" && event.blockId === "near-a-b").event.originRole = "C"; }],
  ["non-participating block device", "UNEXPECTED_BLOCK_ROLE", ({ events }) => { const source = findEvent(events, (event) => event.blockId === "near-a-b" && event.deviceRole === "A" && event.action === "diagnostics-started").event; events.push({ ...clone(source), deviceRole: "C" }); }],
  ["orphan frame event", "ORPHAN_FRAME_EVENT", ({ events }) => { findEvent(events, (event) => event.action === "ingress").event.frameId = "f".repeat(64); }],
  ["frame crosses blocks", "CROSS_BLOCK_FRAME", ({ events }) => { const origins = events.filter((event) => event.action === "origin"); const ingress = findEvent(events, (event) => event.action === "ingress" && event.blockId !== origins[0].blockId).event; ingress.frameId = origins[0].frameId; }],
  ["duplicate frame origin", "DUPLICATE_FRAME_ORIGIN", ({ events }) => { const origins = events.filter((event) => event.action === "origin"); origins[1].frameId = origins[0].frameId; }],
  ["missing diagnostic start", "DIAGNOSTIC_BOUNDARY", ({ events }) => { const { index } = findEvent(events, (event) => event.action === "diagnostics-started"); events.splice(index, 1); }],
  ["stop before start", "DIAGNOSTIC_BOUNDARY_ORDER", ({ events }) => { const start = findEvent(events, (event) => event.action === "diagnostics-started").event; const stop = findEvent(events, (event) => event.action === "diagnostics-stopped" && event.blockId === start.blockId && event.deviceRole === start.deviceRole).event; stop.monotonicNs = "0"; }],
  ["event after diagnostic stop", "DIAGNOSTIC_BOUNDARY_POSITION", ({ events }) => { const stop = findEvent(events, (event) => event.action === "diagnostics-stopped").event; const prior = findEvent(events, (event) => event.blockId === stop.blockId && event.deviceRole === stop.deviceRole && event.eventIndex === stop.eventIndex - 1).event; [stop.action, prior.action] = [prior.action, stop.action]; }],
];

test("strict manifest/event validator rejects every named malformed case", async (t) => {
  assert.ok(malformedCases.length >= 70);
  for (const [name, expectedCode, mutate] of malformedCases) {
    await t.test(name, () => {
      const bundle = canonicalBundle();
      mutate(bundle);
      const issues = validateBundle(bundle.manifest, bundle.events);
      assert.ok(
        issues.some((issue) => issue.code === expectedCode),
        `expected ${expectedCode}, received ${JSON.stringify(issues.slice(0, 8))}`,
      );
    });
  }
});

test("JSON Schema artifacts identify the frozen manifest and event contracts", () => {
  const manifestSchema = JSON.parse(readFileSync(resolve(prototypeDirectory, "manifest.schema.json"), "utf8"));
  const eventSchema = JSON.parse(readFileSync(resolve(prototypeDirectory, "event.schema.json"), "utf8"));
  assert.equal(manifestSchema.$id, `https://loc8.local/schemas/${MANIFEST_SCHEMA}.json`);
  assert.equal(eventSchema.$id, `https://loc8.local/schemas/${EVENT_SCHEMA}.json`);
  assert.equal(manifestSchema.additionalProperties, false);
  assert.equal(eventSchema.additionalProperties, false);
  assert.deepEqual(eventSchema.properties.action.enum, ACTIONS);
});

test("prototype source has no radio, native bridge or network dependency", () => {
  for (const filename of ["mesh-field-kit.mjs", "fixtures.mjs", "benchmark.mjs"]) {
    const source = readFileSync(resolve(prototypeDirectory, filename), "utf8");
    const imports = [...source.matchAll(/from\s+"([^"]+)"/gu)].map((match) => match[1]);
    assert.ok(imports.every((specifier) => specifier.startsWith("node:") || specifier.startsWith("./")));
    assert.doesNotMatch(source, /CoreBluetooth|BluetoothGatt|requireNativeModule|fetch\s*\(/u);
  }
});

test("bidirectional near controls derive bounded cross-device clock offsets", () => {
  const derived = deriveClockSync(canonicalEvents());
  assert.equal(derived.schema, "loc8.mesh-field-clock-sync.v1");
  assert.equal(derived.referenceRole, "B");
  assert.equal(derived.within100msGate, true);
  assert.deepEqual(derived.clockSync, [
    { role: "A", offsetNs: "0", uncertaintyNs: "25000000" },
    { role: "B", offsetNs: "0", uncertaintyNs: "0" },
    { role: "C", offsetNs: "0", uncertaintyNs: "25000000" },
  ]);
});

test("clock derivation fails the gate when directional bounds are wider than 200 ms", () => {
  const events = structuredClone(canonicalEvents());
  for (const event of events) {
    const widenedForwardBound =
      (event.blockId === "near-a-b" && event.deviceRole === "B") ||
      (event.blockId === "near-a-c" && event.deviceRole === "C");
    if (widenedForwardBound && ["ingress", "application-delivery"].includes(event.action)) {
      event.monotonicNs = String(BigInt(event.monotonicNs) + 300_000_000n);
    }
  }
  const derived = deriveClockSync(events);
  assert.equal(derived.within100msGate, false);
  assert.equal(derived.clockSync.find((clock) => clock.role === "A").uncertaintyNs, "175000000");
});

test("physical manifest generator freezes the matrix and rejects failed clock evidence", () => {
  const physical = physicalise(canonicalManifest());
  const metadata = {
    runId: physical.runId,
    createdAt: physical.createdAt,
    build: physical.build,
    devices: physical.devices,
    cohort: physical.cohorts[0],
    geometry: physical.geometry,
    privacy: physical.privacy,
    overflowCounts: physical.diagnostics.overflowCounts,
  };
  const clock = deriveClockSync(canonicalEvents());
  const generated = createPhysicalManifest(metadata, clock);
  assert.deepEqual(validateManifest(generated), []);
  assert.equal(generated.evidenceClass, "physical");
  assert.deepEqual(generated.blocks, physical.blocks);
  assert.throws(
    () => createPhysicalManifest(metadata, { ...clock, nearControlsPass: false }),
    /near controls/u,
  );
});
