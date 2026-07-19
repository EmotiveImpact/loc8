// src/hooks/useNowSec.ts
import { useEffect, useState } from 'react';

/** Re-renders once per second with current unix seconds — drives freshness labels. */
export function useNowSec(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
