import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  BUNDLE_MAX_AGE_MS,
  CELL_BODY_BYTES,
  CborTag,
  EVIDENCE_GATES,
  FUTURE_SKEW_MS,
  MAX_CELL_COUNT,
  MAX_FRAME_BYTES,
  PROTOCOL_SHAPES,
  PROVIDER_CANDIDATES,
  RETRANSMISSION_GRACE_MS,
  UINT32_MAX,
  assignPrekey,
  benchmarkDigest,
  consumePrekey,
  createPrekeyState,
  credentialMeasurements,
  decodeDeterministic,
  decodeLogicalHeader,
  deleteExpiredPrekeys,
  encodeCredentialShape,
  encodeDeterministic,
  encodeLogicalHeader,
  evaluateProvider,
  extendedClaimsFixture,
  frameCost,
  ingestRemoteBundle,
  logicalHeaderFixture,
  protocolCostMatrix,
  providerMeasurements,
  replenishPrekeys,
  restorePrekeyState,
  serializePrekeyState,
  standardClaimsFixture,
  validateCredentialShape,
  validatePrekeyState,
} from "./crypto-provider-bakeoff.mjs";
import { collectVectorProvenance } from "./vector-provenance.mjs";

const fixtureNow = 1_800_000_000_000;
const prototypeDirectory = dirname(fileURLToPath(import.meta.url));

function clone(value) {
  return structuredClone(value);
}

function mutateCredential({ claimsVariant = "standard", tagMode = "cwt-cose" } = {}, mutate) {
  const encoded = encodeCredentialShape({ claimsVariant, tagMode });
  const outer = decodeDeterministic(encoded, { allowedTags: [18, 61] });
  let message;
  if (tagMode === "untagged") message = outer;
  if (tagMode === "cose") message = outer.value;
  if (tagMode === "cwt-cose") message = outer.value.value;
  const originalPayload = message[2];
  const claims = decodeDeterministic(message[2]);
  const context = { outer, message, claims };
  mutate(context);
  if (message[2] === originalPayload) {
    context.message[2] = encodeDeterministic(context.claims);
  }
  return encodeDeterministic(context.outer);
}

function remoteBundle(overrides = {}) {
  return {
    namespace: "site-001/device-00000002/epoch-7",
    generation: 1,
    revision: 1,
    generatedAtMs: fixtureNow,
    prekeyIds: [1, 2, 3],
    ...overrides,
  };
}

test("deterministic CBOR sorts encoded map keys independently of insertion order", () => {
  const left = new Map([
    [-70_001, Buffer.from([3])],
    [2, "b"],
    [1, "a"],
  ]);
  const right = new Map([
    [1, "a"],
    [-70_001, Buffer.from([3])],
    [2, "b"],
  ]);
  assert.deepEqual(encodeDeterministic(left), encodeDeterministic(right));
  assert.equal(encodeDeterministic(new Map([[2, "b"], [1, "a"]])).toString("hex"), "a2016161026162");
});

test("deterministic CBOR round-trips the supported contract types", () => {
  const value = new CborTag(
    61,
    new CborTag(18, [new Map([[1, -8], [4, Buffer.from("issuer01")]]), true, null]),
  );
  const encoded = encodeDeterministic(value);
  const decoded = decodeDeterministic(encoded, { allowedTags: [18, 61] });
  assert.deepEqual(decoded, value);
  assert.deepEqual(encodeDeterministic(decoded), encoded);
});

test("all six credential shapes validate and reproduce byte-for-byte", () => {
  const first = credentialMeasurements();
  const second = credentialMeasurements();
  const frozen = [
    ["standard", "untagged", 171, "e1c0b19588433e73dc7f61ca3514777d3f32e382884b8a2e2b4694addbe64cd0"],
    ["standard", "cose", 172, "9063930b3c12a5feab5358ac4888808a1bfd70fd40958d03f5013cb8c5085a67"],
    ["standard", "cwt-cose", 174, "f1239e2071ac2f6ba7359f7eba29958fa876097014d4a8f3a97306e91992b7a6"],
    ["extended", "untagged", 205, "75fc7791c9d8690d9237a975ccc9b95beb07bd39dfa8fcf217fdb1fb3b43ade1"],
    ["extended", "cose", 206, "bc7dbeaaced21151a14bccec42cf98cdc07ea6f8ce6c24aa28277fc927f1538d"],
    ["extended", "cwt-cose", 208, "17b5fefb3830a48e611da9cebf1e6bb8f1e80637874aff42d326c7ae6893c532"],
  ];
  assert.equal(first.length, 6);
  assert.deepEqual(second, first);
  assert.deepEqual(
    first.map((entry) => [entry.claimsVariant, entry.tagMode, entry.bytes, entry.sha256]),
    frozen,
  );
  assert.equal(new Set(first.map((entry) => entry.sha256)).size, 6);
  for (const entry of first) {
    assert.equal(entry.hex.length, entry.bytes * 2);
    assert.equal(entry.sha256.length, 64);
    assert.equal(entry.cells, Math.ceil(entry.bytes / CELL_BODY_BYTES));
  }
});

