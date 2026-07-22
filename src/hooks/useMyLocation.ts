// src/hooks/useMyLocation.ts
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useCrewStore, getSimTransport, FALLBACK_ORIGIN } from '@loc8/engine';

export type LocationStatus = 'pending' | 'granted' | 'denied';

/** Watches real GPS; feeds store + sim origin (no-op on the BLE mesh). Falls back to demo origin if denied. */
export function useMyLocation(): LocationStatus {
  const [status, setStatus] = useState<LocationStatus>('pending');
  const setMyLocation = useCrewStore((s) => s.setMyLocation);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('denied');
        setMyLocation(FALLBACK_ORIGIN);
        getSimTransport()?.setOrigin(FALLBACK_ORIGIN);
        return;
      }
      setStatus('granted');
      try {
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 2 },
          (loc) => {
            const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setMyLocation(c);
            getSimTransport()?.setOrigin(c);
          },
          // Swallow mid-session GPS errors so they don't become unhandled rejections.
          () => {},
        );
      } catch {
        // Watch rejected after grant (e.g. system Location Services off) — fall back.
        setMyLocation(FALLBACK_ORIGIN);
        getSimTransport()?.setOrigin(FALLBACK_ORIGIN);
      }
    })();
    return () => sub?.remove();
  }, [setMyLocation]);

  return status;
}
