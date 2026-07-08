import type { Packet } from '../core/types';
import { encodePacket, decodePacket } from '../core/packetCodec';
import type { LocationTransport, MeshStatus } from './LocationTransport';
import { useMeshDebugStore } from '../state/meshDebugStore';
import * as Loc8Mesh from '../../modules/loc8-mesh';

const dbg = () => useMeshDebugStore.getState();

type Subscription = { remove(): void };

/**
 * Real BLE mesh transport (spike brief §2) over the loc8-mesh native module.
 * The native side owns framing, dedup, TTL and relay; this wrapper only
 * encodes/decodes the 25-byte Loc8 packets and fans events out to listeners,
 * so the existing trustLayer replay path stays unchanged.
 *
 * Unlike SimulatedTransport there is no setOrigin/scenario/simulateIncomingPing —
 * real peers move themselves. DevMenu/useMyLocation must go through
 * getSimTransport() and no-op when this transport is active.
 */
export class BleMeshTransport implements LocationTransport {
  private packetCbs: Array<(p: Packet, relayVia?: string) => void> = [];
  private statusCbs: Array<(s: MeshStatus) => void> = [];
  private subs: Subscription[] = [];
  private started = false;

  start(): void {
    if (this.started) return;   // idempotent — mirror SimulatedTransport's guarded lifecycle
    this.started = true;
    this.subs.push(
      Loc8Mesh.addPacketListener((event) => {
        let packet: Packet;
        try {
          const { buffer, byteOffset, byteLength } = event.data;
          packet = decodePacket(buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer);
        } catch {
          dbg().markDropped();
          return;   // malformed packet off the air — drop silently, never crash
        }
        dbg().markReceived();
        this.packetCbs.forEach((cb) => cb(packet, event.relayVia));
      }),
      Loc8Mesh.addStatusListener((status) => {
        dbg().setStatus(status);
        this.statusCbs.forEach((cb) => cb(status));
      }),
    );
    // LocationTransport.start() is sync, so the native start is fire-and-forget —
    // but a rejection (Bluetooth off, missing permissions, background FGS
    // restriction) UN-LATCHES `started` and detaches the native subscriptions,
    // so a later start() (e.g. meshService's foreground retry) really retries.
    // Listeners see a zeroed onMeshStatus so the UI reflects "mesh down".
    Loc8Mesh.start().catch((e) => {
      this.started = false;
      this.subs.forEach((s) => s.remove());
      this.subs = [];
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[BleMeshTransport] native start failed: ${msg}`);
      dbg().setError(msg);
      const status: MeshStatus = { nearbyCount: 0, connected: false };
      dbg().setStatus(status);
      this.statusCbs.forEach((cb) => cb(status));
    });
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.subs.forEach((s) => s.remove());
    this.subs = [];
    Loc8Mesh.stop().catch(() => {});
  }

  /** Send my packet into the mesh — encode to 25 bytes, native adds bitchat framing. */
  broadcast(packet: Packet): void {
    dbg().markSent();
    Loc8Mesh.broadcast(new Uint8Array(encodePacket(packet))).catch(() => {});
  }

  onPacket(cb: (p: Packet, relayVia?: string) => void): void { this.packetCbs.push(cb); }
  onMeshStatus(cb: (s: MeshStatus) => void): void { this.statusCbs.push(cb); }

  clearListeners(): void {
    this.packetCbs = [];
    this.statusCbs = [];
    // Also detach from the native emitter so restarts don't accumulate subscriptions.
    this.subs.forEach((s) => s.remove());
    this.subs = [];
  }
}
