import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coordinate, Packet } from '../core/types';
import { quickReplyLabel } from '../core/types';
import type { PacketReceiptContext } from '../transport/LocationTransport';
import { makePositionReceipt, newerPosition, validPosition, type PositionReceipt } from '../core/positionFreshness';
import { captureSourceLocation, shouldReplaceSourceLocation, type SourceLocationInput, type SourceLocationSample } from '../core/sourceLocation';
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

/**
 * Parse a `loc8://crew/<CODE>` deep link into a crew code, or null if the URL
 * isn't a crew link. Tolerates malformed percent-encoding (e.g. "50%off", which
 * makes decodeURIComponent throw a URIError) by falling back to the raw path
 * segment — a bad deep link must never crash the join flow.
 */
export function parseCrewDeepLink(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/loc8:\/\/crew\/(.+)/i);
  if (!m) return null;
  let code: string;
  try {
    code = decodeURIComponent(m[1]).trim();
  } catch {
    code = m[1].trim(); // malformed %-escape — use the raw segment rather than throw
  }
  return code || null;
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
  /** First receipt of the retained position, never refreshed by chatter/reconnect. */
  positionReceipt?: PositionReceipt;
  /** Display gates supplied by the owning permission workflow, not radio claims. */
  positionVisible?: boolean;
  positionVisibleUntilSec?: number;
}
export interface RallyPin { latitude: number; longitude: number; droppedById: number; atSec: number; floor?: number; }

/** Top banner. `kind` lets the UI decide what to render (e.g. reply chips for an incoming ping). */
export type BannerKind = 'ping' | 'reply' | 'rally' | 'info';
export interface Banner { text: string; friendId?: number; kind?: BannerKind; }

/**
 * Whether a banner should fire the incoming-social notification + double-buzz.
 * Only directed SOCIAL events do (an incoming ping/reply). A message banner is
 * kind:'info' and was ALREADY buzzed by the mesh service when it reassembled —
 * notifying again here double-buzzes it and deep-links it like a ping. Rally and
 * "Sent …" banners carry no friendId, so they're excluded too.
 */
export function shouldNotifyBanner(b: Banner): boolean {
  return b.friendId != null && b.kind !== 'info';
}

/**
 * Whether a banner should auto-dismiss after the standard timeout. An interactive
 * ping banner (kind:'ping') renders reply chips and must stay until the user taps
 * a chip / dismisses it (or a newer banner replaces it); everything else fades.
 */
export function shouldAutoDismissBanner(b: Banner): boolean {
  return b.kind !== 'ping';
}

export type ActivityKind = 'ping' | 'reply' | 'rally' | 'found' | 'dark' | 'session' | 'message';
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

