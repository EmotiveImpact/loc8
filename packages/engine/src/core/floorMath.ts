// src/core/floorMath.ts
//
// Pure barometric-floor math — no sensors, no state, fully unit-tested. The
// floorService feeds it live pressure; the UI never touches this directly.
//
// Physics: near ground level air pressure falls ~0.12 hPa per metre, so one
// storey (~3.5 m) is ~0.42 hPa. Absolute pressure is useless (weather shifts it
// by tens of hPa), so we always work RELATIVE to a baseline pressure captured at
// a known floor (self-baseline at clock-in, or a reference shared over the mesh).

/** Default pressure delta per storey, hPa. ~3.5 m × 0.12 hPa/m. */
export const DEFAULT_HPA_PER_FLOOR = 0.42;

/** Floor bounds (match the 7-bit signed wire field in packetCodec). */
export const FLOOR_MIN = -64;
export const FLOOR_MAX = 63;

export function clampFloor(f: number): number {
  return Math.max(FLOOR_MIN, Math.min(FLOOR_MAX, Math.round(f)));
}

/**
 * Continuous (fractional) floor estimate relative to `baselineHpa`.
 * Lower pressure than baseline → higher up → positive floors.
 */
export function floorEstimate(
  pressureHpa: number,
  baselineHpa: number,
  hPaPerFloor: number = DEFAULT_HPA_PER_FLOOR,
): number {
  if (!Number.isFinite(pressureHpa) || !Number.isFinite(baselineHpa) || hPaPerFloor <= 0) return 0;
  return (baselineHpa - pressureHpa) / hPaPerFloor;
}

/** Nearest integer floor from a fractional estimate, clamped to wire bounds. */
export function floorFromEstimate(estimate: number): number {
  return clampFloor(Math.round(estimate));
}

/**
 * Resolve a stable floor with hysteresis so the reading doesn't flap at a
 * boundary: only leave `current` once the estimate crosses ±(0.5 + margin).
 * `margin` is a fraction of a floor (0.25 ≈ needs to be ~0.75 past the edge).
 */
export function resolveFloorWithHysteresis(
  estimate: number,
  current: number,
  margin = 0.25,
): number {
  if (estimate > current + 0.5 + margin) return floorFromEstimate(estimate);
  if (estimate < current - 0.5 - margin) return floorFromEstimate(estimate);
  return current;
}

/** Exponential moving average to damp per-sample barometer noise. */
export function smoothPressure(prev: number | null, next: number, alpha = 0.2): number {
  if (prev == null || !Number.isFinite(prev)) return next;
  if (!Number.isFinite(next)) return prev;
  return prev + alpha * (next - prev);
}

/** Human label for a floor: 0 → "Ground (G)", positive → "L2", negative → "B1". */
export function floorLabel(floor: number): string {
  if (floor === 0) return 'Ground';
  if (floor > 0) return `L${floor}`;
  return `B${-floor}`;
}

/** Short label for tight spots (badges): "G" / "L2" / "B1" — same register as floorLabel. */
export function floorShort(floor: number): string {
  if (floor === 0) return 'G';
  if (floor > 0) return `L${floor}`;
  return `B${-floor}`;
}

/**
 * A venue's named level — real buildings have "Balcony" and "Car Park", not
 * bare integers. Apps supply the list; `floor` is the wire integer.
 */
export interface VenueLevel {
  floor: number;
  name: string;
  short: string;
}

/** Venue name for a floor, falling back to the generic label. */
export function venueLevelName(levels: VenueLevel[] | undefined, floor: number): string {
  return levels?.find((l) => l.floor === floor)?.name ?? floorLabel(floor);
}

/** Venue short tag for a floor, falling back to the generic short label. */
export function venueLevelShort(levels: VenueLevel[] | undefined, floor: number): string {
  return levels?.find((l) => l.floor === floor)?.short ?? floorShort(floor);
}
