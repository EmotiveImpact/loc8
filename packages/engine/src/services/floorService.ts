// src/services/floorService.ts
//
// Automatic floor detection from the phone's barometer, with a manual override.
// Mirrors the haptics contract: guarded, fire-and-forget, safe where there's no
// sensor (web, simulators, older devices) — it simply never moves the floor and
// the UI's manual picker takes over.
//
// Strategy (see core/floorMath for the physics):
//   • Self-baseline: the first stable pressure reading after start() is treated
//     as the current floor's reference (floor 0 at clock-in / entry).
//   • Every reading → EMA-smoothed → fractional estimate vs baseline → resolved
//     with hysteresis so it doesn't flap at a boundary → written to the store
//     (which ignores it while the user has pinned a floor manually).
//   • Manual pin recalibrates the baseline so 'auto' agrees on return.
//
// Weather drift over a long shift is the known limitation; a future enhancement
// is a shared baseline broadcast over the mesh (all phones see one weather), for
// which setSharedBaseline() is the hook.
import { Platform } from 'react-native';
import { Barometer } from 'expo-sensors';
import { useCrewStore } from '../state/crewStore';
import {
  floorEstimate,
  resolveFloorWithHysteresis,
  smoothPressure,
  DEFAULT_HPA_PER_FLOOR,
} from '../core/floorMath';

let sub: { remove: () => void } | null = null;
let baselineHpa: number | null = null;
let smoothed: number | null = null;
let started = false;
let available = false;

const store = () => useCrewStore.getState();

function onReading(pressureHpa: number): void {
  if (!Number.isFinite(pressureHpa) || pressureHpa <= 0) return;
  smoothed = smoothPressure(smoothed, pressureHpa);
  // First good reading establishes the baseline = wherever you are now (floor 0).
  if (baselineHpa == null) baselineHpa = smoothed;
  const est = floorEstimate(smoothed, baselineHpa);
  const s = store();
  const resolved = resolveFloorWithHysteresis(est, s.myFloor);
  if (resolved !== s.myFloor) s.setMyFloor(resolved); // no-op while mode === 'manual'
}

/** True once start() has confirmed a usable barometer. */
export function isFloorSensingActive(): boolean {
  return started && available;
}

export async function startFloorService(): Promise<void> {
  if (started) return;
  started = true;
  if (Platform.OS === 'web') return; // no barometer on web
  try {
    available = await Barometer.isAvailableAsync();
  } catch {
    available = false;
  }
  if (!available) return; // simulator / device without a barometer → manual only
  try {
    Barometer.setUpdateInterval(500); // 2 Hz is ample
    sub = Barometer.addListener(({ pressure }) => onReading(pressure));
  } catch {
    available = false;
  }
}

export function stopFloorService(): void {
  sub?.remove();
  sub = null;
  started = false;
  available = false;
  smoothed = null;
  baselineHpa = null;
}

/** Pin the floor manually and recalibrate the baseline so 'auto' agrees later. */
export function setManualFloor(floor: number): void {
  store().setFloorManual(floor);
  if (smoothed != null) baselineHpa = smoothed + floor * DEFAULT_HPA_PER_FLOOR;
}

/** Hand control back to the barometer, keeping the current floor as the anchor. */
export function setAutoFloor(): void {
  const cur = store().myFloor;
  store().setFloorAuto();
  if (smoothed != null) baselineHpa = smoothed + cur * DEFAULT_HPA_PER_FLOOR;
}

/**
 * Adopt a baseline learned elsewhere (e.g. a ground-floor reference broadcast
 * over the mesh) so floors are consistent team-wide and weather drift cancels.
 * `refPressureHpa` is the pressure that corresponds to `refFloor`.
 */
export function setSharedBaseline(refPressureHpa: number, refFloor = 0): void {
  if (!Number.isFinite(refPressureHpa) || refPressureHpa <= 0) return;
  baselineHpa = refPressureHpa + refFloor * DEFAULT_HPA_PER_FLOOR;
}