/** Legacy reported age only. Prefer friendPositionFreshness for any current/live claim. */
export function freshnessSec(f: FriendState, nowSec: number): number | null {
  const age = f.lastPacket ? nowSec - f.lastPacket.timestampSec : NaN;
  return Number.isFinite(age) && age >= 0 ? age : null;
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
  /** Original device sample; never refreshed by publishing a heartbeat. */
  myLocationSample: SourceLocationSample | null;
  /** My current floor/level (0 = ground). Driven by floorService via the FloorTracker. */
  myFloor: number;
  /**
   * How much to trust myFloor: 'anchored' = the user asserted it, 'estimated' =
   * the barometer has tracked movement since, 'unknown' = never anchored.
   */
  floorConfidence: 'unknown' | 'anchored' | 'estimated';
  /** ≥2 floors travelled since the last anchor — the UI should ask to confirm. */
  floorConfirmNeeded: boolean;
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
  applyPacket(p: Packet, relayVia?: string, receiptContext?: PacketReceiptContext): void;
  /** Apply a display name learned from a peer's 'profile' announce over the mesh. */
  setFriendName(senderId: number, name: string): void;
  /** Surface a fully-reassembled crew message from another member. */
  receiveMessage(senderId: number, text: string): void;
  /** Echo the local user's own outgoing message into the timeline. */
  addLocalMessage(text: string): void;
  startSession(hours: number, nowSec?: number): void;
  extendSession(hours: number): void;
  endSession(): void;
  isSessionActive(nowSec: number): boolean;
  setPrivacy(m: PrivacyMode): void;
  /** Legacy/demo caller with no source evidence; clears any previous provenance. */
  setMyLocation(c: Coordinate): void;
  setMyLocationSample(sample: SourceLocationInput): boolean;
  setDemoLocation(c: Coordinate): void;
  clearMyLocation(): void;
  /** Written by floorService whenever the FloorTracker's state changes. */
  setFloorState(floor: number, confidence: 'unknown' | 'anchored' | 'estimated', confirmNeeded: boolean): void;
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
  friends: {}, rallyPin: null, myLocation: null, myLocationSample: null,
  myFloor: 0, floorConfidence: 'unknown' as const, floorConfirmNeeded: false,
  meshNearby: 0,
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

  applyPacket: (p, relayVia, receiptContext) => {
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
      if (!Number.isInteger(p.senderId) || p.senderId < 0 || p.senderId > 0xffffffff ||
          !validPosition(p) || !newerPosition(p.timestampSec, get().friends[p.senderId]?.lastPacket?.timestampSec)) return;
      const isSimulation = receiptContext?.source === 'simulation';
      const positionReceipt = makePositionReceipt(p, p.timestampSec,
        isSimulation ? receiptContext.receivedAtSec : Math.floor(Date.now() / 1000),
        isSimulation ? 'simulation' : 'unverified');
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
        set({ friends: { ...get().friends, [p.senderId]: { ...f, lastPacket: { ...p }, relayVia, positionReceipt } } });
        return;
      }
      // No crew set: keep existing sim/BLE behavior (known-sender / autoAddPeers).
      const f = ensureFriend(p.senderId) ?? get().friends[p.senderId];
      if (!f) return; // unknown sender (sim mode) — not our crew, drop
      set({ friends: { ...get().friends, [p.senderId]: { ...f, lastPacket: { ...p }, relayVia, positionReceipt } } });
    } else if (p.type === 'rally') {
      const crew = get().crew;
      // Real-crew mode (BLE): only accept rally pins tagged for our crew, mirroring
      // the position branch — otherwise a rally leaks across crews on the shared mesh.
      // Gated on autoAddPeers so the sim design loop is unaffected.
      if (crew && get().autoAddPeers && p.targetId !== crew.tag) return;
      ensureFriend(p.senderId);
      const current = get().rallyPin;
      if (!current || p.timestampSec > current.atSec) {
        const name = get().friends[p.senderId]?.name ?? 'Someone';
        set({
          rallyPin: {
            latitude: p.latitude, longitude: p.longitude,
            droppedById: p.senderId, atSec: p.timestampSec, floor: p.floor ?? 0,
          },
          banner: { text: `${name} dropped a rally pin`, kind: 'rally' },
        });
        get().pushActivity({ kind: 'rally', text: `${name} dropped a rally pin`, atSec: p.timestampSec, friendId: p.senderId });
      }
    } else if (p.type === 'pingWhere' || p.type === 'pingComeFind') {
      // Pings are directed (by targetId), like replies. Drop a directed ping not
      // addressed to me; targetId:0 is the sim's broadcast and is still accepted.
      if (p.targetId !== 0 && p.targetId !== get().profile?.id) return;
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

  setFriendName: (senderId, name) => {
    // Ignore self (our own announce echoed back through the mesh).
    if (get().profile && senderId === get().profile!.id) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = get().friends[senderId];
    // Upgrade an existing (possibly placeholder) friend, or create one —
    // mirroring the auto-register colour logic so colour stays deterministic.
    const friend: FriendState = existing
      ? { ...existing, name: trimmed }
      : { id: senderId, name: trimmed, color: FRIEND_COLORS[senderId % FRIEND_COLORS.length] };
    if (existing && existing.name === trimmed) return; // no-op
    set({ friends: { ...get().friends, [senderId]: friend } });
  },

  receiveMessage: (senderId, text) => {
    // Ignore our own message (self-echo through the mesh).
    if (get().profile && senderId === get().profile!.id) return;
    // Resolve a name; auto-register unknown BLE senders like other packet paths.
    let friend = get().friends[senderId];
    if (!friend && get().autoAddPeers) {
      friend = {
        id: senderId,
        name: `Friend ${senderId % 1000}`,
        color: FRIEND_COLORS[senderId % FRIEND_COLORS.length],
      };
      set({ friends: { ...get().friends, [senderId]: friend } });
    }
    const name = friend?.name ?? 'Someone';
    const atSec = Math.floor(Date.now() / 1000);
    const display = `${name}: ${text}`;
    get().pushActivity({ kind: 'message', text: display, atSec, friendId: senderId });
    set({ banner: { text: display, friendId: senderId, kind: 'info' } });
  },

  addLocalMessage: (text) => {
    get().pushActivity({
      kind: 'message',
      text: `You: ${text}`,
      atSec: Math.floor(Date.now() / 1000),
    });
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
  setMyLocation: (myLocation) => {
    if (!validPosition(myLocation)) return;
    set({ myLocation: { ...myLocation }, myLocationSample: null });
  },
  setMyLocationSample: (input) => {
    const sample = captureSourceLocation(input);
    if (!sample || !shouldReplaceSourceLocation(get().myLocationSample, sample)) return false;
    set({ myLocation: { ...sample.coordinate }, myLocationSample: sample });
    return true;
  },
  setDemoLocation: (coordinate) => {
    const now = Date.now();
    const sample = captureSourceLocation({ coords: coordinate, timestamp: now }, now, undefined, 'demo');
    if (sample) set({ myLocation: { ...sample.coordinate }, myLocationSample: sample });
  },
  clearMyLocation: () => set({ myLocation: null, myLocationSample: null }),
  setFloorState: (myFloor, floorConfidence, floorConfirmNeeded) =>
    set({ myFloor, floorConfidence, floorConfirmNeeded }),
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
