// src/hooks/useSmoothedHeading.ts
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { smoothHeading } from '@loc8/engine';

/**
 * Device compass heading through the low-pass filter (spec §6 — festival EM noise).
 * Falls back to 0° (north-up) when no magnetometer (simulators).
 */
export function useSmoothedHeading(): number {
  const [heading, setHeading] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let mounted = true;
    (async () => {
      try {
        sub = await Location.watchHeadingAsync((h) => {
          if (!mounted) return;
          const raw =
            Number.isFinite(h.trueHeading) && h.trueHeading >= 0
              ? h.trueHeading
              : Number.isFinite(h.magHeading)
                ? h.magHeading
                : undefined;
          if (raw === undefined) return; // no usable heading — keep current
          current.current = smoothHeading(current.current, raw, 0.25);
          setHeading(current.current);
        });
      } catch {
        // no magnetometer (simulator) — stay north-up at 0°
      }
    })();
    return () => { mounted = false; sub?.remove(); };
  }, []);

  return heading;
}