test("credential fixture uses registered CWT value types and private-use range", () => {
  const standard = standardClaimsFixture();
  assert.equal(typeof standard.get(1), "string");
  assert.equal(typeof standard.get(2), "string");
  assert.equal(typeof standard.get(3), "string");
  assert.ok(Buffer.isBuffer(standard.get(7)));
  assert.ok(standard.get(8) instanceof Map);
  assert.ok(Buffer.isBuffer(standard.get(9)));
  const extended = extendedClaimsFixture();
  for (const key of [-70_001, -70_002, -70_003]) assert.ok(key < -65_536);
  assert.equal(extended.size, 12);
});

test("logical metadata is an exact, strict 32-byte frame header", () => {
  const fixture = logicalHeaderFixture();
  const encoded = encodeLogicalHeader(fixture);
  assert.equal(encoded.length, 32);
  assert.equal(
    encoded.toString("hex"),
    "0201010051525354555657586162636465666768717273747576777800000007",
  );
  assert.deepEqual(decodeLogicalHeader(encoded), fixture);
  assert.throws(() => decodeLogicalHeader(encoded.subarray(0, 31)));
  for (const [field, value] of [
    ["version", 1],
    ["kind", 0],
    ["suite", 0],
    ["flags", 8],
    ["policyEpoch", 0],
  ]) {
    assert.throws(() => encodeLogicalHeader({ ...fixture, [field]: value }));
  }
  assert.throws(() => encodeLogicalHeader({ ...fixture, messageId: Buffer.alloc(7) }));
});

