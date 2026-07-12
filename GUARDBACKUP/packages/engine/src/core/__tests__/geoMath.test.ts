import { getHaversineDistance, getAbsoluteBearing } from '../geoMath';
import {
  movePoint, smoothHeading, radarRadiusForDistance, calculateRadarPoint,
  LINEAR_MAX_M, OUTER_MAX_M,
} from '../geoMath';

const ORIGIN = { latitude: 0, longitude: 0 };

describe('getHaversineDistance', () => {
  it('is ~111.19km for 1 degree of longitude at the equator', () => {
    const d = getHaversineDistance(ORIGIN, { latitude: 0, longitude: 1 });
    expect(d).toBeGreaterThan(111100);
    expect(d).toBeLessThan(111300);
  });
  it('is 0 for identical points', () => {
    expect(getHaversineDistance(ORIGIN, ORIGIN)).toBe(0);
  });
  it('is symmetric', () => {
    const a = { latitude: 37.77, longitude: -122.42 };
    const b = { latitude: 37.78, longitude: -122.41 };
    expect(getHaversineDistance(a, b)).toBeCloseTo(getHaversineDistance(b, a), 6);
  });
});

describe('getAbsoluteBearing', () => {
  it('is 0° pointing due north', () => {
    expect(getAbsoluteBearing(ORIGIN, { latitude: 1, longitude: 0 })).toBeCloseTo(0, 5);
  });
  it('is 90° pointing due east', () => {
    expect(getAbsoluteBearing(ORIGIN, { latitude: 0, longitude: 1 })).toBeCloseTo(90, 5);
  });
  it('is 270° pointing due west', () => {
    expect(getAbsoluteBearing(ORIGIN, { latitude: 0, longitude: -1 })).toBeCloseTo(270, 5);
  });
});

describe('movePoint', () => {
  it('moves ~100m north', () => {
    const moved = movePoint(ORIGIN, 0, 100);
    expect(getHaversineDistance(ORIGIN, moved)).toBeCloseTo(100, 0);
    expect(getAbsoluteBearing(ORIGIN, moved)).toBeCloseTo(0, 1);
  });
  it('moves ~50m east', () => {
    const moved = movePoint(ORIGIN, 90, 50);
    expect(getHaversineDistance(ORIGIN, moved)).toBeCloseTo(50, 0);
    expect(getAbsoluteBearing(ORIGIN, moved)).toBeCloseTo(90, 1);
  });
});

describe('smoothHeading (low-pass with wrap-around)', () => {
  it('interpolates normally', () => {
    expect(smoothHeading(100, 120, 0.5)).toBeCloseTo(110, 5);
  });
  it('handles the 350°→10° wrap without spinning backwards', () => {
    expect(smoothHeading(350, 10, 0.5)).toBeCloseTo(0, 5);
  });
  it('handles the 10°→350° wrap', () => {
    expect(smoothHeading(10, 350, 0.5)).toBeCloseTo(0, 5);
  });
  it('ignores a non-finite reading (keeps current) and still smooths a later finite reading', () => {
    expect(smoothHeading(90, NaN)).toBe(90); // one NaN can't poison the filter
    expect(smoothHeading(90, 110, 0.5)).toBeCloseTo(100, 5); // later finite reading smooths normally
  });
});

describe('radarRadiusForDistance (piecewise linear→log)', () => {
  const R = 150; // px
  it('is 0 at 0m', () => expect(radarRadiusForDistance(0, R)).toBe(0));
  it('is 70% of radius at LINEAR_MAX_M', () =>
    expect(radarRadiusForDistance(LINEAR_MAX_M, R)).toBeCloseTo(0.7 * R, 5));
  it('is full radius at OUTER_MAX_M and beyond (clamped)', () => {
    expect(radarRadiusForDistance(OUTER_MAX_M, R)).toBeCloseTo(R, 5);
    expect(radarRadiusForDistance(OUTER_MAX_M * 3, R)).toBeCloseTo(R, 5);
  });
  it('is strictly monotonic', () => {
    const r = (d: number) => radarRadiusForDistance(d, R);
    expect(r(80)).toBeLessThan(r(150));
    expect(r(150)).toBeLessThan(r(400));
    expect(r(400)).toBeLessThan(r(1500));
  });
});

describe('calculateRadarPoint (north-up)', () => {
  it('plots a friend due north straight up (negative y)', () => {
    const friend = movePoint(ORIGIN, 0, 100);
    const pt = calculateRadarPoint(ORIGIN, friend, 150);
    expect(pt.x).toBeCloseTo(0, 0);
    expect(pt.y).toBeLessThan(0);
    expect(pt.distanceMeters).toBeCloseTo(100, 0);
  });
  it('plots a friend due east to the right (positive x)', () => {
    const friend = movePoint(ORIGIN, 90, 100);
    const pt = calculateRadarPoint(ORIGIN, friend, 150);
    expect(pt.y).toBeCloseTo(0, 0);
    expect(pt.x).toBeGreaterThan(0);
  });
});
