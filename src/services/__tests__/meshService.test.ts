// src/services/__tests__/meshService.test.ts
import { createMeshService } from '../meshService';
import { useCrewStore } from '../../state/crewStore';
import { TrustLayer } from '../../core/trustLayer';
import { fragmentText } from '../../core/textFragments';
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

  it('sendQuickReply sends a targeted quickReply packet carrying the code', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.sendQuickReply(101, 3);
    const reply = transport.sent.find((p) => p.type === 'quickReply');
    expect(reply).toBeDefined();
    expect(reply?.targetId).toBe(101);
    expect(reply?.senderId).toBe(1);
    expect(reply?.quickReplyCode).toBe(3);
  });

  it('sendCrewMessage fragments a message into N text packets and echoes it locally', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    const msg = 'B'.repeat(50); // >11 bytes → multiple fragments
    svc.sendCrewMessage(msg);
    const frags = transport.sent.filter((p) => p.type === 'text');
    expect(frags.length).toBe(Math.ceil(50 / 11));
    frags.forEach((f) => expect(f.senderId).toBe(1));
    // all fragments share one msgId, and seqs are 0..N-1
    expect(new Set(frags.map((f) => f.msgId)).size).toBe(1);
    expect(frags.map((f) => f.seq).sort((a, b) => a! - b!)).toEqual(frags.map((_, i) => i));
    // local echo
    const log = useCrewStore.getState().activityLog;
    expect(log[0].kind).toBe('message');
    expect(log[0].text).toBe(`You: ${msg}`);
  });

  it('receiving all fragments of a message produces one message activity + banner', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    const frags = fragmentText({ senderId: 101, targetId: 0, msgId: 5, text: 'hey where are you', timestampSec: clock });
    expect(frags.length).toBeGreaterThan(1);
    frags.forEach((f) => transport.packetCb!(f));
    const log = useCrewStore.getState().activityLog.filter((e) => e.kind === 'message');
    expect(log.length).toBe(1);
    expect(log[0].text).toBe('Maya: hey where are you');
    expect(log[0].friendId).toBe(101);
    expect(useCrewStore.getState().banner?.text).toBe('Maya: hey where are you');
  });

  it('ignores our own text fragments echoed back through the mesh (self)', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    const mine = fragmentText({ senderId: 1, targetId: 0, msgId: 9, text: 'echo', timestampSec: clock });
    mine.forEach((f) => transport.packetCb!(f));
    expect(useCrewStore.getState().activityLog.some((e) => e.kind === 'message')).toBe(false);
  });

  it('drops text fragments not tagged for our crew (real BLE mode)', () => {
    useCrewStore.getState().setAutoAddPeers(true);
    useCrewStore.getState().joinCrew('FIRE-42');
    const tag = useCrewStore.getState().crew!.tag;
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    const wrong = fragmentText({ senderId: 202, targetId: tag + 1, msgId: 3, text: 'not for us', timestampSec: clock });
    wrong.forEach((f) => transport.packetCb!(f));
    expect(useCrewStore.getState().activityLog.some((e) => e.kind === 'message')).toBe(false);
    const right = fragmentText({ senderId: 202, targetId: tag, msgId: 4, text: 'for us', timestampSec: clock });
    right.forEach((f) => transport.packetCb!(f));
    const log = useCrewStore.getState().activityLog.filter((e) => e.kind === 'message');
    expect(log.length).toBe(1);
    expect(log[0].text).toMatch(/for us/);
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
