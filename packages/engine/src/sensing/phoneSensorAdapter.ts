import type {
  NormalizedPhoneSensorObservation,
  PhoneSensorAdapterCapability,
  PhoneSensorAdapterIssue,
  PhoneSensorAdapterStatus,
  PhoneSensorKind,
  PhoneSensorPermission,
  SensorVector3,
} from './types';

export interface SensorSubscriptionPort {
  remove(): void;
}

export interface SensorPermissionResponsePort {
  status: string;
  granted?: boolean;
}

export interface SensorSourcePort<Measurement> {
  isAvailableAsync(): Promise<boolean>;
  getPermissionsAsync?(): Promise<SensorPermissionResponsePort>;
  requestPermissionsAsync?(): Promise<SensorPermissionResponsePort>;
  setUpdateInterval(intervalMs: number): void;
  addListener(listener: (measurement: Measurement) => void): SensorSubscriptionPort;
}

export interface NativeBarometerMeasurement {
  pressure: number;
  relativeAltitude?: number;
  timestamp: number;
}

export interface NativeMotionMeasurement {
  acceleration: SensorVector3 & { timestamp: number } | null;
  accelerationIncludingGravity: SensorVector3 & { timestamp: number };
  rotationRate: { alpha: number; beta: number; gamma: number; timestamp: number } | null;
  orientation: number;
}

export interface NativeMagnetometerMeasurement extends SensorVector3 {
  timestamp: number;
}

export interface PhoneSensorAdapterPorts {
  barometer: SensorSourcePort<NativeBarometerMeasurement>;
  motion: SensorSourcePort<NativeMotionMeasurement>;
  magnetometer: SensorSourcePort<NativeMagnetometerMeasurement>;
}

export interface PhoneSensorAdapterClock {
  nowMonotonicUs(): number;
}

export interface PhoneSensorAdapterCallbacks {
  onObservation(observation: NormalizedPhoneSensorObservation): void;
  onIssue?(issue: PhoneSensorAdapterIssue): void;
}

export interface PhoneSensorAdapterIntervals {
  barometer: number;
  motion: number;
  magnetometer: number;
}

const SOURCE_BY_KIND: Record<PhoneSensorKind, string> = {
  barometer: 'barometer.primary', motion: 'motion.primary', magnetometer: 'magnetometer.primary',
};
const UNIT_BY_KIND = { barometer: 'hpa', motion: 'mps2-rps', magnetometer: 'microtesla' } as const;
const RAD_PER_DEGREE = Math.PI / 180;

