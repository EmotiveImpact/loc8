// src/hooks/useBatteryGuard.ts
import { useEffect } from 'react';
import * as Battery from 'expo-battery';
import { useCrewStore } from '@loc8/engine';

const LOW_BATTERY = 0.15;

/**
 * Auto-enables beacon mode below 15% battery (spec §5). Dev menu can still force it.
 * Battery monitoring isn't available on every platform (web, some simulators) — where it
 * isn't, this degrades to a no-op instead of crashing the app.
 */
export function useBatteryGuard(): void {
  const setBeacon = useCrewStore((s) => s.setBeacon);
  const setBanner = useCrewStore((s) => s.setBanner);

  useEffect(() => {
    let mounted = true;
    let sub: Battery.Subscription | null = null;

    (async () => {
      try {
        // Bail cleanly where the battery API isn't supported (web / stripped runtimes).
        const available =
          typeof Battery.isAvailableAsync === 'function'
            ? await Battery.isAvailableAsync()
            : false;
        if (!available || !mounted) return;

        const level = await Battery.getBatteryLevelAsync();
        if (mounted && level >= 0 && level < LOW_BATTERY) {
          setBeacon(true);
          setBanner({ text: 'Power saver on — updating once a minute, still findable' });
        }

        if (mounted && typeof Battery.addBatteryLevelListener === 'function') {
          sub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
            if (batteryLevel < LOW_BATTERY) setBeacon(true);
          });
        }
      } catch {
        // Battery monitoring unavailable on this device/platform — skip the guard silently.
      }
    })();

    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);
}
