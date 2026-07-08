// src/domain/zones.ts — anonymous crowd density + coverage.
//
// Everything here operates on COUNTS, never identities. This is the data that
// feeds the coverage heatmap and the operations overview: how full / how well
// covered a zone is, with nobody individually locatable.

import type { DensityLevel, Zone, ZoneDensity } from './types';

/** Coverage thresholds → density level (design README: well-covered/thin/gap). */
export function densityLevel(coveragePct: number): DensityLevel {
  if (coveragePct >= 80) return 'good';
  if (coveragePct >= 40) return 'thin';
  return 'gap';
}

export interface ZoneCounts {
  zoneId: string;
  guardCount: number;
  attendeeCount: number;
  coveragePct: number;
}

/** Build a ZoneDensity from raw counts, deriving the density level. */
export function toZoneDensity(c: ZoneCounts): ZoneDensity {
  return {
    zoneId: c.zoneId,
    guardCount: c.guardCount,
    attendeeCount: c.attendeeCount,
    coveragePct: c.coveragePct,
    level: densityLevel(c.coveragePct),
  };
}

/**
 * Overall venue coverage — the average zone coverage, weighted by attendee
 * count so a crowded uncovered zone drags the number down harder than an empty
 * one. Falls back to a plain average when there are no attendees.
 */
export function venueCoverage(densities: ZoneDensity[]): number {
  if (densities.length === 0) return 0;
  const totalHeads = densities.reduce((s, d) => s + d.attendeeCount, 0);
  if (totalHeads === 0) {
    const avg = densities.reduce((s, d) => s + d.coveragePct, 0) / densities.length;
    return Math.round(avg);
  }
  const weighted = densities.reduce((s, d) => s + d.coveragePct * d.attendeeCount, 0) / totalHeads;
  return Math.round(weighted);
}

/** Zones flagged as coverage gaps (red) — where responders are missing. */
export function coverageGaps(densities: ZoneDensity[]): string[] {
  return densities.filter((d) => d.level === 'gap').map((d) => d.zoneId);
}

/** Look up a zone by id (helper for label rendering). */
export function zoneName(zones: Zone[], id: string): string {
  return zones.find((z) => z.id === id)?.name ?? id;
}
