import type { Coordinate, Packet } from '../core/types';
import { movePoint, getAbsoluteBearing, getHaversineDistance } from '../core/geoMath';
import { mulberry32 } from './seededRandom';
import type { LocationTransport, MeshStatus } from './LocationTransport';

export interface SimFriendSpec {
  id: number; name: string; color: string;
  startBearingDeg: number; startDistanceM: number;
  relayVia?: string;   // delivered as if hopped via this crew member
  lagTicks?: number;   // buffer packets N ticks before delivery (simulates relay lag)
}

export type SimScenario = 'goDark' | 'return' | 'approach' | 'lowBattery';

interface SimFriend extends SimFriendSpec {
  pos: Coordinate; headingDeg: number; batteryPct: number;
  mode: 'walk' | 'dark' | 'approach';
  buffer: Array<{ packet: Packet; relayVia?: string }>;
  pendingPingReply: boolean;
}

interface Options {
  seed: number;
  origin: Coordinate;                 // "me" — friends spawn & orbit around this
  friends: SimFriendSpec[];
  tickMs?: number;
  nowSec?: () => number;
}

const WALK_SPEED_MPS = 1.3;
const TICK_SEC = 2;

export class SimulatedTransport implements LocationTransport {
  private rng: () => number;
  private friends: SimFriend[];
  private packetCbs: Array<(p: Packet, relayVia?: string) => void> = [];
  private statusCbs: Array<(s: MeshStatus) => void> = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private origin: Coordinate;
  private tickMs: number;
  private nowSec: () => number;
  private anchored = false;

  constructor(opts: Options) {
    this.rng = mulberry32(opts.seed);
    this.origin = opts.origin;
    this.tickMs = opts.tickMs ?? 2000;
    this.nowSec = opts.nowSec ?? (() => Math.floor(Date.now() / 1000));
    this.friends = opts.friends.map((f) => ({
      ...f,
      pos: movePoint(opts.origin, f.startBearingDeg, f.startDistanceM),
      headingDeg: Math.floor(this.rng() * 360),
      batteryPct: 60 + Math.floor(this.rng() * 35),
      mode: 'walk',
      buffer: [],
      pendingPingReply: false,
    }));
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  onPacket(cb: (p: Packet, relayVia?: string) => void): void { this.packetCbs.push(cb); }
  onMeshStatus(cb: (s: MeshStatus) => void): void { this.statusCbs.push(cb); }
  clearListeners(): void { this.packetCbs = []; this.statusCbs = []; }

  /** My outgoing packets. Sim friends react to pings addressed to them. */
  broadcast(packet: Packet): void {
    if (packet.type === 'pingWhere' || packet.type === 'pingComeFind') {
      const f = this.friends.find((x) => x.id === packet.targetId);
      if (f) {
        f.pendingPingReply = true;                         // answers next tick, even if dark (spec §5)
        if (packet.type === 'pingComeFind') f.mode = 'approach';
      }
    }
    // position/rally broadcasts vanish into the simulated ether (no echo needed)
  }

  /**
   * Update my position. The FIRST real origin (GPS, or fallback if denied) re-seats the
   * simulated friends around it, so the demo always shows them near you — otherwise they'd
   * stay anchored to the placeholder origin the transport was built with (e.g. 7km away).
   * Later origin updates just re-target 'approach' friends; they don't teleport everyone.
   */
  setOrigin(origin: Coordinate): void {
    this.origin = origin;
    if (!this.anchored) {
      this.anchored = true;
      for (const f of this.friends) {
        f.pos = movePoint(origin, f.startBearingDeg, f.startDistanceM);
      }
    }
  }

  scenario(action: SimScenario, friendId: number): void {
    const f = this.friends.find((x) => x.id === friendId);
    if (!f) return;
    if (action === 'goDark') f.mode = 'dark';
    if (action === 'return') f.mode = 'walk';
    if (action === 'approach') f.mode = 'approach';
    if (action === 'lowBattery') f.batteryPct = 9;
  }

  /**
   * Simulate an INCOMING ping from a friend to the local user (targetId 0).
   * Emits through the normal packet pathway so it flows meshService.onPacket →
   * trust.accept → crewStore.applyPacket's ping branch, which sets the tappable
   * banner + notifyPing. No-op if the friend id is unknown.
   */
  simulateIncomingPing(friendId: number, kind: 'pingWhere' | 'pingComeFind'): void {
    const f = this.friends.find((x) => x.id === friendId);
    if (!f) return;
    const packet: Packet = {
      type: kind, senderId: f.id, targetId: 0,
      latitude: f.pos.latitude, longitude: f.pos.longitude,
      headingDeg: Math.round(f.headingDeg), batteryPct: Math.round(f.batteryPct),
      timestampSec: this.nowSec(), accuracyM: 8 + Math.floor(this.rng() * 15),
    };
    this.emit(packet, f.relayVia);
  }

  /** One simulation step. Public so tests and demo controls can drive time manually. */
  tick(): void {
    const now = this.nowSec();
    for (const f of this.friends) {
      // movement
      if (f.mode === 'walk') {
        f.headingDeg = (f.headingDeg + (this.rng() * 80 - 40) + 360) % 360;
        f.pos = movePoint(f.pos, f.headingDeg, WALK_SPEED_MPS * TICK_SEC);
      } else if (f.mode === 'approach') {
        const dist = getHaversineDistance(f.pos, this.origin);
        if (dist > 8) {
          f.headingDeg = getAbsoluteBearing(f.pos, this.origin);
          f.pos = movePoint(f.pos, f.headingDeg, Math.min(1.5 * WALK_SPEED_MPS * TICK_SEC, dist - 6));
        }
      }
      f.batteryPct = Math.max(1, f.batteryPct - 0.02);

      const shouldEmit = f.mode !== 'dark' || f.pendingPingReply;
      if (shouldEmit) {
        f.pendingPingReply = false;
        const packet: Packet = {
          type: 'position', senderId: f.id, targetId: 0,
          latitude: f.pos.latitude, longitude: f.pos.longitude,
          headingDeg: Math.round(f.headingDeg), batteryPct: Math.round(f.batteryPct),
          timestampSec: now, accuracyM: 8 + Math.floor(this.rng() * 15),
        };
        if (f.lagTicks && f.lagTicks > 0) {
          f.buffer.push({ packet, relayVia: f.relayVia });
          if (f.buffer.length > f.lagTicks) {
            const delayed = f.buffer.shift()!;
            this.emit(delayed.packet, delayed.relayVia);
          }
        } else {
          this.emit(packet, f.relayVia);
        }
      }
    }
    const nearby = this.friends.filter((f) => f.mode !== 'dark').length;
    this.statusCbs.forEach((cb) => cb({ nearbyCount: nearby, connected: nearby > 0 }));
  }

  private emit(p: Packet, relayVia?: string): void {
    this.packetCbs.forEach((cb) => cb(p, relayVia));
  }
}
