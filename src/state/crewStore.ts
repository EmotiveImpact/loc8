import { create } from 'zustand';
import type { Coordinate, Packet } from '../core/types';

export type PrivacyMode = 'live' | 'open' | 'invisible';

export interface Profile { id: number; name: string; color: string; }
export interface FriendState {
  id: number; name: string; color: string;
  lastPacket?: Packet; relayVia?: string;
}
export interface RallyPin { latitude: number; longitude: number; droppedById: number; atSec: number; }

export const STALE_SEC = 90;    // desaturate blips older than this
export const GHOST_SEC = 240;   // "went dark" ghost state

/** Seconds since friend's last packet, or null if never seen. */
export function freshnessSec(f: FriendState, nowSec: number): number | null {
  return f.lastPacket ? nowSec - f.lastPacket.timestampSec : null;
}

interface CrewState {
  profile: Profile | null;
  privacyMode: PrivacyMode;
  sessionEndsAtSec: number | null;
  friends: Record<number, FriendState>;
  rallyPin: RallyPin | null;
  myLocation: Coordinate | null;
  meshNearby: number;
  beaconMode: boolean;
  banner: { text: string; friendId?: number } | null;
  celebrated: Record<number, boolean>;

  setProfile(p: Profile): void;
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
  reset(): void;
}

const initial = {
  profile: null, privacyMode: 'live' as PrivacyMode, sessionEndsAtSec: null,
  friends: {}, rallyPin: null, myLocation: null, meshNearby: 0,
  beaconMode: false, banner: null, celebrated: {},
};

export const useCrewStore = create<CrewState>((set, get) => ({
  ...initial,

  setProfile: (profile) => set({ profile }),

  registerFriends: (list) =>
    set({
      friends: Object.fromEntries(list.map((f) => [f.id, { ...f }])),
    }),

  applyPacket: (p, relayVia) => {
    if (p.type === 'position') {
      const f = get().friends[p.senderId];
      if (!f) return; // unknown sender — not our crew, drop
      set({ friends: { ...get().friends, [p.senderId]: { ...f, lastPacket: p, relayVia } } });
    } else if (p.type === 'rally') {
      const current = get().rallyPin;
      if (!current || p.timestampSec > current.atSec) {
        set({
          rallyPin: {
            latitude: p.latitude, longitude: p.longitude,
            droppedById: p.senderId, atSec: p.timestampSec,
          },
          banner: { text: `🚩 ${get().friends[p.senderId]?.name ?? 'Someone'} dropped a rally pin` },
        });
      }
    } else if (p.type === 'pingWhere' || p.type === 'pingComeFind') {
      const name = get().friends[p.senderId]?.name ?? 'Someone';
      set({
        banner: {
          text: p.type === 'pingWhere' ? `📍 ${name} asked: where are you?` : `📣 ${name}: come find me!`,
          friendId: p.senderId,
        },
      });
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
  markCelebrated: (friendId) =>
    set({ celebrated: { ...get().celebrated, [friendId]: true } }),
  clearCelebrated: (friendId) =>
    set(() => {
      const { [friendId]: _removed, ...rest } = get().celebrated;
      return { celebrated: rest };
    }),
  dropLocalPin: (rallyPin) => set({ rallyPin }),

  reset: () => set({ ...initial, friends: {} }),
}));
