// src/core/floorTracker.ts
//
// The floor state machine: MANUAL ANCHOR is the source of truth, the barometer
// only tracks within-device movement — the one thing a phone barometer is
// genuinely reliable at. We deliberately do NOT try to compute absolute floors
// from pressure (cross-device sensor bias is often larger than a storey), and
// we do NOT trust slow pressure changes (that's weather, not stairs).
//
// Pure logic, no sensors, fully unit-tested. floorService feeds it samples.
//
//   anchor(floor)      — the user asserts "I am on `floor` right now". Pressure
//                        at that moment becomes the reference for that floor.
//   addSample(p, t)    — a barometer reading. Fast changes (stairs, lifts) move
//                        the floor and degrade confidence to 'estimated'; slow
//                        changes (weather) are leaked into the baseline instead.
//   confirmSuggested   — true once ≥2 floors have accumulated since the last
//                        anchor: the UI should ask "still right?" (one tap
//                        re-anchors). Movement tracking is good, but honesty
//                        beats false certainty.
import {
  DEFAULT_HPA_PER_FLOOR,
  floorEstimate,
  resolveFloorWithHysteresis,
  smoothPressure,
  clampFloor,
} from './floorMath';

export type FloorConfidence = 'unknown' | 'anchored' | 'estimated';

export interface FloorTrackerState {
  floor: number;
  confidence: FloorConfidence;
  /** ≥2 floors travelled since the last anchor — ask the user to confirm. */
  confirmSuggested: boolean;
}

export interface FloorTrackerOptions {
  hPaPerFloor?: number;
  /** EMA factor for raw samples (default 0.2). */
  alpha?: number;
  /** Extra fraction of a floor past ±0.5 before switching (default 0.25). */
  hysteresisMargin?: number;
  /**
   * Time constant (ms) for leaking in-band error into the baseline. Weather
   * drifts over tens of minutes; stairs take seconds — a ~10 min tau absorbs
   * the former without touching the latter. Default 10 minutes.
   */
  driftTauMs?: number;
  /** Floors travelled since anchor that trigger a confirm prompt (default 2). */
  confirmAfterFloors?: number;
}

export class FloorTracker {
  private readonly hPaPerFloor: number;
  private readonly alpha: number;
  private readonly margin: number;
  private readonly driftTauMs: number;
  private readonly confirmAfterFloors: number;

  private smoothed: number | null = null;
  private baselineHpa: number | null = null;
  private lastSampleMs: number | null = null;

  private floor = 0;
  private confidence: FloorConfidence = 'unknown';
  private anchorFloor: number | null = null;

  constructor(opts: FloorTrackerOptions = {}) {
    this.hPaPerFloor = opts.hPaPerFloor ?? DEFAULT_HPA_PER_FLOOR;
    this.alpha = opts.alpha ?? 0.2;
    this.margin = opts.hysteresisMargin ?? 0.25;
    this.driftTauMs = opts.driftTauMs ?? 10 * 60_000;
    this.confirmAfterFloors = opts.confirmAfterFloors ?? 2;
  }

  get state(): FloorTrackerState {
    return {
      floor: this.floor,
      confidence: this.confidence,
      confirmSuggested:
        this.anchorFloor !== null &&
        this.confidence === 'estimated' &&
        Math.abs(this.floor - this.anchorFloor) >= this.confirmAfterFloors,
    };
  }

  /** The user asserts they are on `floor` right now. Recalibrates the baseline. */
  anchor(floor: number): FloorTrackerState {
    this.floor = clampFloor(floor);
    this.anchorFloor = this.floor;
    this.confidence = 'anchored';
    // Whatever the air feels like here IS this floor. If no sample has arrived
    // yet, baseline stays null and the first sample calibrates instead.
    this.baselineHpa =
      this.smoothed != null ? this.smoothed + this.floor * this.hPaPerFloor : null;
    return this.state;
  }

  /**
   * Feed one barometer reading. Returns the new state when the floor or
   * confidence changed, null otherwise.
   */
  addSample(pressureHpa: number, atMs: number): FloorTrackerState | null {
    if (!Number.isFinite(pressureHpa) || pressureHpa <= 0) return null;
    const dtMs = this.lastSampleMs != null ? Math.max(0, atMs - this.lastSampleMs) : 0;
    this.lastSampleMs = atMs;
    this.smoothed = smoothPressure(this.smoothed, pressureHpa, this.alpha);

    // First usable sample calibrates the baseline to the CURRENT floor.
    if (this.baselineHpa == null) {
      this.baselineHpa = this.smoothed + this.floor * this.hPaPerFloor;
      return null;
    }

    let est = floorEstimate(this.smoothed, this.baselineHpa, this.hPaPerFloor);

    // In-band error is far more likely weather than a half-climbed staircase:
    // leak it into the baseline with a slow time constant so estimates stay
    // centred on the current floor. (A real climb blows through the band in
    // seconds — the leak never gets a grip on it.)
    const err = est - this.floor;
    if (Math.abs(err) < 0.5 && dtMs > 0) {
      const leak = Math.min(1, dtMs / this.driftTauMs);
      this.baselineHpa -= err * this.hPaPerFloor * leak;
      est = floorEstimate(this.smoothed, this.baselineHpa, this.hPaPerFloor);
    }

    const resolved = resolveFloorWithHysteresis(est, this.floor, this.margin);
    if (resolved === this.floor) return null;

    this.floor = resolved;
    this.confidence = 'estimated';
    return this.state;
  }
}
