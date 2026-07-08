import { useCrewStore, freshnessSec, STALE_SEC } from '../crewStore';
import type { Packet } from '../../core/types';

const posPacket = (senderId: number, timestampSec: number): Packet => ({
  type: 'position', senderId, targetId: 0, latitude: 37.77, longitude: -122.41,
  headingDeg: 0, batteryPct: 70, timestampSec, accuracyM: 10,
});

beforeEach(() => {
  useCrewStore.getState().reset();
  useCrewStore.getState().registerFriends([
    { id: 101, name: 'Maya', color: '#4be3c0' },
    { id: 102, name: 'Jules', color: '#ff9a5a' },
  ]);
});

describe('crewStore', () => {
  it('applies position packets to the right friend', () => {
    useCrewStore.getState().applyPacket(posPacket(101, 1000), 'someRelay');
    const f = useCrewStore.getState().friends[101];
    expect(f.lastPacket?.timestampSec).toBe(1000);
    expect(f.relayVia).toBe('someRelay');
  });

  it('computes freshness and staleness', () => {
    useCrewStore.getState().applyPacket(posPacket(101, 1000));
    const f = useCrewStore.getState().friends[101];
    expect(freshnessSec(f, 1010)).toBe(10);
    expect(freshnessSec(f, 1000 + STALE_SEC + 1)! > STALE_SEC).toBe(true);
    expect(freshnessSec(useCrewStore.getState().friends[102], 1010)).toBeNull(); // never seen
  });

  it('session: starts with duration, expires, extends', () => {
    const s = useCrewStore.getState();
    s.startSession(6, 1000);                      // 6h from t=1000
    expect(useCrewStore.getState().sessionEndsAtSec).toBe(1000 + 6 * 3600);
    expect(useCrewStore.getState().isSessionActive(1000 + 3600)).toBe(true);
    expect(useCrewStore.getState().isSessionActive(1000 + 7 * 3600)).toBe(false);
    s.extendSession(2);
    expect(useCrewStore.getState().sessionEndsAtSec).toBe(1000 + 8 * 3600);
    s.endSession();
    expect(useCrewStore.getState().sessionEndsAtSec).toBeNull();
  });

  it('rally pin: latest wins, older rally packets ignored', () => {
    const s = useCrewStore.getState();
    s.applyPacket({ ...posPacket(101, 2000), type: 'rally' });
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(101);
    s.applyPacket({ ...posPacket(102, 1500), type: 'rally' });   // older — ignored
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(101);
    s.applyPacket({ ...posPacket(102, 2500), type: 'rally' });   // newer — replaces
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(102);
  });

  it('ping packets set a banner instead of moving blips', () => {
    useCrewStore.getState().applyPacket({ ...posPacket(101, 1000), type: 'pingWhere', targetId: 1 });
    expect(useCrewStore.getState().banner?.text).toMatch(/Maya/);
    expect(useCrewStore.getState().friends[101].lastPacket).toBeUndefined();
  });

  it('drops packets from unknown senders when autoAddPeers is false (sim)', () => {
    useCrewStore.getState().applyPacket(posPacket(999, 1000));
    expect(useCrewStore.getState().friends[999]).toBeUndefined();
  });

  it('auto-adds an unknown sender and applies its packet when autoAddPeers is true', () => {
    useCrewStore.getState().setAutoAddPeers(true);
    useCrewStore.getState().applyPacket(posPacket(999, 1000));
    const f = useCrewStore.getState().friends[999];
    expect(f).toBeDefined();
    expect(f.name).toMatch(/Friend/);
    expect(f.lastPacket?.timestampSec).toBe(1000);
  });

  it('ignores self-echo packets (senderId === own profile id) in both modes', () => {
    useCrewStore.getState().setProfile({ id: 555, name: 'You', color: '#fff' });
    useCrewStore.getState().setAutoAddPeers(true);
    useCrewStore.getState().applyPacket(posPacket(555, 1000));
    expect(useCrewStore.getState().friends[555]).toBeUndefined();
  });

  it('pushActivity prepends newest-first, assigns ids, and caps the log at 50', () => {
    const s = useCrewStore.getState();
    s.pushActivity({ kind: 'ping', text: 'first', atSec: 1000 });
    s.pushActivity({ kind: 'rally', text: 'second', atSec: 1001 });
    const log = useCrewStore.getState().activityLog;
    expect(log[0].text).toBe('second');           // newest first
    expect(log[1].text).toBe('first');
    expect(log[0].id).not.toBe(log[1].id);         // unique ids
    for (let i = 0; i < 60; i++) s.pushActivity({ kind: 'ping', text: `x${i}`, atSec: 2000 + i });
    expect(useCrewStore.getState().activityLog.length).toBe(50);   // capped
  });

  it('records a rally activity event when a rally packet is accepted', () => {
    useCrewStore.getState().applyPacket({ ...posPacket(101, 3000), type: 'rally' });
    const log = useCrewStore.getState().activityLog;
    expect(log[0].kind).toBe('rally');
    expect(log[0].text).toMatch(/Maya/);
  });

  it('records a ping activity event carrying the friendId', () => {
    useCrewStore.getState().applyPacket({ ...posPacket(101, 3000), type: 'pingWhere' });
    const log = useCrewStore.getState().activityLog;
    expect(log[0].kind).toBe('ping');
    expect(log[0].friendId).toBe(101);
  });

  it('markCelebrated then clearCelebrated removes the flag (allows re-celebration)', () => {
    const s = useCrewStore.getState();
    s.markCelebrated(101);
    expect(useCrewStore.getState().celebrated[101]).toBe(true);
    s.clearCelebrated(101);
    expect(useCrewStore.getState().celebrated[101]).toBeUndefined();
    expect(101 in useCrewStore.getState().celebrated).toBe(false);
  });
});
