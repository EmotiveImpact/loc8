import { FloorTracker } from '../core/floorTracker';
import type { VenuePackage } from '../building/types';
import {
  FLOOR_REPLAY_MAX_BYTES,
  FLOOR_REPLAY_MAX_EVENTS,
  FLOOR_REPLAY_SCHEMA,
  type FloorReplayBarometerEvent,
  type FloorReplayBundle,
  type FloorReplayCapability,
  type FloorReplayEvent,
  type FloorReplayFrame,
  type FloorReplayMagnetometerEvent,
  type FloorReplayMotionEvent,
  type FloorReplayTruthEvent,
  type PhoneSensorKind,
  type SensorVector3,
  type SensingValidationIssue,
} from './types';

const STABLE_ID = /^[a-z][a-z0-9._-]{2,95}$/u;
const ROOT_KEYS = new Set(['schemaVersion', 'evidenceClass', 'journeyId', 'buildingId', 'packageId', 'mapVersion', 'durationMs', 'levels', 'connectorIds', 'capabilities', 'events']);
const LEVEL_KEYS = new Set(['levelId', 'legacyFloor', 'elevationM']);
const CAPABILITY_KEYS = new Set(['sourceId', 'kind', 'available', 'permission', 'requestedIntervalMs', 'unit', 'nativeTimestampUnit']);
const EVENT_KEYS: Record<FloorReplayEvent['kind'], ReadonlySet<string>> = {
  anchor: new Set(['sequence', 'elapsedMs', 'sourceId', 'kind', 'levelId']),
  truth: new Set(['sequence', 'elapsedMs', 'sourceId', 'kind', 'levelId', 'phase', 'connectorId']),
  barometer: new Set(['sequence', 'elapsedMs', 'sourceId', 'kind', 'pressureHpa', 'relativeAltitudeM', 'nativeTimestampSec']),
  motion: new Set(['sequence', 'elapsedMs', 'sourceId', 'kind', 'accelerationIncludingGravityMps2', 'userAccelerationMps2', 'rotationRateRps', 'screenOrientationDeg', 'nativeTimestampSec']),
  magnetometer: new Set(['sequence', 'elapsedMs', 'sourceId', 'kind', 'microtesla', 'nativeTimestampSec']),
};
const VECTOR_KEYS = new Set(['x', 'y', 'z']);
const PERMISSIONS = new Set(['granted', 'denied', 'undetermined', 'unavailable', 'not-required', 'error']);
const PHASES = new Set(['stationary', 'transition-start', 'landing', 'same-floor-control']);
const ORIENTATIONS = new Set([0, 90, 180, -90]);
const KINDS = new Set<PhoneSensorKind>(['barometer', 'motion', 'magnetometer']);
const UNIT_BY_KIND: Record<PhoneSensorKind, FloorReplayCapability['unit']> = {
  barometer: 'hpa', motion: 'mps2-rps', magnetometer: 'microtesla',
};
type ReplayEventWithoutSequence = FloorReplayEvent extends infer Event
  ? Event extends FloorReplayEvent ? Omit<Event, 'sequence'> : never
  : never;

export class FloorReplayError extends Error {
  constructor(readonly code: string, message = code, readonly issues?: readonly SensingValidationIssue[]) {
    super(message);
    this.name = 'FloorReplayError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exact(value: Record<string, unknown>, keys: ReadonlySet<string>) {
  const own = Object.keys(value);
  return own.length === keys.size && own.every((key) => keys.has(key));
}

function finite(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function safeInt(value: unknown, min: number, max: number) {
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
}

function vectorValid(value: unknown, limit: number): value is SensorVector3 {
  return isRecord(value) && exact(value, VECTOR_KEYS) && ['x', 'y', 'z'].every((axis) => finite(value[axis], -limit, limit));
}

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}

function canonical(value: unknown): string {
  const sort = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) return candidate.map(sort);
    if (candidate !== null && typeof candidate === 'object') {
      return Object.fromEntries(Object.entries(candidate as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sort(child)]));
    }
    return candidate;
  };
  return JSON.stringify(sort(value));
}