test("strict CBOR and credential parsers reject every frozen adversarial case", async (t) => {
  const manyNulls = Buffer.alloc(129, 0xf6);
  const deep = Buffer.concat([Buffer.alloc(18, 0x81), Buffer.from([0x00])]);
  const rawCases = [
    ["empty input", Buffer.alloc(0), {}],
    ["trailing item", Buffer.from([0x00, 0x00]), {}],
    ["indefinite bytes", Buffer.from([0x5f, 0xff]), {}],
    ["indefinite text", Buffer.from([0x7f, 0xff]), {}],
    ["indefinite array", Buffer.from([0x9f, 0xff]), {}],
    ["indefinite map", Buffer.from([0xbf, 0xff]), {}],
    ["unexpected break", Buffer.from([0xff]), {}],
    ["reserved argument", Buffer.from([0x1c]), {}],
    ["non-minimal uint8", Buffer.from([0x18, 0x17]), {}],
    ["non-minimal uint16", Buffer.from([0x19, 0x00, 0xff]), {}],
    ["non-minimal uint32", Buffer.from([0x1a, 0x00, 0x00, 0xff, 0xff]), {}],
    ["non-minimal uint64", Buffer.from([0x1b, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff]), {}],
    ["non-minimal negative", Buffer.from([0x38, 0x17]), {}],
    ["unsupported half float", Buffer.from([0xf9, 0x00, 0x00]), {}],
    ["unsupported float", Buffer.from([0xfa, 0, 0, 0, 0]), {}],
    ["undefined simple", Buffer.from([0xf7]), {}],
    ["invalid UTF-8", Buffer.from([0x61, 0xff]), {}],
    ["truncated bytes", Buffer.from([0x42, 0x01]), {}],
    ["truncated text", Buffer.from([0x62, 0x61]), {}],
    ["truncated array", Buffer.from([0x82, 0x01]), {}],
    ["truncated map", Buffer.from([0xa1, 0x01]), {}],
    ["truncated tag", Buffer.from([0xd2]), { allowedTags: [18] }],
    ["non-deterministic key order", Buffer.from([0xa2, 0x01, 0x00, 0x00, 0x00]), {}],
    ["duplicate map key", Buffer.from([0xa2, 0x01, 0x00, 0x01, 0x01]), {}],
    ["unknown tag", Buffer.from([0xc0, 0x00]), {}],
    ["unknown nested tag", Buffer.from([0xd2, 0xc0, 0x00]), { allowedTags: [18] }],
    ["unsafe uint64", Buffer.from([0x1b, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]), {}],
    ["excessive nesting", deep, { maxDepth: 16 }],
    ["excessive item count", Buffer.concat([Buffer.from([0x98, 0x81]), manyNulls]), { maxItems: 128 }],
    ["excessive input bytes", Buffer.alloc(MAX_FRAME_BYTES + 1), {}],
    ["non-minimal byte length", Buffer.concat([Buffer.from([0x58, 0x17]), Buffer.alloc(23)]), {}],
    ["non-minimal text length", Buffer.concat([Buffer.from([0x78, 0x17]), Buffer.alloc(23, 0x61)]), {}],
    ["non-minimal array length", Buffer.concat([Buffer.from([0x98, 0x17]), Buffer.alloc(23, 0xf6)]), {}],
  ];

  for (const [name, bytes, options] of rawCases) {
    await t.test(name, () => {
      assert.throws(() => decodeDeterministic(bytes, options));
    });
  }

  const credentialCases = [
    ["wrong expected outer tag", () => validateCredentialShape(encodeCredentialShape(), { tagMode: "cose" })],
    ["unexpected tag for untagged", () => validateCredentialShape(encodeCredentialShape(), { tagMode: "untagged" })],
    ["CWT tag without COSE tag", () => {
      const decoded = decodeDeterministic(encodeCredentialShape(), { allowedTags: [18, 61] });
      return validateCredentialShape(encodeDeterministic(new CborTag(61, decoded.value.value)));
    }],
    ["wrong message array length", () => validateCredentialShape(mutateCredential({}, ({ message }) => message.pop()))],
    ["protected headers not bytes", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[0] = new Map(); }))],
    ["protected headers not map", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[0] = encodeDeterministic([]); }))],
    ["protected duplicate label", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[0] = Buffer.from([0xa2, 0x01, 0x27, 0x01, 0x27]); }))],
    ["protected missing kid", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[0] = encodeDeterministic(new Map([[1, -8]])); }))],
    ["protected unknown label", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[0] = encodeDeterministic(new Map([[1, -8], [4, Buffer.alloc(8)], [9, true]])); }))],
    ["protected wrong algorithm", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[0] = encodeDeterministic(new Map([[1, -7], [4, Buffer.alloc(8)]])); }))],
    ["protected kid wrong length", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[0] = encodeDeterministic(new Map([[1, -8], [4, Buffer.alloc(7)]])); }))],
    ["unprotected header present", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[1] = new Map([[1, -8]]); }))],
    ["payload not bytes", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[2] = new Map(); }))],
    ["signature not bytes", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[3] = "signature"; }))],
    ["signature wrong length", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[3] = Buffer.alloc(63); }))],
    ["signature non-placeholder", () => validateCredentialShape(mutateCredential({}, ({ message }) => { message[3] = Buffer.alloc(64, 1); }))],
    ["missing required claim", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.delete(9)))],
    ["unknown claim", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(-80_000, 1)))],
    ["issuer wrong type", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(1, Buffer.alloc(8))))],
    ["subject empty", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(2, "")))],
    ["audience wrong type", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(3, 1)))],
    ["expiration negative", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(4, -1)))],
    ["expiration before issuance", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(4, claims.get(6))))],
    ["not-before after issuance", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(5, claims.get(6) + 1)))],
    ["CWT ID wrong length", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(7, Buffer.alloc(7))))],
    ["confirmation not map", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(8, Buffer.alloc(8))))],
    ["confirmation unknown member", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(8, new Map([[2, Buffer.alloc(8)]]))))],
    ["confirmation kid wrong length", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(8, new Map([[3, Buffer.alloc(7)]]))))],
    ["scope wrong type", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(9, "scope")))],
    ["standard unexpectedly has private claim", () => validateCredentialShape(mutateCredential({}, ({ claims }) => claims.set(-70_001, Buffer.alloc(8))))],
    ["extended missing private claim", () => validateCredentialShape(mutateCredential({ claimsVariant: "extended" }, ({ claims }) => claims.delete(-70_003)), { claimsVariant: "extended" })],
    ["private encryption handle wrong length", () => validateCredentialShape(mutateCredential({ claimsVariant: "extended" }, ({ claims }) => claims.set(-70_001, Buffer.alloc(7))), { claimsVariant: "extended" })],
    ["private policy epoch negative", () => validateCredentialShape(mutateCredential({ claimsVariant: "extended" }, ({ claims }) => claims.set(-70_002, -1)), { claimsVariant: "extended" })],
    ["private shift handle wrong length", () => validateCredentialShape(mutateCredential({ claimsVariant: "extended" }, ({ claims }) => claims.set(-70_003, Buffer.alloc(9))), { claimsVariant: "extended" })],
  ];

  assert.ok(rawCases.length + credentialCases.length >= 40);
  for (const [name, action] of credentialCases) {
    await t.test(name, () => assert.throws(action));
  }
});

