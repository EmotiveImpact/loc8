// src/core/proximity.ts
//
// Reunion/celebration thresholds + hysteresis for the compass "found" flow.
// Shared here (not inlined in the screen) so the screen and its tests agree on
// the numbers and the flap-prevention logic is unit-testable.

/** Within this radius (m) you've "found" a friend — fire the celebration once. */
export const FOUND_RADIUS_M = 15;

/**
 * Extra separation (m) beyond the proximity radius required before the found
 * celebration re-arms. This is the HYSTERESIS gap: after celebrating at <15 m,
 * GPS jitter can easily bounce the reported distance up to ~25–30 m; without a
 * margin that re-arms the celebration, and jitter back under 15 m re-fires
 * haptics.found() and flaps the screen. Requiring a clearly larger separation to
 * re-arm keeps found() firing exactly once per genuine reunion.
 */
export const REARM_MARGIN_M = 20;

/**
 * Proximity radius (m): adapts to GPS accuracy (spec §3 — never claim arrow
 * precision we don't have), but never tighter than 25 m.
 */
export function proximityRadiusM(accuracyM: number): number {
  return Math.max(25, accuracyM * 1.5);
}

/** True when the friend is inside the found radius. */
export function isFound(distM: number | null): boolean {
  return distM !== null && distM < FOUND_RADIUS_M;
}

/**
 * True when — having already celebrated — the friend is now clearly far enough to
 * re-arm a future celebration: beyond the proximity radius PLUS the hysteresis
 * margin. Distances between the found radius and this re-arm point are treated as
 * the same reunion (jitter), so the celebration neither flaps nor re-buzzes.
 */
export function shouldRearmCelebration(distM: number | null, accuracyM: number): boolean {
  return distM !== null && distM > proximityRadiusM(accuracyM) + REARM_MARGIN_M;
}
