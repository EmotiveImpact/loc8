import { useEffect, useState } from 'react';
import { fmtClock, fmtElapsed, nowSec } from '../domain/time';

/** Live wall-clock HH:MM:SS, ticking every second. */
export function useClock(): string {
  const [t, setT] = useState(() => fmtClock(new Date()));
  useEffect(() => {
    const id = setInterval(() => setT(fmtClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/** Live MM:SS elapsed since a unix-seconds timestamp. */
export function useElapsed(sinceSec: number): string {
  const [s, setS] = useState(() => fmtElapsed(nowSec() - sinceSec));
  useEffect(() => {
    const id = setInterval(() => setS(fmtElapsed(nowSec() - sinceSec)), 1000);
    return () => clearInterval(id);
  }, [sinceSec]);
  return s;
}