test("all protocol byte formulas and cell counts match the frozen registry", () => {
  const payloads = [0, 16, 32, 64, 128, 512, 1024];
  const rows = protocolCostMatrix(payloads);
  assert.equal(rows.length, Object.keys(PROTOCOL_SHAPES).length * payloads.length * 2);
  for (const row of rows) {
    const expected = row.payloadBytes + row.protocolOverheadBytes + row.headerBytes;
    assert.equal(row.frameBytes, expected);
    assert.equal(row.cells, Math.ceil(expected / CELL_BODY_BYTES));
    assert.equal(row.accepted, expected <= MAX_FRAME_BYTES && row.cells <= MAX_CELL_COUNT);
  }
  assert.equal(PROTOCOL_SHAPES["noise-x"].overhead, 96);
  assert.equal(PROTOCOL_SHAPES["noise-x-prekey"].overhead, 100);
  assert.equal(PROTOCOL_SHAPES["noise-xx-handshake"].overhead, 192);
  assert.equal(PROTOCOL_SHAPES["noise-transport-explicit64"].overhead, 24);
  assert.equal(PROTOCOL_SHAPES["hpke-raw-base"].overhead, 48);
  assert.equal(PROTOCOL_SHAPES["hpke-raw-auth"].overhead, 48);
  assert.equal(PROTOCOL_SHAPES["tink-hpke-tink"].overhead, 53);
  assert.equal(PROTOCOL_SHAPES["bitchat-extracted32-adverse"].selectable, false);
});

test("2048 bytes is accepted as 228 cells and 2049 bytes fails", () => {
  const atLimit = frameCost("hpke-raw-base", 1968);
  const overLimit = frameCost("hpke-raw-base", 1969);
  assert.equal(atLimit.frameBytes, 2048);
  assert.equal(atLimit.cells, 228);
  assert.equal(atLimit.accepted, true);
  assert.equal(overLimit.frameBytes, 2049);
  assert.equal(overLimit.cells, 228);
  assert.equal(overLimit.accepted, false);
});

test("provider evidence is veto-based and missing evidence never passes", () => {
  const measurements = providerMeasurements();
  assert.equal(measurements.length, PROVIDER_CANDIDATES.length);
  assert.ok(measurements.every((candidate) => candidate.directProductAdoption === false));
  assert.ok(measurements.every((candidate) => candidate.eligibleForNativeRepeat === false));
  assert.equal(measurements.find((item) => item.id === "bitchat-custom-noise-copy").decision, "STOP");
  assert.equal(measurements.find((item) => item.id === "libsignal-direct").decision, "STOP");
  assert.equal(measurements.find((item) => item.id === "cryptokit-tink-java-hpke-base").decision, "REPEAT");
  assert.equal(measurements.find((item) => item.id === "snow-noise-ffi").decision, "HOLD");
  assert.throws(() => evaluateProvider({ id: "missing", gates: [] }));
  assert.throws(() => evaluateProvider({ id: "bad", gates: Array(EVIDENCE_GATES.length).fill("maybe") }));
});

test("prekey assignment commits before success and selects the lowest ID", () => {
  const initial = createPrekeyState({ generatedAtMs: fixtureNow, startId: 40 });
  let persistedRevision = null;
  const result = assignPrekey(initial, {
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow,
    persist: (draft) => {
      persistedRevision = draft.revision;
      return true;
    },
  });
  assert.equal(result.assignment.id, 40);
  assert.equal(result.assignment.retransmission, false);
  assert.equal(persistedRevision, 2);
  assert.equal(initial.records[0].state, "available");
  assert.equal(result.state.records[0].state, "assigned");
});

test("prekey assignment persistence failure leaves the durable state unchanged", () => {
  const initial = createPrekeyState({ generatedAtMs: fixtureNow });
  const before = serializePrekeyState(initial);
  assert.throws(() => assignPrekey(initial, {
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow,
    persist: () => false,
  }), /persistence failed/u);
  assert.equal(serializePrekeyState(initial), before);
});

