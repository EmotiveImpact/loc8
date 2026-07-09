// src/services/__tests__/meshService.test.ts
import { createMeshService } from '../meshService';
import { useCrewStore } from '../../state/crewStore';
import { TrustLayer } from '../../core/trustLayer';
import { fragmentText, fragmentProfile } from '../../core/textFragments';
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
    const positions = () => transport.sent.filter((p) => p.type === 'position');
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    svc.broadcastTick();                            // no session → nothing
    expect(transport.sent.length).toBe(0);
    useCrewStore.getState().startSession(6, clock);
    svc.broadcastTick();
    expect(positions().length).toBe(1);
    expect(transport.sent[0].type).toBe('position');
    useCrewStore.getState().setPrivacy('invisible');
    svc.broadcastTick();
    expect(positions().length).toBe(1);             // invisible → no broadcast
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

  it('broadcasts a profile (name) announce alongside position while active', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.broadcastTick();
    const profile = transport.sent.filter((p) => p.type === 'profile');
    expect(profile.length).toBeGreaterThanOrEqual(1);        // 'Me' → one fragment
    expect(profile.every((f) => f.senderId === 1)).toBe(true);
    // Reassembling the announced fragments yields the local display name.
    const { TextReassembler } = require('../../core/textFragments');
    const r = new TextReassembler();
    let out: { text: string } | null = null;
    profile.forEach((f: Packet) => { out = r.add(f) ?? out; });
    expect(out!.text).toBe('Me');
  });

  it('receiving a full profile announce upgrades a placeholder name to the real name', () => {
    useCrewStore.getState().setAutoAddPeers(true);
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    // Peer 831 first seen via a nameless position packet → placeholder name.
    transport.packetCb!(pos(831, clock));
    expect(useCrewStore.getState().friends[831].name).toBe('Friend 831');
    // Then a profile announce arrives → name upgrades live, colour preserved.
    const colorBefore = useCrewStore.getState().friends[831].color;
    const frags = fragmentProfile({ senderId: 831, targetId: 0, msgId: 1, text: 'Maya', timestampSec: clock });
    frags.forEach((f) => transport.packetCb!(f));
    expect(useCrewStore.getState().friends[831].name).toBe('Maya');
    expect(useCrewStore.getState().friends[831].color).toBe(colorBefore);
    // Profiles are metadata — never surfaced to the Activity feed.
    expect(useCrewStore.getState().activityLog.some((e) => e.kind === 'message')).toBe(false);
  });

  it('creates a friend from a profile announce even before any position packet', () => {
    useCrewStore.getState().setAutoAddPeers(true);
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    const frags = fragmentProfile({ senderId: 555, targetId: 0, msgId: 2, text: 'Priya 🎉', timestampSec: clock });
    frags.forEach((f) => transport.packetCb!(f));
    expect(useCrewStore.getState().friends[555].name).toBe('Priya 🎉');
  });

  it('ignores our own profile announce echoed back through the mesh (self)', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    const mine = fragmentProfile({ senderId: 1, targetId: 0, msgId: 3, text: 'Impostor', timestampSec: clock });
    mine.forEach((f) => transport.packetCb!(f));
    expect(useCrewStore.getState().friends[1]).toBeUndefined();
    expect(useCrewStore.getState().profile!.name).toBe('Me');
  });

  it('drops profile fragments not tagged for our crew (real BLE mode)', () => {
    useCrewStore.getState().setAutoAddPeers(true);
    useCrewStore.getState().joinCrew('FIRE-42');
    const tag = useCrewStore.getState().crew!.tag;
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    const wrong = fragmentProfile({ senderId: 202, targetId: tag + 1, msgId: 4, text: 'Nope', timestampSec: clock });
    wrong.forEach((f) => transport.packetCb!(f));
    expect(useCrewStore.getState().friends[202]).toBeUndefined();
    const right = fragmentProfile({ senderId: 202, targetId: tag, msgId: 5, text: 'Yes', timestampSec: clock });
    right.forEach((f) => transport.packetCb!(f));
    expect(useCrewStore.getState().friends[202].name).toBe('Yes');
  });

  it('dropRally broadcasts a rally packet at my location and pins locally', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.dropRally();
    expect(transport.sent.some((p) => p.type === 'rally')).toBe(true);
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(1);
  });

  // Fix 2a: the rally packet must carry the crew tag (like position/text/profile)
  // so it doesn't leak to other crews sharing the mesh.
  it('dropRally tags the rally packet with the crew tag', () => {
    useCrewStore.getState().joinCrew('FIRE-42');
    const tag = useCrewStore.getState().crew!.tag;
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    svc.dropRally();
    const rally = transport.sent.find((p) => p.type === 'rally');
    expect(rally?.targetId).toBe(tag);
  });

  it('dropRally with no crew tags the rally with 0 (broadcast)', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    svc.dropRally();
    expect(transport.sent.find((p) => p.type === 'rally')?.targetId).toBe(0);
  });

  // Fix 9: text bypasses TrustLayer (reassembled first), so a re-delivered full
  // fragment set would reassemble twice and double-push to Activity.
  it('a re-delivered completed message pushes only ONE activity entry', () => {
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    const frags = fragmentText({ senderId: 101, targetId: 0, msgId: 7, text: 'hey where are you', timestampSec: clock });
    frags.forEach((f) => transport.packetCb!(f));
    // Replay the identical full fragment set (e.g. a relayed duplicate copy).
    frags.forEach((f) => transport.packetCb!(f));
    const log = useCrewStore.getState().activityLog.filter((e) => e.kind === 'message');
    expect(log.length).toBe(1);
  });

  // Fix 8: iOS 'inactive' (control center / call banner / Face ID) must be treated
  // as still-foreground, so open-mode broadcasting doesn't wrongly halt.
  it('treats iOS "inactive" as still-foreground (open mode keeps broadcasting)', () => {
    const { AppState } = require('react-native');
    let changeHandler: ((s: string) => void) | undefined;
    const spy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((...args: unknown[]) => {
        const [ev, cb] = args as [string, (s: string) => void];
        if (ev === 'change') changeHandler = cb;
        return { remove() {} } as never;
      });
    try {
      const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
      svc.start();
      useCrewStore.getState().setPrivacy('open');
      useCrewStore.getState().startSession(6, clock);
      // iOS fires 'inactive' — with the old handler this dropped foreground and
      // halted open-mode broadcasting.
      changeHandler?.('inactive');
      clock += 10; // clear the broadcast interval gate
      svc.broadcastTick();
      expect(transport.sent.filter((p) => p.type === 'position').length).toBe(1);
    } finally {
      spy.mockRestore();
    }
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
    expect(transport.sent.filter((p) => p.type === 'position').length).toBe(1); // one tick → one position, not two
  });

  it('after endSession then startSession, the next broadcastTick sends immediately', () => {
    const positions = () => transport.sent.filter((p) => p.type === 'position');
    const svc = createMeshService(transport, new TrustLayer(600, nowSec), nowSec);
    svc.start();
    useCrewStore.getState().startSession(6, clock);
    svc.broadcastTick();                            // first broadcast; lastBroadcastSec = now
    expect(positions().length).toBe(1);

    useCrewStore.getState().endSession();
    svc.broadcastTick();                            // inactive → no broadcast, wasActive cleared
    expect(positions().length).toBe(1);

    clock += 2;                                      // still well under BROADCAST_INTERVAL_SEC
    useCrewStore.getState().startSession(6, clock);
    svc.broadcastTick();                            // new session → must broadcast immediately
    expect(positions().length).toBe(2);
  });
});
