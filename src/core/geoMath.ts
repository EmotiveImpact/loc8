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
