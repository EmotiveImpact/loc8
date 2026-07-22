import { createHash } from "node:crypto";

export const MANIFEST_SCHEMA = "loc8.mesh-field-manifest.v1";
export const EVENT_SCHEMA = "loc8.mesh-field-evidence.v1";
export const PROTOCOL_VERSION = "mesh-01.e01.v1";
export const ROLES = Object.freeze(["A", "B", "C"]);
export const MAX_CLOCK_UNCERTAINTY_NS = 100_000_000n;

export function maxPairClockUncertaintyNs(clockSync) {
  const uncertainties = clockSync.map((clock) => BigInt(clock.uncertaintyNs));
  let maximum = 0n;
  for (let left = 0; left < uncertainties.length; left += 1) {
    for (let right = left + 1; right < uncertainties.length; right += 1) {
      const combined = uncertainties[left] + uncertainties[right];
      if (combined > maximum) maximum = combined;
    }
  }
  return maximum;
}
export const MAX_EVENTS_PER_DEVICE = 20_000;
export const MAX_DEVICE_BLOCK_EXPORTS = 32;

export const ACTIONS = Object.freeze([
  "diagnostics-started",
  "link-up",
  "link-down",
  "origin",
  "ingress",
  "duplicate-drop",
  "stale-drop",
  "future-drop",
  "malformed-drop",
  "relay-scheduled",
  "relay-cancelled",
  "relay-forwarded",
  "application-delivery",
  "egress-skipped",
  "diagnostics-stopped",
]);

export const DROP_REASONS = Object.freeze([
  "duplicate",
  "stale",
  "future",
  "malformed",
  "mtu-too-small",
  "write-backpressure-overflow",
  "notify-backpressure-overflow",
  "scheduled-relay-cancelled",
  "diagnostic-overflow",
]);

const MANIFEST_KEYS = Object.freeze([
  "schema",
  "protocol",
  "runId",
  "evidenceClass",
  "createdAt",
  "build",
  "devices",
  "cohorts",
  "blocks",
  "clockSync",
  "geometry",
  "privacy",
  "diagnostics",
]);

const EVENT_KEYS = Object.freeze([
  "schema",
  "runId",
  "cohortId",
  "blockId",
  "deviceRole",
  "eventIndex",
  "monotonicNs",
  "wallTimeMs",
  "action",
  "frameId",
  "sequence",
  "originRole",
  "ttlBefore",
  "ttlAfter",
  "linkHandle",
  "reason",
  "payloadBytes",
  "wireBytes",
]);

const FRAME_ACTIONS = new Set([
  "origin",
  "ingress",
  "duplicate-drop",
  "stale-drop",
  "future-drop",
  "relay-scheduled",
  "relay-cancelled",
  "relay-forwarded",
  "application-delivery",
  "egress-skipped",
]);

const DROP_ACTIONS = new Set([
  "duplicate-drop",
  "stale-drop",
  "future-drop",
  "malformed-drop",
  "relay-cancelled",
  "egress-skipped",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function pushIssue(issues, code, path, message) {
  issues.push({ code, path, message });
}

function exactKeys(issues, value, expected, path) {
  if (!isPlainObject(value)) {
    pushIssue(issues, "TYPE_OBJECT", path, "must be an object");
    return false;
  }
  const expectedSet = new Set(expected);
  for (const key of Object.keys(value)) {
    if (!expectedSet.has(key)) {
      pushIssue(issues, "UNKNOWN_FIELD", `${path}.${key}`, "field is not allowed");
    }
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) {
      pushIssue(issues, "MISSING_FIELD", `${path}.${key}`, "required field is missing");
    }
  }
  return true;
}

function boundedString(issues, value, path, { min = 1, max = 128, pattern } = {}) {
  if (typeof value !== "string") {
    pushIssue(issues, "TYPE_STRING", path, "must be a string");
    return false;
  }
  if (value.length < min || value.length > max) {
    pushIssue(issues, "STRING_LENGTH", path, `must contain ${min}..${max} characters`);
    return false;
  }
  if (pattern && !pattern.test(value)) {
    pushIssue(issues, "STRING_PATTERN", path, "has an invalid format");
    return false;
  }
  return true;
}

function finiteNumber(issues, value, path, { min = -Infinity, max = Infinity } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    pushIssue(issues, "TYPE_NUMBER", path, "must be a finite number");
    return false;
  }
  if (value < min || value > max) {
    pushIssue(issues, "NUMBER_RANGE", path, `must be within ${min}..${max}`);
    return false;
  }
  return true;
}

function safeInteger(issues, value, path, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value)) {
    pushIssue(issues, "TYPE_SAFE_INTEGER", path, "must be a safe integer");
    return false;
  }
  if (value < min || value > max) {
    pushIssue(issues, "INTEGER_RANGE", path, `must be within ${min}..${max}`);
    return false;
  }
  return true;
}

function exactBoolean(issues, value, expected, path) {
  if (value !== expected) {
    pushIssue(issues, "BOOLEAN_POLICY", path, `must be ${expected}`);
    return false;
  }
  return true;
}

function enumValue(issues, value, allowed, path) {
  if (!allowed.includes(value)) {
    pushIssue(issues, "ENUM", path, `must be one of ${allowed.join(", ")}`);
    return false;
  }
  return true;
}

function decimalBigInt(issues, value, path) {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]{0,19})$/u.test(value)) {
    pushIssue(issues, "DECIMAL_UINT", path, "must be a canonical unsigned decimal string");
    return null;
  }
  try {
    const parsed = BigInt(value);
    if (parsed > 18_446_744_073_709_551_615n) throw new RangeError();
    return parsed;
  } catch {
    pushIssue(issues, "UINT64_RANGE", path, "must fit UInt64");
    return null;
  }
}

