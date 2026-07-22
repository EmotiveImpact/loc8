import { createHash } from "node:crypto";

export const MAX_FRAME_BYTES = 2048;
export const CELL_BODY_BYTES = 9;
export const MAX_CELL_COUNT = 255;
export const UINT32_MAX = 0xffff_ffff;
export const FUTURE_SKEW_MS = 5 * 60 * 1000;
export const BUNDLE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const RETRANSMISSION_GRACE_MS = 48 * 60 * 60 * 1000;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export class CborTag {
  constructor(tag, value) {
    if (!Number.isSafeInteger(tag) || tag < 0) {
      throw new TypeError("CBOR tag must be a non-negative safe integer");
    }
    this.tag = tag;
    this.value = value;
  }
}

function fail(message) {
  throw new Error(message);
}

function assertSafeInteger(value, name) {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${name} must be a safe integer`);
  }
}

function encodeHead(major, argument) {
  assertSafeInteger(argument, "CBOR argument");
  if (argument < 0) {
    throw new RangeError("CBOR argument must be non-negative");
  }
  if (argument < 24) {
    return Buffer.from([(major << 5) | argument]);
  }
  if (argument <= 0xff) {
    return Buffer.from([(major << 5) | 24, argument]);
  }
  if (argument <= 0xffff) {
    const output = Buffer.alloc(3);
    output[0] = (major << 5) | 25;
    output.writeUInt16BE(argument, 1);
    return output;
  }
  if (argument <= UINT32_MAX) {
    const output = Buffer.alloc(5);
    output[0] = (major << 5) | 26;
    output.writeUInt32BE(argument, 1);
    return output;
  }
  const output = Buffer.alloc(9);
  output[0] = (major << 5) | 27;
  output.writeBigUInt64BE(BigInt(argument), 1);
  return output;
}

function encodeValue(value, depth, limits) {
  if (depth > limits.maxDepth) {
    fail("CBOR nesting exceeds configured maximum");
  }
  limits.items += 1;
  if (limits.items > limits.maxItems) {
    fail("CBOR item count exceeds configured maximum");
  }

  if (value === null) {
    return Buffer.from([0xf6]);
  }
  if (value === false) {
    return Buffer.from([0xf4]);
  }
  if (value === true) {
    return Buffer.from([0xf5]);
  }
  if (Number.isSafeInteger(value)) {
    return value >= 0
      ? encodeHead(0, value)
      : encodeHead(1, -1 - value);
  }
  if (typeof value === "number") {
    fail("floating-point and unsafe integer values are outside this contract");
  }
  if (typeof value === "string") {
    const bytes = Buffer.from(textEncoder.encode(value));
    return Buffer.concat([encodeHead(3, bytes.length), bytes]);
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    const bytes = Buffer.from(value);
    return Buffer.concat([encodeHead(2, bytes.length), bytes]);
  }
  if (value instanceof CborTag) {
    return Buffer.concat([
      encodeHead(6, value.tag),
      encodeValue(value.value, depth + 1, limits),
    ]);
  }
  if (Array.isArray(value)) {
    const encoded = value.map((item) =>
      encodeValue(item, depth + 1, limits),
    );
    return Buffer.concat([encodeHead(4, encoded.length), ...encoded]);
  }
  if (value instanceof Map) {
    const entries = [];
    const seen = new Set();
    for (const [key, mapValue] of value.entries()) {
      const keyLimits = {
        maxDepth: limits.maxDepth,
        maxItems: limits.maxItems,
        items: 0,
      };
      const encodedKey = encodeValue(key, depth + 1, keyLimits);
      const keyHex = encodedKey.toString("hex");
      if (seen.has(keyHex)) {
        fail("duplicate deterministic CBOR map key");
      }
      seen.add(keyHex);
      entries.push({ encodedKey, mapValue });
    }
    entries.sort((left, right) => Buffer.compare(left.encodedKey, right.encodedKey));
    const output = [encodeHead(5, entries.length)];
    for (const entry of entries) {
      limits.items += 1;
      if (limits.items > limits.maxItems) {
        fail("CBOR item count exceeds configured maximum");
      }
      output.push(entry.encodedKey);
      output.push(encodeValue(entry.mapValue, depth + 1, limits));
    }
    return Buffer.concat(output);
  }
  fail(`unsupported deterministic CBOR value: ${typeof value}`);
}

export function encodeDeterministic(
  value,
  { maxDepth = 16, maxItems = 256, maxBytes = MAX_FRAME_BYTES } = {},
) {
  const encoded = encodeValue(value, 0, { maxDepth, maxItems, items: 0 });
  if (encoded.length > maxBytes) {
    fail("encoded CBOR exceeds configured byte maximum");
  }
  return encoded;
}

class StrictReader {
  constructor(input, options) {
    this.input = Buffer.from(input);
    this.offset = 0;
    this.items = 0;
    this.maxDepth = options.maxDepth;
    this.maxItems = options.maxItems;
    this.allowedTags = new Set(options.allowedTags);
  }

  requireBytes(count) {
    if (count < 0 || this.offset + count > this.input.length) {
      fail("truncated CBOR item");
    }
  }

  readByte() {
    this.requireBytes(1);
    return this.input[this.offset++];
  }

  readArgument(additional) {
    if (additional < 24) {
      return additional;
    }
    if (additional === 24) {
      const value = this.readByte();
      if (value < 24) fail("non-minimal CBOR argument");
      return value;
    }
    if (additional === 25) {
      this.requireBytes(2);
      const value = this.input.readUInt16BE(this.offset);
      this.offset += 2;
      if (value <= 0xff) fail("non-minimal CBOR argument");
      return value;
    }
    if (additional === 26) {
      this.requireBytes(4);
      const value = this.input.readUInt32BE(this.offset);
      this.offset += 4;
      if (value <= 0xffff) fail("non-minimal CBOR argument");
      return value;
    }
    if (additional === 27) {
      this.requireBytes(8);
      const value = this.input.readBigUInt64BE(this.offset);
      this.offset += 8;
      if (value <= BigInt(UINT32_MAX)) fail("non-minimal CBOR argument");
      if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
        fail("CBOR integer exceeds JavaScript safe-integer contract");
      }
      return Number(value);
    }
    if (additional === 31) {
      fail("indefinite-length CBOR is forbidden");
    }
    fail("reserved CBOR additional-information value");
  }

  parse(depth = 0) {
    if (depth > this.maxDepth) {
      fail("CBOR nesting exceeds configured maximum");
    }
    this.items += 1;
    if (this.items > this.maxItems) {
      fail("CBOR item count exceeds configured maximum");
    }

    const initial = this.readByte();
    const major = initial >>> 5;
    const additional = initial & 0x1f;

    if (major === 7) {
      if (additional === 20) return false;
      if (additional === 21) return true;
      if (additional === 22) return null;
      if (additional === 31) fail("unexpected CBOR break marker");
      fail("unsupported CBOR simple or floating-point value");
    }

    const argument = this.readArgument(additional);
    if (major === 0) return argument;
    if (major === 1) return -1 - argument;

    if (major === 2) {
      this.requireBytes(argument);
      const value = Buffer.from(
        this.input.subarray(this.offset, this.offset + argument),
      );
      this.offset += argument;
      return value;
    }

    if (major === 3) {
      this.requireBytes(argument);
      const bytes = this.input.subarray(this.offset, this.offset + argument);
      this.offset += argument;
      try {
        return textDecoder.decode(bytes);
      } catch {
        fail("invalid UTF-8 text string");
      }
    }

    if (major === 4) {
      const value = [];
      for (let index = 0; index < argument; index += 1) {
        value.push(this.parse(depth + 1));
      }
      return value;
    }

    if (major === 5) {
      const value = new Map();
      const seen = new Set();
      let previousKeyBytes = null;
      for (let index = 0; index < argument; index += 1) {
        const keyStart = this.offset;
        const key = this.parse(depth + 1);
        const keyBytes = Buffer.from(this.input.subarray(keyStart, this.offset));
        const keyHex = keyBytes.toString("hex");
        if (seen.has(keyHex)) fail("duplicate CBOR map key");
        seen.add(keyHex);
        if (previousKeyBytes && Buffer.compare(previousKeyBytes, keyBytes) >= 0) {
          fail("CBOR map keys are not in deterministic bytewise order");
        }
        previousKeyBytes = keyBytes;
        value.set(key, this.parse(depth + 1));
      }
      return value;
    }

    if (major === 6) {
      if (!this.allowedTags.has(argument)) {
        fail(`CBOR tag ${argument} is not allowed by this contract`);
      }
      return new CborTag(argument, this.parse(depth + 1));
    }

    fail(`unsupported CBOR major type ${major}`);
  }
}

export function decodeDeterministic(
  input,
  {
    maxDepth = 16,
    maxItems = 256,
    maxBytes = MAX_FRAME_BYTES,
    allowedTags = [],
  } = {},
) {
  const bytes = Buffer.from(input);
  if (bytes.length === 0) fail("empty CBOR input");
  if (bytes.length > maxBytes) fail("CBOR input exceeds configured byte maximum");
  const reader = new StrictReader(bytes, { maxDepth, maxItems, allowedTags });
  const value = reader.parse();
  if (reader.offset !== bytes.length) fail("trailing bytes after CBOR item");
  return value;
}

function sequence(start, count = 8) {
  return Buffer.from(Array.from({ length: count }, (_, index) => start + index));
}

export function standardClaimsFixture() {
  return new Map([
    [9, sequence(0x21)],
    [8, new Map([[3, sequence(0x11)]])],
    [7, sequence(0x01)],
    [6, 1_800_000_000],
    [5, 1_800_000_000],
    [4, 1_800_003_600],
    [3, "site-001"],
    [2, "device-00000001"],
    [1, "loc8-ca"],
  ]);
}

export function extendedClaimsFixture() {
  const claims = standardClaimsFixture();
  claims.set(-70_003, sequence(0x41));
  claims.set(-70_002, 7);
  claims.set(-70_001, sequence(0x31));
  return claims;
}

function protectedHeadersFixture() {
  return new Map([
    [4, sequence(0x51)],
    [1, -8],
  ]);
}

function applyTagMode(value, tagMode) {
  if (tagMode === "untagged") return value;
  if (tagMode === "cose") return new CborTag(18, value);
  if (tagMode === "cwt-cose") {
    return new CborTag(61, new CborTag(18, value));
  }
  fail(`unknown credential tag mode: ${tagMode}`);
}

export function encodeCredentialShape(
  { claimsVariant = "standard", tagMode = "cwt-cose" } = {},
) {
  const claims =
    claimsVariant === "standard"
      ? standardClaimsFixture()
      : claimsVariant === "extended"
        ? extendedClaimsFixture()
        : fail(`unknown claims variant: ${claimsVariant}`);
  const message = [
    encodeDeterministic(protectedHeadersFixture()),
    new Map(),
    encodeDeterministic(claims),
    Buffer.alloc(64),
  ];
  return encodeDeterministic(applyTagMode(message, tagMode));
}

function bufferLength(value, expected, name) {
  if (!Buffer.isBuffer(value) || value.length !== expected) {
    fail(`${name} must be a ${expected}-byte string`);
  }
}

function assertExactMapKeys(map, allowed, name) {
  if (!(map instanceof Map)) fail(`${name} must be a map`);
  for (const key of map.keys()) {
    if (!allowed.includes(key)) fail(`${name} contains unknown key ${String(key)}`);
  }
}

function validateClaims(claims, claimsVariant) {
  const standard = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const privateKeys = [-70_001, -70_002, -70_003];
  const expected =
    claimsVariant === "standard" ? standard : [...standard, ...privateKeys];
  assertExactMapKeys(claims, expected, "CWT claims");
  if (claims.size !== expected.length || expected.some((key) => !claims.has(key))) {
    fail("CWT claims are missing a required key");
  }
  for (const key of [1, 2, 3]) {
    if (typeof claims.get(key) !== "string" || claims.get(key).length === 0) {
      fail(`CWT text claim ${key} is invalid`);
    }
  }
  for (const key of [4, 5, 6]) {
    const value = claims.get(key);
    if (!Number.isSafeInteger(value) || value < 0) {
      fail(`CWT NumericDate claim ${key} is invalid`);
    }
  }
  if (claims.get(4) <= claims.get(6)) fail("CWT expiration must follow issuance");
  if (claims.get(5) > claims.get(6)) fail("CWT not-before must not follow issuance");
  bufferLength(claims.get(7), 8, "CWT ID");
  const confirmation = claims.get(8);
  assertExactMapKeys(confirmation, [3], "CWT confirmation");
  if (confirmation.size !== 1 || !confirmation.has(3)) {
    fail("CWT confirmation must contain exactly one key handle");
  }
  bufferLength(confirmation.get(3), 8, "confirmation key handle");
  bufferLength(claims.get(9), 8, "CWT scope");
  if (claimsVariant === "extended") {
    bufferLength(claims.get(-70_001), 8, "recipient-encryption-key handle");
    if (!Number.isSafeInteger(claims.get(-70_002)) || claims.get(-70_002) < 0) {
      fail("policy epoch is invalid");
    }
    bufferLength(claims.get(-70_003), 8, "shift handle");
  }
}

function unwrapCredentialTag(value, tagMode) {
  if (tagMode === "untagged") {
    if (value instanceof CborTag) fail("unexpected credential tag");
    return value;
  }
  if (tagMode === "cose") {
    if (!(value instanceof CborTag) || value.tag !== 18) {
      fail("expected COSE_Sign1 tag 18");
    }
    if (value.value instanceof CborTag) fail("unexpected nested credential tag");
    return value.value;
  }
  if (tagMode === "cwt-cose") {
    if (!(value instanceof CborTag) || value.tag !== 61) {
      fail("expected CWT tag 61");
    }
    if (!(value.value instanceof CborTag) || value.value.tag !== 18) {
      fail("expected COSE_Sign1 tag 18 inside CWT");
    }
    return value.value.value;
  }
  fail(`unknown credential tag mode: ${tagMode}`);
}

export function validateCredentialShape(
  input,
  { claimsVariant = "standard", tagMode = "cwt-cose" } = {},
) {
  const decoded = decodeDeterministic(input, { allowedTags: [18, 61] });
  const message = unwrapCredentialTag(decoded, tagMode);
  if (!Array.isArray(message) || message.length !== 4) {
    fail("COSE_Sign1 must be a four-element array");
  }
  const [protectedBytes, unprotected, payloadBytes, signature] = message;
  if (!Buffer.isBuffer(protectedBytes)) fail("protected headers must be a byte string");
  const protectedHeaders = decodeDeterministic(protectedBytes);
  assertExactMapKeys(protectedHeaders, [1, 4], "protected headers");
  if (
    protectedHeaders.size !== 2 ||
    protectedHeaders.get(1) !== -8 ||
    !protectedHeaders.has(4)
  ) {
    fail("protected headers must contain EdDSA and issuer key handle");
  }
  bufferLength(protectedHeaders.get(4), 8, "protected issuer key handle");
  if (!(unprotected instanceof Map) || unprotected.size !== 0) {
    fail("unprotected headers must be an empty map in this fixture");
  }
  if (!Buffer.isBuffer(payloadBytes)) fail("COSE payload must be a byte string");
  const claims = decodeDeterministic(payloadBytes);
  validateClaims(claims, claimsVariant);
  bufferLength(signature, 64, "placeholder signature");
  if (signature.some((byte) => byte !== 0)) {
    fail("fixture signature must be the labelled zero placeholder");
  }
  return { protectedHeaders, claims, placeholderSignature: true };
}

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function credentialMeasurements() {
  const output = [];
  for (const claimsVariant of ["standard", "extended"]) {
    for (const tagMode of ["untagged", "cose", "cwt-cose"]) {
      const encoded = encodeCredentialShape({ claimsVariant, tagMode });
      validateCredentialShape(encoded, { claimsVariant, tagMode });
      output.push({
        claimsVariant,
        tagMode,
        bytes: encoded.length,
        cells: Math.ceil(encoded.length / CELL_BODY_BYTES),
        hex: encoded.toString("hex"),
        sha256: sha256Hex(encoded),
      });
    }
  }
  return output;
}

function exactHandle(value, name) {
  bufferLength(value, 8, name);
  return Buffer.from(value);
}

export function logicalHeaderFixture() {
  return {
    version: 2,
    kind: 1,
    suite: 1,
    flags: 0,
    credentialHandle: sequence(0x51),
    recipientHandle: sequence(0x61),
    messageId: sequence(0x71),
    policyEpoch: 7,
  };
}

export function encodeLogicalHeader(header = logicalHeaderFixture()) {
  for (const [field, name] of [
    [header.version, "version"],
    [header.kind, "kind"],
    [header.suite, "suite"],
    [header.flags, "flags"],
    [header.policyEpoch, "policyEpoch"],
  ]) {
    assertSafeInteger(field, name);
  }
  if (header.version !== 2) fail("logical header version must be 2");
  if (header.kind < 1 || header.kind > 4) fail("logical header kind is out of range");
  if (header.suite < 1 || header.suite > 0xff) fail("logical header suite is out of range");
  if (header.flags < 0 || header.flags > 0x07) fail("logical header has unknown flags");
  if (header.policyEpoch < 1 || header.policyEpoch > UINT32_MAX) {
    fail("logical header policy epoch is out of range");
  }
  const output = Buffer.alloc(32);
  output[0] = header.version;
  output[1] = header.kind;
  output[2] = header.suite;
  output[3] = header.flags;
  exactHandle(header.credentialHandle, "credential handle").copy(output, 4);
  exactHandle(header.recipientHandle, "recipient handle").copy(output, 12);
  exactHandle(header.messageId, "message ID").copy(output, 20);
  output.writeUInt32BE(header.policyEpoch, 28);
  return output;
}

export function decodeLogicalHeader(input) {
  const bytes = Buffer.from(input);
  if (bytes.length !== 32) fail("logical header must be exactly 32 bytes");
  const decoded = {
    version: bytes[0],
    kind: bytes[1],
    suite: bytes[2],
    flags: bytes[3],
    credentialHandle: Buffer.from(bytes.subarray(4, 12)),
    recipientHandle: Buffer.from(bytes.subarray(12, 20)),
    messageId: Buffer.from(bytes.subarray(20, 28)),
    policyEpoch: bytes.readUInt32BE(28),
  };
  encodeLogicalHeader(decoded);
  return decoded;
}

export const PROTOCOL_SHAPES = Object.freeze({
  "noise-x": { overhead: 96, selectable: true },
  "noise-x-prekey": { overhead: 100, selectable: true },
  "noise-xx-handshake": { overhead: 192, selectable: true },
  "noise-transport-implicit": { overhead: 16, selectable: true },
  "noise-transport-explicit64": { overhead: 24, selectable: true },
  "hpke-raw-base": { overhead: 48, selectable: true },
  "hpke-raw-auth": { overhead: 48, selectable: true },
  "tink-hpke-raw": { overhead: 48, selectable: true },
  "tink-hpke-tink": { overhead: 53, selectable: true },
  "bitchat-extracted32-adverse": { overhead: 20, selectable: false },
});

export function frameCost(shapeId, payloadBytes, { logicalHeader = true } = {}) {
  assertSafeInteger(payloadBytes, "payloadBytes");
  if (payloadBytes < 0) throw new RangeError("payloadBytes must be non-negative");
  const shape = PROTOCOL_SHAPES[shapeId];
  if (!shape) fail(`unknown protocol shape: ${shapeId}`);
  const headerBytes = logicalHeader ? 32 : 0;
  const frameBytes = headerBytes + payloadBytes + shape.overhead;
  const cells = Math.ceil(frameBytes / CELL_BODY_BYTES);
  return {
    shapeId,
    payloadBytes,
    headerBytes,
    protocolOverheadBytes: shape.overhead,
    frameBytes,
    cells,
    selectable: shape.selectable,
    withinFrameLimit: frameBytes <= MAX_FRAME_BYTES,
    withinCellLimit: cells <= MAX_CELL_COUNT,
    accepted: frameBytes <= MAX_FRAME_BYTES && cells <= MAX_CELL_COUNT,
  };
}

export function protocolCostMatrix(
  payloads = [0, 16, 32, 64, 128, 512, 1024],
) {
  const output = [];
  for (const shapeId of Object.keys(PROTOCOL_SHAPES)) {
    for (const payloadBytes of payloads) {
      output.push(frameCost(shapeId, payloadBytes, { logicalHeader: false }));
      output.push(frameCost(shapeId, payloadBytes, { logicalHeader: true }));
    }
  }
  return output;
}

export const EVIDENCE_GATES = Object.freeze([
  "licence",
  "maintenance",
  "mobileApi",
  "sameWire",
  "platformVectors",
  "independentReview",
  "keyLifecycle",
  "fuzzAndBounds",
  "mobileEvidence",
  "specialistReview",
]);

const P = "pass";
const F = "fail";
const U = "unknown";

export const PROVIDER_CANDIDATES = Object.freeze([
  {
    id: "cryptokit-tink-java-hpke-base",
    role: "cross-provider native HPKE Base confidentiality candidate",
    sourcePins: ["CryptoKit iOS 17+", "tink-java@1423887709cd"],
    gates: [P, P, P, U, U, U, U, U, U, U],
    stopReasons: [],
  },
  {
    id: "tink-cc-boringssl-shared",
    role: "single C++ HPKE provider and mobile FFI candidate",
    sourcePins: ["tink-cc@5bf527a8dc73"],
    gates: [P, P, U, U, U, U, U, U, U, U],
    stopReasons: [],
  },
  {
    id: "swift-crypto-shared-hpke",
    role: "RFC 9180 implementation/vector source and packaging repeat",
    sourcePins: ["swift-crypto@47d3869a7291"],
    gates: [P, P, U, U, U, U, U, U, U, U],
    stopReasons: [],
  },
  {
    id: "snow-noise-ffi",
    role: "Noise oracle and possible Rust FFI repeat",
    sourcePins: ["snow@8ac60f51cfe3"],
    gates: [P, P, U, U, U, F, U, P, U, U],
    stopReasons: [],
  },
  {
    id: "noise-c-ffi",
    role: "official-reference Noise oracle",
    sourcePins: ["noise-c@cfe25410979a"],
    gates: [P, F, U, U, U, U, U, U, U, U],
    stopReasons: [],
  },
  {
    id: "libsodium-composition",
    role: "mobile primitive provider, not a protocol composition",
    sourcePins: ["libsodium@7014b204b6fb"],
    gates: [P, P, P, F, U, U, U, U, U, U],
    stopReasons: [],
  },
  {
    id: "bitchat-custom-noise-copy",
    role: "public-domain source reference, rejected direct crypto copy",
    sourcePins: ["bitchat@733098bb633e"],
    gates: [P, P, F, F, F, F, F, U, F, U],
    stopReasons: [
      "handwritten cryptographic composition",
      "live 32-bit nonce framing is not covered by public transport vectors",
      "identity and prekey persistence can fail open",
    ],
  },
  {
    id: "libsignal-direct",
    role: "learn-only PQXDH and ratchet architecture",
    sourcePins: ["libsignal@8e49f09bbcde"],
    gates: [F, P, F, P, U, U, U, P, U, U],
    stopReasons: ["AGPL-3.0 and unsupported external client API"],
  },
  {
    id: "openmls-groups",
    role: "separate group-security repeat, not pairwise carrier crypto",
    sourcePins: ["openmls@65396d8ed312"],
    gates: [P, P, F, P, U, U, U, P, F, U],
    stopReasons: [],
  },
  {
    id: "go-cose-oracle",
    role: "COSE parser/vector oracle, not a mobile provider",
    sourcePins: ["go-cose@022cb5419154"],
    gates: [U, P, F, P, U, U, U, P, F, U],
    stopReasons: [],
  },
]);

export function evaluateProvider(candidate) {
  if (!candidate || !Array.isArray(candidate.gates)) {
    fail("provider candidate has no evidence gates");
  }
  if (candidate.gates.length !== EVIDENCE_GATES.length) {
    fail("provider candidate gate count does not match the frozen registry");
  }
  const evidence = {};
  EVIDENCE_GATES.forEach((gate, index) => {
    const status = candidate.gates[index];
    if (![P, F, U].includes(status)) fail(`invalid evidence status for ${gate}`);
    evidence[gate] = status;
  });
  const failed = EVIDENCE_GATES.filter((gate) => evidence[gate] === F);
  const unknown = EVIDENCE_GATES.filter((gate) => evidence[gate] === U);
  const stopReasons = candidate.stopReasons ?? [];
  const eligibleForNativeRepeat = failed.length === 0 && unknown.length === 0;
  const decision =
    stopReasons.length > 0 ? "STOP" : failed.length > 0 ? "HOLD" : "REPEAT";
  return {
    id: candidate.id,
    role: candidate.role,
    evidence,
    failed,
    unknown,
    stopReasons,
    eligibleForNativeRepeat,
    directProductAdoption: false,
    decision,
  };
}

export function providerMeasurements() {
  return PROVIDER_CANDIDATES.map(evaluateProvider);
}

function clone(value) {
  return structuredClone(value);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function commitDraft(original, draft, persist) {
  const accepted = (persist ?? (() => true))(clone(draft));
  if (accepted !== true) {
    fail("durable persistence failed; transaction not committed");
  }
  return draft;
}

function validateMessageIdentity(messageId, digest) {
  if (typeof messageId !== "string" || !/^[a-z0-9-]{1,64}$/u.test(messageId)) {
    fail("invalid logical message ID");
  }
  if (typeof digest !== "string" || !/^[a-f0-9]{64}$/u.test(digest)) {
    fail("invalid ciphertext digest");
  }
}

function validateBundleClock(generatedAtMs, nowMs) {
  assertSafeInteger(generatedAtMs, "generatedAtMs");
  assertSafeInteger(nowMs, "nowMs");
  if (generatedAtMs > nowMs + FUTURE_SKEW_MS) {
    fail("prekey bundle is too far in the future");
  }
  if (nowMs - generatedAtMs > BUNDLE_MAX_AGE_MS) {
    fail("prekey bundle is stale");
  }
}

export function createPrekeyState({
  namespace = "site-001/device-00000001/epoch-7",
  generatedAtMs = 1_800_000_000_000,
  startId = 0,
  count = 8,
} = {}) {
  if (typeof namespace !== "string" || namespace.length < 3) {
    fail("invalid prekey namespace");
  }
  for (const [value, name] of [
    [generatedAtMs, "generatedAtMs"],
    [startId, "startId"],
    [count, "count"],
  ]) {
    assertSafeInteger(value, name);
  }
  if (startId < 0 || startId > UINT32_MAX) fail("prekey start ID out of range");
  if (count < 1 || count > 255) fail("prekey count out of range");
  if (startId + count - 1 > UINT32_MAX) fail("prekey identifier allocation would wrap");
  const records = Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    state: "available",
    messageId: null,
    digest: null,
    assignedAtMs: null,
    consumedAtMs: null,
    deleteAfterMs: null,
  }));
  const last = startId + count - 1;
  return {
    schema: "loc8-prekey-state/v1",
    initialized: true,
    namespace,
    revision: 1,
    bundleGeneration: 1,
    generatedAtMs,
    nextId: last === UINT32_MAX ? null : last + 1,
    records,
  };
}

export function validatePrekeyState(state) {
  if (!state || state.schema !== "loc8-prekey-state/v1" || state.initialized !== true) {
    fail("invalid or uninitialised prekey state");
  }
  if (typeof state.namespace !== "string" || state.namespace.length < 3) {
    fail("invalid prekey namespace");
  }
  for (const [value, name] of [
    [state.revision, "revision"],
    [state.bundleGeneration, "bundleGeneration"],
    [state.generatedAtMs, "generatedAtMs"],
  ]) {
    assertSafeInteger(value, name);
    if (value < 1) fail(`${name} must be positive`);
  }
  if (state.nextId !== null) {
    assertSafeInteger(state.nextId, "nextId");
    if (state.nextId < 0 || state.nextId > UINT32_MAX) fail("nextId out of range");
  }
  if (!Array.isArray(state.records) || state.records.length > 255) {
    fail("invalid prekey record collection");
  }
  const ids = new Set();
  for (const record of state.records) {
    assertSafeInteger(record.id, "prekey ID");
    if (record.id < 0 || record.id > UINT32_MAX || ids.has(record.id)) {
      fail("invalid or duplicate prekey ID");
    }
    ids.add(record.id);
    if (!["available", "assigned", "consumed"].includes(record.state)) {
      fail("invalid prekey record state");
    }
    if (record.state === "available") {
      if (
        record.messageId !== null ||
        record.digest !== null ||
        record.assignedAtMs !== null ||
        record.consumedAtMs !== null ||
        record.deleteAfterMs !== null
      ) {
        fail("available prekey contains assignment data");
      }
    } else {
      validateMessageIdentity(record.messageId, record.digest);
      assertSafeInteger(record.assignedAtMs, "assignedAtMs");
      if (record.state === "consumed") {
        assertSafeInteger(record.consumedAtMs, "consumedAtMs");
        assertSafeInteger(record.deleteAfterMs, "deleteAfterMs");
        if (record.deleteAfterMs !== record.consumedAtMs + RETRANSMISSION_GRACE_MS) {
          fail("invalid consumed-prekey deletion deadline");
        }
      }
    }
  }
  if (state.nextId !== null && ids.has(state.nextId)) {
    fail("nextId collides with an existing prekey");
  }
  return true;
}

export function serializePrekeyState(state) {
  validatePrekeyState(state);
  return stableStringify(state);
}

export function restorePrekeyState(serialized, { previouslyInitialized = true } = {}) {
  if (serialized === null || serialized === undefined || serialized === "") {
    if (previouslyInitialized) fail("missing established prekey state requires recovery");
    return null;
  }
  let state;
  try {
    state = JSON.parse(serialized);
  } catch {
    fail("corrupt prekey state requires recovery");
  }
  validatePrekeyState(state);
  return state;
}

export function assignPrekey(
  state,
  { messageId, digest, nowMs, persist } = {},
) {
  validatePrekeyState(state);
  validateMessageIdentity(messageId, digest);
  validateBundleClock(state.generatedAtMs, nowMs);

  const prior = state.records.find((record) => record.messageId === messageId);
  if (prior) {
    if (prior.digest !== digest) fail("message ID was reused with a different digest");
    return {
      state,
      assignment: { id: prior.id, retransmission: true, recordState: prior.state },
    };
  }

  const available = state.records
    .filter((record) => record.state === "available")
    .sort((left, right) => left.id - right.id)[0];
  if (!available) fail("one-time prekeys depleted; silent static fallback is forbidden");

  const draft = clone(state);
  const record = draft.records.find((entry) => entry.id === available.id);
  record.state = "assigned";
  record.messageId = messageId;
  record.digest = digest;
  record.assignedAtMs = nowMs;
  draft.revision += 1;
  const committed = commitDraft(state, draft, persist);
  return {
    state: committed,
    assignment: { id: record.id, retransmission: false, recordState: record.state },
  };
}

export function consumePrekey(
  state,
  { id, messageId, digest, nowMs, persist } = {},
) {
  validatePrekeyState(state);
  assertSafeInteger(id, "prekey ID");
  validateMessageIdentity(messageId, digest);
  assertSafeInteger(nowMs, "nowMs");
  const existing = state.records.find((record) => record.id === id);
  if (!existing) fail("unknown or deleted prekey");
  if (existing.messageId !== messageId || existing.digest !== digest) {
    fail("distinct logical message attempted to reuse a prekey");
  }
  if (existing.state === "available") fail("prekey was not assigned");
  if (existing.state === "consumed") {
    if (nowMs > existing.deleteAfterMs) fail("consumed prekey grace has expired");
    return { state, consumption: { id, retransmission: true } };
  }

  const draft = clone(state);
  const record = draft.records.find((entry) => entry.id === id);
  record.state = "consumed";
  record.consumedAtMs = nowMs;
  record.deleteAfterMs = nowMs + RETRANSMISSION_GRACE_MS;
  draft.revision += 1;
  const committed = commitDraft(state, draft, persist);
  return { state: committed, consumption: { id, retransmission: false } };
}

export function deleteExpiredPrekeys(state, { nowMs, persist } = {}) {
  validatePrekeyState(state);
  assertSafeInteger(nowMs, "nowMs");
  const draft = clone(state);
  draft.records = draft.records.filter(
    (record) => record.state !== "consumed" || nowMs <= record.deleteAfterMs,
  );
  if (draft.records.length === state.records.length) return state;
  draft.revision += 1;
  return commitDraft(state, draft, persist);
}

export function replenishPrekeys(state, { target = 8, nowMs, persist } = {}) {
  validatePrekeyState(state);
  assertSafeInteger(target, "target");
  assertSafeInteger(nowMs, "nowMs");
  if (target < 1 || target > 255) fail("invalid prekey replenishment target");
  const available = state.records.filter((record) => record.state === "available").length;
  if (available >= target) return state;
  const needed = target - available;
  if (state.nextId === null || state.nextId + needed - 1 > UINT32_MAX) {
    fail("prekey identifier space exhausted; wrap is forbidden");
  }
  const draft = clone(state);
  for (let index = 0; index < needed; index += 1) {
    const id = draft.nextId;
    draft.records.push({
      id,
      state: "available",
      messageId: null,
      digest: null,
      assignedAtMs: null,
      consumedAtMs: null,
      deleteAfterMs: null,
    });
    draft.nextId = id === UINT32_MAX ? null : id + 1;
  }
  draft.generatedAtMs = Math.max(nowMs, draft.generatedAtMs + 1);
  draft.bundleGeneration += 1;
  draft.revision += 1;
  return commitDraft(state, draft, persist);
}

function validateRemoteBundle(bundle, nowMs) {
  if (!bundle || typeof bundle.namespace !== "string") fail("invalid remote bundle");
  for (const [value, name] of [
    [bundle.generation, "bundle generation"],
    [bundle.revision, "bundle revision"],
    [bundle.generatedAtMs, "bundle generatedAtMs"],
  ]) {
    assertSafeInteger(value, name);
    if (value < 1) fail(`${name} must be positive`);
  }
  validateBundleClock(bundle.generatedAtMs, nowMs);
  if (!Array.isArray(bundle.prekeyIds) || bundle.prekeyIds.length < 1 || bundle.prekeyIds.length > 255) {
    fail("invalid remote prekey list");
  }
  const seen = new Set();
  for (const id of bundle.prekeyIds) {
    assertSafeInteger(id, "remote prekey ID");
    if (id < 0 || id > UINT32_MAX || seen.has(id)) fail("invalid or duplicate remote prekey ID");
    seen.add(id);
  }
}

export function ingestRemoteBundle(previous, incoming, { nowMs, persist } = {}) {
  validateRemoteBundle(incoming, nowMs);
  if (previous) {
    validateRemoteBundle(previous, nowMs);
    if (previous.namespace !== incoming.namespace) fail("remote prekey namespace changed");
    if (
      incoming.generation < previous.generation ||
      incoming.revision < previous.revision
    ) {
      fail("remote prekey bundle rollback detected");
    }
    if (
      incoming.generation === previous.generation &&
      incoming.revision === previous.revision
    ) {
      if (stableStringify(incoming) !== stableStringify(previous)) {
        fail("conflicting remote bundle at the same generation and revision");
      }
      return { bundle: previous, retransmission: true };
    }
  }
  const committed = commitDraft(previous, clone(incoming), persist);
  return { bundle: committed, retransmission: false };
}

export function benchmarkDigest(index) {
  return index.toString(16).padStart(64, "0").slice(-64);
}