function utf8Bytes(value: string) {
  let count = 0;
  for (const character of value) {
    const point = character.codePointAt(0)!;
    count += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return count;
}

export function validateFloorReplayBundle(value: unknown, venue?: VenuePackage): SensingValidationIssue[] {
  const issues: SensingValidationIssue[] = [];
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });
  if (!isRecord(value) || !exact(value, ROOT_KEYS)) {
    add('bundle-shape', '$', 'must contain exactly the floor replay bundle fields');
    return issues;
  }
  if (value.schemaVersion !== FLOOR_REPLAY_SCHEMA) add('schema-version', '$.schemaVersion', `must equal ${FLOOR_REPLAY_SCHEMA}`);
  if (value.evidenceClass !== 'synthetic' && value.evidenceClass !== 'recorded-unverified') add('evidence-class', '$.evidenceClass', 'must be synthetic or recorded-unverified');
  for (const key of ['journeyId', 'buildingId', 'packageId', 'mapVersion']) {
    if (typeof value[key] !== 'string' || !STABLE_ID.test(value[key] as string)) add('stable-id', `$.${key}`, 'must be a lower-case stable identifier');
  }
  if (!safeInt(value.durationMs, 1, 24 * 60 * 60 * 1000)) add('duration', '$.durationMs', 'must be a positive safe integer no longer than 24 hours');

  const levelIds = new Set<string>();
  const floors = new Set<number>();
  if (!Array.isArray(value.levels) || value.levels.length < 2 || value.levels.length > 128) {
    add('levels', '$.levels', 'must contain 2 to 128 levels');
  } else value.levels.forEach((level, index) => {
    const path = `$.levels[${index}]`;
    if (!isRecord(level) || !exact(level, LEVEL_KEYS)) return add('level-shape', path, 'must contain exactly levelId, legacyFloor and elevationM');
    if (typeof level.levelId !== 'string' || !STABLE_ID.test(level.levelId)) add('stable-id', `${path}.levelId`, 'must be a stable ID');
    else if (levelIds.has(level.levelId)) add('duplicate-level', `${path}.levelId`, 'must be unique');
    else levelIds.add(level.levelId);
    if (!safeInt(level.legacyFloor, -64, 63)) add('legacy-floor', `${path}.legacyFloor`, 'must fit the signed wire floor range');
    else if (floors.has(level.legacyFloor as number)) add('duplicate-floor', `${path}.legacyFloor`, 'must be unique');
    else floors.add(level.legacyFloor as number);
    if (!finite(level.elevationM, -1000, 10000)) add('elevation', `${path}.elevationM`, 'must be finite and bounded');
  });

  const connectorIds = new Set<string>();
  if (!Array.isArray(value.connectorIds) || value.connectorIds.length > 256) add('connectors', '$.connectorIds', 'must be an array of at most 256 IDs');
  else value.connectorIds.forEach((connector, index) => {
    if (typeof connector !== 'string' || !STABLE_ID.test(connector)) add('stable-id', `$.connectorIds[${index}]`, 'must be a stable ID');
    else if (connectorIds.has(connector)) add('duplicate-connector', `$.connectorIds[${index}]`, 'must be unique');
    else connectorIds.add(connector);
  });

  const capabilities = new Map<string, FloorReplayCapability>();
  const capabilityKinds = new Set<string>();
  if (!Array.isArray(value.capabilities) || value.capabilities.length < 1 || value.capabilities.length > 3) {
    add('capabilities', '$.capabilities', 'must contain one to three sensor capabilities');
  } else value.capabilities.forEach((capability, index) => {
    const path = `$.capabilities[${index}]`;
    if (!isRecord(capability) || !exact(capability, CAPABILITY_KEYS)) return add('capability-shape', path, 'must contain exactly the capability fields');
    const sourceValid = typeof capability.sourceId === 'string' && STABLE_ID.test(capability.sourceId);
    if (!sourceValid) add('stable-id', `${path}.sourceId`, 'must be a stable ID');
    else if (capabilities.has(capability.sourceId as string)) add('duplicate-source', `${path}.sourceId`, 'must be unique');
    if (typeof capability.kind !== 'string' || !KINDS.has(capability.kind as PhoneSensorKind)) add('sensor-kind', `${path}.kind`, 'must be a supported sensor kind');
    else if (capabilityKinds.has(capability.kind)) add('duplicate-kind', `${path}.kind`, 'must be unique');
    else capabilityKinds.add(capability.kind);
    if (typeof capability.available !== 'boolean') add('availability', `${path}.available`, 'must be boolean');
    if (typeof capability.permission !== 'string' || !PERMISSIONS.has(capability.permission)) add('permission', `${path}.permission`, 'must be a supported permission state');
    const expectedInterval = capability.available === true;
    if (!safeInt(capability.requestedIntervalMs, expectedInterval ? 1 : 0, expectedInterval ? 60_000 : 0)) add('interval', `${path}.requestedIntervalMs`, 'must be an integer and positive only for an available source');
    if (typeof capability.kind === 'string' && KINDS.has(capability.kind as PhoneSensorKind) && capability.unit !== UNIT_BY_KIND[capability.kind as PhoneSensorKind]) add('unit', `${path}.unit`, 'does not match sensor kind');
    if (capability.nativeTimestampUnit !== 'seconds') add('timestamp-unit', `${path}.nativeTimestampUnit`, 'must equal seconds');
    if (sourceValid) capabilities.set(capability.sourceId as string, capability as unknown as FloorReplayCapability);
  });

  const nativeTimes = new Map<string, number>();
  let previousElapsed = -1;
  if (!Array.isArray(value.events) || value.events.length < 1 || value.events.length > FLOOR_REPLAY_MAX_EVENTS) {
    add('events', '$.events', `must contain 1 to ${FLOOR_REPLAY_MAX_EVENTS} events`);
  } else value.events.forEach((event, index) => {
    const path = `$.events[${index}]`;
    if (!isRecord(event) || typeof event.kind !== 'string' || !Object.prototype.hasOwnProperty.call(EVENT_KEYS, event.kind)) return add('event-kind', path, 'must be a supported event object');
    const kind = event.kind as FloorReplayEvent['kind'];
    if (!exact(event, EVENT_KEYS[kind])) add('event-shape', path, `must contain exactly the ${kind} event fields`);
    if (event.sequence !== index) add('sequence', `${path}.sequence`, 'must be zero-based and contiguous');
    if (!safeInt(event.elapsedMs, 0, typeof value.durationMs === 'number' ? value.durationMs : 0)) add('elapsed-time', `${path}.elapsedMs`, 'must be within duration');
    else {
      if ((event.elapsedMs as number) < previousElapsed) add('time-order', `${path}.elapsedMs`, 'must be nondecreasing');
      previousElapsed = event.elapsedMs as number;
    }
    if (typeof event.sourceId !== 'string' || !STABLE_ID.test(event.sourceId)) add('stable-id', `${path}.sourceId`, 'must be a stable ID');

    if (kind === 'anchor' || kind === 'truth') {
      if (!levelIds.has(event.levelId as string)) add('unknown-level', `${path}.levelId`, 'must reference a declared level');
      if (kind === 'anchor' && event.sourceId !== 'operator.anchor') add('anchor-source', `${path}.sourceId`, 'must equal operator.anchor');
      if (kind === 'truth') {
        if (event.sourceId !== 'truth.timeline') add('truth-source', `${path}.sourceId`, 'must equal truth.timeline');
        if (!PHASES.has(event.phase as string)) add('truth-phase', `${path}.phase`, 'must be a supported truth phase');
        if (event.connectorId !== null && !connectorIds.has(event.connectorId as string)) add('unknown-connector', `${path}.connectorId`, 'must reference a declared connector');
        if (event.phase === 'transition-start' && event.connectorId === null) add('transition-connector', `${path}.connectorId`, 'is required for a transition start');
      }
      return;
    }

    const capability = capabilities.get(event.sourceId as string);
    if (!capability || capability.kind !== kind || !capability.available || !['granted', 'not-required'].includes(capability.permission)) {
      add('source-not-active', `${path}.sourceId`, 'must reference an available permitted matching capability');
    }
    if (!finite(event.nativeTimestampSec, 0, Number.MAX_SAFE_INTEGER / 1_000_000)) add('native-time', `${path}.nativeTimestampSec`, 'must be finite and non-negative');
    else if (typeof event.sourceId === 'string') {
      const previous = nativeTimes.get(event.sourceId);
      if (previous !== undefined && (event.nativeTimestampSec as number) < previous) add('native-time-order', `${path}.nativeTimestampSec`, 'must not regress within a source');
      nativeTimes.set(event.sourceId, event.nativeTimestampSec as number);
    }
    if (kind === 'barometer') {
      if (!finite(event.pressureHpa, 300, 1200)) add('pressure', `${path}.pressureHpa`, 'must be 300 to 1200 hPa');
      if (event.relativeAltitudeM !== null && !finite(event.relativeAltitudeM, -10_000, 10_000)) add('relative-altitude', `${path}.relativeAltitudeM`, 'must be null or bounded metres');
    } else if (kind === 'motion') {
      if (!vectorValid(event.accelerationIncludingGravityMps2, 200)) add('vector', `${path}.accelerationIncludingGravityMps2`, 'must be a bounded vector');
      if (event.userAccelerationMps2 !== null && !vectorValid(event.userAccelerationMps2, 200)) add('vector', `${path}.userAccelerationMps2`, 'must be null or a bounded vector');
      if (event.rotationRateRps !== null && !vectorValid(event.rotationRateRps, 100)) add('vector', `${path}.rotationRateRps`, 'must be null or a bounded vector');
      if (!ORIENTATIONS.has(event.screenOrientationDeg as number)) add('orientation', `${path}.screenOrientationDeg`, 'must be 0, 90, 180 or -90');
    } else if (!vectorValid(event.microtesla, 5_000)) add('vector', `${path}.microtesla`, 'must be a bounded vector');
  });
  if (Array.isArray(value.events) && value.events[0] && (value.events[0] as Record<string, unknown>).kind !== 'anchor') add('first-event', '$.events[0]', 'must be an anchor');

  if (venue) {
    if (value.buildingId !== venue.buildingId) add('building-mismatch', '$.buildingId', 'must match the current venue');
    if (value.packageId !== venue.packageId) add('package-mismatch', '$.packageId', 'must match the current venue');
    if (value.mapVersion !== venue.mapVersion) add('map-version-mismatch', '$.mapVersion', 'must match the current venue');
    const venueFloorCodes = new Map(venue.legacyFloorCodes.map((entry) => [entry.levelId, entry.code]));
    const venueLevels = new Map(venue.levels.map((level) => [level.levelId, { ...level, legacyFloor: venueFloorCodes.get(level.levelId) }]));
    if (Array.isArray(value.levels) && value.levels.length !== venue.levels.length) add('venue-levels', '$.levels', 'must include every current venue level');
    if (Array.isArray(value.levels)) value.levels.forEach((level, index) => {
      if (!isRecord(level)) return;
      const expected = venueLevels.get(level.levelId as string);
      if (!expected || expected.legacyFloor !== level.legacyFloor || expected.elevationM !== level.elevationM) add('venue-level-mismatch', `$.levels[${index}]`, 'must match current venue level identity');
    });
    const venueConnectors = new Set(venue.connectors.map((connector) => connector.connectorId));
    for (const connector of connectorIds) if (!venueConnectors.has(connector)) add('venue-connector-mismatch', '$.connectorIds', 'must reference current venue connectors');
  }
  return issues.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
}