function signedDecimalBigInt(issues, value, path) {
  if (typeof value !== "string" || !/^-?(?:0|[1-9][0-9]{0,19})$/u.test(value) || value === "-0") {
    pushIssue(issues, "DECIMAL_INT", path, "must be a canonical signed decimal string");
    return null;
  }
  try {
    const parsed = BigInt(value);
    if (parsed < -9_223_372_036_854_775_808n || parsed > 9_223_372_036_854_775_807n) {
      throw new RangeError();
    }
    return parsed;
  } catch {
    pushIssue(issues, "INT64_RANGE", path, "must fit Int64");
    return null;
  }
}

function validateBuild(issues, build, path) {
  const keys = [
    "gitCommit",
    "appVersion",
    "expoVersion",
    "reactNativeVersion",
    "diagnosticSchema",
    "wireVersion",
    "serviceUuid",
    "identicalOnAllDevices",
  ];
  if (!exactKeys(issues, build, keys, path)) return;
  boundedString(issues, build.gitCommit, `${path}.gitCommit`, {
    min: 40,
    max: 40,
    pattern: /^[a-f0-9]{40}$/u,
  });
  for (const key of ["appVersion", "expoVersion", "reactNativeVersion", "wireVersion"]) {
    boundedString(issues, build[key], `${path}.${key}`, { max: 64, pattern: /^[A-Za-z0-9._+~-]+$/u });
  }
  if (build.diagnosticSchema !== EVENT_SCHEMA) {
    pushIssue(issues, "DIAGNOSTIC_SCHEMA", `${path}.diagnosticSchema`, `must equal ${EVENT_SCHEMA}`);
  }
  boundedString(issues, build.serviceUuid, `${path}.serviceUuid`, {
    min: 36,
    max: 36,
    pattern: /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/u,
  });
  exactBoolean(issues, build.identicalOnAllDevices, true, `${path}.identicalOnAllDevices`);
}

function validateDevices(issues, devices, evidenceClass, path) {
  if (!Array.isArray(devices) || devices.length !== 3) {
    pushIssue(issues, "DEVICE_COUNT", path, "must contain exactly A, B and C");
    return;
  }
  const seen = new Set();
  devices.forEach((device, index) => {
    const itemPath = `${path}[${index}]`;
    const keys = [
      "role",
      "model",
      "osName",
      "osVersion",
      "nativeBuildId",
      "syntheticSenderId",
      "batteryStartPct",
      "permissions",
    ];
    if (!exactKeys(issues, device, keys, itemPath)) return;
    if (enumValue(issues, device.role, ROLES, `${itemPath}.role`)) {
      if (seen.has(device.role)) pushIssue(issues, "DUPLICATE_ROLE", `${itemPath}.role`, "device role is duplicated");
      seen.add(device.role);
    }
    boundedString(issues, device.model, `${itemPath}.model`, { max: 80, pattern: /^[A-Za-z0-9 ._+()-]+$/u });
    enumValue(issues, device.osName, ["iOS", "Android", "synthetic"], `${itemPath}.osName`);
    boundedString(issues, device.osVersion, `${itemPath}.osVersion`, { max: 64, pattern: /^[A-Za-z0-9 ._+()-]+$/u });
    boundedString(issues, device.nativeBuildId, `${itemPath}.nativeBuildId`, { max: 80, pattern: /^[A-Za-z0-9._+-]+$/u });
    safeInteger(issues, device.syntheticSenderId, `${itemPath}.syntheticSenderId`, { min: 1, max: 0xffff_ffff });
    finiteNumber(issues, device.batteryStartPct, `${itemPath}.batteryStartPct`, { min: 0, max: 100 });
    const permissionKeys = ["bluetooth", "location", "foregroundService"];
    if (exactKeys(issues, device.permissions, permissionKeys, `${itemPath}.permissions`)) {
      for (const key of permissionKeys) exactBoolean(issues, device.permissions[key], true, `${itemPath}.permissions.${key}`);
    }
    if (evidenceClass === "physical" && device.osName === "synthetic") {
      pushIssue(issues, "SYNTHETIC_DEVICE", `${itemPath}.osName`, "physical evidence cannot use a synthetic device");
    }
  });
  for (const role of ROLES) {
    if (!seen.has(role)) pushIssue(issues, "MISSING_ROLE", path, `role ${role} is missing`);
  }
  const senderIds = devices.map((device) => device?.syntheticSenderId).filter(Number.isSafeInteger);
  if (new Set(senderIds).size !== senderIds.length) {
    pushIssue(issues, "DUPLICATE_SENDER_ID", path, "synthetic sender IDs must be unique");
  }
}

function validateCohorts(issues, cohorts, path) {
  if (!Array.isArray(cohorts) || cohorts.length < 1 || cohorts.length > 8) {
    pushIssue(issues, "COHORT_COUNT", path, "must contain 1..8 cohorts");
    return new Set();
  }
  const ids = new Set();
  cohorts.forEach((cohort, index) => {
    const itemPath = `${path}[${index}]`;
    if (!exactKeys(issues, cohort, ["cohortId", "composition", "foregroundOnly"], itemPath)) return;
    if (boundedString(issues, cohort.cohortId, `${itemPath}.cohortId`, {
      max: 48,
      pattern: /^[a-z0-9][a-z0-9-]*$/u,
    })) {
      if (ids.has(cohort.cohortId)) pushIssue(issues, "DUPLICATE_COHORT", `${itemPath}.cohortId`, "cohort ID is duplicated");
      ids.add(cohort.cohortId);
    }
    boundedString(issues, cohort.composition, `${itemPath}.composition`, { max: 80, pattern: /^[A-Za-z0-9 ./+()-]+$/u });
    exactBoolean(issues, cohort.foregroundOnly, true, `${itemPath}.foregroundOnly`);
  });
  return ids;
}

