import { emitGuardStatus, guardStatusScript } from '../guardFeed';

describe('simulated Guard status feed', () => {
  it('a status makes a full encode→decode round-trip through the engine codec', () => {
    const s = emitGuardStatus(5, 21); // STATUS_ON_SCENE
    expect(s).not.toBeNull();
    expect(s!.fromId).toBe(5);
    expect(s!.code).toBe(21);
    expect(s!.label).toBe('On scene');
  });

  it('builds a staggered beat script over the responders', () => {
    const script = guardStatusScript([5, 3]);
    expect(script).toHaveLength(8); // 4 statuses × 2 responders
    expect(script[0]).toEqual([5, 20]); // first beat: guard 5, En route
    expect(script.every(([, code]) => code >= 20 && code <= 23)).toBe(true);
  });
});
