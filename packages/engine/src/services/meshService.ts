// src/services/meshService.ts
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { useCrewStore } from '../state/crewStore';
import { TrustLayer } from '../core/trustLayer';
import { fragmentText, fragmentProfile, TextReassembler } from '../core/textFragments';
import { haptics } from './haptics';
import type { LocationTransport } from '../transport/LocationTransport';
import type { Packet, PacketType } from '../core/types';

export const BROADCAST_INTERVAL_SEC = 5;
export const BEACON_INTERVAL_SEC = 60;   // low-battery beacon mode (spec §5)
// How often to re-announce our display name while broadcasting, so a peer who
// joins later still learns the name (position packets have no room for it).
export const PROFILE_ANNOUNCE_INTERVAL_SEC = 15;

export interface MeshService {
  start(): void;
  stop(): void;
  /** One broadcast heartbeat. Called on an interval in the app; directly in tests. */
  broadcastTick(): void;
  pingFriend(friendId: number, kind: Extract<PacketType, 'pingWhere' | 'pingComeFind'>): void;
  /** Fire a canned quick reply back to `targetId` (closes the ping loop). */
  sendQuickReply(targetId: number, code: number): void;
  /** Fragment `text` across mesh packets and broadcast it to the crew. */
  sendCrewMessage(text: string): void;
  dropRally(): void;
}

