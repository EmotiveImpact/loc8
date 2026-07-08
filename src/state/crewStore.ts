import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coordinate, Packet } from '../core/types';
import { quickReplyLabel } from '../core/types';
import { FRIEND_COLORS } from '../ui/theme';

const PROFILE_KEY = 'loc8.profile.v1';

export type PrivacyMode = 'live' | 'open' | 'invisible';

export interface Profile { id: number; name: string; color: string; avatarUri?: string; }

export type Units = 'm' | 'ft';

export interface Crew { code: string; tag: number; }

/** Alphabet for generated codes — omits confusable chars (0/O, 1/I). */
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Deterministic uint32 FNV-1a hash of the uppercased code (never 0). */
export function hashCrewCode(code: string): number {
  const s = code.toUpperCase();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h = h >>> 0;
  return h === 0 ? 1 : h;
}

/** Normalize a user-entered/scanned code: trim + uppercase. */
export function normalizeCrewCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Friendly random code, e.g. "FIRE-42": 4 letters + 2 digits. */
function randomCrewCode(): string {
  let letters = '';
  for (let i = 0; i < 4; i++) {
    letters += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
  }
  const num = 10 + Math.floor(Math.random() * 90); // 10–99
  return `${letters}-${num}`;
}
export interface FriendState {
  id: number; name: string; color: string;
  lastPacket?: Packet; relayVia?: string;
}
export interface RallyPin { latitude: number; longitude: number; droppedById: number; atSec: number; }

/** Top banner. `kind` lets the UI decide what to render (e.g. reply chips for an incoming ping). */
export type BannerKind = 'ping' | 'reply' | 'rally' | 'info';
export interface Banner { text: string; friendId?: number; kind?: BannerKind; }

export type ActivityKind = 'ping' | 'reply' | 'rally' | 'found' | 'dark' | 'session';
export interface ActivityEvent {
  id: number;
  kind: ActivityKind;
  text: string;
  atSec: number;
  friendId?: number;
}

const ACTIVITY_CAP = 50;
let activitySeq = 1;

export const STALE_SEC = 90;    // desaturate blips older than this
export const GHOST_SEC = 240;   // "went dark" ghost state

/** Seconds since friend's last packet, or null if never seen. */
export function freshnessSec(f: FriendState, nowSec: number): number | null {
  return f.lastPacket ? nowSec - f.lastPacket.timestampSec : null;
}

interface CrewState {
  profile: Profile | null;
  crew: Crew | null;
  hydrated: boolean;
  autoAddPeers: boolean;
  privacyMode: PrivacyMode;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  units: Units;
  sessionEndsAtSec: number | null;
  friends: Record<number, FriendState>;
  rallyPin: RallyPin | null;
  myLocation: Coordinate | null;
  meshNearby: number;
  beaconMode: boolean;
  banner: Banner | null;
  celebrated: Record<number, boolean>;
  activityLog: ActivityEvent[];

  setProfile(p: Profile): void;
  updateProfile(patch: Partial<Profile>): void;
  setNotificationsEnabled(v: boolean): void;
  setHapticsEnabled(v: boolean): void;
  setUnits(u: Units): void;
  createCrew(): string;
  joinCrew(code: string): void;
  leaveCrew(): void;
  hydrate(): Promise<void>;
  setAutoAddPeers(v: boolean): void;
  registerFriends(list: Array<Pick<FriendState, 'id' | 'name' | 'color'>>): void;
  applyPacket(p: Packet, relayVia?: string): void;
  startSession(hours: number, nowSec?: number): void;
  extendSession(hours: number): void;
  endSession(): void;
  isSessionActive(nowSec: number): boolean;
  setPrivacy(m: PrivacyMode): void;
  setMyLocation(c: Coordinate): void;
  setMeshNearby(n: number): void;
  setBeacon(on: boolean): void;
  setBanner(b: Banner | null): void;
  markCelebrated(friendId: number): void;
  clearCelebrated(friendId: number): void;
  dropLocalPin(pin: RallyPin): void;
  clearRally(): void;
  pushActivity(e: Omit<ActivityEvent, 'id'>): void;
  reset(): void;
}

