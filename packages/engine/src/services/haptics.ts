// src/services/haptics.ts
//
// The single source of truth for haptic feedback across Loc8. Every UI/service
// call site imports { haptics } from here and calls a *semantic* method
// (haptics.success(), haptics.pingReceived(), …) — never expo-haptics directly.
//
// Three invariants, enforced once, here — so no call site has to remember them:
//   1. Respect the user's toggle — no-op when hapticsEnabled === false.
//   2. Web has no haptics engine — no-op when Platform.OS === 'web'.
//   3. Never let a haptic crash a handler — every async primitive is
//      `.catch(() => {})`, and every sequence is wrapped so a throw can't bubble.
//
// Methods are fire-and-forget: synchronous to call, they schedule the buzz and
// return void immediately. The STORE never imports this module (call sites are
// UI/services only) — that keeps the dependency graph acyclic.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCrewStore } from '../state/crewStore';

/** The semantic events Loc8 can express through touch. */
export type HapticEvent =
  | 'select'
  | 'tap'
  | 'success'
  | 'warning'
  | 'error'
  | 'pingSent'
  | 'pingReceived'
  | 'rallyDrop'
  | 'rallyReceived'
  | 'proximityPulse'
  | 'found';

export interface Haptic {
  select(): void;
  tap(): void;
  success(): void;
  warning(): void;
  error(): void;
  pingSent(): void;
  pingReceived(): void;
  rallyDrop(): void;
  rallyReceived(): void;
  /** closeness in 0..1 (1 = closest) → single graded impact. Caller owns the rhythm. */
  proximityPulse(closeness: number): void;
  found(): void;
}

/** True when haptics may actually fire (toggle on + native platform). */
function enabled(): boolean {
  if (Platform.OS === 'web') return false;
  return useCrewStore.getState().hapticsEnabled !== false;
}

/**
 * Run a haptic body under the full guard: skip when disabled, and swallow any
 * synchronous throw so a buzz can never take down the caller's handler.
 */
function guard(fn: () => void): void {
  if (!enabled()) return;
  try {
    fn();
  } catch {
    // A haptic must never crash a UI handler.
  }
}

// Convenience shorthands for the expo-haptics primitives (each self-catches).
const impact = (style: Haptics.ImpactFeedbackStyle) =>
  Haptics.impactAsync(style).catch(() => {});
const notify = (type: Haptics.NotificationFeedbackType) =>
  Haptics.notificationAsync(type).catch(() => {});
const selection = () => Haptics.selectionAsync().catch(() => {});

/**
 * Schedule `fn` after `ms`, still under the guard, with the timer callback
 * wrapped so a late throw can't escape. Used for multi-buzz sequences.
 */
function later(ms: number, fn: () => void): void {
  setTimeout(() => {
    try {
      if (enabled()) fn();
    } catch {
      // swallow — see guard()
    }
  }, ms);
}

export const haptics: Haptic = {
  // Light, dry ticks — navigation & discrete selection.
  select: () => guard(() => selection()),

  // Generic press: a button, a CTA, opening a sheet, "Find".
  tap: () => guard(() => impact(Haptics.ImpactFeedbackStyle.Light)),

  // Outcome notifications.
  success: () => guard(() => notify(Haptics.NotificationFeedbackType.Success)),
  warning: () => guard(() => notify(Haptics.NotificationFeedbackType.Warning)),
  error: () => guard(() => notify(Haptics.NotificationFeedbackType.Error)),

  // You ping someone — a single firm nudge.
  pingSent: () => guard(() => impact(Haptics.ImpactFeedbackStyle.Medium)),

  // Someone pings YOU — a distinct DOUBLE knock (two crisp rigid taps),
  // deliberately unlike success() so an incoming ping is recognisable eyes-free.
  pingReceived: () =>
    guard(() => {
      impact(Haptics.ImpactFeedbackStyle.Rigid);
      later(90, () => impact(Haptics.ImpactFeedbackStyle.Rigid));
    }),

  // You plant a rally pin — the heaviest deliberate thunk.
  rallyDrop: () => guard(() => impact(Haptics.ImpactFeedbackStyle.Heavy)),

  // A rally lands from someone else — a "here → settle" two-beat (medium, then light).
  rallyReceived: () =>
    guard(() => {
      impact(Haptics.ImpactFeedbackStyle.Medium);
      later(120, () => impact(Haptics.ImpactFeedbackStyle.Light));
    }),

  // One graded pulse of the proximity heartbeat. The CALLER controls the
  // interval/rhythm; strength steps up by band as you close in.
  proximityPulse: (closeness: number) =>
    guard(() => {
      const c = Number.isFinite(closeness) ? closeness : 0;
      const style =
        c < 0.4
          ? Haptics.ImpactFeedbackStyle.Light
          : c < 0.75
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy;
      impact(style);
    }),

  // The reunion payoff — a three-beat celebration: thunk → success chime → sparkle.
  found: () =>
    guard(() => {
      impact(Haptics.ImpactFeedbackStyle.Heavy);
      later(120, () => notify(Haptics.NotificationFeedbackType.Success));
      later(260, () => impact(Haptics.ImpactFeedbackStyle.Rigid));
    }),
};
