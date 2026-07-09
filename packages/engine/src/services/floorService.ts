// src/services/floorService.ts
//
// Glue between the phone's barometer and the FloorTracker (core/floorTracker):
// MANUAL ANCHOR is the source of truth, the barometer only tracks within-device
// movement — the one thing it's reliable at. Absolute pressure→floor and
// cross-device pressure sharing are deliberately NOT done here: device sensor
// bias (0.5–2 hPa between phones) is often bigger than a storey, so "automatic
// team-consistent floors from pressure" would be false confidence. Consistency
// comes from each guard anchoring once at clock-in; phase-2 co-location
// calibration (e.g. at muster) can tighten this later.
//
// Guarded like haptics: safe where there's no sensor (web, simulators) — floors
// then move only via anchorFloor(), which is pure manual mode.
import { Platform } from 'react-native';
import { Barometer } from 'expo-sensors';
import { useCrewStore } from '../state/crewStore';
import { FloorTracker } from '../core/floorTracker';

let tracker = new FloorTracker();
let sub: { remove: () => void } | null = null;
let started = false;
let available = false;

function push(state: { floor: number; confidence: 'unknown' | 'anchored' | 'estimated'; confirmSuggested: boolean }): void {
  useCrewStore.getState().setFloorState(state.floor, state.confidence, state.confirmSuggested);
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
  if (!available) return; // simulator / no sensor → anchors only
  try {
    Barometer.setUpdateInterval(500); // 2 Hz is ample for stairs and lifts
    sub = Barometer.addListener(({ pressure, timestamp }) => {
      // expo-sensors timestamps are seconds; fall back to wall clock.
      const atMs = Number.isFinite(timestamp) ? timestamp * 1000 : Date.now();
      const changed = tracker.addSample(pressure, atMs);
      if (changed) push(changed);
    });
  } catch {
    available = false;
  }
}

export function stopFloorService(): void {
  sub?.remove();
  sub = null;
  started = false;
  available = false;
  tracker = new FloorTracker();
}

/**
 * The user asserts their floor ("I'm on the Balcony"). Recalibrates the
 * barometric reference so subsequent movement is measured from here. This is
 * the spine of the whole feature — call it at clock-in and whenever the user
 * picks a level or confirms a suggestion.
 */
export function anchorFloor(floor: number): void {
  push(tracker.anchor(floor));
}

/** One-tap "yes, that's right" for the confirm prompt: re-anchor where we are. */
export function confirmCurrentFloor(): void {
  push(tracker.anchor(useCrewStore.getState().myFloor));
}
