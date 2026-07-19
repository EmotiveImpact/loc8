// Ops haptics: SOS must be un-missable (long, multi-cluster) and dispatch a
// firm triple knock. Same mock shape as haptics.test.ts.
import * as Haptics from 'expo-haptics';
import { haptics } from '../haptics';
import { useCrewStore } from '../../state/crewStore';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const impactAsync = Haptics.impactAsync as jest.Mock;
const notificationAsync = Haptics.notificationAsync as jest.Mock;
const S = Haptics.ImpactFeedbackStyle;
const N = Haptics.NotificationFeedbackType;

beforeEach(() => {
  useCrewStore.getState().reset();
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe('ops haptics', () => {
  it('sos() fires an immediate heavy impact and sustains a long multi-cluster burst', () => {
    haptics.sos();
    // First cluster's first knock is synchronous.
    expect(impactAsync).toHaveBeenCalledWith(S.Heavy);
    const immediate = impactAsync.mock.calls.length;
    jest.advanceTimersByTime(1600);
    // Three clusters × 3 heavy knocks = 9 heavy impacts, + 3 error chimes.
    expect(impactAsync.mock.calls.length).toBeGreaterThan(immediate);
    expect(impactAsync.mock.calls.filter((c) => c[0] === S.Heavy).length).toBe(9);
    expect(notificationAsync.mock.calls.filter((c) => c[0] === N.Error).length).toBe(3);
  });

  it('dispatch() is a firm triple knock ending heavy', () => {
    haptics.dispatch();
    expect(impactAsync).toHaveBeenCalledWith(S.Medium);
    jest.advanceTimersByTime(300);
    expect(impactAsync.mock.calls.map((c) => c[0])).toEqual([S.Medium, S.Medium, S.Heavy]);
  });

  it('respects the haptics toggle (no-op when disabled)', () => {
    useCrewStore.getState().setHapticsEnabled(false);
    haptics.sos();
    jest.advanceTimersByTime(1600);
    expect(impactAsync).not.toHaveBeenCalled();
    expect(notificationAsync).not.toHaveBeenCalled();
  });
});