test("exact assignment retransmission is idempotent but message-ID mutation fails", () => {
  const initial = createPrekeyState({ generatedAtMs: fixtureNow });
  const first = assignPrekey(initial, {
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow,
  });
  const repeat = assignPrekey(first.state, {
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow + 1,
  });
  assert.equal(repeat.assignment.id, first.assignment.id);
  assert.equal(repeat.assignment.retransmission, true);
  assert.equal(repeat.state, first.state);
  assert.throws(() => assignPrekey(first.state, {
    messageId: "message-1",
    digest: benchmarkDigest(2),
    nowMs: fixtureNow + 1,
  }));
});

test("prekey consumption is atomic and only exact retransmissions survive grace", () => {
  const initial = createPrekeyState({ generatedAtMs: fixtureNow });
  const assigned = assignPrekey(initial, {
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow,
  });
  assert.throws(() => consumePrekey(assigned.state, {
    id: assigned.assignment.id,
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow + 1,
    persist: () => false,
  }));
  assert.equal(assigned.state.records[0].state, "assigned");
  const consumed = consumePrekey(assigned.state, {
    id: assigned.assignment.id,
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow + 1,
  });
  assert.equal(consumed.state.records[0].state, "consumed");
  const repeated = consumePrekey(consumed.state, {
    id: assigned.assignment.id,
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow + RETRANSMISSION_GRACE_MS,
  });
  assert.equal(repeated.consumption.retransmission, true);
  assert.throws(() => consumePrekey(consumed.state, {
    id: assigned.assignment.id,
    messageId: "message-2",
    digest: benchmarkDigest(2),
    nowMs: fixtureNow + 2,
  }), /distinct logical message/u);
});

test("expired consumed prekeys are deleted and cannot be replayed", () => {
  let state = createPrekeyState({ generatedAtMs: fixtureNow });
  const assigned = assignPrekey(state, {
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow,
  });
  state = consumePrekey(assigned.state, {
    id: assigned.assignment.id,
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow,
  }).state;
  const atBoundary = deleteExpiredPrekeys(state, { nowMs: fixtureNow + RETRANSMISSION_GRACE_MS });
  assert.equal(atBoundary.records.length, 8);
  const afterBoundary = deleteExpiredPrekeys(state, { nowMs: fixtureNow + RETRANSMISSION_GRACE_MS + 1 });
  assert.equal(afterBoundary.records.length, 7);
  assert.throws(() => consumePrekey(afterBoundary, {
    id: assigned.assignment.id,
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow + RETRANSMISSION_GRACE_MS + 1,
  }), /unknown or deleted/u);
});

test("future, stale, depleted and invalid prekey states fail closed", () => {
  const future = createPrekeyState({ generatedAtMs: fixtureNow + FUTURE_SKEW_MS + 1 });
  const stale = createPrekeyState({ generatedAtMs: fixtureNow - BUNDLE_MAX_AGE_MS - 1 });
  for (const state of [future, stale]) {
    assert.throws(() => assignPrekey(state, {
      messageId: "message-1",
      digest: benchmarkDigest(1),
      nowMs: fixtureNow,
    }));
  }
  let depleted = createPrekeyState({ generatedAtMs: fixtureNow, count: 1 });
  depleted = assignPrekey(depleted, {
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow,
  }).state;
  assert.throws(() => assignPrekey(depleted, {
    messageId: "message-2",
    digest: benchmarkDigest(2),
    nowMs: fixtureNow,
  }), /silent static fallback is forbidden/u);
  assert.throws(() => restorePrekeyState(null), /requires recovery/u);
  assert.throws(() => restorePrekeyState("{"), /corrupt/u);
  assert.equal(restorePrekeyState(null, { previouslyInitialized: false }), null);
});

test("serialised prekey state is stable and rejects corruption", () => {
  const state = createPrekeyState({ generatedAtMs: fixtureNow });
  const serialised = serializePrekeyState(state);
  const restored = restorePrekeyState(serialised);
  assert.deepEqual(restored, state);
  assert.equal(serializePrekeyState(restored), serialised);
  const corrupt = clone(state);
  corrupt.records.push(clone(corrupt.records[0]));
  assert.throws(() => validatePrekeyState(corrupt), /duplicate/u);
  const collision = clone(state);
  collision.nextId = collision.records[0].id;
  assert.throws(() => validatePrekeyState(collision), /collides/u);
});

