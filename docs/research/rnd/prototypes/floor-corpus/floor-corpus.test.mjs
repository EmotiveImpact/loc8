import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  EVENT_KINDS,
  FloorCorpusRecorder,
  evaluateSession,
  parseBundle,
  serializeBundle,
  validateManifest,
} from './floor-corpus.mjs';
import { createCanonicalFixture, createManifest } from './fixture.mjs';

function clone(value) {
  return structuredClone(value);
}

function fixture() {
  const { manifest, events } = createCanonicalFixture();
  return { manifest: clone(manifest), events: clone(events) };
}

function errorCodes(report) {
  return new Set(report.errors.map((error) => error.code));
}

function findEvent(events, kind, occurrence = 0) {
  return events.filter((event) => event.kind === kind)[occurrence];
}

test('canonical synthetic session passes every pure contract gate', () => {
  const { manifest, events } = fixture();
  const report = evaluateSession(manifest, events);
  assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
  assert.equal(report.eventCount, 129);
  assert.deepEqual(report.timeQuality, {
    syncCount: 2,
    maxUncertaintyMs: 20,
    maxDriftMsPerMinute: 1.363636,
    validForTransitionTiming: true,
  });
  assert.deepEqual(report.truth, {
    segmentCount: 3,
    transitionCount: 1,
    sameFloorControlCount: 1,
    gapUs: 0,
    overlapUs: 0,
  });
  assert.equal(report.streams['barometer-primary'].missing, 0);
  assert.equal(report.streams['barometer-primary'].medianIntervalMs, 500);
  assert.equal(report.streams['barometer-primary'].maxIntervalMs, 500);
  assert.equal(report.streams['barometer-primary'].intervalsOverDoubleRequested, 0);
  assert.equal(report.streams['device-motion-primary'].missing, 0);
  assert.equal(report.streams['device-motion-primary'].p95IntervalMs, 100);
});

test('JSONL export parses and reproduces the same deterministic report', () => {
  const { manifest, events } = fixture();
  const text = serializeBundle(manifest, events);
  const parsed = parseBundle(text);
  assert.deepEqual(parsed, { manifest, events });
  assert.equal(evaluateSession(parsed.manifest, parsed.events).fingerprint, evaluateSession(manifest, events).fingerprint);
});

test('machine-readable schema is valid JSON and event kinds match the implementation', async () => {
  const schema = JSON.parse(await readFile(new URL('./schema-v1.json', import.meta.url), 'utf8'));
  const schemaKinds = schema.$defs.event.properties.kind.enum;
  assert.deepEqual(schemaKinds, EVENT_KINDS);
  assert.equal(schema.$defs.manifest.properties.schemaVersion.const, 'loc8.floor-corpus.v1');
  assert.equal(schema.$defs.event.allOf.length, EVENT_KINDS.length);
  assert.equal(schema.$defs.pressurePayload.additionalProperties, false);
  assert.equal(schema.$defs.groundTruthSegmentPayload.allOf.length, 1);
});

test('semantic labels may skip public floors and remain non-numeric', () => {
  const { manifest, events } = fixture();
  assert.deepEqual(manifest.building.levels.map((level) => level.levelRef), ['B1', 'G', '2A']);
  assert.equal(evaluateSession(manifest, events).valid, true);
});

test('manifest fails closed without consent', () => {
  const { manifest, events } = fixture();
  delete manifest.consent;
  assert.equal(evaluateSession(manifest, events).valid, false);
  assert(errorCodes(evaluateSession(manifest, events)).has('required'));
});

test('manifest fails closed without a future retention boundary', () => {
  const { manifest, events } = fixture();
  manifest.retention.deleteAfterMs = manifest.createdAtMs;
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('retention'));
  assert(codes.has('retention-expired'));
});

test('manifest fails closed without a retention policy', () => {
  const { manifest, events } = fixture();
  delete manifest.retention;
  assert.doesNotThrow(() => evaluateSession(manifest, events));
  assert(errorCodes(evaluateSession(manifest, events)).has('required'));
});

test('manifest requires the preregistered app build and access-logging controls', () => {
  const { manifest, events } = fixture();
  delete manifest.device.appBuild;
  manifest.retention.accessLogging = false;
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('required'));
  assert(codes.has('retention'));
});

test('v1 raw-data retention cannot silently exceed twelve months', () => {
  const { manifest, events } = fixture();
  manifest.retention.deleteAfterMs = manifest.createdAtMs + 367 * 24 * 60 * 60 * 1000;
  assert(errorCodes(evaluateSession(manifest, events)).has('retention'));
});

