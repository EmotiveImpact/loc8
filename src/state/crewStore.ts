import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coordinate, Packet } from '../core/types';
import { FRIEND_COLORS } from '../ui/theme';

const PROFILE_KEY = 'loc8.profile.v1';

export type PrivacyMode = 'live' | 'open' | 'invisible';

export interface Profile { id: number; name: string; color: string; }
export interface FriendState {
  id: number; name: string; color: string;
  lastPacket?: Packet; relayVia?: string;
}
export interface RallyPin { latitude: number; longitude: number; droppedById: number; atSec: number; }

export type ActivityKind = 'ping' | 'rally' | 'found' | 'dark' | 'session';
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
  hydrated: boolean;
  autoAddPeers: boolean;
  privacyMode: PrivacyMode;
  sessionEndsAtSec: number | null;
  friends: Record<number, FriendState>;
  rallyPin: RallyPin | null;
  myLocation: Coordinate | null;
  meshNearby: number;
  beaconMode: boolean;
  banner: { text: string; friendId?: number } | null;
  celebrated: Record<number, boolean>;
  activityLog: ActivityEvent[];

  setProfile(p: Profile): void;
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
  setBanner(b: { text: string; friendId?: number } | null): void;
  markCelebrated(friendId: number): void;
  clearCelebrated(friendId: number): void;
  dropLocalPin(pin: RallyPin): void;
  clearRally(): void;
  pushActivity(e: Omit<ActivityEvent, 'id'>): void;
  reset(): void;
}

const initial = {
  profile: null, hydrated: false, autoAddPeers: false,
  privacyMode: 'live' as PrivacyMode, sessionEndsAtSec: null,
  friends: {}, rallyPin: null, myLocation: null, meshNearby: 0,
  beaconMode: false, banner: null, celebrated: {},
  activityLog: [] as ActivityEvent[],
};

export const useCrewStore = create<CrewState>((set, get) => ({
  ...initial,

  setProfile: (profile) => {
    set({ profile });
    // Persist so the id stays stable and onboarding is skipped next launch.
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        const profile = JSON.parse(raw) as Profile;
        if (profile && typeof profile.id === 'number') set({ profile });
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
          banner: { text: `${name} dropped a rally pin` },
        });
        get().pushActivity({ kind: 'rally', text: `${name} dropped a rally pin`, atSec: p.timestampSec, friendId: p.senderId });
      }
    } else if (p.type === 'pingWhere' || p.type === 'pingComeFind') {
      ensureFriend(p.senderId);
      const name = get().friends[p.senderId]?.name ?? 'Someone';
      const text = p.type === 'pingWhere' ? `${name} asked: where are you?` : `${name}: come find me!`;
      set({ banner: { text, friendId: p.senderId } });
      get().pushActivity({ kind: 'ping', text, atSec: p.timestampSec, friendId: p.senderId });
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