export function assertFloorReplayBundle(value: unknown, venue?: VenuePackage): asserts value is FloorReplayBundle {
  const issues = validateFloorReplayBundle(value, venue);
  if (issues.length > 0) throw new FloorReplayError('invalid-floor-replay', 'floor replay failed validation', issues);
}

export function canonicalFloorReplayJson(bundle: FloorReplayBundle): string {
  assertFloorReplayBundle(bundle);
  return canonical(bundle);
}

export function parseFloorReplayJson(json: string, venue?: VenuePackage): FloorReplayBundle {
  if (utf8Bytes(json) > FLOOR_REPLAY_MAX_BYTES) throw new FloorReplayError('floor-replay-too-large');
  let value: unknown;
  try { value = JSON.parse(json); } catch { throw new FloorReplayError('invalid-floor-replay-json'); }
  assertFloorReplayBundle(value, venue);
  return deepFreeze(clonePlain(value)) as FloorReplayBundle;
}

export function createSyntheticFloorReplay(venue: VenuePackage): FloorReplayBundle {
  const levelById = new Map(venue.levels.map((level) => [level.levelId, level]));
  const byFloor = new Map(venue.legacyFloorCodes.map((entry) => [entry.code, levelById.get(entry.levelId)!]));
  const ground = byFloor.get(0);
  const one = byFloor.get(1);
  const two = byFloor.get(2);
  const ramp = venue.connectors.find((connector) => connector.connectorId === 'connector.east-ramp');
  if (!ground || !one || !two || !ramp) throw new FloorReplayError('synthetic-venue-incompatible');
  const pending: ReplayEventWithoutSequence[] = [];
  const add = (event: ReplayEventWithoutSequence) => pending.push(event);
  add({ kind: 'anchor', sourceId: 'operator.anchor', elapsedMs: 0, levelId: ground.levelId });
  add({ kind: 'truth', sourceId: 'truth.timeline', elapsedMs: 0, levelId: ground.levelId, phase: 'stationary', connectorId: null });
  add({ kind: 'truth', sourceId: 'truth.timeline', elapsedMs: 5_000, levelId: ground.levelId, phase: 'transition-start', connectorId: ramp.connectorId });
  add({ kind: 'truth', sourceId: 'truth.timeline', elapsedMs: 14_000, levelId: one.levelId, phase: 'landing', connectorId: ramp.connectorId });
  add({ kind: 'truth', sourceId: 'truth.timeline', elapsedMs: 16_000, levelId: one.levelId, phase: 'transition-start', connectorId: ramp.connectorId });
  add({ kind: 'truth', sourceId: 'truth.timeline', elapsedMs: 25_000, levelId: two.levelId, phase: 'landing', connectorId: ramp.connectorId });
  add({ kind: 'truth', sourceId: 'truth.timeline', elapsedMs: 30_000, levelId: two.levelId, phase: 'same-floor-control', connectorId: null });
  for (let elapsedMs = 0; elapsedMs <= 30_000; elapsedMs += 500) {
    const first = Math.max(0, Math.min(1, (elapsedMs - 5_000) / 9_000));
    const second = Math.max(0, Math.min(1, (elapsedMs - 16_000) / 9_000));
    const floorProgress = first + second;
    add({
      kind: 'barometer', sourceId: 'barometer.primary', elapsedMs,
      pressureHpa: Number((1013.2 - 0.42 * floorProgress).toFixed(6)),
      relativeAltitudeM: Number((3.6 * floorProgress).toFixed(6)),
      nativeTimestampSec: elapsedMs / 1000,
    });
    if (elapsedMs % 1_000 === 0) {
      const index = elapsedMs / 1_000;
      add({
        kind: 'motion', sourceId: 'motion.primary', elapsedMs,
        accelerationIncludingGravityMps2: { x: Number((0.18 * Math.sin(index)).toFixed(6)), y: Number((0.12 * Math.cos(index / 2)).toFixed(6)), z: Number((9.81 + 0.25 * Math.sin(index / 3)).toFixed(6)) },
        userAccelerationMps2: { x: 0.02, y: -0.01, z: 0.03 },
        rotationRateRps: { x: 0.01, y: -0.02, z: 0.015 },
        screenOrientationDeg: 0,
        nativeTimestampSec: elapsedMs / 1000,
      });
    }
    if (elapsedMs % 2_000 === 0) {
      const index = elapsedMs / 2_000;
      add({ kind: 'magnetometer', sourceId: 'magnetometer.primary', elapsedMs, microtesla: { x: 24 + index * 0.1, y: -8 + index * 0.05, z: 41 - index * 0.08 }, nativeTimestampSec: elapsedMs / 1000 });
    }
  }
  const priority: Record<FloorReplayEvent['kind'], number> = { anchor: 0, truth: 1, barometer: 2, motion: 3, magnetometer: 4 };
  pending.sort((left, right) => left.elapsedMs - right.elapsedMs || priority[left.kind] - priority[right.kind]);
  const events = pending.map((event, sequence) => ({ ...event, sequence })) as FloorReplayEvent[];
  const bundle: FloorReplayBundle = {
    schemaVersion: FLOOR_REPLAY_SCHEMA,
    evidenceClass: 'synthetic',
    journeyId: `journey.synthetic.${venue.mapVersion.replaceAll('.', '-')}`,
    buildingId: venue.buildingId,
    packageId: venue.packageId,
    mapVersion: venue.mapVersion,
    durationMs: 30_000,
    levels: venue.levels.map(({ levelId, elevationM }) => ({ levelId, legacyFloor: venue.legacyFloorCodes.find((entry) => entry.levelId === levelId)!.code, elevationM })),
    connectorIds: [ramp.connectorId],
    capabilities: [
      { sourceId: 'barometer.primary', kind: 'barometer', available: true, permission: 'granted', requestedIntervalMs: 500, unit: 'hpa', nativeTimestampUnit: 'seconds' },
      { sourceId: 'motion.primary', kind: 'motion', available: true, permission: 'granted', requestedIntervalMs: 1_000, unit: 'mps2-rps', nativeTimestampUnit: 'seconds' },
      { sourceId: 'magnetometer.primary', kind: 'magnetometer', available: true, permission: 'granted', requestedIntervalMs: 2_000, unit: 'microtesla', nativeTimestampUnit: 'seconds' },
    ],
    events,
  };
  assertFloorReplayBundle(bundle, venue);
  return deepFreeze(bundle) as FloorReplayBundle;
}

