import { Barometer, DeviceMotion, Magnetometer } from 'expo-sensors';
import {
  PhoneFloorSensorAdapter,
  type PhoneSensorAdapterCallbacks,
  type PhoneSensorAdapterIntervals,
  type PhoneSensorAdapterPorts,
} from '../sensing/phoneSensorAdapter';

function monotonicNowUs() {
  const now = globalThis.performance?.now?.();
  if (!Number.isFinite(now) || now < 0) throw new Error('monotonic-clock-unavailable');
  return Math.round(now * 1_000);
}

/**
 * Expo SDK 57 native adapter. Creating it performs no permission request,
 * subscription, persistence or network send; the caller must explicitly call
 * start(), normally from a consented user action.
 */
export function createExpoPhoneFloorSensorAdapter(
  callbacks: PhoneSensorAdapterCallbacks,
  intervals?: Partial<PhoneSensorAdapterIntervals>,
) {
  return new PhoneFloorSensorAdapter({
    ports: { barometer: Barometer, motion: DeviceMotion, magnetometer: Magnetometer } as unknown as PhoneSensorAdapterPorts,
    clock: { nowMonotonicUs: monotonicNowUs },
    callbacks,
    intervals,
  });
}