test('raw BSSID fields and MAC-like values are rejected recursively', () => {
  const { manifest, events } = fixture();
  const pressure = findEvent(events, 'pressure');
  pressure.payload.BSSID = 'AA:BB:CC:DD:EE:FF';
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('forbidden-field'));
  assert(codes.has('forbidden-value'));
});

test('raw SSID fields are rejected even when the value is not MAC-like', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'pressure').payload.ssid = 'building-network';
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('forbidden-field'));
  assert(codes.has('unexpected-field'));
});

test('free-text operator notes are rejected', () => {
  const { manifest, events } = fixture();
  const note = {
    ...clone(events.at(-1)),
    sequence: events.length - 1,
    kind: 'operator-note',
    source: 'truth-ui',
    payload: { code: 'route-deviation', freeText: 'person name' },
  };
  events[events.length - 1] = note;
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('operator-note'));
  assert(codes.has('forbidden-field'));
});

test('unknown event kinds are rejected', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'pressure').kind = 'pressure-v2';
  assert(errorCodes(evaluateSession(manifest, events)).has('event-kind'));
});

test('invalid pressure values and missing native time are rejected', () => {
  const { manifest, events } = fixture();
  const pressure = findEvent(events, 'pressure');
  pressure.payload.pressureHpa = 2000;
  delete pressure.payload.nativeTimestamp;
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('pressure-range'));
  assert(codes.has('native-time'));
});

test('capability units and every declared native timestamp unit must match', () => {
  const { manifest, events } = fixture();
  manifest.capabilities[0].unit = 'pascal';
  findEvent(events, 'motion').payload.nativeTimestampUnit = 'milliseconds';
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('unit'));
  assert(codes.has('native-time'));
});

test('kind-specific payloads reject arbitrary extension fields', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'pressure').payload.vendorDiagnostic = 'opaque';
  assert(errorCodes(evaluateSession(manifest, events)).has('unexpected-field'));
});

test('manifest, event envelope and vector extensions fail closed at runtime', () => {
  const { manifest, events } = fixture();
  manifest.device.serialNumber = 'opaque';
  findEvent(events, 'pressure').debug = true;
  findEvent(events, 'motion').payload.accelerationIncludingGravityMps2.quality = 1;
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('unexpected-field'));
});

test('unknown ground-truth levels are rejected', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'ground-truth-segment').payload.sourceLevelId = 'level-unknown';
  assert(errorCodes(evaluateSession(manifest, events)).has('unknown-level'));
});

test('a connector must join both labelled transition levels', () => {
  const { manifest, events } = fixture();
  const transition = events.find((event) => event.kind === 'ground-truth-segment' && event.payload.category === 'transition');
  transition.payload.sourceLevelId = 'level-b1';
  const codes = errorCodes(evaluateSession(manifest, events));
  assert(codes.has('connector-topology'));
});

test('transitions require declared connector landings on the correct levels', () => {
  const { manifest, events } = fixture();
  const transition = events.find((event) => event.kind === 'ground-truth-segment' && event.payload.category === 'transition');
  transition.payload.startLandingId = transition.payload.endLandingId;
  assert(errorCodes(evaluateSession(manifest, events)).has('landing-topology'));
});

test('missing transition landings are rejected', () => {
  const { manifest, events } = fixture();
  const transition = events.find((event) => event.kind === 'ground-truth-segment' && event.payload.category === 'transition');
  delete transition.payload.startLandingId;
  assert(errorCodes(evaluateSession(manifest, events)).has('landing'));
});

test('unknown transition connectors are rejected', () => {
  const { manifest, events } = fixture();
  const transition = events.find((event) => event.kind === 'ground-truth-segment' && event.payload.category === 'transition');
  transition.payload.connectorId = 'connector-unknown';
  assert(errorCodes(evaluateSession(manifest, events)).has('unknown-connector'));
});

test('transition direction must match semantic level order', () => {
  const { manifest, events } = fixture();
  const transition = events.find((event) => event.kind === 'ground-truth-segment' && event.payload.category === 'transition');
  transition.payload.direction = 'down';
  assert(errorCodes(evaluateSession(manifest, events)).has('direction'));
});

test('sequence gaps are rejected', () => {
  const { manifest, events } = fixture();
  events[10].sequence = 11;
  assert(errorCodes(evaluateSession(manifest, events)).has('sequence-gap'));
});

test('monotonic timestamp regressions are rejected even if wall time increases', () => {
  const { manifest, events } = fixture();
  events[10].monotonicUs = events[9].monotonicUs - 1;
  events[10].wallTimeMs = events[9].wallTimeMs + 1000;
  assert(errorCodes(evaluateSession(manifest, events)).has('monotonic-regression'));
});

test('clock uncertainty over 100 ms rejects transition timing', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'clock-sync', 1).clockUncertaintyMs = 101;
  const report = evaluateSession(manifest, events);
  assert.equal(report.timeQuality.validForTransitionTiming, false);
  assert(errorCodes(report).has('clock-uncertainty'));
});

