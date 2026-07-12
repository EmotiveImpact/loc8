// src/services/__tests__/haptics.test.ts
import * as Haptics from 'expo-haptics';
import { haptics } from '../haptics';
import { useCrewStore } from '../../state/crewStore';

// Manual mock: real fn spies + the enum shapes the module reads at call-time.
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Rigid: 'rigid',
    Soft: 'soft',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

const impactAsync = Haptics.impactAsync as jest.Mock;
const notificationAsync = Haptics.notificationAsync as jest.Mock;
const selectionAsync = Haptics.selectionAsync as jest.Mock;

const S = Haptics.ImpactFeedbackStyle;
const N = Haptics.NotificationFeedbackType;

beforeEach(() => {
  useCrewStore.getState().reset(); // hapticsEnabled defaults back to true
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('haptics — semantic → primitive mapping', () => {
  it('select() → selectionAsync', () => {
    haptics.select();
    expect(selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('tap() → impactAsync(Light)', () => {
    haptics.tap();
    expect(impactAsync).toHaveBeenCalledWith(S.Light);
  });

  it('success() → notificationAsync(Success)', () => {
    haptics.success();
    expect(notificationAsync).toHaveBeenCalledWith(N.Success);
  });

  it('warning() → notificationAsync(Warning)', () => {
    haptics.warning();
    expect(notificationAsync).toHaveBeenCalledWith(N.Warning);
  });

  it('error() → notificationAsync(Error)', () => {
    haptics.error();
    expect(notificationAsync).toHaveBeenCalledWith(N.Error);
  });

  it('pingSent() → impactAsync(Medium)', () => {
    haptics.pingSent();
    expect(impactAsync).toHaveBeenCalledWith(S.Medium);
  });

  it('rallyDrop() → impactAsync(Heavy)', () => {
    haptics.rallyDrop();
    expect(impactAsync).toHaveBeenCalledWith(S.Heavy);
  });

  it('proximityPulse() grades strength by band', () => {
    haptics.proximityPulse(0.2);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Light);
    haptics.proximityPulse(0.5);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Medium);
    haptics.proximityPulse(0.9);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Heavy);
    expect(impactAsync).toHaveBeenCalledTimes(3);
  });
});

describe('haptics — multi-beat sequences (fake timers)', () => {
  it('pingReceived() is a double Rigid knock ~90ms apart', () => {
    haptics.pingReceived();
    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Rigid);
    jest.advanceTimersByTime(90);
    expect(impactAsync).toHaveBeenCalledTimes(2);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Rigid);
  });

  it('rallyReceived() is Medium then Light ~120ms later', () => {
    haptics.rallyReceived();
    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Medium);
    jest.advanceTimersByTime(120);
    expect(impactAsync).toHaveBeenCalledTimes(2);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Light);
  });

  it('found() plays Heavy → Success → Rigid over its timeline', () => {
    haptics.found();
    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Heavy);
    expect(notificationAsync).not.toHaveBeenCalled();
    jest.advanceTimersByTime(120);
    expect(notificationAsync).toHaveBeenCalledWith(N.Success);
    jest.advanceTimersByTime(140); // total 260ms
    expect(impactAsync).toHaveBeenCalledTimes(2);
    expect(impactAsync).toHaveBeenLastCalledWith(S.Rigid);
  });
});

describe('haptics — disabled toggle silences everything', () => {
  beforeEach(() => {
    useCrewStore.getState().setHapticsEnabled(false);
    jest.clearAllMocks();
  });

  it('fires no primitive for single-shot methods', () => {
    haptics.select();
    haptics.tap();
    haptics.success();
    haptics.warning();
    haptics.error();
    haptics.pingSent();
    haptics.rallyDrop();
    haptics.proximityPulse(0.9);
    expect(selectionAsync).not.toHaveBeenCalled();
    expect(impactAsync).not.toHaveBeenCalled();
    expect(notificationAsync).not.toHaveBeenCalled();
  });

  it('fires no primitive for sequences, even after their timers elapse', () => {
    haptics.pingReceived();
    haptics.rallyReceived();
    haptics.found();
    jest.advanceTimersByTime(500);
    expect(impactAsync).not.toHaveBeenCalled();
    expect(notificationAsync).not.toHaveBeenCalled();
  });
});