function validateBlocks(issues, blocks, cohortIds, path) {
  if (!Array.isArray(blocks) || blocks.length < 1 || blocks.length > 64) {
    pushIssue(issues, "BLOCK_COUNT", path, "must contain 1..64 blocks");
    return new Map();
  }
  const byId = new Map();
  blocks.forEach((block, index) => {
    const itemPath = `${path}[${index}]`;
    const keys = [
      "blockId",
      "cohortId",
      "kind",
      "direction",
      "sourceRole",
      "destinationRole",
      "relayRole",
      "expectedAttempts",
      "intervalMs",
      "deliveryDeadlineMs",
    ];
    if (!exactKeys(issues, block, keys, itemPath)) return;
    if (boundedString(issues, block.blockId, `${itemPath}.blockId`, {
      max: 64,
      pattern: /^[a-z0-9][a-z0-9-]*$/u,
    })) {
      if (byId.has(block.blockId)) pushIssue(issues, "DUPLICATE_BLOCK", `${itemPath}.blockId`, "block ID is duplicated");
      byId.set(block.blockId, block);
    }
    if (!cohortIds.has(block.cohortId)) pushIssue(issues, "UNKNOWN_COHORT", `${itemPath}.cohortId`, "cohort is not declared");
    enumValue(issues, block.kind, ["near", "isolation-pre", "relay", "isolation-post"], `${itemPath}.kind`);
    enumValue(issues, block.sourceRole, ROLES, `${itemPath}.sourceRole`);
    enumValue(issues, block.destinationRole, ROLES, `${itemPath}.destinationRole`);
    if (block.sourceRole === block.destinationRole) pushIssue(issues, "SAME_ENDPOINT", itemPath, "source and destination must differ");
    const expectedDirection = `${block.sourceRole}-${block.destinationRole}`;
    if (block.direction !== expectedDirection) pushIssue(issues, "DIRECTION_MISMATCH", `${itemPath}.direction`, `must equal ${expectedDirection}`);
    if (block.kind === "relay") {
      if (block.relayRole !== "B" || !["A", "C"].includes(block.sourceRole) || !["A", "C"].includes(block.destinationRole)) {
        pushIssue(issues, "RELAY_TOPOLOGY", itemPath, "relay blocks must be A-B-C or C-B-A");
      }
      if (block.expectedAttempts !== 100) pushIssue(issues, "RELAY_ATTEMPTS", `${itemPath}.expectedAttempts`, "relay block must have 100 attempts");
    } else if (block.relayRole !== null) {
      pushIssue(issues, "UNEXPECTED_RELAY", `${itemPath}.relayRole`, "non-relay block must have null relayRole");
    }
    if (block.kind === "near" && block.expectedAttempts !== 10) {
      pushIssue(issues, "NEAR_ATTEMPTS", `${itemPath}.expectedAttempts`, "near block must have 10 attempts");
    }
    if (["isolation-pre", "isolation-post"].includes(block.kind) && block.expectedAttempts !== 50) {
      pushIssue(issues, "ISOLATION_ATTEMPTS", `${itemPath}.expectedAttempts`, "isolation block must have 50 attempts");
    }
    safeInteger(issues, block.expectedAttempts, `${itemPath}.expectedAttempts`, { min: 1, max: 255 });
    safeInteger(issues, block.intervalMs, `${itemPath}.intervalMs`, { min: 100, max: 60_000 });
    if (block.intervalMs !== 1_000) pushIssue(issues, "INTERVAL_POLICY", `${itemPath}.intervalMs`, "frozen interval is 1000 ms");
    if (block.deliveryDeadlineMs !== 10_000) pushIssue(issues, "DEADLINE_POLICY", `${itemPath}.deliveryDeadlineMs`, "frozen deadline is 10000 ms");
  });
  return byId;
}

function validateClockSync(issues, clockSync, path) {
  if (!Array.isArray(clockSync) || clockSync.length !== 3) {
    pushIssue(issues, "CLOCK_COUNT", path, "must contain one clock record per role");
    return new Map();
  }
  const byRole = new Map();
  clockSync.forEach((clock, index) => {
    const itemPath = `${path}[${index}]`;
    if (!exactKeys(issues, clock, ["role", "offsetNs", "uncertaintyNs"], itemPath)) return;
    if (enumValue(issues, clock.role, ROLES, `${itemPath}.role`)) {
      if (byRole.has(clock.role)) pushIssue(issues, "DUPLICATE_CLOCK", `${itemPath}.role`, "clock role is duplicated");
      byRole.set(clock.role, clock);
    }
    signedDecimalBigInt(issues, clock.offsetNs, `${itemPath}.offsetNs`);
    decimalBigInt(issues, clock.uncertaintyNs, `${itemPath}.uncertaintyNs`);
  });
  return byRole;
}

function validateGeometry(issues, geometry, path) {
  const keys = ["aToBM", "bToCM", "aToCM", "heightM", "orientation", "barrier", "isolationMethod", "fixedAcrossBlocks"];
  if (!exactKeys(issues, geometry, keys, path)) return;
  for (const key of ["aToBM", "bToCM", "aToCM"]) finiteNumber(issues, geometry[key], `${path}.${key}`, { min: 0.1, max: 10_000 });
  finiteNumber(issues, geometry.heightM, `${path}.heightM`, { min: 0.1, max: 5 });
  for (const key of ["orientation", "barrier", "isolationMethod"]) {
    boundedString(issues, geometry[key], `${path}.${key}`, { max: 160, pattern: /^[A-Za-z0-9 .,/+():_-]+$/u });
  }
  exactBoolean(issues, geometry.fixedAcrossBlocks, true, `${path}.fixedAcrossBlocks`);
}

