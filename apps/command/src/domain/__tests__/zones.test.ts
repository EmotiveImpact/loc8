import { densityLevel, toZoneDensity, venueCoverage, coverageGaps } from '../zones';
import type { ZoneDensity } from '../types';

describe('density thresholds', () => {
  it('maps coverage% to level (good ≥80, thin ≥40, else gap)', () => {
    expect(densityLevel(100)).toBe('good');
    expect(densityLevel(80)).toBe('good');
    expect(densityLevel(79)).toBe('thin');
    expect(densityLevel(40)).toBe('thin');
    expect(densityLevel(39)).toBe('gap');
    expect(densityLevel(0)).toBe('gap');
  });

  it('derives level when building a ZoneDensity', () => {
    const d = toZoneDensity({ zoneId: 'z', guardCount: 0, attendeeCount: 300, coveragePct: 20 });
    expect(d.level).toBe('gap');
  });
});

describe('venue coverage (attendee-weighted)', () => {
  const dens: ZoneDensity[] = [
    { zoneId: 'a', guardCount: 2, attendeeCount: 400, coveragePct: 100, level: 'good' },
    { zoneId: 'b', guardCount: 0, attendeeCount: 100, coveragePct: 20, level: 'gap' },
  ];

  it('weights a crowded uncovered zone harder than an empty one', () => {
    // plain avg = 60; weighted = (100*400 + 20*100)/500 = 84
    expect(venueCoverage(dens)).toBe(84);
  });

  it('falls back to a plain average when there are no attendees', () => {
    const empty: ZoneDensity[] = [
      { zoneId: 'a', guardCount: 1, attendeeCount: 0, coveragePct: 100, level: 'good' },
      { zoneId: 'b', guardCount: 0, attendeeCount: 0, coveragePct: 50, level: 'thin' },
    ];
    expect(venueCoverage(empty)).toBe(75);
  });

  it('is 0 for no zones', () => {
    expect(venueCoverage([])).toBe(0);
  });

  it('lists coverage gaps', () => {
    expect(coverageGaps(dens)).toEqual(['b']);
  });
});