function finite(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function vector(value: unknown, limit: number): value is SensorVector3 {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return finite(candidate.x, -limit, limit) && finite(candidate.y, -limit, limit) && finite(candidate.z, -limit, limit);
}

function permission(response: SensorPermissionResponsePort): PhoneSensorPermission {
  if (response.granted === true || response.status === 'granted') return 'granted';
  if (response.status === 'denied') return 'denied';
  return 'undetermined';
}

export class PhoneFloorSensorAdapter {
  private subscriptions: SensorSubscriptionPort[] = [];
  private statusValue: PhoneSensorAdapterStatus = { state: 'idle', capabilities: [] };
  private sessionStartUs = 0;
  private sequence = 0;
  private timestampOffsets = new Map<string, number>();
  private lastMapped = new Map<string, number>();

  constructor(private readonly dependencies: {
    ports: PhoneSensorAdapterPorts;
    clock: PhoneSensorAdapterClock;
    callbacks: PhoneSensorAdapterCallbacks;
    intervals?: Partial<PhoneSensorAdapterIntervals>;
  }) {}

  get status(): PhoneSensorAdapterStatus {
    return { state: this.statusValue.state, capabilities: this.statusValue.capabilities.map((entry) => ({ ...entry })) };
  }

  async start(options: { requestPermissions: boolean; streams?: readonly PhoneSensorKind[] }): Promise<PhoneSensorAdapterStatus> {
    if (this.statusValue.state === 'starting' || this.statusValue.state === 'active') throw new Error('phone-sensor-adapter-already-started');
    this.removeSubscriptions();
    this.sequence = 0;
    this.timestampOffsets.clear();
    this.lastMapped.clear();
    const start = this.dependencies.clock.nowMonotonicUs();
    if (!Number.isSafeInteger(start) || start < 0) throw new Error('phone-sensor-clock-unavailable');
    this.sessionStartUs = start;
    this.statusValue = { state: 'starting', capabilities: [] };
    const intervals: PhoneSensorAdapterIntervals = {
      barometer: this.dependencies.intervals?.barometer ?? 500,
      motion: this.dependencies.intervals?.motion ?? 100,
      magnetometer: this.dependencies.intervals?.magnetometer ?? 200,
    };
    for (const interval of Object.values(intervals)) {
      if (!Number.isSafeInteger(interval) || interval < 20 || interval > 60_000) throw new Error('phone-sensor-interval-invalid');
    }
    const selected = new Set(options.streams ?? (['barometer', 'motion', 'magnetometer'] as const));
    const capabilities: PhoneSensorAdapterCapability[] = [];
    for (const kind of ['barometer', 'motion', 'magnetometer'] as const) {
      if (!selected.has(kind)) continue;
      capabilities.push(await this.startSource(kind, intervals[kind], options.requestPermissions));
    }
    this.statusValue = {
      state: capabilities.some((entry) => entry.active) ? 'active' : 'inactive',
      capabilities,
    };
    return this.status;
  }

  stop(): PhoneSensorAdapterStatus {
    this.removeSubscriptions();
    this.statusValue = { state: 'stopped', capabilities: this.statusValue.capabilities.map((entry) => ({ ...entry, active: false })) };
    return this.status;
  }

  private async startSource(kind: PhoneSensorKind, interval: number, requestPermissions: boolean): Promise<PhoneSensorAdapterCapability> {
    const sourceId = SOURCE_BY_KIND[kind];
    const port = this.dependencies.ports[kind] as SensorSourcePort<unknown>;
    const base = { sourceId, kind, requestedIntervalMs: interval, unit: UNIT_BY_KIND[kind], nativeTimestampUnit: 'seconds' as const };
    let available: boolean;
    try { available = await port.isAvailableAsync(); } catch {
      this.issue('availability-error', sourceId);
      return { ...base, available: false, permission: 'error', active: false, requestedIntervalMs: 0 };
    }
    if (!available) return { ...base, available: false, permission: 'unavailable', active: false, requestedIntervalMs: 0 };
    let permissionState: PhoneSensorPermission = 'not-required';
    if (port.getPermissionsAsync) {
      try {
        permissionState = permission(await port.getPermissionsAsync());
        if (permissionState === 'undetermined' && requestPermissions && port.requestPermissionsAsync) {
          permissionState = permission(await port.requestPermissionsAsync());
        }
      } catch {
        this.issue('permission-error', sourceId);
        return { ...base, available: true, permission: 'error', active: false };
      }
    }
    if (permissionState !== 'granted' && permissionState !== 'not-required') {
      return { ...base, available: true, permission: permissionState, active: false };
    }
    try {
      port.setUpdateInterval(interval);
      const subscription = port.addListener((measurement) => this.accept(kind, measurement));
      this.subscriptions.push(subscription);
      return { ...base, available: true, permission: permissionState, active: true };
    } catch {
      this.issue('subscription-error', sourceId);
      return { ...base, available: true, permission: 'error', active: false };
    }
  }

  private accept(kind: PhoneSensorKind, measurement: unknown) {
    const sourceId = SOURCE_BY_KIND[kind];
    const normalized = kind === 'barometer'
      ? this.mapBarometer(sourceId, measurement)
      : kind === 'motion'
        ? this.mapMotion(sourceId, measurement)
        : this.mapMagnetometer(sourceId, measurement);
    if (normalized) this.dependencies.callbacks.onObservation(normalized);
  }

  private mapTime(sourceId: string, nativeTimestampSec: unknown): number | null {
    if (!finite(nativeTimestampSec, 0, Number.MAX_SAFE_INTEGER / 1_000_000)) {
      this.issue('invalid-native-timestamp', sourceId);
      return null;
    }
    const now = this.dependencies.clock.nowMonotonicUs();
    if (!Number.isSafeInteger(now) || now < this.sessionStartUs) {
      this.issue('clock-regression', sourceId);
      return null;
    }
    const relativeNow = now - this.sessionStartUs;
    let offset = this.timestampOffsets.get(sourceId);
    if (offset === undefined) {
      offset = relativeNow - Math.round(nativeTimestampSec * 1_000_000);
      this.timestampOffsets.set(sourceId, offset);
    }
    const mapped = Math.round(nativeTimestampSec * 1_000_000 + offset);
    const previous = this.lastMapped.get(sourceId);
    if (!Number.isSafeInteger(mapped) || mapped < 0 || (previous !== undefined && mapped < previous)) {
      this.issue('native-timestamp-regression', sourceId);
      return null;
    }
    this.lastMapped.set(sourceId, mapped);
    return mapped;
  }

  private mapBarometer(sourceId: string, value: unknown): NormalizedPhoneSensorObservation | null {
    if (value === null || typeof value !== 'object') return this.invalid(sourceId);
    const measurement = value as NativeBarometerMeasurement;
    if (!finite(measurement.pressure, 300, 1200) ||
        (measurement.relativeAltitude !== undefined && !finite(measurement.relativeAltitude, -10_000, 10_000))) return this.invalid(sourceId);
    const monotonicUs = this.mapTime(sourceId, measurement.timestamp);
    if (monotonicUs === null) return this.invalid(sourceId);
    return {
      sequence: this.sequence++, kind: 'barometer', sourceId, monotonicUs,
      pressureHpa: measurement.pressure,
      relativeAltitudeM: measurement.relativeAltitude ?? null,
      nativeTimestampSec: measurement.timestamp,
    };
  }

  private mapMotion(sourceId: string, value: unknown): NormalizedPhoneSensorObservation | null {
    if (value === null || typeof value !== 'object') return this.invalid(sourceId);
    const measurement = value as NativeMotionMeasurement;
    const gravity = measurement.accelerationIncludingGravity;
    if (!vector(gravity, 200) || (measurement.acceleration !== null && !vector(measurement.acceleration, 200)) ||
        ![0, 90, 180, -90].includes(measurement.orientation)) return this.invalid(sourceId);
    const rate = measurement.rotationRate;
    if (rate !== null && (!finite(rate.alpha, -36_000, 36_000) || !finite(rate.beta, -36_000, 36_000) || !finite(rate.gamma, -36_000, 36_000))) return this.invalid(sourceId);
    const monotonicUs = this.mapTime(sourceId, gravity.timestamp);
    if (monotonicUs === null) return this.invalid(sourceId);
    return {
      sequence: this.sequence++, kind: 'motion', sourceId, monotonicUs,
      accelerationIncludingGravityMps2: { x: gravity.x, y: gravity.y, z: gravity.z },
      userAccelerationMps2: measurement.acceleration ? { x: measurement.acceleration.x, y: measurement.acceleration.y, z: measurement.acceleration.z } : null,
      // Expo SDK 57's DeviceMotion type defines rotation-rate alpha/beta/gamma
      // as X/Y/Z respectively. These are rates, not the differently described
      // Euler-orientation angles exposed in `rotation`.
      rotationRateRps: rate ? { x: rate.alpha * RAD_PER_DEGREE, y: rate.beta * RAD_PER_DEGREE, z: rate.gamma * RAD_PER_DEGREE } : null,
      screenOrientationDeg: measurement.orientation as 0 | 90 | 180 | -90,
      nativeTimestampSec: gravity.timestamp,
    };
  }

  private mapMagnetometer(sourceId: string, value: unknown): NormalizedPhoneSensorObservation | null {
    if (value === null || typeof value !== 'object') return this.invalid(sourceId);
    const measurement = value as NativeMagnetometerMeasurement;
    if (!vector(measurement, 5_000)) return this.invalid(sourceId);
    const monotonicUs = this.mapTime(sourceId, measurement.timestamp);
    if (monotonicUs === null) return this.invalid(sourceId);
    return {
      sequence: this.sequence++, kind: 'magnetometer', sourceId, monotonicUs,
      microtesla: { x: measurement.x, y: measurement.y, z: measurement.z },
      nativeTimestampSec: measurement.timestamp,
    };
  }

  private invalid(sourceId: string): null {
    this.issue('invalid-sample', sourceId);
    return null;
  }

  private issue(code: string, sourceId: string) {
    this.dependencies.callbacks.onIssue?.({ code, sourceId });
  }

  private removeSubscriptions() {
    for (const subscription of this.subscriptions.splice(0)) {
      try { subscription.remove(); } catch { this.issue('subscription-remove-error', 'adapter.lifecycle'); }
    }
  }
}
