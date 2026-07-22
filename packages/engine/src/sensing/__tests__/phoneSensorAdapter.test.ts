import {
  PhoneFloorSensorAdapter,
  type NativeBarometerMeasurement,
  type NativeMagnetometerMeasurement,
  type NativeMotionMeasurement,
  type NormalizedPhoneSensorObservation,
  type PhoneSensorAdapterPorts,
  type SensorSourcePort,
} from '..';

class FakeSource<Measurement> implements SensorSourcePort<Measurement> {
  available = true;
  permission = 'granted';
  requestResult = 'granted';
  availabilityThrows = false;
  permissionThrows = false;
  subscribeThrows = false;
  listener: ((measurement: Measurement) => void) | null = null;
  events: string[] = [];
  removed = 0;
  requests = 0;

  async isAvailableAsync() {
    this.events.push('available');
    if (this.availabilityThrows) throw new Error('availability');
    return this.available;
  }
  async getPermissionsAsync() {
    this.events.push('permission');
    if (this.permissionThrows) throw new Error('permission');
    return { status: this.permission, granted: this.permission === 'granted' };
  }
  async requestPermissionsAsync() {
    this.events.push('request');
    this.requests += 1;
    return { status: this.requestResult, granted: this.requestResult === 'granted' };
  }
  setUpdateInterval(intervalMs: number) { this.events.push(`interval:${intervalMs}`); }
  addListener(listener: (measurement: Measurement) => void) {
    this.events.push('listen');
    if (this.subscribeThrows) throw new Error('subscribe');
    this.listener = listener;
    return { remove: () => { this.removed += 1; this.listener = null; } };
  }
  emit(measurement: Measurement) { this.listener?.(measurement); }
}

function fixture() {
  const barometer = new FakeSource<NativeBarometerMeasurement>();
  const motion = new FakeSource<NativeMotionMeasurement>();
  const magnetometer = new FakeSource<NativeMagnetometerMeasurement>();
  let now = 1_000_000;
  const observations: NormalizedPhoneSensorObservation[] = [];
  const issues: Array<{ code: string; sourceId: string }> = [];
  const adapter = new PhoneFloorSensorAdapter({
    ports: { barometer, motion, magnetometer } as PhoneSensorAdapterPorts,
    clock: { nowMonotonicUs: () => now },
    callbacks: { onObservation: (value) => observations.push(value), onIssue: (value) => issues.push(value) },
  });
  return { adapter, barometer, motion, magnetometer, observations, issues, setNow: (value: number) => { now = value; } };
}

const motionSample = (timestamp = 10): NativeMotionMeasurement => ({
  acceleration: { x: 1, y: 2, z: 3, timestamp },
  accelerationIncludingGravity: { x: 4, y: 5, z: 9.8, timestamp },
  rotationRate: { alpha: 180, beta: 90, gamma: -90, timestamp },
  orientation: 90,
});

