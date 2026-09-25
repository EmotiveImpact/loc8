import type { Coordinate } from './types';
import { positionElapsedClock, validPosition, type PositionElapsedClock } from './positionFreshness';

/** Local provenance only. The v1 wire timestamp remains REPORT publication time. */
export interface SourceLocationInput {
  coords: Coordinate & { accuracy?: number | null };
  timestamp: number; // provider observation time, epoch milliseconds (Expo SDK 57)
  mocked?: boolean;
}
export interface SourceLocationSample {
  coordinate: Coordinate;
  observedAtMs: number;
  receivedAtMs: number;
  accuracyM: number | null; // original provider precision, not the uint8 wire value
  source: 'device' | 'demo';
  mocked: boolean | null; // null means the provider did not say
  elapsedClock: PositionElapsedClock;
}
export type SourceLocationState = 'missing' | 'unverified' | 'demo' | 'mocked' | 'clock-uncertain' | 'recent' | 'ageing' | 'stale';
export interface SourceLocationView {
  state: SourceLocationState;
  ageMs: number | null;
  accuracyM: number | null;
  observedAtMs: number | null;
  isCurrent: boolean;
}

/** Display policy only; does not suppress or re-time the legacy heartbeat. */
export const SOURCE_RECENT_MS = 30_000;
export const SOURCE_STALE_MS = 90_000;
const validMillis = (value: unknown): value is number => typeof value === 'number' &&
  Number.isFinite(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER;

/** Validate untrusted provider objects without fabricating missing timestamps. */
export function captureSourceLocation(
  input: SourceLocationInput, receivedAtMs = Date.now(),
  elapsedClock: PositionElapsedClock = positionElapsedClock(),
  source: SourceLocationSample['source'] = 'device',
): SourceLocationSample | null {
  if (!input || !validPosition(input.coords) || !validMillis(input.timestamp) ||
      !validMillis(receivedAtMs) || input.timestamp > receivedAtMs ||
      (source !== 'device' && source !== 'demo')) return null;
  const accuracy = input.coords.accuracy;
  return {
    coordinate: { latitude: input.coords.latitude, longitude: input.coords.longitude },
    observedAtMs: input.timestamp, receivedAtMs,
    accuracyM: typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null,
    source, mocked: typeof input.mocked === 'boolean' ? input.mocked : null,
    elapsedClock: { ...elapsedClock },
  };
}

/** First receipt wins for the same sample, even if an OS redelivers it later. */
export function shouldReplaceSourceLocation(previous: SourceLocationSample | null, next: SourceLocationSample): boolean {
  return !previous || previous.source !== next.source ||
    previous.elapsedClock.epoch !== next.elapsedClock.epoch || next.observedAtMs > previous.observedAtMs;
}

function boundSample(location: Coordinate | null | undefined, sample: SourceLocationSample | null | undefined): sample is SourceLocationSample {
  return !!sample && validPosition(location) && validPosition(sample.coordinate) &&
    location.latitude === sample.coordinate.latitude && location.longitude === sample.coordinate.longitude;
}

/**
 * Observation age is source delay plus local elapsed time, never publication age.
 * Wall/monotonic disagreement fails closed, including suspend clocks that pause.
 * A provider timestamp is still not a cryptographic or physical accuracy proof.
 */
export function sourceLocationView(
  location: Coordinate | null | undefined, sample: SourceLocationSample | null | undefined,
  nowMs = Date.now(), clock: PositionElapsedClock = positionElapsedClock(),
): SourceLocationView {
  const empty: SourceLocationView = { state: 'missing', ageMs: null, accuracyM: null, observedAtMs: null, isCurrent: false };
  if (!validPosition(location)) return empty;
  if (!boundSample(location, sample)) return { ...empty, state: 'unverified' };
  const view = { ...empty, accuracyM: sample.accuracyM, observedAtMs: sample.observedAtMs };
  if (sample.source === 'demo') return { ...view, state: 'demo' };
  if (sample.mocked === true) return { ...view, state: 'mocked' };
  const elapsed = clock.seconds;
  const received = sample.elapsedClock.seconds;
  const uncertain = { ...view, state: 'clock-uncertain' as const };
  if (!validMillis(nowMs) || !validMillis(sample.observedAtMs) || !validMillis(sample.receivedAtMs) ||
      sample.observedAtMs > sample.receivedAtMs || sample.elapsedClock.epoch !== clock.epoch ||
      typeof received !== 'number' || !Number.isFinite(received) || received < 0 ||
      typeof elapsed !== 'number' || !Number.isFinite(elapsed) || elapsed < received) return uncertain;
  const elapsedMs = (elapsed - received) * 1000;
  const wallElapsedMs = nowMs - sample.receivedAtMs;
  // Five seconds allows clock resolution/scheduling noise, not a freshness grant.
  if (Math.abs(wallElapsedMs - elapsedMs) > 5000) return uncertain;
  const ageMs = sample.receivedAtMs - sample.observedAtMs + Math.max(elapsedMs, wallElapsedMs, 0);
  if (!Number.isFinite(ageMs)) return uncertain;
  const state = ageMs <= SOURCE_RECENT_MS ? 'recent' : ageMs <= SOURCE_STALE_MS ? 'ageing' : 'stale';
  return { ...view, state, ageMs, isCurrent: state === 'recent' };
}

/**
 * Reuse the existing accuracy byte, rounding upwards rather than inventing 10m.
 * 255 is the existing representational ceiling, NOT a new unambiguous sentinel.
 * Unknown and saturated values cannot be distinguished by legacy receivers.
 */
export function legacySourceAccuracy(location: Coordinate | null | undefined, sample: SourceLocationSample | null | undefined): number {
  const accuracy = boundSample(location, sample) && sample.source === 'device' && sample.mocked !== true
    ? sample.accuracyM : null;
  return typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0
    ? Math.min(255, Math.ceil(accuracy)) : 255;
}
