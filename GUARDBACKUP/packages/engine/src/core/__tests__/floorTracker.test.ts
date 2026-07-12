// FloorTracker contract: manual anchor is the spine, the barometer tracks
// WITHIN-DEVICE movement only (the reliable part), slow weather drift is
// leaked into the baseline instead of moving floors, and accumulated travel
// of ≥2 floors since the last anchor asks the user to confirm.
import { FloorTracker } from '../floorTracker';
import { DEFAULT_HPA_PER_FLOOR } from '../floorMath';

const P0 = 1013.0;

/** Feed `n` samples of the same pressure to let the EMA settle. */
function settle(t: FloorTracker, pressure: number, atMs: number, n = 30, stepMs = 500): number {
  for (let i = 0; i < n; i++) t.addSample(pressure, atMs + i * stepMs);
  return atMs + n * 500;
}

describe('FloorTracker — anchoring', () => {
  it('starts unknown at floor 0', () => {
    const t = new FloorTracker();
    expect(t.state).toEqual({ floor: 0, confidence: 'unknown', confirmSuggested: false });
  });

  it('anchor() asserts a floor with anchored confidence', () => {
    const t = new FloorTracker();
    const s = t.anchor(2);
    expect(s.floor).toBe(2);
    expect(s.confidence).toBe('anchored');
    expect(s.confirmSuggested).toBe(false);
  });

  it('anchor before any sample still calibrates from the first sample', () => {
    const t = new FloorTracker();
    t.anchor(1);
    // First readings at P0 must NOT move the floor — P0 is simply "what L1 feels like".
    settle(t, P0, 0);
    expect(t.state.floor).toBe(1);
    expect(t.state.confidence).toBe('anchored');
  });
});

describe('FloorTracker — movement (the reliable part)', () => {
  it('climbing one storey moves the floor up and degrades confidence to estimated', () => {
    const t = new FloorTracker();
    let at = settle(t, P0, 0);
    t.anchor(0);
    // Climb: pressure drops one storey's worth over ~20s.
    at = settle(t, P0 - DEFAULT_HPA_PER_FLOOR, at, 40);
    expect(t.state.floor).toBe(1);
    expect(t.state.confidence).toBe('estimated');
    expect(t.state.confirmSuggested).toBe(false); // only 1 floor since anchor
  });

  it('descending below the anchor goes negative', () => {
    const t = new FloorTracker();
    let at = settle(t, P0, 0);
    t.anchor(0);
    at = settle(t, P0 + DEFAULT_HPA_PER_FLOOR, at, 40);
    expect(t.state.floor).toBe(-1);
  });

  it('travelling ≥2 floors since the anchor suggests a confirm', () => {
    const t = new FloorTracker();
    let at = settle(t, P0, 0);
    t.anchor(0);
    at = settle(t, P0 - 3 * DEFAULT_HPA_PER_FLOOR, at, 60);
    expect(t.state.floor).toBe(3);
    expect(t.state.confirmSuggested).toBe(true);
  });

  it('re-anchoring clears the suggestion and restores anchored confidence', () => {
    const t = new FloorTracker();
    let at = settle(t, P0, 0);
    t.anchor(0);
    at = settle(t, P0 - 2 * DEFAULT_HPA_PER_FLOOR, at, 60);
    expect(t.state.confirmSuggested).toBe(true);
    const s = t.anchor(t.state.floor); // user confirms "yes, L2"
    expect(s).toEqual({ floor: 2, confidence: 'anchored', confirmSuggested: false });
  });
});

describe('FloorTracker — weather drift is absorbed, not misread as stairs', () => {
  it('a slow 0.5 hPa drift over an hour does not change the floor', () => {
    const t = new FloorTracker();
    let at = settle(t, P0, 0);
    t.anchor(0);
    // 60 samples a minute apart, drifting 0.5 hPa total (≫ one storey if naive).
    for (let i = 1; i <= 60; i++) {
      t.addSample(P0 - (0.5 * i) / 60, at + i * 60_000);
    }
    expect(t.state.floor).toBe(0);
    expect(t.state.confidence).toBe('anchored'); // never moved
  });

  it('a fast one-storey change is NOT leaked away', () => {
    const t = new FloorTracker();
    let at = settle(t, P0, 0);
    t.anchor(0);
    // 20 seconds of stair climb at 2 Hz.
    at = settle(t, P0 - DEFAULT_HPA_PER_FLOOR, at, 40);
    expect(t.state.floor).toBe(1);
  });
});

describe('FloorTracker — no barometer at all', () => {
  it('anchor works standalone (pure manual mode)', () => {
    const t = new FloorTracker();
    expect(t.anchor(3).floor).toBe(3);
    expect(t.anchor(-1).floor).toBe(-1);
    expect(t.state.confidence).toBe('anchored');
  });

  it('ignores garbage samples', () => {
    const t = new FloorTracker();
    t.anchor(1);
    t.addSample(NaN, 0);
    t.addSample(-5, 500);
    expect(t.state.floor).toBe(1);
  });
});
