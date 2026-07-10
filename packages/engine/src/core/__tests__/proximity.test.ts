import {
  proximityRadiusM, isFound, shouldRearmCelebration, FOUND_RADIUS_M, REARM_MARGIN_M,
} from '../proximity';

// Fix 12: hysteresis so GPS jitter around the found radius can't flap the
// celebration or re-fire haptics.found().
describe('proximity celebration hysteresis', () => {
  it('proximity radius adapts to accuracy but never below 25m', () => {
    expect(proximityRadiusM(10)).toBe(25); // 10*1.5=15 → clamped to 25
    expect(proximityRadiusM(30)).toBe(45); // 30*1.5=45
  });

  it('isFound triggers strictly inside the found radius', () => {
    expect(isFound(FOUND_RADIUS_M - 1)).toBe(true);
    expect(isFound(FOUND_RADIUS_M)).toBe(false);
    expect(isFound(null)).toBe(false);
  });

  it('does NOT re-arm on GPS jitter just above the proximity radius', () => {
    const accuracy = 10; // proximityAt = 25, re-arm only past 25 + 20 = 45
    // Old logic re-armed at dist > proximityAt (25m); 30m must now be treated as
    // the same reunion (jitter), NOT a re-arm.
    expect(shouldRearmCelebration(30, accuracy)).toBe(false);
    expect(shouldRearmCelebration(44, accuracy)).toBe(false);
  });

  it('re-arms only after a clearly larger separation (proximity + margin)', () => {
    const accuracy = 10; // proximityAt = 25, re-arm past 45
    expect(shouldRearmCelebration(25 + REARM_MARGIN_M + 1, accuracy)).toBe(true);
    expect(shouldRearmCelebration(null, accuracy)).toBe(false);
  });
});
