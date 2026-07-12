// apps/guard/src/hooks/useGuardBoot.ts
//
// One-time boot for the on-duty session: seed the team, start the shared engine
// mesh (with BLE permission gate on real hardware), and — in sim mode only —
// seed a single demo incident so the team map has a live incident marker and the
// Dispatch screen is reachable for the design loop. All mesh mechanics come from
// @loc8/engine; this hook only wires them up.
import { useEffect } from 'react';
import {
  useCrewStore,
  getMeshService,
  ensureBlePermissions,
  movePoint,
  FALLBACK_ORIGIN,
  startFloorService,
  stopFloorService,
} from '@loc8/engine';
import { bootGuardTeam } from '../state/guardTeam';
import { useGuardStore } from '../state/guardStore';

/** Seed one demo incident (reported by Marcus · Guard 05) ~55 m NE of you. */
function seedDemoIncident(): void {
  if (process.env.EXPO_PUBLIC_TRANSPORT === 'ble') return; // real mesh: no fakes
  const store = useCrewStore.getState();
  if (store.rallyPin) return; // don't clobber a real/active pin
  const origin = store.myLocation ?? FALLBACK_ORIGIN;
  const at = movePoint(origin, 38, 55); // 38° bearing, 55 m
  store.dropLocalPin({
    latitude: at.latitude,
    longitude: at.longitude,
    droppedById: 102, // Marcus · Guard 05
    atSec: Math.floor(Date.now() / 1000),
    floor: 0, // ground — visible on the default map view
  });
  useGuardStore.getState().setDispatch('Gate C · fight');
}

export function useGuardBoot(): void {
  useEffect(() => {
    bootGuardTeam();
    const mesh = getMeshService();
    let cancelled = false;
    (async () => {
      if (process.env.EXPO_PUBLIC_TRANSPORT === 'ble' && !(await ensureBlePermissions())) {
        useCrewStore.getState().setBanner({ text: 'Bluetooth permission needed — mesh is off' });
        return;
      }
      if (cancelled) return;
      mesh.start();
      startFloorService(); // barometric floor (auto) where available; manual otherwise
      // Give location a beat to arrive, then place the demo incident near you.
      setTimeout(() => { if (!cancelled) seedDemoIncident(); }, 1500);
    })();
    return () => {
      cancelled = true;
      mesh.stop();
      stopFloorService();
    };
  }, []);
}