describe('Expo 57 phone sensor normalisation contract', () => {
  it('checks permission, sets intervals before listeners and removes all streams', async () => {
    const f = fixture();
    const status = await f.adapter.start({ requestPermissions: false });
    expect(status.state).toBe('active');
    expect(status.capabilities.every((entry) => entry.active)).toBe(true);
    expect(f.barometer.events).toEqual(['available', 'permission', 'interval:500', 'listen']);
    expect(f.motion.events).toEqual(['available', 'permission', 'interval:100', 'listen']);
    expect(f.magnetometer.events).toEqual(['available', 'permission', 'interval:200', 'listen']);
    expect(f.adapter.stop().state).toBe('stopped');
    expect([f.barometer.removed, f.motion.removed, f.magnetometer.removed]).toEqual([1, 1, 1]);
  });

  it('normalises hPa, optional relative altitude and one timestamp mapping', async () => {
    const f = fixture();
    await f.adapter.start({ requestPermissions: false, streams: ['barometer'] });
    f.barometer.emit({ pressure: 1012.8, relativeAltitude: 3.4, timestamp: 10 });
    expect(f.observations[0]).toMatchObject({
      sequence: 0, kind: 'barometer', sourceId: 'barometer.primary', pressureHpa: 1012.8,
      relativeAltitudeM: 3.4, nativeTimestampSec: 10, monotonicUs: 0,
    });
  });

  it('maps SDK 57 rotation-rate alpha/beta/gamma to X/Y/Z and converts degrees/s to radians/s', async () => {
    const f = fixture();
    await f.adapter.start({ requestPermissions: false, streams: ['motion'] });
    f.motion.emit(motionSample());
    expect(f.observations[0]).toMatchObject({
      kind: 'motion', accelerationIncludingGravityMps2: { x: 4, y: 5, z: 9.8 },
      userAccelerationMps2: { x: 1, y: 2, z: 3 }, screenOrientationDeg: 90,
    });
    const rate = (f.observations[0] as Extract<NormalizedPhoneSensorObservation, { kind: 'motion' }>).rotationRateRps!;
    expect(rate.x).toBeCloseTo(Math.PI);
    expect(rate.y).toBeCloseTo(Math.PI / 2);
    expect(rate.z).toBeCloseTo(-Math.PI / 2);
  });

  it('keeps calibrated magnetometer values in microtesla', async () => {
    const f = fixture();
    await f.adapter.start({ requestPermissions: false, streams: ['magnetometer'] });
    f.magnetometer.emit({ x: 24, y: -8, z: 41, timestamp: 5 });
    expect(f.observations[0]).toMatchObject({ kind: 'magnetometer', microtesla: { x: 24, y: -8, z: 41 }, nativeTimestampSec: 5 });
  });

  it('requests permission only when the caller explicitly enables it', async () => {
    const passive = fixture();
    passive.motion.permission = 'undetermined';
    expect((await passive.adapter.start({ requestPermissions: false, streams: ['motion'] })).state).toBe('inactive');
    expect(passive.motion.requests).toBe(0);
    const explicit = fixture();
    explicit.motion.permission = 'undetermined';
    expect((await explicit.adapter.start({ requestPermissions: true, streams: ['motion'] })).state).toBe('active');
    expect(explicit.motion.requests).toBe(1);
  });

  it('reports unavailable and denied streams without listeners or fake samples', async () => {
    const f = fixture();
    f.barometer.available = false;
    f.motion.permission = 'denied';
    const status = await f.adapter.start({ requestPermissions: false, streams: ['barometer', 'motion'] });
    expect(status.state).toBe('inactive');
    expect(status.capabilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'barometer', permission: 'unavailable', active: false }),
      expect.objectContaining({ kind: 'motion', permission: 'denied', active: false }),
    ]));
    expect(f.observations).toEqual([]);
  });

  it('isolates source setup errors while another stream remains active', async () => {
    const f = fixture();
    f.barometer.availabilityThrows = true;
    f.motion.subscribeThrows = true;
    const status = await f.adapter.start({ requestPermissions: false });
    expect(status.state).toBe('active');
    expect(status.capabilities.find((entry) => entry.kind === 'magnetometer')?.active).toBe(true);
    expect(f.issues.map((entry) => entry.code)).toEqual(expect.arrayContaining(['availability-error', 'subscription-error']));
  });

  it('drops invalid and regressing native samples fail closed', async () => {
    const f = fixture();
    await f.adapter.start({ requestPermissions: false, streams: ['barometer'] });
    f.barometer.emit({ pressure: 1013, timestamp: 10 });
    f.setNow(1_500_000);
    f.barometer.emit({ pressure: 0, timestamp: 10.5 });
    f.barometer.emit({ pressure: 1012.9, timestamp: 9 });
    expect(f.observations).toHaveLength(1);
    expect(f.issues.map((entry) => entry.code)).toEqual(expect.arrayContaining(['invalid-sample', 'native-timestamp-regression']));
  });

  it('does not let an invalid payload advance the accepted native timestamp', async () => {
    const f = fixture();
    await f.adapter.start({ requestPermissions: false, streams: ['barometer'] });
    f.barometer.emit({ pressure: 2_000, timestamp: 12 });
    f.barometer.emit({ pressure: 1012.4, timestamp: 6 });
    expect(f.observations).toHaveLength(1);
    expect(f.observations[0]).toMatchObject({ kind: 'barometer', pressureHpa: 1012.4, nativeTimestampSec: 6 });
  });

  it('rejects double start, invalid intervals and an unavailable monotonic clock', async () => {
    const f = fixture();
    await f.adapter.start({ requestPermissions: false, streams: ['barometer'] });
    await expect(f.adapter.start({ requestPermissions: false })).rejects.toThrow('already-started');
    const invalidInterval = fixture();
    const adapter = new PhoneFloorSensorAdapter({
      ports: { barometer: invalidInterval.barometer, motion: invalidInterval.motion, magnetometer: invalidInterval.magnetometer },
      clock: { nowMonotonicUs: () => 0 }, callbacks: { onObservation: () => undefined }, intervals: { barometer: 1 },
    });
    await expect(adapter.start({ requestPermissions: false })).rejects.toThrow('interval-invalid');
    const badClock = fixture();
    badClock.setNow(-1);
    await expect(badClock.adapter.start({ requestPermissions: false })).rejects.toThrow('clock-unavailable');
  });
});