function validatePrivacy(issues, privacy, path) {
  const keys = [
    "siteAuthorised",
    "operatorAuthorised",
    "syntheticPayloadsOnly",
    "gpsCaptured",
    "personalNamesCaptured",
    "rawRadioIdentifiersCaptured",
    "rawBundleUri",
    "encryptedAtRest",
    "accessLogged",
    "retentionDays",
    "deletionOwner",
  ];
  if (!exactKeys(issues, privacy, keys, path)) return;
  for (const key of ["siteAuthorised", "operatorAuthorised", "syntheticPayloadsOnly", "encryptedAtRest", "accessLogged"]) {
    exactBoolean(issues, privacy[key], true, `${path}.${key}`);
  }
  for (const key of ["gpsCaptured", "personalNamesCaptured", "rawRadioIdentifiersCaptured"]) {
    exactBoolean(issues, privacy[key], false, `${path}.${key}`);
  }
  boundedString(issues, privacy.rawBundleUri, `${path}.rawBundleUri`, {
    max: 200,
    pattern: /^research:\/\/[a-z0-9][a-z0-9./_-]*$/u,
  });
  safeInteger(issues, privacy.retentionDays, `${path}.retentionDays`, { min: 1, max: 366 });
  boundedString(issues, privacy.deletionOwner, `${path}.deletionOwner`, { max: 80, pattern: /^[A-Za-z0-9 ._+&'-]+$/u });
}

function validateDiagnostics(issues, diagnostics, path) {
  const keys = ["maxEventsPerDevice", "overflowCounts", "linkHandlesRunScoped", "rawIdentifiersExported"];
  if (!exactKeys(issues, diagnostics, keys, path)) return;
  safeInteger(issues, diagnostics.maxEventsPerDevice, `${path}.maxEventsPerDevice`, { min: 1_000, max: MAX_EVENTS_PER_DEVICE });
  if (diagnostics.maxEventsPerDevice !== MAX_EVENTS_PER_DEVICE) {
    pushIssue(issues, "DIAGNOSTIC_BOUND", `${path}.maxEventsPerDevice`, `must equal frozen ${MAX_EVENTS_PER_DEVICE}`);
  }
  if (exactKeys(issues, diagnostics.overflowCounts, ROLES, `${path}.overflowCounts`)) {
    for (const role of ROLES) {
      safeInteger(issues, diagnostics.overflowCounts[role], `${path}.overflowCounts.${role}`, { min: 0, max: MAX_EVENTS_PER_DEVICE });
      if (diagnostics.overflowCounts[role] !== 0) pushIssue(issues, "DIAGNOSTIC_OVERFLOW", `${path}.overflowCounts.${role}`, "overflow invalidates the evidence");
    }
  }
  exactBoolean(issues, diagnostics.linkHandlesRunScoped, true, `${path}.linkHandlesRunScoped`);
  exactBoolean(issues, diagnostics.rawIdentifiersExported, false, `${path}.rawIdentifiersExported`);
}

export function validateManifest(manifest) {
  const issues = [];
  if (!exactKeys(issues, manifest, MANIFEST_KEYS, "$")) return issues;
  if (manifest.schema !== MANIFEST_SCHEMA) pushIssue(issues, "MANIFEST_SCHEMA", "$.schema", `must equal ${MANIFEST_SCHEMA}`);
  if (manifest.protocol !== PROTOCOL_VERSION) pushIssue(issues, "PROTOCOL", "$.protocol", `must equal ${PROTOCOL_VERSION}`);
  boundedString(issues, manifest.runId, "$.runId", { min: 8, max: 64, pattern: /^[a-z0-9][a-z0-9-]*$/u });
  enumValue(issues, manifest.evidenceClass, ["physical", "synthetic"], "$.evidenceClass");
  boundedString(issues, manifest.createdAt, "$.createdAt", {
    min: 20,
    max: 32,
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u,
  });
  validateBuild(issues, manifest.build, "$.build");
  validateDevices(issues, manifest.devices, manifest.evidenceClass, "$.devices");
  const cohortIds = validateCohorts(issues, manifest.cohorts, "$.cohorts");
  const blocks = validateBlocks(issues, manifest.blocks, cohortIds, "$.blocks");
  const clocks = validateClockSync(issues, manifest.clockSync, "$.clockSync");
  validateGeometry(issues, manifest.geometry, "$.geometry");
  validatePrivacy(issues, manifest.privacy, "$.privacy");
  validateDiagnostics(issues, manifest.diagnostics, "$.diagnostics");

  const blockKinds = [...blocks.values()].reduce((map, block) => {
    const key = `${block.kind}:${block.direction}`;
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map());
  for (const direction of ["A-C", "C-A"]) {
    for (const kind of ["isolation-pre", "isolation-post"]) {
      if (blockKinds.get(`${kind}:${direction}`) !== 1) {
        pushIssue(issues, "BLOCK_MATRIX", "$.blocks", `requires exactly one ${kind} ${direction} block`);
      }
    }
    if (blockKinds.get(`relay:${direction}`) !== 2) {
      pushIssue(issues, "BLOCK_MATRIX", "$.blocks", `requires exactly two relay ${direction} blocks`);
    }
  }
  for (const direction of ["A-B", "B-A", "B-C", "C-B", "A-C", "C-A"]) {
    if (blockKinds.get(`near:${direction}`) !== 1) {
      pushIssue(issues, "BLOCK_MATRIX", "$.blocks", `requires exactly one near ${direction} block`);
    }
  }
  for (const role of ROLES) {
    if (!clocks.has(role)) pushIssue(issues, "MISSING_CLOCK", "$.clockSync", `role ${role} clock is missing`);
  }
  return issues;
}

function validateEventShape(issues, event, index) {
  const path = `$events[${index}]`;
  if (!exactKeys(issues, event, EVENT_KEYS, path)) return;
  if (event.schema !== EVENT_SCHEMA) pushIssue(issues, "EVENT_SCHEMA", `${path}.schema`, `must equal ${EVENT_SCHEMA}`);
  boundedString(issues, event.runId, `${path}.runId`, { min: 8, max: 64, pattern: /^[a-z0-9][a-z0-9-]*$/u });
  boundedString(issues, event.cohortId, `${path}.cohortId`, { max: 48, pattern: /^[a-z0-9][a-z0-9-]*$/u });
  boundedString(issues, event.blockId, `${path}.blockId`, { max: 64, pattern: /^[a-z0-9][a-z0-9-]*$/u });
  enumValue(issues, event.deviceRole, ROLES, `${path}.deviceRole`);
  safeInteger(issues, event.eventIndex, `${path}.eventIndex`, { min: 0, max: 0xffff_ffff });
  decimalBigInt(issues, event.monotonicNs, `${path}.monotonicNs`);
  safeInteger(issues, event.wallTimeMs, `${path}.wallTimeMs`, { min: 0 });
  enumValue(issues, event.action, ACTIONS, `${path}.action`);

  const frameRelated = FRAME_ACTIONS.has(event.action);
  if (frameRelated) {
    boundedString(issues, event.frameId, `${path}.frameId`, { min: 64, max: 64, pattern: /^[a-f0-9]{64}$/u });
    enumValue(issues, event.originRole, ROLES, `${path}.originRole`);
  } else {
    for (const key of ["frameId", "sequence", "originRole", "ttlBefore", "ttlAfter", "payloadBytes", "wireBytes"]) {
      if (event[key] !== null) pushIssue(issues, "NON_FRAME_FIELD", `${path}.${key}`, "must be null for a non-frame event");
    }
  }

  if (event.action === "origin") {
    safeInteger(issues, event.sequence, `${path}.sequence`, { min: 0, max: 99 });
    if (event.originRole !== event.deviceRole) pushIssue(issues, "ORIGIN_ROLE", `${path}.originRole`, "must equal the originating device role");
    if (event.ttlBefore !== 7 || event.ttlAfter !== 7) pushIssue(issues, "ORIGIN_TTL", path, "origin TTL must be 7/7");
    if (event.linkHandle !== null) pushIssue(issues, "ORIGIN_LINK", `${path}.linkHandle`, "origin has no ingress link");
  } else if (frameRelated && event.sequence !== null) {
    pushIssue(issues, "SEQUENCE_SCOPE", `${path}.sequence`, "sequence is present only on origin events");
  }

  for (const key of ["ttlBefore", "ttlAfter"]) {
    if (event[key] !== null) safeInteger(issues, event[key], `${path}.${key}`, { min: 0, max: 7 });
  }
  if (event.action === "relay-forwarded") {
    if (event.deviceRole !== "B") pushIssue(issues, "FORWARD_ROLE", `${path}.deviceRole`, "relay-forwarded must occur on B");
    if (!Number.isSafeInteger(event.ttlBefore) || !Number.isSafeInteger(event.ttlAfter) || event.ttlAfter >= event.ttlBefore || event.ttlAfter > 6) {
      pushIssue(issues, "FORWARD_TTL", path, "relay-forwarded must decrement TTL to at most 6");
    }
  }
  if (["ingress", "duplicate-drop", "relay-scheduled", "relay-cancelled", "application-delivery"].includes(event.action) && event.linkHandle === null) {
    pushIssue(issues, "MISSING_LINK", `${path}.linkHandle`, "action requires a run-scoped link handle");
  }
  if (event.linkHandle !== null) boundedString(issues, event.linkHandle, `${path}.linkHandle`, { min: 16, max: 16, pattern: /^[a-f0-9]{16}$/u });
  if (DROP_ACTIONS.has(event.action)) {
    enumValue(issues, event.reason, DROP_REASONS, `${path}.reason`);
  } else if (event.reason !== null) {
    pushIssue(issues, "UNEXPECTED_REASON", `${path}.reason`, "reason is allowed only on a drop/cancel/skip event");
  }
  if (frameRelated && event.action !== "malformed-drop") {
    if (event.payloadBytes !== 25) pushIssue(issues, "PAYLOAD_BYTES", `${path}.payloadBytes`, "must equal 25");
    if (event.wireBytes !== 47) pushIssue(issues, "WIRE_BYTES", `${path}.wireBytes`, "must equal 47");
  }
}

export function validateBundle(manifest, events) {
  const issues = validateManifest(manifest);
  if (!Array.isArray(events)) {
    pushIssue(issues, "EVENTS_ARRAY", "$events", "must be an array");
    return issues;
  }
  if (events.length > MAX_EVENTS_PER_DEVICE * MAX_DEVICE_BLOCK_EXPORTS) {
    pushIssue(issues, "EVENT_BUNDLE_BOUND", "$events", "event bundle exceeds the frozen bound");
  }
  events.forEach((event, index) => validateEventShape(issues, event, index));
  if (!isPlainObject(manifest)) return issues;

  const blocks = new Map((manifest.blocks ?? []).filter(isPlainObject).map((block) => [block.blockId, block]));
  const cohortIds = new Set((manifest.cohorts ?? []).filter(isPlainObject).map((cohort) => cohort.cohortId));
  const lastIndex = new Map();
  const lastMonotonic = new Map();
  const indexesByExport = new Map();
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!isPlainObject(event)) continue;
    const path = `$events[${index}]`;
    if (event.runId !== manifest.runId) pushIssue(issues, "RUN_MISMATCH", `${path}.runId`, "does not match manifest");
    const block = blocks.get(event.blockId);
    if (!block) pushIssue(issues, "UNKNOWN_BLOCK", `${path}.blockId`, "block is not declared");
    if (!cohortIds.has(event.cohortId)) pushIssue(issues, "UNKNOWN_COHORT", `${path}.cohortId`, "cohort is not declared");
    if (block && event.cohortId !== block.cohortId) pushIssue(issues, "BLOCK_COHORT", `${path}.cohortId`, "does not match block cohort");
    if (ROLES.includes(event.deviceRole) && Number.isSafeInteger(event.eventIndex)) {
      const exportKey = `${event.deviceRole}:${event.blockId}`;
      const previous = lastIndex.get(exportKey);
      if (previous !== undefined && event.eventIndex <= previous) {
        pushIssue(issues, "EVENT_INDEX_ORDER", `${path}.eventIndex`, "must increase strictly per device/block export");
      }
      lastIndex.set(exportKey, event.eventIndex);
      const indexes = indexesByExport.get(exportKey) ?? [];
      indexes.push(event.eventIndex);
      indexesByExport.set(exportKey, indexes);
    }
    if (ROLES.includes(event.deviceRole) && typeof event.monotonicNs === "string" && /^\d+$/u.test(event.monotonicNs)) {
      const exportKey = `${event.deviceRole}:${event.blockId}`;
      const current = BigInt(event.monotonicNs);
      const previous = lastMonotonic.get(exportKey);
      if (previous !== undefined && current < previous) {
        pushIssue(issues, "MONOTONIC_ORDER", `${path}.monotonicNs`, "must not decrease per device/block export");
      }
      lastMonotonic.set(exportKey, current);
    }
    if (block && event.action === "origin" && event.deviceRole !== block.sourceRole) {
      pushIssue(issues, "BLOCK_SOURCE", `${path}.deviceRole`, "origin device does not match block source");
    }
    if (block && event.action === "application-delivery" && event.deviceRole !== block.destinationRole) {
      pushIssue(issues, "BLOCK_DESTINATION", `${path}.deviceRole`, "delivery device does not match block destination");
    }
    if (block && event.originRole !== null && event.originRole !== block.sourceRole) {
      pushIssue(issues, "BLOCK_ORIGIN_ROLE", `${path}.originRole`, "origin role does not match block source");
    }
    if (block && ROLES.includes(event.deviceRole)) {
      const participatingRoles = block.kind === "relay"
        ? [block.sourceRole, block.relayRole, block.destinationRole]
        : [block.sourceRole, block.destinationRole];
      if (!participatingRoles.includes(event.deviceRole)) {
        pushIssue(issues, "UNEXPECTED_BLOCK_ROLE", `${path}.deviceRole`, "device is not a participant in this block");
      }
    }
  }
  for (const [exportKey, indexes] of indexesByExport) {
    if (indexes.length > (manifest.diagnostics?.maxEventsPerDevice ?? MAX_EVENTS_PER_DEVICE)) {
      pushIssue(issues, "DEVICE_EVENT_BOUND", "$events", `${exportKey} exceeds the per-device/block diagnostic bound`);
    }
    if (!indexes.every((value, index) => value === index)) {
      pushIssue(issues, "EVENT_INDEX_GAP", "$events", `${exportKey} event indexes must be contiguous from zero`);
    }
  }

  const originsByFrame = new Map();
  for (const event of events.filter(isPlainObject)) {
    if (event.action !== "origin" || typeof event.frameId !== "string") continue;
    const prior = originsByFrame.get(event.frameId);
    if (prior) {
      pushIssue(issues, "DUPLICATE_FRAME_ORIGIN", "$events", `frame ${event.frameId} has more than one origin`);
    } else {
      originsByFrame.set(event.frameId, event);
    }
  }
  for (const event of events.filter(isPlainObject)) {
    if (!FRAME_ACTIONS.has(event.action) || event.action === "origin" || typeof event.frameId !== "string") continue;
    const origin = originsByFrame.get(event.frameId);
    if (!origin) {
      pushIssue(issues, "ORPHAN_FRAME_EVENT", "$events", `frame ${event.frameId} has no declared origin`);
    } else if (origin.blockId !== event.blockId) {
      pushIssue(issues, "CROSS_BLOCK_FRAME", "$events", `frame ${event.frameId} crosses block boundaries`);
    }
  }

  for (const block of blocks.values()) {
    const roles = block.kind === "relay"
      ? [block.sourceRole, block.relayRole, block.destinationRole]
      : [block.sourceRole, block.destinationRole];
    for (const role of roles) {
      const deviceBlockEvents = events.filter((event) =>
        isPlainObject(event) && event.blockId === block.blockId && event.deviceRole === role,
      );
      const starts = deviceBlockEvents.filter((event) => event.action === "diagnostics-started");
      const stops = deviceBlockEvents.filter((event) => event.action === "diagnostics-stopped");
      if (starts.length !== 1 || stops.length !== 1) {
        pushIssue(issues, "DIAGNOSTIC_BOUNDARY", "$events", `${block.blockId}/${role} requires exactly one diagnostics start and stop`);
      } else if (BigInt(stops[0].monotonicNs) < BigInt(starts[0].monotonicNs)) {
        pushIssue(issues, "DIAGNOSTIC_BOUNDARY_ORDER", "$events", `${block.blockId}/${role} stop precedes start`);
      } else {
        const finalIndex = Math.max(...deviceBlockEvents.map((event) => event.eventIndex));
        if (starts[0].eventIndex !== 0 || stops[0].eventIndex !== finalIndex) {
          pushIssue(issues, "DIAGNOSTIC_BOUNDARY_POSITION", "$events", `${block.blockId}/${role} start must be first and stop must be last`);
        }
      }
    }
  }
  return issues;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256Hex(value) {
  return createHash("sha256").update(typeof value === "string" ? value : stableStringify(value)).digest("hex");
}

function normalizedNs(event, clocks) {
  const clock = clocks.get(event.deviceRole);
  return BigInt(event.monotonicNs) + BigInt(clock.offsetNs);
}

function nearestRank(values, probability) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(probability * sorted.length) - 1)];
}

