// src/domain/time.ts — small, deterministic time formatters for the mono register.
export const nowSec = (): number => Math.floor(Date.now() / 1000);

/** HH:MM:SS from a Date (the live topbar clock). */
export function fmtClock(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

/** HH:MM from a unix-seconds timestamp (local). */
export function fmtHM(sec: number): string {
  return new Date(sec * 1000).toTimeString().slice(0, 5);
}

/** MM:SS count-up from an elapsed number of seconds (never negative). */
export function fmtElapsed(elapsedSec: number): string {
  const s = Math.max(0, Math.floor(elapsedSec));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}