/** Persisted shape (v2): profile + crew + prefs stored together under PROFILE_KEY. */
interface Persisted {
  profile: Profile | null;
  crew: Crew | null;
  notificationsEnabled?: boolean;
  hapticsEnabled?: boolean;
  units?: Units;
}

/** Persist profile + crew + prefs so they survive relaunch. */
function persist(): void {
  const { profile, crew, notificationsEnabled, hapticsEnabled, units } = useCrewStore.getState();
  AsyncStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ profile, crew, notificationsEnabled, hapticsEnabled, units } as Persisted),
  ).catch(() => {});
}

const initial = {
  profile: null as Profile | null, crew: null as Crew | null,
  hydrated: false, autoAddPeers: false,
  privacyMode: 'live' as PrivacyMode, sessionEndsAtSec: null,
  notificationsEnabled: true, hapticsEnabled: true, units: 'm' as Units,
  friends: {}, rallyPin: null, myLocation: null, meshNearby: 0,
  beaconMode: false, banner: null, celebrated: {},
  activityLog: [] as ActivityEvent[],
};

export const useCrewStore = create<CrewState>((set, get) => ({
  ...initial,

  setProfile: (profile) => {
    set({ profile });
    persist();
  },

  updateProfile: (patch) => {
    const cur = get().profile;
    if (!cur) return;
    set({ profile: { ...cur, ...patch } });
    persist();
  },

  setNotificationsEnabled: (notificationsEnabled) => {
    set({ notificationsEnabled });
    persist();
  },

  setHapticsEnabled: (hapticsEnabled) => {
    set({ hapticsEnabled });
    persist();
  },

  setUnits: (units) => {
    set({ units });
    persist();
  },

  createCrew: () => {
    const code = randomCrewCode();
    set({ crew: { code, tag: hashCrewCode(code) } });
    persist();
    return code;
  },

  joinCrew: (code) => {
    const normalized = normalizeCrewCode(code);
    if (!normalized) return;
    set({ crew: { code: normalized, tag: hashCrewCode(normalized) } });
    persist();
  },

  leaveCrew: () => {
    set({ crew: null });
    persist();
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted | Profile;
        // v2 shape { profile, crew } — or legacy bare Profile (has `id`).
        if (parsed && 'profile' in parsed) {
          const { profile, crew, notificationsEnabled, hapticsEnabled, units } = parsed as Persisted;
          if (profile && typeof profile.id === 'number') set({ profile });
          if (crew && typeof crew.tag === 'number') set({ crew });
          if (typeof notificationsEnabled === 'boolean') set({ notificationsEnabled });
          if (typeof hapticsEnabled === 'boolean') set({ hapticsEnabled });
          if (units === 'm' || units === 'ft') set({ units });
        } else if (parsed && typeof (parsed as Profile).id === 'number') {
          set({ profile: parsed as Profile });
        }
      }
    } catch {
      // Corrupt/unavailable storage — fall through to onboarding.
    } finally {
      set({ hydrated: true });
    }
  },

  setAutoAddPeers: (autoAddPeers) => set({ autoAddPeers }),

  registerFriends: (list) =>
    set({
      friends: Object.fromEntries(list.map((f) => [f.id, { ...f }])),
    }),

  applyPacket: (p, relayVia) => {
    // Self-echo guard: never treat our own broadcast (relayed back through the
    // mesh) as a friend, in both sim and BLE modes.
    if (get().profile && p.senderId === get().profile!.id) return;

    // Auto-add real BLE peers: in BLE mode unknown senders are real crew, not noise.
    const ensureFriend = (senderId: number) => {
      if (get().friends[senderId] || !get().autoAddPeers) return get().friends[senderId];
      const friend: FriendState = {
        id: senderId,
        name: `Friend ${senderId % 1000}`,
        color: FRIEND_COLORS[senderId % FRIEND_COLORS.length],
      };
      set({ friends: { ...get().friends, [senderId]: friend } });
      return friend;
    };

    if (p.type === 'position') {
      const crew = get().crew;
      // Crew filtering is a real-transport privacy feature: accept only packets
      // tagged for our crew. It's gated on autoAddPeers (true only on real BLE)
      // so the sim design loop always shows the demo crew, regardless of any
      // crew you've created.
      if (crew && get().autoAddPeers) {
        // Real-crew mode: only accept position packets tagged for our crew.
        if (p.targetId !== crew.tag) return;
        const existing = get().friends[p.senderId];
        const f: FriendState = existing ?? {
          id: p.senderId,
          name: `Friend ${p.senderId % 1000}`,
          color: FRIEND_COLORS[p.senderId % FRIEND_COLORS.length],
        };
        set({ friends: { ...get().friends, [p.senderId]: { ...f, lastPacket: p, relayVia } } });
        return;
      }
      // No crew set: keep existing sim/BLE behavior (known-sender / autoAddPeers).
      const f = ensureFriend(p.senderId) ?? get().friends[p.senderId];
      if (!f) return; // unknown sender (sim mode) — not our crew, drop
      set({ friends: { ...get().friends, [p.senderId]: { ...f, lastPacket: p, relayVia } } });
    } else if (p.type === 'rally') {
      ensureFriend(p.senderId);
      const current = get().rallyPin;
      if (!current || p.timestampSec > current.atSec) {
        const name = get().friends[p.senderId]?.name ?? 'Someone';
        set({
          rallyPin: {
            latitude: p.latitude, longitude: p.longitude,
            droppedById: p.senderId, atSec: p.timestampSec,
          },
          banner: { text: `${name} dropped a rally pin`, kind: 'rally' },
        });
        get().pushActivity({ kind: 'rally', text: `${name} dropped a rally pin`, atSec: p.timestampSec, friendId: p.senderId });
      }
    } else if (p.type === 'pingWhere' || p.type === 'pingComeFind') {
      ensureFriend(p.senderId);
      const name = get().friends[p.senderId]?.name ?? 'Someone';
      const text = p.type === 'pingWhere' ? `${name} asked: where are you?` : `${name}: come find me!`;
      set({ banner: { text, friendId: p.senderId, kind: 'ping' } });
      get().pushActivity({ kind: 'ping', text, atSec: p.timestampSec, friendId: p.senderId });
    } else if (p.type === 'quickReply') {
      // Replies are directed (by targetId), like pings — NOT crew-tag-filtered.
      // Only surface a reply addressed to me.
      if (p.targetId !== get().profile?.id) return;
      ensureFriend(p.senderId);
      const name = get().friends[p.senderId]?.name ?? 'Someone';
      const text = `${name}: ${quickReplyLabel(p.quickReplyCode ?? 0)}`;
      set({ banner: { text, friendId: p.senderId, kind: 'reply' } });
      get().pushActivity({ kind: 'reply', text, atSec: p.timestampSec, friendId: p.senderId });
    }
  },

  startSession: (hours, nowSec = Math.floor(Date.now() / 1000)) =>
    set({ sessionEndsAtSec: nowSec + hours * 3600 }),
  extendSession: (hours) => {
    const cur = get().sessionEndsAtSec;
    if (cur) set({ sessionEndsAtSec: cur + hours * 3600 });
  },
  endSession: () => set({ sessionEndsAtSec: null }),
  isSessionActive: (nowSec) => {
    const ends = get().sessionEndsAtSec;
    return ends !== null && nowSec < ends;
  },

  setPrivacy: (privacyMode) => set({ privacyMode }),
  setMyLocation: (myLocation) => set({ myLocation }),
  setMeshNearby: (meshNearby) => set({ meshNearby }),
  setBeacon: (beaconMode) => set({ beaconMode }),
  setBanner: (banner) => set({ banner }),
  markCelebrated: (friendId) => {
    if (!get().celebrated[friendId]) {
      const name = get().friends[friendId]?.name ?? 'Someone';
      get().pushActivity({
        kind: 'found', text: `You found ${name}!`,
        atSec: Math.floor(Date.now() / 1000), friendId,
      });
    }
    set({ celebrated: { ...get().celebrated, [friendId]: true } });
  },
  clearCelebrated: (friendId) =>
    set(() => {
      const { [friendId]: _removed, ...rest } = get().celebrated;
      return { celebrated: rest };
    }),
  dropLocalPin: (rallyPin) => set({ rallyPin }),
  clearRally: () => set({ rallyPin: null }),
  pushActivity: (e) =>
    set({ activityLog: [{ ...e, id: activitySeq++ }, ...get().activityLog].slice(0, ACTIVITY_CAP) }),

  reset: () => set({ ...initial, friends: {}, activityLog: [] }),
}));
