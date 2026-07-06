import { getHaversineDistance, getAbsoluteBearing } from '../geoMath';

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
