import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { evaluateSession } from './floor-corpus.mjs';
import { createCanonicalFixture } from './fixture.mjs';

const MINIMUM_EVENTS = 50_000;
const MAXIMUM_DURATION_MS = 5_000;
const fixture = createCanonicalFixture({ pressureCount: 50_001, includeMotion: false });

function run() {
  const startedAt = performance.now();
  const report = evaluateSession(fixture.manifest, fixture.events);
  return { report, durationMs: Number((performance.now() - startedAt).toFixed(3)) };
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

const first = run();
const second = run();
const fingerprintsMatch = first.report.fingerprint === second.report.fingerprint;
const gatePass =
  fixture.events.length >= MINIMUM_EVENTS &&
  first.report.valid &&
  second.report.valid &&
  first.durationMs < MAXIMUM_DURATION_MS &&
  second.durationMs < MAXIMUM_DURATION_MS &&
  fingerprintsMatch;

const evidence = {
  benchmark: 'floor-01-corpus-replay-v1',
  runtime: process.version,
  platform: process.platform,
  architecture: process.arch,
  eventCount: fixture.events.length,
  minimumEvents: MINIMUM_EVENTS,
  maximumDurationMs: MAXIMUM_DURATION_MS,
  durationsMs: [first.durationMs, second.durationMs],
  valid: [first.report.valid, second.report.valid],
  fingerprintSha256: [digest(first.report.fingerprint), digest(second.report.fingerprint)],
  fingerprintsMatch,
  errors: [first.report.errors, second.report.errors],
  gatePass,
};

process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (!gatePass) process.exitCode = 1;