function blockMetrics(block, events, clocks, latencyUsable) {
  const blockEvents = events.filter((event) => event.blockId === block.blockId);
  const origins = blockEvents.filter((event) => event.action === "origin" && event.deviceRole === block.sourceRole);
  const sequenceCounts = new Map();
  for (const event of origins) sequenceCounts.set(event.sequence, (sequenceCounts.get(event.sequence) ?? 0) + 1);
  const distinctSequences = [...sequenceCounts.keys()].sort((left, right) => left - right);
  const exactSequenceSet = distinctSequences.length === block.expectedAttempts &&
    distinctSequences.every((sequence, index) => sequence === index) &&
    [...sequenceCounts.values()].every((count) => count === 1);

  let delivered = 0;
  let deliveredWithinDeadline = 0;
  let applicationDuplicates = 0;
  let relayProved = 0;
  let relayPathProvedTotal = 0;
  let relayForwardCount = 0;
  let relayExactlyOnce = 0;
  let relayMultipleForwardFrames = 0;
  const latencyMs = [];
  const frameOutcomes = [];

  for (const origin of origins) {
    const sameFrame = blockEvents.filter((event) => event.frameId === origin.frameId);
    const destinationIngress = sameFrame.filter((event) => event.action === "ingress" && event.deviceRole === block.destinationRole);
    const deliveries = sameFrame.filter((event) => event.action === "application-delivery" && event.deviceRole === block.destinationRole);
    const forwards = block.kind === "relay"
      ? sameFrame.filter((event) => event.action === "relay-forwarded" && event.deviceRole === block.relayRole)
      : [];
    const relayIngress = block.kind === "relay"
      ? sameFrame.filter((event) => event.action === "ingress" && event.deviceRole === block.relayRole)
      : [];
    relayForwardCount += forwards.length;
    if (forwards.length > 1) relayMultipleForwardFrames += 1;
    if (deliveries.length > 0) delivered += 1;
    if (deliveries.length > 1) applicationDuplicates += deliveries.length - 1;

    let latency = null;
    let withinDeadline = false;
    if (deliveries.length > 0 && latencyUsable) {
      const nanoseconds = normalizedNs(deliveries[0], clocks) - normalizedNs(origin, clocks);
      latency = Number(nanoseconds) / 1_000_000;
      if (Number.isFinite(latency) && latency >= 0) {
        latencyMs.push(latency);
        withinDeadline = latency <= block.deliveryDeadlineMs;
        if (withinDeadline) deliveredWithinDeadline += 1;
      }
    }
    if (withinDeadline && forwards.length === 1) relayExactlyOnce += 1;

    let pathProved = false;
    if (block.kind === "relay" && deliveries.length === 1 && relayIngress.length >= 1 && forwards.length === 1 && destinationIngress.length >= 1) {
      const forward = forwards[0];
      const destination = destinationIngress[0];
      const relayIngressBeforeForward = relayIngress.some((event) => normalizedNs(event, clocks) <= normalizedNs(forward, clocks));
      const forwardingBeforeDestination = normalizedNs(forward, clocks) <= normalizedNs(destination, clocks);
      const ingressBeforeDelivery = normalizedNs(destination, clocks) <= normalizedNs(deliveries[0], clocks);
      pathProved = relayIngress.some((event) => event.ttlBefore === 7) &&
        forward.ttlBefore === 7 && forward.ttlAfter <= 6 && forward.ttlAfter < forward.ttlBefore &&
        destination.ttlBefore === forward.ttlAfter && deliveries[0].ttlBefore === forward.ttlAfter &&
        relayIngressBeforeForward && forwardingBeforeDestination && ingressBeforeDelivery;
      if (pathProved) {
        relayPathProvedTotal += 1;
        if (withinDeadline) relayProved += 1;
      }
    }

    frameOutcomes.push({
      sequence: origin.sequence,
      frameId: origin.frameId,
      deliveries: deliveries.length,
      withinDeadline,
      latencyMs: latency,
      relayIngress: relayIngress.length,
      relayForwards: forwards.length,
      destinationIngress: destinationIngress.length,
      pathProved,
    });
  }

  return {
    blockId: block.blockId,
    kind: block.kind,
    direction: block.direction,
    expectedAttempts: block.expectedAttempts,
    attempted: origins.length,
    distinctSequences: distinctSequences.length,
    exactSequenceSet,
    delivered,
    deliveredWithinDeadline,
    deliveryRatio: origins.length === 0 ? null : deliveredWithinDeadline / origins.length,
    applicationDuplicates,
    relayProved,
    relayPathProvedTotal,
    relayProofRatio: deliveredWithinDeadline === 0 ? null : relayProved / deliveredWithinDeadline,
    relayForwardCount,
    relayExactlyOnce,
    relayMultipleForwardFrames,
    latencyMs: latencyUsable ? {
      count: latencyMs.length,
      p50: nearestRank(latencyMs, 0.5),
      p95: nearestRank(latencyMs, 0.95),
      p99: nearestRank(latencyMs, 0.99),
      max: latencyMs.length === 0 ? null : Math.max(...latencyMs),
    } : null,
    frameOutcomes,
  };
}

