// src/services/meshService.ts
import { useCrewStore } from '../state/crewStore';
import { TrustLayer } from '../core/trustLayer';
import type { LocationTransport } from '../transport/LocationTransport';
import type { Packet, PacketType } from '../core/types';

export const BROADCAST_INTERVAL_SEC = 5;
export const BEACON_INTERVAL_SEC = 60;   // low-battery beacon mode (spec §5)

export interface MeshService {
  start(): void;
  stop(): void;
  /** One broadcast heartbeat. Called on an interval in the app; directly in tests. */
  broadcastTick(): void;
  pingFriend(friendId: number, kind: Extract<PacketType, 'pingWhere' | 'pingComeFind'>): void;
  dropRally(): void;
}

export function createMeshService(
  transport: LocationTransport,
  trust: TrustLayer,
  nowSec: () => number = () => Math.floor(Date.now() / 1000),
): MeshService {
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastBroadcastSec = 0;
  const store = () => useCrewStore.getState();

  const myPacket = (type: PacketType, targetId = 0): Packet | null => {
    const s = store();
    if (!s.profile || !s.myLocation) return null;
    return {
      type, senderId: s.profile.id, targetId,
      latitude: s.myLocation.latitude, longitude: s.myLocation.longitude,
      headingDeg: 0, batteryPct: 100, timestampSec: nowSec(), accuracyM: 10,
    };
  };

  const service: MeshService = {
    start() {
      transport.onPacket((p, relayVia) => {
        if (trust.accept(p)) store().applyPacket(p, relayVia);
      });
      transport.onMeshStatus((st) => store().setMeshNearby(st.nearbyCount));
      transport.start();
      timer = setInterval(() => service.broadcastTick(), 1000);
    },

    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      transport.stop();
    },

    broadcastTick() {
      const s = store();
      const now = nowSec();

      // session expiry (spec §4: auto-expire + notify)
      if (s.sessionEndsAtSec !== null && now >= s.sessionEndsAtSec) {
        s.endSession();
        s.setBanner({ text: '⏳ Session ended — you stopped broadcasting' });
        return;
      }
      if (!s.isSessionActive(now)) return;
      if (s.privacyMode === 'invisible') return;

      const interval = s.beaconMode ? BEACON_INTERVAL_SEC : BROADCAST_INTERVAL_SEC;
      if (now - lastBroadcastSec < interval) return;
      const p = myPacket('position');
      if (!p) return;
      lastBroadcastSec = now;
      transport.broadcast(p);
    },

    pingFriend(friendId, kind) {
      const p = myPacket(kind, friendId);
      if (p) transport.broadcast(p);
    },

    dropRally() {
      const p = myPacket('rally');
      if (!p) return;
      transport.broadcast(p);
      const s = store();
      s.dropLocalPin({
        latitude: p.latitude, longitude: p.longitude,
        droppedById: p.senderId, atSec: p.timestampSec,
      });
    },
  };

  return service;
}
