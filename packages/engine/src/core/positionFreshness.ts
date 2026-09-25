import type { Coordinate, Packet } from './types';

/** Display policy, not a radio latency promise. Preserve existing 90/240s bounds. */
export const POSITION_RECENT_SEC = 30;
export const POSITION_STALE_SEC = 90;
export const POSITION_GHOST_SEC = 240;

// This is a process-local clock domain, not a device identity or a security token.
let clockEpoch = `${Date.now()}:${Math.random()}`;
let lastElapsed: number | null = null;
export interface PositionElapsedClock { epoch: string; seconds: number | null; }
export function positionElapsedClock(): PositionElapsedClock {
  const raw = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now() / 1000 : NaN;
  const seconds = Number.isFinite(raw) && raw >= 0 ? raw : null;
  // Retire the old clock domain on reset/unavailability. It must not become
  // valid again merely because a replacement clock later catches up.
  if (seconds === null || (lastElapsed !== null && seconds < lastElapsed)) {
    clockEpoch = `${Date.now()}:${Math.random()}`;
  }
  lastElapsed = seconds;
  return { epoch: clockEpoch, seconds };
}

export type PositionClockBasis = 'unverified' | 'verified' | 'simulation';
export type PositionFreshnessState = 'missing' | 'withheld' | 'clock-uncertain' | 'recent' | 'ageing' | 'stale';

/** Local-only metadata. Never encoded into a legacy packet or accepted from its payload. */
export interface PositionReceipt {
  reportedAtSec: number;
  receivedAtSec: number;
  latitude: number;
  longitude: number;
  clockBasis: PositionClockBasis;
  elapsedClock: PositionElapsedClock;
}

export interface PositionRecord {
  location?: Coordinate | null;
  receipt?: PositionReceipt;
  /** Legacy sender time is reported time, not proof of GPS observation time. */
  reportedAtSec?: number;
  visible?: boolean;
  visibleUntilSec?: number;
}

export interface PositionFreshness {
  state: PositionFreshnessState;
  label: string;
  location: Coordinate | null;
  /** Age only when the source clock and local receipt ordering are established. */
  ageSec: number | null;
  receivedAgoSec: number | null;
  /** Useful as a claim from the sender, never sufficient to assert freshness. */
  reportedAgeSec: number | null;
  isCurrent: boolean;
  ghost: boolean;
}

export function validPosition(location: Coordinate | null | undefined): location is Coordinate {
  return !!location && Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90 &&
    Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180;
}

export function validPositionTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff;
}

/** Unknown clocks do not become trusted because a packet parsed or a socket connected. */
export function makePositionReceipt(
  location: Coordinate, reportedAtSec: number, receivedAtSec: number,
  clockBasis: PositionClockBasis = 'unverified',
  elapsedClock: PositionElapsedClock = positionElapsedClock(),
): PositionReceipt | undefined {
  if (!validPosition(location) || !validPositionTime(reportedAtSec) ||
      !Number.isFinite(receivedAtSec) || receivedAtSec < 0) return undefined;
  return { latitude: location.latitude, longitude: location.longitude, reportedAtSec, receivedAtSec, clockBasis, elapsedClock: { ...elapsedClock } };
}

/** Preserve the existing monotonic sender-time rule, including direct store callers. */
export function newerPosition(next: number, previous?: number): boolean {
  return validPositionTime(next) && (!validPositionTime(previous) || next > previous);
}

