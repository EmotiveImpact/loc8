import {
  floorEstimate,
  floorFromEstimate,
  resolveFloorWithHysteresis,
  smoothPressure,
  clampFloor,
  floorLabel,
  floorShort,
  DEFAULT_HPA_PER_FLOOR,
} from '../floorMath';

describe('floorEstimate', () => {
  it('is 0 at the baseline', () => {
    expect(floorEstimate(1013.0, 1013.0)).toBe(0);
  });
  it('goes positive as pressure drops (going up)', () => {
    // one floor up ≈ baseline − 0.42 hPa
    expect(floorFromEstimate(floorEstimate(1013.0 - DEFAULT_HPA_PER_FLOOR, 1013.0))).toBe(1);
    expect(floorFromEstimate(floorEstimate(1013.0 - 3 * DEFAULT_HPA_PER_FLOOR, 1013.0))).toBe(3);
  });
  it('goes negative below baseline (basement)', () => {
    expect(floorFromEstimate(floorEstimate(1013.0 + 2 * DEFAULT_HPA_PER_FLOOR, 1013.0))).toBe(-2);
  });
  it('guards bad input', () => {
    expect(floorEstimate(NaN, 1013)).toBe(0);
    expect(floorEstimate(1000, 1013, 0)).toBe(0);
  });
});

describe('resolveFloorWithHysteresis', () => {
  it('holds the current floor inside the band', () => {
    expect(resolveFloorWithHysteresis(0.6, 0)).toBe(0); // within 0.5+0.25
    expect(resolveFloorWithHysteresis(1.2, 1)).toBe(1);
  });
  it('switches once the estimate crosses the band', () => {
    expect(resolveFloorWithHysteresis(0.8, 0)).toBe(1); // past 0.75
    expect(resolveFloorWithHysteresis(-0.9, 0)).toBe(-1);
  });
});

describe('smoothPressure', () => {
  it('returns the first sample as-is', () => {
    expect(smoothPressure(null, 1010)).toBe(1010);
  });
  it('eases toward the new sample', () => {
    expect(smoothPressure(1000, 1010, 0.5)).toBe(1005);
  });
});

describe('clampFloor', () => {
  it('clamps to the 7-bit signed wire range', () => {
    expect(clampFloor(200)).toBe(63);
    expect(clampFloor(-200)).toBe(-64);
    expect(clampFloor(3.4)).toBe(3);
  });
});

describe('labels', () => {
  it('floorLabel', () => {
    expect(floorLabel(0)).toBe('Ground');
    expect(floorLabel(2)).toBe('L2');
    expect(floorLabel(-1)).toBe('B1');
  });
  it('floorShort', () => {
    expect(floorShort(0)).toBe('G');
    expect(floorShort(4)).toBe('4');
    expect(floorShort(-2)).toBe('-2');
  });
});
