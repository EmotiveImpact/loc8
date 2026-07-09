import {
  startCheckins,
  checkinPhase,
  armPrompt,
  confirmOk,
  promptSecondsLeft,
  CHECKIN_GRACE_SEC,
  CHECKIN_INTERVAL_SEC,
} from '../loneWorker';

describe('lone-worker check-in machine', () => {
  const t0 = 1_000_000;

  it('idles until the interval elapses, then prompts', () => {
    const s = startCheckins(t0);
    expect(checkinPhase(s, t0)).toBe('idle');
    expect(checkinPhase(s, t0 + CHECKIN_INTERVAL_SEC - 1)).toBe('idle');
    expect(checkinPhase(s, t0 + CHECKIN_INTERVAL_SEC)).toBe('prompt');
  });

  it('an armed prompt counts down its grace window, then goes overdue', () => {
    let s = startCheckins(t0);
    const promptAt = t0 + CHECKIN_INTERVAL_SEC;
    s = armPrompt(s, promptAt);
    expect(promptSecondsLeft(s, promptAt)).toBe(CHECKIN_GRACE_SEC);
    expect(checkinPhase(s, promptAt + CHECKIN_GRACE_SEC - 1)).toBe('prompt');
    expect(checkinPhase(s, promptAt + CHECKIN_GRACE_SEC)).toBe('overdue');
    expect(promptSecondsLeft(s, promptAt + CHECKIN_GRACE_SEC + 5)).toBe(0);
  });

  it("I'M OK clears the prompt and schedules the next cycle", () => {
    let s = startCheckins(t0);
    const promptAt = t0 + CHECKIN_INTERVAL_SEC;
    s = armPrompt(s, promptAt);
    s = confirmOk(s, promptAt + 5);
    expect(checkinPhase(s, promptAt + 6)).toBe('idle');
    expect(checkinPhase(s, promptAt + 5 + CHECKIN_INTERVAL_SEC)).toBe('prompt');
  });

  it('arming twice does not extend the window', () => {
    let s = startCheckins(t0);
    const promptAt = t0 + CHECKIN_INTERVAL_SEC;
    s = armPrompt(s, promptAt);
    const again = armPrompt(s, promptAt + 10);
    expect(again.promptExpiresAtSec).toBe(s.promptExpiresAtSec);
  });
});
