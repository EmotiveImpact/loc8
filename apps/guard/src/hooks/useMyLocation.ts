// apps/guard/src/hooks/useMyLocation.ts
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  useCrewStore, getSimTransport, FALLBACK_ORIGIN, startSourceLocationWatch,
  type SourceLocationStatus,
} from '@loc8/engine';

export type LocationStatus = SourceLocationStatus;

/** Preserve provider observation time/accuracy; fallback belongs only to the demo. */
export function useMyLocation(): LocationStatus {
  const [status, setStatus] = useState<LocationStatus>('pending');
  useEffect(() => {
    const watcher = startSourceLocationWatch({
      permitted: async () => (await Location.getForegroundPermissionsAsync()).status === 'granted',
      watch: (onSample, onError) => Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 2 },
        onSample, onError,
      ),
    }, {
      status: setStatus,
      accept: (sample) => {
        const store = useCrewStore.getState();
        if (!store.setMyLocationSample(sample)) return false;
        const accepted = useCrewStore.getState().myLocation;
        if (accepted) getSimTransport()?.setOrigin(accepted);
        return true;
      },
      unavailable: () => {
        const store = useCrewStore.getState();
        store.clearMyLocation();
        const sim = getSimTransport();
        if (sim) {
          store.setDemoLocation(FALLBACK_ORIGIN);
          sim.setOrigin(FALLBACK_ORIGIN);
        }
      },
    });
    return () => watcher.stop();
  }, []);
  return status;
}