function elapsedLabel(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

/**
 * A projection over existing records, not a new store. Receipt time is never
 * substituted for reported/observation time. Missing provenance is uncertainty.
 * Permission/expiry is a caller-supplied visibility gate, not authorisation code.
 */
export function positionFreshness(
  record: PositionRecord, nowSec: number, clock: PositionElapsedClock = positionElapsedClock(),
): PositionFreshness {
  const empty: PositionFreshness = {
    state: 'missing', label: 'Position unavailable', location: null, ageSec: null,
    receivedAgoSec: null, reportedAgeSec: null, isCurrent: false, ghost: true,
  };
  if (record.visible === false || (record.visibleUntilSec !== undefined &&
      (!Number.isFinite(record.visibleUntilSec) || !Number.isFinite(nowSec) || nowSec >= record.visibleUntilSec))) {
    return { ...empty, state: 'withheld', label: 'Position withheld' };
  }
  if (!validPosition(record.location)) return empty;
  const location = { latitude: record.location.latitude, longitude: record.location.longitude };
  const receipt = record.receipt;
  // A status/SOS/fixture that replaces coordinates cannot inherit another fix's provenance.
  const bound = receipt && receipt.latitude === location.latitude && receipt.longitude === location.longitude &&
    (record.reportedAtSec === undefined || record.reportedAtSec === receipt.reportedAtSec);
  const reportedAt = bound ? receipt.reportedAtSec : record.reportedAtSec;
  const saneNow = Number.isFinite(nowSec) && nowSec >= 0;
  const receiptClock = bound ? receipt.elapsedClock : undefined;
  const receivedAgoSec = receiptClock && receiptClock.epoch === clock.epoch &&
    typeof receiptClock.seconds === 'number' && Number.isFinite(receiptClock.seconds) && receiptClock.seconds >= 0 &&
    typeof clock.seconds === 'number' && Number.isFinite(clock.seconds) && clock.seconds >= receiptClock.seconds
    ? clock.seconds - receiptClock.seconds : null;
  const reportedAgeSec = saneNow && validPositionTime(reportedAt) && nowSec >= reportedAt
    ? nowSec - reportedAt : null;
  const uncertain = {
    ...empty, location, state: 'clock-uncertain' as const, receivedAgoSec, reportedAgeSec,
    label: receivedAgoSec === null ? 'Age unverified' : `Age unverified · received ${elapsedLabel(receivedAgoSec)} ago`,
    ghost: receivedAgoSec === null || receivedAgoSec > POSITION_GHOST_SEC,
  };
  if (!saneNow || !bound || receivedAgoSec === null ||
      (receipt.clockBasis !== 'verified' && receipt.clockBasis !== 'simulation') ||
      !validPositionTime(receipt.reportedAtSec) || !Number.isFinite(receipt.receivedAtSec) ||
      receipt.receivedAtSec < receipt.reportedAtSec) return uncertain;
  // Initial source age plus local monotonic elapsed time. Wall-clock corrections
  // after receipt cannot make a previously ageing observation recent again.
  const ageSec = receipt.receivedAtSec - receipt.reportedAtSec + receivedAgoSec;
  if (!Number.isFinite(ageSec)) return uncertain;
  const state = ageSec <= POSITION_RECENT_SEC ? 'recent' : ageSec <= POSITION_STALE_SEC ? 'ageing' : 'stale';
  const prefix = receipt.clockBasis === 'simulation' ? 'Demo · ' : '';
  return {
    location, state, ageSec, reportedAgeSec, receivedAgoSec,
    label: `${prefix}${state === 'stale' ? 'Last known' : state === 'ageing' ? 'Ageing' : 'Recent'} · ${elapsedLabel(ageSec)} ago`,
    isCurrent: state === 'recent', ghost: ageSec > POSITION_GHOST_SEC,
  };
}

/** Structural adapter shared by Consumer and Guard; no runtime store import. */
export function friendPositionFreshness(
  friend: { lastPacket?: Packet; positionReceipt?: PositionReceipt; positionVisible?: boolean; positionVisibleUntilSec?: number },
  nowSec: number, clock: PositionElapsedClock = positionElapsedClock(),
): PositionFreshness {
  const packet = friend.lastPacket;
  return positionFreshness({
    location: packet?.type === 'position' ? packet : undefined,
    reportedAtSec: packet?.timestampSec, receipt: friend.positionReceipt,
    visible: friend.positionVisible, visibleUntilSec: friend.positionVisibleUntilSec,
  }, nowSec, clock);
}
