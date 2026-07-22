import {
  FLOOR_REPLAY_MAX_BYTES,
  FLOOR_REPLAY_MAX_EVENTS,
  canonicalFloorReplayJson,
  createFloorReplayFrames,
  createSyntheticFloorReplay,
  floorReplayFrameAt,
  parseFloorReplayJson,
  validateFloorReplayBundle,
  type FloorReplayBundle,
  type FloorReplayEvent,
} from '..';
import { createSyntheticFourLevelVenue } from '../../building';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function valid() {
  return createSyntheticFloorReplay(createSyntheticFourLevelVenue());
}

describe('floor journey replay', () => {
  it('generates and replays the same synthetic journey deterministically', () => {
    const venue = createSyntheticFourLevelVenue();
    const first = createSyntheticFloorReplay(venue);
    const second = createSyntheticFloorReplay(venue);
    expect(canonicalFloorReplayJson(first)).toBe(canonicalFloorReplayJson(second));
    expect(Object.isFrozen(first)).toBe(true);
    const frames = createFloorReplayFrames(first, venue);
    expect(frames).toHaveLength(first.events.length);
    expect(frames.at(-1)).toMatchObject({
      truthLevelId: 'level.two',
      estimatedLevelId: 'level.two',
      estimatedLegacyFloor: 2,
      estimateDeltaFloors: 0,
      counts: { barometer: 61, motion: 31, magnetometer: 16 },
    });
  });

  it('round-trips strict JSON and keeps recorded imports unverified', () => {
    const venue = createSyntheticFourLevelVenue();
    const recorded = clone(createSyntheticFloorReplay(venue));
    recorded.evidenceClass = 'recorded-unverified';
    recorded.journeyId = 'journey.recorded.fixture.01';
    const parsed = parseFloorReplayJson(JSON.stringify(recorded), venue);
    expect(parsed.evidenceClass).toBe('recorded-unverified');
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it('seeks to the latest event at or before elapsed time', () => {
    const frames = createFloorReplayFrames(valid());
    expect(floorReplayFrameAt(frames, 0).elapsedMs).toBe(0);
    expect(floorReplayFrameAt(frames, 12_345).elapsedMs).toBeLessThanOrEqual(12_345);
    expect(floorReplayFrameAt(frames, 99_000)).toBe(frames.at(-1));
  });

  it('rejects malformed and oversized JSON before replay', () => {
    expect(() => parseFloorReplayJson('{bad')).toThrow('invalid-floor-replay-json');
    expect(() => parseFloorReplayJson(' '.repeat(FLOOR_REPLAY_MAX_BYTES + 1))).toThrow('floor-replay-too-large');
  });
});

type InvalidCase = [string, string, (bundle: FloorReplayBundle) => void];

const invalidCases: InvalidCase[] = [
  ['unknown root field', 'bundle-shape', (value) => { (value as FloorReplayBundle & { extra: boolean }).extra = true; }],
  ['wrong schema', 'schema-version', (value) => { (value.schemaVersion as string) = 'loc8.floor-replay.v0'; }],
  ['invalid evidence class', 'evidence-class', (value) => { (value.evidenceClass as string) = 'physical'; }],
  ['invalid journey ID', 'stable-id', (value) => { value.journeyId = 'BAD ID'; }],
  ['zero duration', 'duration', (value) => { value.durationMs = 0; }],
  ['missing levels', 'levels', (value) => { value.levels = []; }],
  ['duplicate level ID', 'duplicate-level', (value) => { value.levels[1].levelId = value.levels[0].levelId; }],
  ['floor outside wire range', 'legacy-floor', (value) => { value.levels[0].legacyFloor = 64; }],
  ['duplicate legacy floor', 'duplicate-floor', (value) => { value.levels[1].legacyFloor = value.levels[0].legacyFloor; }],
  ['invalid elevation', 'elevation', (value) => { value.levels[0].elevationM = Number.NaN; }],
  ['invalid connector ID', 'stable-id', (value) => { value.connectorIds[0] = 'BAD'; }],
  ['duplicate connector', 'duplicate-connector', (value) => { value.connectorIds.push(value.connectorIds[0]); }],
  ['missing capabilities', 'capabilities', (value) => { value.capabilities = []; }],
  ['extra capability field', 'capability-shape', (value) => { (value.capabilities[0] as typeof value.capabilities[0] & { extra: boolean }).extra = true; }],
  ['duplicate source', 'duplicate-source', (value) => { value.capabilities[1].sourceId = value.capabilities[0].sourceId; }],
  ['duplicate kind', 'duplicate-kind', (value) => { value.capabilities[1].kind = value.capabilities[0].kind; }],
  ['unavailable source with interval', 'interval', (value) => { value.capabilities[0].available = false; }],
  ['available source without interval', 'interval', (value) => { value.capabilities[0].requestedIntervalMs = 0; }],
  ['fractional requested interval', 'interval', (value) => { value.capabilities[0].requestedIntervalMs = 500.5; }],
  ['wrong sensor unit', 'unit', (value) => { value.capabilities[0].unit = 'microtesla'; }],
  ['wrong native timestamp unit', 'timestamp-unit', (value) => { (value.capabilities[0].nativeTimestampUnit as string) = 'milliseconds'; }],
  ['no events', 'events', (value) => { value.events = []; }],
  ['prototype-named event kind', 'event-kind', (value) => { (value.events[1].kind as string) = 'toString'; }],
  ['non-contiguous sequence', 'sequence', (value) => { value.events[2].sequence = 99; }],
  ['elapsed time regression', 'time-order', (value) => { const index = value.events.findIndex((event) => event.elapsedMs > 1_000); value.events[index].elapsedMs = 0; }],
  ['elapsed time outside duration', 'elapsed-time', (value) => { value.events.at(-1)!.elapsedMs = value.durationMs + 1; }],
  ['first event is not anchor', 'first-event', (value) => { const first = value.events[0] as FloorReplayEvent & { kind: string }; first.kind = 'truth'; }],
  ['anchor references unknown level', 'unknown-level', (value) => { (value.events[0] as Extract<FloorReplayEvent, { kind: 'anchor' }>).levelId = 'level.unknown'; }],
  ['anchor has wrong source', 'anchor-source', (value) => { value.events[0].sourceId = 'operator.other'; }],
  ['transition lacks connector', 'transition-connector', (value) => { const event = value.events.find((entry) => entry.kind === 'truth' && entry.phase === 'transition-start') as Extract<FloorReplayEvent, { kind: 'truth' }>; event.connectorId = null; }],
  ['truth references unknown connector', 'unknown-connector', (value) => { const event = value.events.find((entry) => entry.kind === 'truth' && entry.connectorId) as Extract<FloorReplayEvent, { kind: 'truth' }>; event.connectorId = 'connector.other'; }],
  ['barometer uses inactive source', 'source-not-active', (value) => { value.capabilities[0].permission = 'denied'; }],
  ['pressure outside bounds', 'pressure', (value) => { (value.events.find((entry) => entry.kind === 'barometer') as Extract<FloorReplayEvent, { kind: 'barometer' }>).pressureHpa = 0; }],
  ['relative altitude outside bounds', 'relative-altitude', (value) => { (value.events.find((entry) => entry.kind === 'barometer') as Extract<FloorReplayEvent, { kind: 'barometer' }>).relativeAltitudeM = 20_000; }],
  ['native timestamp regression', 'native-time-order', (value) => { const events = value.events.filter((entry) => entry.kind === 'barometer') as Array<Extract<FloorReplayEvent, { kind: 'barometer' }>>; events[2].nativeTimestampSec = 0.25; }],
  ['invalid motion vector', 'vector', (value) => { const event = value.events.find((entry) => entry.kind === 'motion') as Extract<FloorReplayEvent, { kind: 'motion' }>; event.accelerationIncludingGravityMps2.x = 500; }],
  ['invalid screen orientation', 'orientation', (value) => { const event = value.events.find((entry) => entry.kind === 'motion') as Extract<FloorReplayEvent, { kind: 'motion' }>; (event.screenOrientationDeg as number) = 45; }],
  ['invalid magnetic vector', 'vector', (value) => { const event = value.events.find((entry) => entry.kind === 'magnetometer') as Extract<FloorReplayEvent, { kind: 'magnetometer' }>; event.microtesla.z = 10_000; }],
  ['extra event field', 'event-shape', (value) => { (value.events[1] as FloorReplayEvent & { extra: boolean }).extra = true; }],
  ['too many events', 'events', (value) => { value.events = Array.from({ length: FLOOR_REPLAY_MAX_EVENTS + 1 }, (_, sequence) => ({ ...value.events[0], sequence })); }],
];

describe.each(invalidCases)('floor replay validation: %s', (_name, code, mutate) => {
  it(`reports ${code}`, () => {
    const bundle = clone(valid());
    mutate(bundle);
    expect(validateFloorReplayBundle(bundle)).toEqual(expect.arrayContaining([expect.objectContaining({ code })]));
  });
});

describe('floor replay venue identity gate', () => {
  it.each([
    ['building-mismatch', (bundle: FloorReplayBundle) => { bundle.buildingId = 'building.other'; }],
    ['package-mismatch', (bundle: FloorReplayBundle) => { bundle.packageId = 'package.other'; }],
    ['map-version-mismatch', (bundle: FloorReplayBundle) => { bundle.mapVersion = 'map.other'; }],
    ['venue-level-mismatch', (bundle: FloorReplayBundle) => { bundle.levels[0].elevationM += 1; }],
    ['venue-connector-mismatch', (bundle: FloorReplayBundle) => { bundle.connectorIds[0] = 'connector.other'; }],
  ])('reports %s against the current venue', (code, mutate) => {
    const venue = createSyntheticFourLevelVenue();
    const bundle = clone(createSyntheticFloorReplay(venue));
    mutate(bundle);
    expect(validateFloorReplayBundle(bundle, venue)).toEqual(expect.arrayContaining([expect.objectContaining({ code })]));
  });
});
