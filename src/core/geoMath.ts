import type { Coordinate } from './types';

const EARTH_RADIUS_METERS = 6371000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Straight-line meters between two GPS points (Haversine). */
export function getHaversineDistance(p1: Coordinate, p2: Coordinate): number {
  const dLat = rad(p2.latitude - p1.latitude);
  const dLon = rad(p2.longitude - p1.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(rad(p1.latitude)) * Math.cos(rad(p2.latitude));
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Forward azimuth from `from` to `to`. 0° = true north, 90° = east. Range [0, 360). */
export function getAbsoluteBearing(from: Coordinate, to: Coordinate): number {
  const fromLat = rad(from.latitude);
  const toLat = rad(to.latitude);
  const dLon = rad(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Destination point given start, bearing, meters (equirectangular approx — fine <2km). */
export function movePoint(from: Coordinate, bearingDeg: number, meters: number): Coordinate {
  const dLat = (meters * Math.cos(rad(bearingDeg))) / 111320;
  const dLon = (meters * Math.sin(rad(bearingDeg))) / (111320 * Math.cos(rad(from.latitude)));
  return { latitude: from.latitude + dLat, longitude: from.longitude + dLon };
}

/**
 * Low-pass filter for magnetometer headings (festival EM noise makes raw headings jitter).
 * Handles the 359°→0° wrap so the needle never spins the long way round.
 */
export function smoothHeading(currentDeg: number, nextDeg: number, alpha = 0.2): number {
  let diff = nextDeg - currentDeg;
  if (diff > 180) diff -= 360;
  else if (diff < -180) diff += 360;
  return (currentDeg + alpha * diff + 360) % 360;
}

/** Piecewise distance→pixel scale: linear to 150m (inner 70% of radius), log 150m→1.5km (outer 30%). */
export const LINEAR_MAX_M = 150;
export const OUTER_MAX_M = 1500;
const LINEAR_FRACTION = 0.7;

export function radarRadiusForDistance(distanceM: number, radarRadiusPx: number): number {
  if (distanceM <= 0) return 0;
  if (distanceM <= LINEAR_MAX_M) {
    return (distanceM / LINEAR_MAX_M) * LINEAR_FRACTION * radarRadiusPx;
  }
  const clamped = Math.min(distanceM, OUTER_MAX_M);
  const frac = Math.log(clamped / LINEAR_MAX_M) / Math.log(OUTER_MAX_M / LINEAR_MAX_M);
  return (LINEAR_FRACTION + frac * (1 - LINEAR_FRACTION)) * radarRadiusPx;
}

export interface RadarPoint {
  x: number;              // px right of center
  y: number;              // px below center (screen coords; north = -y)
  distanceMeters: number;
  absoluteBearing: number;
}

/** North-up radar plot (deliberately NO device heading — spec §6). */
export function calculateRadarPoint(
  myLocation: Coordinate,
  friendLocation: Coordinate,
  radarRadiusPx: number,
): RadarPoint {
  const distanceMeters = getHaversineDistance(myLocation, friendLocation);
  const absoluteBearing = getAbsoluteBearing(myLocation, friendLocation);
  const r = radarRadiusForDistance(distanceMeters, radarRadiusPx);
  const theta = rad(absoluteBearing);
  return { x: r * Math.sin(theta), y: -r * Math.cos(theta), distanceMeters, absoluteBearing };
}
