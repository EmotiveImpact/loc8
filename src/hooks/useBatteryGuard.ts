// src/hooks/useBatteryGuard.ts
import { useEffect } from 'react';
import * as Battery from 'expo-battery';
import { useCrewStore } from '../state/crewStore';

const LOW_BATTERY = 0.15;

/** Auto-enables beacon mode below 15% battery (spec §5). Dev menu can still force it. */
export function useBatteryGuard(): void {
  const setBeacon = useCrewStore((s) => s.setBeacon);
  const setBanner = useCrewStore((s) => s.setBanner);

  useEffect(() => {
    let sub: Battery.Subscription | null = null;
    (async () => {
      const level = await Battery.getBatteryLevelAsync();
      if (level >= 0 && level < LOW_BATTERY) {
        setBeacon(true);
        setBanner({ text: '🪫 Power saver on — updating once a minute, still findable' });
      }
      sub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        if (batteryLevel < LOW_BATTERY) setBeacon(true);
      });
    })();
    return () => sub?.remove();
  }, []);
}
