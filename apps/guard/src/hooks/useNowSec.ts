// apps/guard/src/hooks/useNowSec.ts
// Re-renders once per second with current unix seconds — drives shift clocks,
// dispatch distances and the lone-worker countdown.
import { useEffect, useState } from 'react';

export function useNowSec(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
