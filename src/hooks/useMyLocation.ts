// src/hooks/useMyLocation.ts
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useCrewStore } from '../state/crewStore';
import { getTransport, FALLBACK_ORIGIN } from '../services/appServices';

export type LocationStatus = 'pending' | 'granted' | 'denied';

/** Watches real GPS; feeds store + sim origin. Falls back to demo origin if denied. */
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
        getTransport().setOrigin(FALLBACK_ORIGIN);
        return;
      }
      setStatus('granted');
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 2 },
        (loc) => {
          const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setMyLocation(c);
          getTransport().setOrigin(c);
        },
      );
    })();
    return () => sub?.remove();
  }, []);

  return status;
}
