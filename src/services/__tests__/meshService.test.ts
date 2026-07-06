// src/services/__tests__/meshService.test.ts
import { createMeshService } from '../meshService';
import { useCrewStore } from '../../state/crewStore';
import { TrustLayer } from '../../core/trustLayer';
import type { LocationTransport, MeshStatus } from '../../transport/LocationTransport';
import type { Packet } from '../../core/types';

class FakeTransport implements LocationTransport {
  packetCbs: Array<(p: Packet, via?: string) => void> = [];
  statusCbs: Array<(s: MeshStatus) => void> = [];
  sent: Packet[] = [];
  start() {} stop() {}
  broadcast(p: Packet) { this.sent.push(p); }
  onPacket(cb: (p: Packet, via?: string) => void) { this.packetCbs.push(cb); }
  onMeshStatus(cb: (s: MeshStatus) => void) { this.statusCbs.push(cb); }
  clearListeners() { this.packetCbs = []; this.statusCbs = []; }
  // convenience for tests that emit a single inbound packet
  get packetCb() { return this.packetCbs[0]; }
  get statusCb() { return this.statusCbs[0]; }
}

const pos = (senderId: number, ts: number): Packet => ({
  type: 'position', senderId, targetId: 0, latitude: 1, longitude: 1,
  headingDeg: 0, batteryPct: 50, timestampSec: ts, accuracyM: 10,
});

describe('meshService', () => {
  let transport: FakeTransport;
  let clock: number;
  const nowSec = () => clock;

  beforeEach(() => {
    clock = 1000;
    useCrewStore.getState().reset();
    useCrewStore.getState().setProfile({ id: 1, name: 'Me', color: '#fff' });
    useCrewStore.getState().registerFriends([{ id: 101, name: 'Maya', color: '#4be3c0' }]);
    useCrewStore.getState().setMyLocation({ latitude: 37.77, longitude: -122.41 });
    transport = new FakeTransport();
  });

  it('accepted packets reach the store; replays are dropped', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    transport.packetCb!(pos(101, 990));
    expect(useCrewStore.getState().friends[101].lastPacket?.timestampSec).toBe(990);
    transport.packetCb!(pos(101, 980)); // out-of-order replay — must not regress
    expect(useCrewStore.getState().friends[101].lastPacket?.timestampSec).toBe(990);
  });

  it('broadcasts my position only while session active and not invisible', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    svc.broadcastTick();                            // no session → nothing
    expect(transport.sent.length).toBe(0);
    useCrewStore.getState().startSession(6, clock);
    svc.broadcastTick();
    expect(transport.sent.length).toBe(1);
    expect(transport.sent[0].type).toBe('position');
    useCrewStore.getState().setPrivacy('invisible');
    svc.broadcastTick();
    expect(transport.sent.length).toBe(1);          // invisible → no broadcast
  });

  it('session expiry ends the session and sets a banner', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(1, clock); // 1h
    clock += 3700;                                  // past expiry
    svc.broadcastTick();
    expect(useCrewStore.getState().sessionEndsAtSec).toBeNull();
    expect(useCrewStore.getState().banner?.text).toMatch(/session ended/i);
    expect(transport.sent.length).toBe(0);
  });

  it('pingFriend sends a targeted ping packet', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.pingFriend(101, 'pingComeFind');
    const ping = transport.sent.find((p) => p.type === 'pingComeFind');
    expect(ping?.targetId).toBe(101);
  });

  it('dropRally broadcasts a rally packet at my location and pins locally', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.dropRally();
    expect(transport.sent.some((p) => p.type === 'rally')).toBe(true);
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(1);
  });

  it('start() is idempotent — a second start() does not double-broadcast per tick', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    svc.start();                                    // second start must be a no-op
    // exactly one inbound callback registered (no accumulation)
    expect(transport.packetCbs.length).toBe(1);
    useCrewStore.getState().startSession(6, clock);
    clock += 10;                                     // clear the interval gate
    svc.broadcastTick();
    expect(transport.sent.length).toBe(1);          // one tick → one broadcast, not two
  });

  it('after endSession then startSession, the next broadcastTick sends immediately', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.broadcastTick();                            // first broadcast; lastBroadcastSec = now
    expect(transport.sent.length).toBe(1);

    useCrewStore.getState().endSession();
    svc.broadcastTick();                            // inactive → no broadcast, wasActive cleared
    expect(transport.sent.length).toBe(1);

    clock += 2;                                      // still well under BROADCAST_INTERVAL_SEC
    useCrewStore.getState().startSession(6, clock);
    svc.broadcastTick();                            // new session → must broadcast immediately
    expect(transport.sent.length).toBe(2);
  });
});
