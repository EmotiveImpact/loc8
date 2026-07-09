import {
  useCrewStore, freshnessSec, STALE_SEC,
  shouldNotifyBanner, shouldAutoDismissBanner, parseCrewDeepLink,
} from '../crewStore';
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
    // Directed ping addressed to me (targetId === my id) — surfaces a banner.
    useCrewStore.getState().setProfile({ id: 1, name: 'You', color: '#fff' });
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

  it('quickReply addressed to me sets a reply banner + activity (not crew-filtered)', () => {
    useCrewStore.getState().setProfile({ id: 555, name: 'You', color: '#fff' });
    useCrewStore.getState().applyPacket({
      ...posPacket(101, 3000), type: 'quickReply', targetId: 555, quickReplyCode: 1,
    });
    const banner = useCrewStore.getState().banner;
    expect(banner?.kind).toBe('reply');
    expect(banner?.friendId).toBe(101);
    expect(banner?.text).toMatch(/Maya/);
    expect(banner?.text).toMatch(/On my way/);
    const log = useCrewStore.getState().activityLog;
    expect(log[0].kind).toBe('reply');
    expect(log[0].friendId).toBe(101);
  });

  it('quickReply NOT addressed to me is ignored (no banner, no activity)', () => {
    useCrewStore.getState().setProfile({ id: 555, name: 'You', color: '#fff' });
    useCrewStore.getState().applyPacket({
      ...posPacket(101, 3000), type: 'quickReply', targetId: 999, quickReplyCode: 1,
    });
    expect(useCrewStore.getState().banner).toBeNull();
    expect(useCrewStore.getState().activityLog.length).toBe(0);
  });

  it('createCrew sets a crew, returns a code, and hashes to a nonzero tag', () => {
    const code = useCrewStore.getState().createCrew();
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
    const crew = useCrewStore.getState().crew;
    expect(crew?.code).toBe(code);
    expect(crew?.tag).toBeGreaterThan(0);
  });

  it('joinCrew normalizes the code and produces the same tag for the same code', () => {
    useCrewStore.getState().joinCrew('  fire-42 ');
    const a = useCrewStore.getState().crew;
    expect(a?.code).toBe('FIRE-42'); // trimmed + uppercased
    useCrewStore.getState().joinCrew('FIRE-42');
    const b = useCrewStore.getState().crew;
    expect(b?.tag).toBe(a?.tag); // deterministic hash
    expect(b?.tag).toBeGreaterThan(0);
  });

  it('with a crew set, drops position packets whose targetId != crew.tag', () => {
    useCrewStore.getState().setAutoAddPeers(true); // crew filter is active only on real BLE
    useCrewStore.getState().joinCrew('FIRE-42');
    const tag = useCrewStore.getState().crew!.tag;
    // 101 is a pre-registered friend, but the packet is tagged for another crew.
    useCrewStore.getState().applyPacket({ ...posPacket(101, 1000), targetId: tag + 1 });
    expect(useCrewStore.getState().friends[101].lastPacket).toBeUndefined();
  });

  it('with a crew set, accepts + auto-registers a sender whose targetId == crew.tag', () => {
    useCrewStore.getState().setAutoAddPeers(true); // crew filter is active only on real BLE
    useCrewStore.getState().joinCrew('FIRE-42');
    const tag = useCrewStore.getState().crew!.tag;
    useCrewStore.getState().applyPacket({ ...posPacket(777, 1000), targetId: tag }, 'relayX');
    const f = useCrewStore.getState().friends[777];
    expect(f).toBeDefined();
    expect(f.name).toMatch(/Friend/);
    expect(f.lastPacket?.timestampSec).toBe(1000);
    expect(f.relayVia).toBe('relayX');
  });

  it('leaveCrew clears the crew', () => {
    useCrewStore.getState().createCrew();
    expect(useCrewStore.getState().crew).not.toBeNull();
    useCrewStore.getState().leaveCrew();
    expect(useCrewStore.getState().crew).toBeNull();
  });

  it('updateProfile merges a partial patch into the existing profile', () => {
    useCrewStore.getState().setProfile({ id: 7, name: 'Ada', color: '#fff' });
    useCrewStore.getState().updateProfile({ name: 'Ada Lovelace' });
    expect(useCrewStore.getState().profile).toMatchObject({ id: 7, name: 'Ada Lovelace', color: '#fff' });
    useCrewStore.getState().updateProfile({ avatarUri: 'file://pic.jpg', color: '#ff4d7d' });
    expect(useCrewStore.getState().profile).toMatchObject({
      id: 7, name: 'Ada Lovelace', color: '#ff4d7d', avatarUri: 'file://pic.jpg',
    });
  });

  it('updateProfile is a no-op when there is no profile yet', () => {
    expect(useCrewStore.getState().profile).toBeNull();
    useCrewStore.getState().updateProfile({ name: 'Ghost' });
    expect(useCrewStore.getState().profile).toBeNull();
  });

  it('units default to metres and can be changed; notifications default on', () => {
    expect(useCrewStore.getState().units).toBe('m');
    expect(useCrewStore.getState().notificationsEnabled).toBe(true);
    useCrewStore.getState().setUnits('ft');
    expect(useCrewStore.getState().units).toBe('ft');
    useCrewStore.getState().setNotificationsEnabled(false);
    expect(useCrewStore.getState().notificationsEnabled).toBe(false);
  });

  it('markCelebrated then clearCelebrated removes the flag (allows re-celebration)', () => {
    const s = useCrewStore.getState();
    s.markCelebrated(101);
    expect(useCrewStore.getState().celebrated[101]).toBe(true);
    s.clearCelebrated(101);
    expect(useCrewStore.getState().celebrated[101]).toBeUndefined();
    expect(101 in useCrewStore.getState().celebrated).toBe(false);
  });

  // Fix 1: a directed ping addressed to someone else must not surface on my device.
  it('drops a directed ping addressed to a DIFFERENT id (not me)', () => {
    useCrewStore.getState().setProfile({ id: 555, name: 'You', color: '#fff' });
    useCrewStore.getState().applyPacket({ ...posPacket(101, 1000), type: 'pingWhere', targetId: 999 });
    expect(useCrewStore.getState().banner).toBeNull();
    expect(useCrewStore.getState().activityLog.length).toBe(0);
  });

  it('accepts a directed ping addressed to me (targetId === my id)', () => {
    useCrewStore.getState().setProfile({ id: 555, name: 'You', color: '#fff' });
    useCrewStore.getState().applyPacket({ ...posPacket(101, 1000), type: 'pingComeFind', targetId: 555 });
    expect(useCrewStore.getState().banner?.kind).toBe('ping');
    expect(useCrewStore.getState().banner?.text).toMatch(/Maya/);
    expect(useCrewStore.getState().activityLog[0].kind).toBe('ping');
  });

  it('accepts the sim broadcast ping (targetId 0) regardless of my id', () => {
    useCrewStore.getState().setProfile({ id: 555, name: 'You', color: '#fff' });
    useCrewStore.getState().applyPacket({ ...posPacket(101, 1000), type: 'pingWhere', targetId: 0 });
    expect(useCrewStore.getState().banner?.kind).toBe('ping');
  });

  // Fix 2b: a rally must not leak across crews on a shared real (BLE) mesh.
  it('with a crew set + autoAddPeers, drops a rally whose targetId != crew.tag', () => {
    useCrewStore.getState().setAutoAddPeers(true);
    useCrewStore.getState().joinCrew('FIRE-42');
    const tag = useCrewStore.getState().crew!.tag;
    useCrewStore.getState().applyPacket({ ...posPacket(303, 2000), type: 'rally', targetId: tag + 1 });
    expect(useCrewStore.getState().rallyPin).toBeNull();
    expect(useCrewStore.getState().friends[303]).toBeUndefined(); // no phantom friend added
  });

  it('with a crew set + autoAddPeers, accepts a rally whose targetId == crew.tag', () => {
    useCrewStore.getState().setAutoAddPeers(true);
    useCrewStore.getState().joinCrew('FIRE-42');
    const tag = useCrewStore.getState().crew!.tag;
    useCrewStore.getState().applyPacket({ ...posPacket(303, 2000), type: 'rally', targetId: tag });
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(303);
  });

  it('in sim (autoAddPeers false) a rally is unaffected by crew tagging', () => {
    useCrewStore.getState().joinCrew('FIRE-42');
    const tag = useCrewStore.getState().crew!.tag;
    // Sim broadcast rally (targetId 0) still lands even though a crew is set.
    useCrewStore.getState().applyPacket({ ...posPacket(101, 2000), type: 'rally', targetId: tag + 99 });
    expect(useCrewStore.getState().rallyPin?.droppedById).toBe(101);
  });

  // Fix 3 + 6: banner predicates that the home screen uses to gate notify/buzz + auto-dismiss.
  describe('banner predicates', () => {
    it('shouldNotifyBanner: message (kind:info) does NOT notify/buzz; ping & reply do', () => {
      expect(shouldNotifyBanner({ text: 'Maya: hi', friendId: 101, kind: 'info' })).toBe(false);
      expect(shouldNotifyBanner({ text: 'Maya: come find me', friendId: 101, kind: 'ping' })).toBe(true);
      expect(shouldNotifyBanner({ text: 'Maya: on my way', friendId: 101, kind: 'reply' })).toBe(true);
    });
    it('shouldNotifyBanner: rally / "Sent" banners (no friendId) do not', () => {
      expect(shouldNotifyBanner({ text: 'x dropped a pin', kind: 'rally' })).toBe(false);
      expect(shouldNotifyBanner({ text: 'Sent "On my way"', kind: 'info' })).toBe(false);
    });
    it('shouldAutoDismissBanner: ping stays; info/reply/rally auto-dismiss', () => {
      expect(shouldAutoDismissBanner({ text: '', friendId: 1, kind: 'ping' })).toBe(false);
      expect(shouldAutoDismissBanner({ text: '', friendId: 1, kind: 'reply' })).toBe(true);
      expect(shouldAutoDismissBanner({ text: '', friendId: 1, kind: 'info' })).toBe(true);
      expect(shouldAutoDismissBanner({ text: '', kind: 'rally' })).toBe(true);
    });
  });

  // Fix 4: a malformed deep link must never crash the join flow.
  describe('parseCrewDeepLink', () => {
    it('parses a normal crew link', () => {
      expect(parseCrewDeepLink('loc8://crew/FIRE-42')).toBe('FIRE-42');
    });
    it('does not throw on malformed percent-encoding, returns the raw segment', () => {
      expect(() => parseCrewDeepLink('loc8://crew/50%off')).not.toThrow();
      expect(parseCrewDeepLink('loc8://crew/50%off')).toBe('50%off');
    });
    it('decodes valid percent-encoding', () => {
      expect(parseCrewDeepLink('loc8://crew/FIRE%2D42')).toBe('FIRE-42');
    });
    it('returns null for a non-crew or empty url', () => {
      expect(parseCrewDeepLink('loc8://other/x')).toBeNull();
      expect(parseCrewDeepLink(null)).toBeNull();
      expect(parseCrewDeepLink(undefined)).toBeNull();
    });
  });
});
