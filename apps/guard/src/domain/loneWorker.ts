// Lone-worker check-in logic — pure and testable. The Guard app shows the
// countdown; on expiry the app auto-escalates to the control room with the
// last known position (the regulated duty-of-care mechanism).

export const CHECKIN_INTERVAL_SEC = 15 * 60; // patrol cadence between prompts
export const CHECKIN_GRACE_SEC = 20; // response window once prompted

export type CheckinPhase = 'idle' | 'prompt' | 'overdue';

export interface CheckinState {
  /** when the next prompt fires (unix sec) */
  nextPromptAtSec: number;
  /** when the current prompt expires, or null if no prompt is showing */
  promptExpiresAtSec: number | null;
}

export function startCheckins(nowSec: number, intervalSec = CHECKIN_INTERVAL_SEC): CheckinState {
  return { nextPromptAtSec: nowSec + intervalSec, promptExpiresAtSec: null };
}

/** Advance the machine one tick; returns the phase the UI must render. */
export function checkinPhase(s: CheckinState, nowSec: number): CheckinPhase {
  if (s.promptExpiresAtSec !== null) {
    return nowSec >= s.promptExpiresAtSec ? 'overdue' : 'prompt';
  }
  return nowSec >= s.nextPromptAtSec ? 'prompt' : 'idle';
}

/** The prompt just appeared: arm its grace window. */
export function armPrompt(s: CheckinState, nowSec: number, graceSec = CHECKIN_GRACE_SEC): CheckinState {
  if (s.promptExpiresAtSec !== null) return s; // already armed
  return { ...s, promptExpiresAtSec: nowSec + graceSec };
}

/** Guard tapped I'M OK: clear the prompt and schedule the next one. */
export function confirmOk(s: CheckinState, nowSec: number, intervalSec = CHECKIN_INTERVAL_SEC): CheckinState {
  return { nextPromptAtSec: nowSec + intervalSec, promptExpiresAtSec: null };
}

/** Seconds left on the visible countdown (0 when overdue / no prompt). */
export function promptSecondsLeft(s: CheckinState, nowSec: number): number {
  if (s.promptExpiresAtSec === null) return 0;
  return Math.max(0, s.promptExpiresAtSec - nowSec);
}
