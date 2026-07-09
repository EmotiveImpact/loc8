// Guard ops glue — everything Guard sends/receives over the mesh, built ONLY
// from engine primitives. The engine meshService already handles presence
// (position broadcast, names, crew chat); this module adds the ops verbs:
//   SOS            → first-class 'sos' packet (type 7), raiser position aboard
//   status reply   → the shared GUARD_STATUS quickReply vocabulary
//   dispatch inbox → reassembles inbound free-text as dispatch orders
//   gateway mode   → EXPO_PUBLIC_BRIDGE_URL wraps the mesh in BridgedTransport,
//                    making this phone the venue's mesh ↔ Command gateway.
import {
  getTransport,
  bootCrew,
  createMeshService,
  BridgedTransport,
  TrustLayer,
  useCrewStore,
  TextReassembler,
  haptics,
  GUARD_STATUS,
  type LocationTransport,
  type MeshService,
  type Packet,
} from '@loc8/engine';
import { useGuardStore } from '../store/guardStore';

const nowSec = () => Math.floor(Date.now() / 1000);

/**
 * The demo shift roster (sim mode). Same mesh sender ids as the engine's
 * DEMO_CREW so the SimulatedTransport's packets resolve to guard callsigns —
 * on real BLE these come from live peers instead.
 */
export const GUARD_TEAM = [
  { id: 101, name: 'Marcus · Guard 05', color: '#46e0a0' },
  { id: 102, name: 'Priya · Guard 03', color: '#46e0a0' },
  { id: 103, name: 'Dyani · Guard 09', color: '#ffb43a' },
  { id: 104, name: 'Erik · Guard 08', color: '#46e0a0' },
];

let transport: LocationTransport | null = null;
let service: MeshService | null = null;
let booted = false;

/** Guard's transport: the engine's (sim/BLE), bridged when a gateway URL is set. */
export function opsTransport(): LocationTransport {
  if (!transport) {
    const inner = getTransport();
    const url = process.env.EXPO_PUBLIC_BRIDGE_URL;
    transport = url ? new BridgedTransport(inner, { url }) : inner;
  }
  return transport;
}

/** Guard's mesh service — same engine service, over the (possibly bridged) transport. */
export function ops(): MeshService {
  if (!service) service = createMeshService(opsTransport(), new TrustLayer());
  return service;
}

/** Boot the shared engine + attach Guard's ops listeners (idempotent). */
export function bootGuard(): void {
  if (booted) return;
  booted = true;
  bootCrew();
  // Sim mode: reskin the demo crew as the shift roster (same ids → same packets).
  if (process.env.EXPO_PUBLIC_TRANSPORT !== 'ble') {
    useCrewStore.getState().registerFriends(GUARD_TEAM);
  }
  const t = opsTransport();
  // Guard's own dispatch inbox: inbound free-text over the mesh IS a dispatch
  // order on this door (product-architecture.md §Communication).
  const inbox = new TextReassembler();
  t.onPacket((p: Packet) => {
    const me = useCrewStore.getState().profile;
    if (me && p.senderId === me.id) return; // self-echo
    if (p.type === 'text') {
      const done = inbox.add(p);
      if (done) {
        useGuardStore.getState().receiveDispatch(done.text, nowSec());
        haptics.pingReceived(); // dispatch must be felt in a pocket
      }
    }
  });
  ops().start();
}

/** One un-missable SOS: broadcast a first-class 'sos' packet with my position. */
export function sendSos(): void {
  const s = useCrewStore.getState();
  if (!s.profile) return;
  const loc = s.myLocation;
  const p: Packet = {
    type: 'sos',
    senderId: s.profile.id,
    targetId: s.crew?.tag ?? 0,
    latitude: loc?.latitude ?? 0,
    longitude: loc?.longitude ?? 0,
    headingDeg: 0,
    batteryPct: 100,
    timestampSec: nowSec(),
    accuracyM: 10,
  };
  opsTransport().broadcast(p);
  useGuardStore.getState().raiseSos(nowSec());
  haptics.rallyReceived(); // strongest pattern in the vocabulary
}

/** Send a field status (En route / On scene / Need backup / Clear). */
export function sendStatus(code: number): void {
  // quickReply is directed; 0 = broadcast so Command and teammates both hear it.
  ops().sendQuickReply(0, code);
}

export { GUARD_STATUS };