export function createFloorReplayFrames(bundle: FloorReplayBundle, venue?: VenuePackage): readonly FloorReplayFrame[] {
  assertFloorReplayBundle(bundle, venue);
  const tracker = new FloorTracker();
  const levelsById = new Map(bundle.levels.map((level) => [level.levelId, level]));
  const levelsByFloor = new Map(bundle.levels.map((level) => [level.legacyFloor, level]));
  let truth: FloorReplayTruthEvent | null = null;
  let barometer: FloorReplayBarometerEvent | null = null;
  let motion: FloorReplayMotionEvent | null = null;
  let magnetometer: FloorReplayMagnetometerEvent | null = null;
  const counts: Record<PhoneSensorKind, number> = { barometer: 0, motion: 0, magnetometer: 0 };
  const frames: FloorReplayFrame[] = [];
  bundle.events.forEach((event, index) => {
    if (event.kind === 'anchor') tracker.anchor(levelsById.get(event.levelId)!.legacyFloor);
    else if (event.kind === 'truth') truth = event;
    else if (event.kind === 'barometer') { barometer = event; counts.barometer += 1; tracker.addSample(event.pressureHpa, event.elapsedMs); }
    else if (event.kind === 'motion') { motion = event; counts.motion += 1; }
    else { magnetometer = event; counts.magnetometer += 1; }
    const estimated = levelsByFloor.get(tracker.state.floor) ?? null;
    const truthLevel = truth ? levelsById.get(truth.levelId) ?? null : null;
    frames.push({
      index, elapsedMs: event.elapsedMs, event,
      estimatedLevelId: estimated?.levelId ?? null,
      estimatedLegacyFloor: tracker.state.floor,
      estimateConfidence: tracker.state.confidence,
      confirmSuggested: tracker.state.confirmSuggested,
      truthLevelId: truth?.levelId ?? null,
      truthPhase: truth?.phase ?? null,
      truthConnectorId: truth?.connectorId ?? null,
      estimateDeltaFloors: truthLevel ? tracker.state.floor - truthLevel.legacyFloor : null,
      counts: { ...counts }, latestBarometer: barometer, latestMotion: motion, latestMagnetometer: magnetometer,
    });
  });
  return deepFreeze(frames) as readonly FloorReplayFrame[];
}

export function floorReplayFrameAt(frames: readonly FloorReplayFrame[], elapsedMs: number): FloorReplayFrame {
  if (frames.length === 0) throw new FloorReplayError('empty-replay');
  let low = 0;
  let high = frames.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (frames[middle].elapsedMs <= elapsedMs) low = middle;
    else high = middle - 1;
  }
  return frames[low];
}