test('clock drift over 5 ms/minute rejects transition timing', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'clock-sync', 1).payload.offsetMs = 20;
  const report = evaluateSession(manifest, events);
  assert.equal(report.timeQuality.validForTransitionTiming, false);
  assert(errorCodes(report).has('clock-drift'));
});

test('missing session end is rejected', () => {
  const { manifest, events } = fixture();
  events.pop();
  assert(errorCodes(evaluateSession(manifest, events)).has('session-boundary'));
});

test('missing session start is rejected', () => {
  const { manifest, events } = fixture();
  events.shift();
  events.forEach((event, index) => { event.sequence = index; });
  assert(errorCodes(evaluateSession(manifest, events)).has('session-boundary'));
});

test('session and clock-sync boundaries must contain the analysis interval', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'clock-sync').monotonicUs = manifest.analysis.startMonotonicUs + 1;
  assert(errorCodes(evaluateSession(manifest, events)).has('clock-sync-window'));
});

test('ground-truth gaps over 100 ms are rejected', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'ground-truth-segment').payload.endUs -= 100_001;
  assert(errorCodes(evaluateSession(manifest, events)).has('truth-gap'));
});

test('ground-truth overlaps over 100 ms are rejected', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'ground-truth-segment', 1).payload.startUs -= 100_001;
  assert(errorCodes(evaluateSession(manifest, events)).has('truth-overlap'));
});

test('ground-truth segment identifiers must be unique', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'ground-truth-segment', 1).payload.segmentId =
    findEvent(events, 'ground-truth-segment', 0).payload.segmentId;
  assert(errorCodes(evaluateSession(manifest, events)).has('duplicate'));
});

test('periodic observations from undeclared streams are rejected', () => {
  const { manifest, events } = fixture();
  findEvent(events, 'pressure').source = 'barometer-undeclared';
  assert(errorCodes(evaluateSession(manifest, events)).has('undeclared-stream'));
});

test('recorder rejects invalid manifests and out-of-order events', () => {
  const badManifest = createManifest();
  badManifest.retention.encryptedAtRest = false;
  assert.throws(() => new FloorCorpusRecorder(badManifest), /invalid manifest/);

  const recorder = new FloorCorpusRecorder(createManifest({ pressureCount: 3, includeMotion: false }));
  recorder.start({ monotonicUs: 10, wallTimeMs: 1_784_675_200_000, clockUncertaintyMs: 1 });
  assert.throws(() => recorder.record({
    kind: 'operator-note',
    source: 'truth-ui',
    monotonicUs: 9,
    wallTimeMs: 1_784_675_200_001,
    clockUncertaintyMs: 1,
    payload: { code: 'manual-pause' },
  }), /moved backwards/);
});

test('a rejected start does not poison recorder lifecycle state', () => {
  const recorder = new FloorCorpusRecorder(createManifest({ pressureCount: 3, includeMotion: false }));
  assert.throws(() => recorder.start({ monotonicUs: -1, wallTimeMs: 1_784_675_200_000 }), /invalid event/);
  assert.doesNotThrow(() => recorder.start({ monotonicUs: 0, wallTimeMs: 1_784_675_200_000 }));
});

test('evaluation fails closed instead of throwing when clock configuration is missing', () => {
  const { manifest, events } = fixture();
  delete manifest.clock;
  assert.doesNotThrow(() => evaluateSession(manifest, events));
  assert.equal(evaluateSession(manifest, events).valid, false);
});

test('recorder streams immutable event copies to its sink', () => {
  const received = [];
  const recorder = new FloorCorpusRecorder(createManifest({ pressureCount: 3, includeMotion: false }), (event) => received.push(event));
  recorder.start({ monotonicUs: 0, wallTimeMs: 1_784_675_200_000, clockUncertaintyMs: 1 });
  received[0].payload.reason = 'cancelled';
  assert.equal(recorder.events[0].payload.reason, 'started');
});

test('two independently generated sessions have identical evidence fingerprints', () => {
  const left = createCanonicalFixture();
  const right = createCanonicalFixture();
  assert.equal(
    evaluateSession(left.manifest, left.events).fingerprint,
    evaluateSession(right.manifest, right.events).fingerprint,
  );
});

test('manifest validator catches duplicate level ordinals and sources', () => {
  const manifest = createManifest();
  manifest.building.levels[2].ordinal = manifest.building.levels[1].ordinal;
  manifest.capabilities[1].source = manifest.capabilities[0].source;
  const codes = new Set(validateManifest(manifest).map((error) => error.code));
  assert(codes.has('duplicate'));
});
