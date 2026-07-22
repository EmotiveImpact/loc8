export const FLOOR_REPLAY_SCHEMA = 'loc8.floor-replay.v1' as const;
export const FLOOR_REPLAY_MAX_BYTES = 2_000_000;
export const FLOOR_REPLAY_MAX_EVENTS = 20_000;

export type FloorReplayEvidenceClass = 'synthetic' | 'recorded-unverified';
export type PhoneSensorKind = 'barometer' | 'motion' | 'magnetometer';
export type PhoneSensorPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable' | 'not-required' | 'error';

export interface SensorVector3 {
  x: number;
  y: number;
  z: number;
}

export interface FloorReplayCapability {
  sourceId: string;
  kind: PhoneSensorKind;
  available: boolean;
  permission: PhoneSensorPermission;
  requestedIntervalMs: number;
  unit: 'hpa' | 'mps2-rps' | 'microtesla';
  nativeTimestampUnit: 'seconds';
}

export interface FloorReplayLevel {
  levelId: string;
  legacyFloor: number;
  elevationM: number;
}

interface FloorReplayEventBase {
  sequence: number;
  elapsedMs: number;
  sourceId: string;
}

export interface FloorReplayAnchorEvent extends FloorReplayEventBase {
  kind: 'anchor';
  sourceId: 'operator.anchor';
  levelId: string;
}

export interface FloorReplayTruthEvent extends FloorReplayEventBase {
  kind: 'truth';
  sourceId: 'truth.timeline';
  levelId: string;
  phase: 'stationary' | 'transition-start' | 'landing' | 'same-floor-control';
  connectorId: string | null;
}

export interface FloorReplayBarometerEvent extends FloorReplayEventBase {
  kind: 'barometer';
  pressureHpa: number;
  relativeAltitudeM: number | null;
  nativeTimestampSec: number;
}

export interface FloorReplayMotionEvent extends FloorReplayEventBase {
  kind: 'motion';
  accelerationIncludingGravityMps2: SensorVector3;
  userAccelerationMps2: SensorVector3 | null;
  rotationRateRps: SensorVector3 | null;
  screenOrientationDeg: 0 | 90 | 180 | -90;
  nativeTimestampSec: number;
}

export interface FloorReplayMagnetometerEvent extends FloorReplayEventBase {
  kind: 'magnetometer';
  microtesla: SensorVector3;
  nativeTimestampSec: number;
}

export type FloorReplayEvent =
  | FloorReplayAnchorEvent
  | FloorReplayTruthEvent
  | FloorReplayBarometerEvent
  | FloorReplayMotionEvent
  | FloorReplayMagnetometerEvent;

export interface FloorReplayBundle {
  schemaVersion: typeof FLOOR_REPLAY_SCHEMA;
  evidenceClass: FloorReplayEvidenceClass;
  journeyId: string;
  buildingId: string;
  packageId: string;
  mapVersion: string;
  durationMs: number;
  levels: FloorReplayLevel[];
  connectorIds: string[];
  capabilities: FloorReplayCapability[];
  events: FloorReplayEvent[];
}

export interface SensingValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface FloorReplayFrame {
  index: number;
  elapsedMs: number;
  event: FloorReplayEvent;
  estimatedLevelId: string | null;
  estimatedLegacyFloor: number;
  estimateConfidence: 'unknown' | 'anchored' | 'estimated';
  confirmSuggested: boolean;
  truthLevelId: string | null;
  truthPhase: FloorReplayTruthEvent['phase'] | null;
  truthConnectorId: string | null;
  estimateDeltaFloors: number | null;
  counts: Record<PhoneSensorKind, number>;
  latestBarometer: FloorReplayBarometerEvent | null;
  latestMotion: FloorReplayMotionEvent | null;
  latestMagnetometer: FloorReplayMagnetometerEvent | null;
}

export type NormalizedPhoneSensorObservation =
  | (Omit<FloorReplayBarometerEvent, 'elapsedMs'> & { kind: 'barometer'; monotonicUs: number })
  | (Omit<FloorReplayMotionEvent, 'elapsedMs'> & { kind: 'motion'; monotonicUs: number })
  | (Omit<FloorReplayMagnetometerEvent, 'elapsedMs'> & { kind: 'magnetometer'; monotonicUs: number });

export interface PhoneSensorAdapterIssue {
  code: string;
  sourceId: string;
}

export interface PhoneSensorAdapterCapability extends FloorReplayCapability {
  active: boolean;
}

export interface PhoneSensorAdapterStatus {
  state: 'idle' | 'starting' | 'active' | 'inactive' | 'stopped';
  capabilities: PhoneSensorAdapterCapability[];
}