export function evaluateMeshRun(manifest, events) {
  const issues = validateBundle(manifest, events);
  if (issues.length > 0) {
    return {
      schema: "loc8.mesh-field-result.v1",
      runId: manifest?.runId ?? null,
      evidenceClass: manifest?.evidenceClass ?? null,
      decision: "INCOMPLETE",
      counterfactualDecision: "INCOMPLETE",
      issues,
      resultFingerprintSha256: sha256Hex({ decision: "INCOMPLETE", issues }),
    };
  }

  const clocks = new Map(manifest.clockSync.map((clock) => [clock.role, clock]));
  const pairClockUncertaintyNs = maxPairClockUncertaintyNs(manifest.clockSync);
  const latencyUsable = pairClockUncertaintyNs <= MAX_CLOCK_UNCERTAINTY_NS;
  const blocks = manifest.blocks.map((block) => blockMetrics(block, events, clocks, latencyUsable));
  const near = blocks.filter((block) => block.kind === "near");
  const isolation = blocks.filter((block) => block.kind.startsWith("isolation"));
  const relay = blocks.filter((block) => block.kind === "relay");
  const isolationBlockIds = new Set(isolation.map((block) => block.blockId));
  const isolationLinkUps = events.filter((event) => isolationBlockIds.has(event.blockId) && event.action === "link-up").length;
  const unexpectedDirectDeliveries = isolation.reduce((sum, block) => sum + block.delivered, 0);
  const exactAttempts = blocks.every((block) => block.exactSequenceSet && block.attempted === block.expectedAttempts);
  const nearPass = near.length === 6 && near.every((block) =>
    block.deliveredWithinDeadline === block.expectedAttempts && block.applicationDuplicates === 0,
  );

  const relayDirections = {};
  for (const direction of ["A-C", "C-A"]) {
    const directionBlocks = relay.filter((block) => block.direction === direction);
    const attempted = directionBlocks.reduce((sum, block) => sum + block.attempted, 0);
    const delivered = directionBlocks.reduce((sum, block) => sum + block.deliveredWithinDeadline, 0);
    const applicationDuplicates = directionBlocks.reduce((sum, block) => sum + block.applicationDuplicates, 0);
    const relayProved = directionBlocks.reduce((sum, block) => sum + block.relayProved, 0);
    const relayForwards = directionBlocks.reduce((sum, block) => sum + block.relayForwardCount, 0);
    const exactForwardFrames = directionBlocks.reduce((sum, block) => sum + block.relayExactlyOnce, 0);
    const multipleForwardFrames = directionBlocks.reduce((sum, block) => sum + block.relayMultipleForwardFrames, 0);
    const latencies = directionBlocks.flatMap((block) => block.latencyMs === null
      ? []
      : block.frameOutcomes.map((frame) => frame.latencyMs).filter(Number.isFinite));
    relayDirections[direction] = {
      blocks: directionBlocks.length,
      attempted,
      deliveredWithinDeadline: delivered,
      deliveryRatio: attempted === 0 ? null : delivered / attempted,
      applicationDuplicates,
      relayProved,
      relayProofRatio: delivered === 0 ? null : relayProved / delivered,
      relayForwards,
      exactForwardFrames,
      multipleForwardFrames,
      latencyMs: latencyUsable ? {
        count: latencies.length,
        p50: nearestRank(latencies, 0.5),
        p95: nearestRank(latencies, 0.95),
        p99: nearestRank(latencies, 0.99),
        max: latencies.length === 0 ? null : Math.max(...latencies),
      } : null,
    };
  }

  const hasDuplicates = Object.values(relayDirections).some((direction) => direction.applicationDuplicates > 0);
  const hasForwardLoop = Object.values(relayDirections).some((direction) => direction.multipleForwardFrames > 0);
  const allObservedPathsProved = Object.values(relayDirections).every((direction) =>
    direction.deliveredWithinDeadline === 0 ||
    (direction.relayProved === direction.deliveredWithinDeadline &&
      direction.exactForwardFrames === direction.deliveredWithinDeadline),
  );
  const relayGo = Object.values(relayDirections).every((direction) =>
    direction.blocks === 2 && direction.attempted === 200 && direction.deliveredWithinDeadline >= 190 &&
    direction.applicationDuplicates === 0 && direction.relayProved === direction.deliveredWithinDeadline &&
    direction.exactForwardFrames === direction.deliveredWithinDeadline,
  );
  const anyRelayDelivery = Object.values(relayDirections).some((direction) => direction.deliveredWithinDeadline > 0);

  let counterfactualDecision;
  const reasons = [];
  if (!manifest.geometry.fixedAcrossBlocks || unexpectedDirectDeliveries > 0 || isolationLinkUps > 0) {
    counterfactualDecision = "CONFOUNDED";
    reasons.push("bracketed A-C radio isolation did not hold");
  } else if (!exactAttempts || !latencyUsable) {
    counterfactualDecision = "INCOMPLETE";
    if (!exactAttempts) reasons.push("one or more blocks lacks the frozen exact attempt/sequence set");
    if (!latencyUsable) reasons.push("pairwise clock uncertainty exceeds 100 ms");
  } else if (!nearPass || hasDuplicates || hasForwardLoop || (anyRelayDelivery && !allObservedPathsProved)) {
    counterfactualDecision = "NO-GO";
    if (!nearPass) reasons.push("near controls failed");
    if (hasDuplicates) reasons.push("duplicate application delivery occurred");
    if (hasForwardLoop) reasons.push("relay forwarding was not exactly once per delivered frame");
    if (anyRelayDelivery && !allObservedPathsProved) reasons.push("delivered frames lack complete B/TTL path proof");
  } else if (relayGo) {
    counterfactualDecision = "GO";
    reasons.push("both directions meet 190/200, exact path proof and zero-duplicate gates");
  } else if (anyRelayDelivery && allObservedPathsProved) {
    counterfactualDecision = "LIMITED";
    reasons.push("isolated relay is proved but at least one direction is absent or misses the 95%/10-second gate");
  } else {
    counterfactualDecision = "NO-GO";
    reasons.push("no useful bidirectional isolated relay capability was observed");
  }

  const decision = manifest.evidenceClass === "physical" ? counterfactualDecision : "HOLD-PHYSICAL";
  const deterministic = {
    schema: "loc8.mesh-field-result.v1",
    runId: manifest.runId,
    evidenceClass: manifest.evidenceClass,
    decision,
    counterfactualDecision,
    reasons,
    latencyUsable,
    maxPairClockUncertaintyNs: String(pairClockUncertaintyNs),
    nearPass,
    exactAttempts,
    isolation: {
      blocks: isolation.length,
      unexpectedDirectDeliveries,
      linkUps: isolationLinkUps,
    },
    relayDirections,
    eventCount: events.length,
    eventCountsByRole: Object.fromEntries(ROLES.map((role) => [role, events.filter((event) => event.deviceRole === role).length])),
  };
  return {
    ...deterministic,
    resultFingerprintSha256: sha256Hex(deterministic),
    blocks,
    issues: [],
  };
}

export function encodeJsonLines(events) {
  return `${events.map((event) => stableStringify(event)).join("\n")}\n`;
}

export function decodeJsonLines(input) {
  if (typeof input !== "string") throw new TypeError("JSONL input must be a string");
  const lines = input.split(/\r?\n/u);
  const events = [];
  lines.forEach((line, index) => {
    if (line.length === 0) return;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`invalid JSON on line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  return events;
}
