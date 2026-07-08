// apps/guard/src/hooks/useMyLocation.ts
// App glue (not engine): watches real GPS and feeds the engine's crewStore +
// the simulated transport's origin, falling back to the demo origin if denied.
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useCrewStore, getSimTransport, FALLBACK_ORIGIN } from '@loc8/engine';

export type LocationStatus = 'pending' | 'granted' | 'denied';

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
          () => {},
        );
      } catch {
        setMyLocation(FALLBACK_ORIGIN);
        getSimTransport()?.setOrigin(FALLBACK_ORIGIN);
      }
    })();
    return () => sub?.remove();
  }, []);

  return status;
}