export function createMeshService(
  transport: LocationTransport,
  trust: TrustLayer,
  nowSec: () => number = () => Math.floor(Date.now() / 1000),
): MeshService {
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastBroadcastSec = 0;
  let lastProfileAnnounceSec = 0;
  let wasActive = false;
  let foreground = true;
  let appStateSub: NativeEventSubscription | null = null;
  // Reassembles inbound 'text' fragments; one per service instance.
  const reassembler = new TextReassembler();
  // Separate reassembler for inbound 'profile' (name) fragments — kept apart so
  // its (senderId,msgId) keyspace never collides with chat text.
  const profileReassembler = new TextReassembler();
  // Rolling uint16 message ids for outgoing messages / profile announces.
  let msgIdCounter = 0;
  let profileMsgIdCounter = 0;
  const store = () => useCrewStore.getState();

  // Bounded FIFO of recently-COMPLETED `${type}:${senderId}:${msgId}` keys.
  // text/profile bypass the TrustLayer (they're routed to the reassembler first,
  // since fragments share a timestamp), so a re-delivered full fragment set would
  // reassemble a second time and double-push to Activity. This is their replay
  // guard: a completed message is surfaced exactly once.
  const recentCompleted = new Set<string>();
  const recentOrder: string[] = [];
  const RECENT_CAP = 64;
  const firstCompletion = (key: string): boolean => {
    if (recentCompleted.has(key)) return false; // already surfaced — drop the replay
    recentCompleted.add(key);
    recentOrder.push(key);
    if (recentOrder.length > RECENT_CAP) {
      const evicted = recentOrder.shift()!;
      recentCompleted.delete(evicted);
    }
    return true;
  };

  const myPacket = (type: PacketType, targetId = 0): Packet | null => {
    const s = store();
    if (!s.profile || !s.myLocation) return null;
    return {
      type, senderId: s.profile.id, targetId,
      latitude: s.myLocation.latitude, longitude: s.myLocation.longitude,
      headingDeg: 0, batteryPct: 100, timestampSec: nowSec(), accuracyM: 10,
    };
  };

  // Broadcast our display name as 'profile' fragments so peers can replace the
  // `Friend NNN` placeholder auto-registered from a nameless position packet.
  const announceProfile = () => {
    const s = store();
    if (!s.profile) return;
    const name = s.profile.name.trim();
    if (!name) return;
    const targetId = s.crew?.tag ?? 0; // crew-scoped, like position
    const msgId = (profileMsgIdCounter = (profileMsgIdCounter + 1) & 0xffff);
    const frags = fragmentProfile({
      senderId: s.profile.id, targetId, msgId, text: name, timestampSec: nowSec(),
    });
    for (const f of frags) transport.broadcast(f);
  };

  const service: MeshService = {
    start() {
      if (timer) return;   // idempotent — don't re-register callbacks or start a 2nd interval
      transport.onPacket((p, relayVia) => {
        if (p.type === 'text') {
          // Text is fragmented: route to the reassembler FIRST (fragments share
          // a timestamp, so the per-type trust gate would drop all but the
          // first). Surface to the store only when a full message completes.
          const s = store();
          if (s.profile && p.senderId === s.profile.id) return; // self-echo
          const crew = s.crew;
          // Real-crew mode (BLE): only accept fragments tagged for our crew.
          if (crew && s.autoAddPeers && p.targetId !== crew.tag) return;
          const done = reassembler.add(p);
          if (done && firstCompletion(`text:${p.senderId}:${p.msgId}`)) {
            s.receiveMessage(done.senderId, done.text);
            haptics.pingReceived();
          }
          return;
        }
        if (p.type === 'profile') {
          // Profile (display name) is fragmented like text: route to its own
          // reassembler BEFORE the trust gate (fragments share a timestamp).
          // It's metadata — never surfaced to the chat/Activity feed.
          const s = store();
          if (s.profile && p.senderId === s.profile.id) return; // self-echo
          const crew = s.crew;
          // Real-crew mode (BLE): only accept fragments tagged for our crew.
          if (crew && s.autoAddPeers && p.targetId !== crew.tag) return;
          const done = profileReassembler.add(p);
          if (done && firstCompletion(`profile:${p.senderId}:${p.msgId}`)) s.setFriendName(done.senderId, done.text);
          return;
        }
        if (trust.accept(p)) store().applyPacket(p, relayVia);
      });
      transport.onMeshStatus((st) => store().setMeshNearby(st.nearbyCount));
      foreground = AppState.currentState !== 'background';
      appStateSub = AppState.addEventListener('change', (next: AppStateStatus) => {
        // Treat 'inactive' (iOS control center / call banner / Face ID) as STILL
        // foreground, matching the init above. Only 'background' truly backgrounds
        // us — otherwise a transient 'inactive' would wrongly halt open-mode
        // broadcasting and make us disappear from the crew.
        const nowForeground = next !== 'background';
        const cameToForeground = nowForeground && !foreground;
        foreground = nowForeground;
        // Returning to the foreground retries a native transport start that
        // failed earlier (background FGS restriction, permissions granted after
        // boot). transport.start() is idempotent, so this is a no-op when the
        // mesh is already up.
        if (cameToForeground) transport.start();
      });
      transport.start();
      timer = setInterval(() => service.broadcastTick(), 1000);
    },

    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      appStateSub?.remove();
      appStateSub = null;
      transport.clearListeners();
      transport.stop();
    },

    broadcastTick() {
      const s = store();
      const now = nowSec();

      // session expiry (spec §4: auto-expire + notify)
      if (s.sessionEndsAtSec !== null && now >= s.sessionEndsAtSec) {
        s.endSession();
        s.setBanner({ text: 'Session ended — you stopped broadcasting' });
        s.pushActivity({ kind: 'session', text: 'Session ended — you stopped broadcasting', atSec: now });
        wasActive = false;
        return;
      }
      const active = s.isSessionActive(now);
      // inactive → active transition: broadcast (and re-announce our name)
      // immediately, don't wait out a stale interval
      if (active && !wasActive) { lastBroadcastSec = 0; lastProfileAnnounceSec = 0; }
      wasActive = active;
      if (!active) return;
      if (s.privacyMode === 'invisible') return;
      // 'open' mode: findable only while the app is foregrounded
      if (s.privacyMode === 'open' && !foreground) return;

      const interval = s.beaconMode ? BEACON_INTERVAL_SEC : BROADCAST_INTERVAL_SEC;
      if (now - lastBroadcastSec < interval) return;
      // Position packets carry the crew tag (0 = no crew); receivers filter on it.
      const p = myPacket('position', s.crew?.tag ?? 0);
      if (!p) return;
      lastBroadcastSec = now;
      transport.broadcast(p);
      // Piggyback a profile (name) announce on the position cadence, but at a
      // slower interval, so late-joining peers learn our name without flooding.
      // Gated exactly like position: only while the user is broadcasting.
      if (lastProfileAnnounceSec === 0 || now - lastProfileAnnounceSec >= PROFILE_ANNOUNCE_INTERVAL_SEC) {
        announceProfile();
        lastProfileAnnounceSec = now;
      }
    },

    pingFriend(friendId, kind) {
      const p = myPacket(kind, friendId);
      if (p) transport.broadcast(p);
    },

    sendQuickReply(targetId, code) {
      const p = myPacket('quickReply', targetId);
      if (!p) return;
      transport.broadcast({ ...p, quickReplyCode: code });
    },

    sendCrewMessage(text) {
      const s = store();
      if (!s.profile) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      // Crew-scoped like position packets (0 = no crew / broadcast to all).
      const targetId = s.crew?.tag ?? 0;
      const msgId = (msgIdCounter = (msgIdCounter + 1) & 0xffff);
      const frags = fragmentText({
        senderId: s.profile.id, targetId, msgId, text: trimmed, timestampSec: nowSec(),
      });
      for (const f of frags) transport.broadcast(f);
      // Echo my own message into the timeline immediately.
      s.addLocalMessage(trimmed);
    },

    dropRally() {
      const s = store();
      // Crew-scoped like position/text/profile (0 = no crew) so a rally pin doesn't
      // leak to other crews sharing the mesh; receivers filter on the tag.
      const p = myPacket('rally', s.crew?.tag ?? 0);
      if (!p) return;
      transport.broadcast(p);
      s.dropLocalPin({
        latitude: p.latitude, longitude: p.longitude,
        droppedById: p.senderId, atSec: p.timestampSec,
      });
    },
  };

  return service;
}