test("prekey ID allocation stops at UInt32 exhaustion without wrap", () => {
  const terminal = createPrekeyState({ generatedAtMs: fixtureNow, startId: UINT32_MAX, count: 1 });
  assert.equal(terminal.nextId, null);
  assert.throws(() => replenishPrekeys(terminal, { target: 2, nowMs: fixtureNow + 1 }), /wrap is forbidden/u);
  assert.throws(() => createPrekeyState({ generatedAtMs: fixtureNow, startId: UINT32_MAX, count: 2 }), /wrap/u);
});

test("prekey replenishment is transactional and advances generation monotonically", () => {
  let state = createPrekeyState({ generatedAtMs: fixtureNow, count: 2 });
  state = assignPrekey(state, {
    messageId: "message-1",
    digest: benchmarkDigest(1),
    nowMs: fixtureNow,
  }).state;
  const before = serializePrekeyState(state);
  assert.throws(() => replenishPrekeys(state, { target: 8, nowMs: fixtureNow + 1, persist: () => false }));
  assert.equal(serializePrekeyState(state), before);
  const replenished = replenishPrekeys(state, { target: 8, nowMs: fixtureNow + 1 });
  assert.equal(replenished.records.filter((record) => record.state === "available").length, 8);
  assert.equal(replenished.bundleGeneration, state.bundleGeneration + 1);
  assert.ok(replenished.generatedAtMs > state.generatedAtMs);
});

test("remote bundle ingest rejects future, stale, rollback, conflict and persistence failure", () => {
  const first = remoteBundle();
  const accepted = ingestRemoteBundle(null, first, { nowMs: fixtureNow });
  assert.equal(accepted.retransmission, false);
  const repeated = ingestRemoteBundle(accepted.bundle, clone(first), { nowMs: fixtureNow });
  assert.equal(repeated.retransmission, true);
  assert.throws(() => ingestRemoteBundle(first, remoteBundle({ prekeyIds: [4, 5, 6] }), { nowMs: fixtureNow }), /conflicting/u);
  assert.throws(() => ingestRemoteBundle(first, remoteBundle({ generation: 0 }), { nowMs: fixtureNow }));
  assert.throws(() => ingestRemoteBundle(null, remoteBundle({ generatedAtMs: fixtureNow + FUTURE_SKEW_MS + 1 }), { nowMs: fixtureNow }), /future/u);
  assert.throws(() => ingestRemoteBundle(null, remoteBundle({ generatedAtMs: fixtureNow - BUNDLE_MAX_AGE_MS - 1 }), { nowMs: fixtureNow }), /stale/u);
  assert.throws(() => ingestRemoteBundle(null, remoteBundle({ prekeyIds: [1, 1] }), { nowMs: fixtureNow }), /duplicate/u);
  assert.throws(() => ingestRemoteBundle(null, first, { nowMs: fixtureNow, persist: () => false }), /persistence/u);
});

test("selected public-vector artifacts have pinned, reproducible provenance", () => {
  const first = collectVectorProvenance();
  const second = collectVectorProvenance();
  const manifest = JSON.parse(readFileSync(resolve(
    prototypeDirectory,
    "../../results/SEC-05/2026-07-22-crypto-provider-bakeoff/evidence-manifest.json",
  ), "utf8"));
  assert.deepEqual(second, first);
  assert.equal(first.length, 7);
  assert.equal(new Set(first.map((item) => item.id)).size, first.length);
  for (const artifact of first) {
    assert.match(artifact.commit, /^[a-f0-9]{40}$/u);
    assert.match(artifact.objectId, /^[a-f0-9]{40,64}$/u);
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(artifact.bytes > 0);
  }
  assert.deepEqual(
    first.map(({ id, repository, commit, path, objectId, bytes, sha256 }) => ({
      id,
      repository,
      commit,
      path,
      objectId,
      bytes,
      sha256,
    })),
    manifest.vectorArtifacts,
  );
});

test("prototype source imports only Node built-ins and exposes no crypto implementation APIs", () => {
  for (const filename of ["crypto-provider-bakeoff.mjs", "vector-provenance.mjs"] ) {
    const source = readFileSync(resolve(prototypeDirectory, filename), "utf8");
    const imports = [...source.matchAll(/from\s+"([^"]+)"/gu)].map((match) => match[1]);
    assert.ok(imports.every((specifier) => specifier.startsWith("node:")));
    assert.doesNotMatch(source, /\b(?:generateKey|encrypt|decrypt|sign|verify)\s*\(/u);
  }
});
