// src/domain/coverage.ts — real geo → canvas projection + staffing-based coverage.
//
// This replaces the earlier hardcoded map positions and faked coverage numbers.
// Staff are plotted from their actual lat/lng; nearest-responder distances use
// the engine's getHaversineDistance; zone coverage is derived from how many
// consented guards are actually in a zone relative to its crowd load.

import { getHaversineDistance, type Coordinate } from '../engine';
import type { DensityLevel, StaffMember, Zone, ZoneDensity } from './types';

export interface Bounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

/** Venue bounding box (padded around the deployed staff spread). */
export const VENUE_BOUNDS: Bounds = {
  latMin: 51.492,
  latMax: 51.4955,
  lngMin: -0.1024,
  lngMax: -0.0984,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Project a real coordinate to a canvas percentage (north up). Clamped 3..97. */
export function projectToCanvas(c: Coordinate, b: Bounds = VENUE_BOUNDS): { x: number; y: number } {
  const x = (c.longitude - b.lngMin) / (b.lngMax - b.lngMin);
  const y = (b.latMax - c.latitude) / (b.latMax - b.latMin);
  return { x: clamp(x * 100, 3, 97), y: clamp(y * 100, 3, 97) };
}

/** Zone rectangle in canvas %, derived from its projected centroid + display size. */
export function projectedZoneRect(zone: Zone, b: Bounds = VENUE_BOUNDS) {
  const { x, y } = projectToCanvas(zone.center, b);
  return {
    x: clamp(x - zone.w / 2, 1, 99 - zone.w),
    y: clamp(y - zone.h / 2, 1, 99 - zone.h),
    w: zone.w,
    h: zone.h,
  };
}

/** A guard is one on-duty staff member currently reporting a position. */
export function guardsInZone(staff: StaffMember[], zoneId: string): StaffMember[] {
  return staff.filter((s) => s.zoneId === zoneId && s.status !== 'no_signal' && s.location);
}

/** Guards needed to cover a crowd of this size (≈ one per 150 attendees, min 1). */
export function requiredGuards(attendeeCount: number): number {
  return Math.max(1, Math.ceil(attendeeCount / 150));
}

export function levelFromCoverage(pct: number): DensityLevel {
  if (pct >= 80) return 'good';
  if (pct >= 40) return 'thin';
  return 'gap';
}

/**
 * Compute a zone's density from the ACTUAL guards in it vs its crowd load.
 * `attendeeCount` is the anonymous crowd feed (counts only, never identities).
 */
export function computeZoneDensity(
  zone: Zone,
  staff: StaffMember[],
  attendeeCount: number,
): ZoneDensity {
  const guards = guardsInZone(staff, zone.id);
  // Guards actively covering (SOS subjects don't count as coverage).
  const covering = guards.filter((g) => g.status !== 'sos').length;
  const need = requiredGuards(attendeeCount);
  const coveragePct = clamp(Math.round((covering / need) * 100), 0, 100);
  return {
    zoneId: zone.id,
    guardCount: guards.length,
    attendeeCount,
    coveragePct,
    level: levelFromCoverage(coveragePct),
  };
}

export interface RankedResponder {
  staff: StaffMember;
  distanceM: number;
}

/**
 * Nearest on-duty responders to an incident, by real great-circle distance —
 * the "nearest-responder dispatch" primitive, on the shared geoMath.
 * Excludes the incident's own subject and anyone without a live position.
 */
export function nearestResponders(
  incident: Coordinate,
  staff: StaffMember[],
  opts: { excludeId?: number; limit?: number } = {},
): RankedResponder[] {
  const { excludeId, limit = 3 } = opts;
  return staff
    .filter((s) => s.location && s.id !== excludeId && s.status !== 'no_signal')
    .map((s) => ({ staff: s, distanceM: Math.round(getHaversineDistance(incident, s.location!)) }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}
