// src/transport/BridgedTransport.ts
//
// Bridges a local mesh to a control-room console over a plain WebSocket relay.
//
//   Guard phone:  new BridgedTransport(bleOrSim, { url })  — gateway mode:
//                 every mesh packet is mirrored up the socket; frames arriving
//                 from the socket are delivered to the app like mesh packets.
//   Command web:  new BridgedTransport(null, { url })      — console mode:
//                 no local mesh; the socket IS the transport.
//
// The payload on the wire is the engine's own 25-byte frame (encodePacket) —
// the bridge carries mesh bytes verbatim, so both ends speak the exact packet
// format the mesh speaks, and the relay stays a dumb pipe.
//
// Pure module: uses the platform-global WebSocket (React Native, browsers and
// Node ≥21 all provide it). Injectable via opts.wsFactory for tests.

import type { Packet } from '../core/types';
import { encodePacket, decodePacket, PACKET_SIZE } from '../core/packetCodec';
import type { LocationTransport, MeshStatus } from './LocationTransport';

/** The subset of the WebSocket API this transport needs. */
export interface BridgeSocket {
  readonly readyState: number;
  binaryType: string;
  send(data: ArrayBuffer): void;
  close(): void;
  addEventListener(type: 'open' | 'close' | 'error' | 'message', cb: (ev: any) => void): void;
}

export interface BridgedTransportOptions {
  url: string;
  /** reconnect delay after a drop (ms); 0 disables reconnection */
  reconnectMs?: number;
  /** test seam — defaults to the platform WebSocket */
  wsFactory?: (url: string) => BridgeSocket;
}

const OPEN = 1;

export class BridgedTransport implements LocationTransport {
  private packetCbs: Array<(p: Packet, relayVia?: string) => void> = [];
  private statusCbs: Array<(s: MeshStatus) => void> = [];
  private ws: BridgeSocket | null = null;
  private started = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    /** the local mesh (BLE/sim) to gateway, or null for console mode */
    private inner: LocationTransport | null,
    private opts: BridgedTransportOptions,
  ) {}

  /** Is the socket to the relay currently open? */
  bridgeConnected(): boolean {
    return this.ws?.readyState === OPEN;
  }

  start(): void {
    if (this.started) {
      this.inner?.start();
      return;
    }
    this.started = true;
    if (this.inner) {
      // Gateway: mirror everything the mesh delivers up the socket.
      this.inner.onPacket((p, relayVia) => {
        this.emit(p, relayVia);
        this.sendFrame(encodePacket(p));
      });
      this.inner.onMeshStatus((s) => this.pushStatus(s));
      this.inner.start();
    }
    this.connect();
  }

  stop(): void {
    this.started = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.ws?.close();
    this.ws = null;
    this.inner?.stop();
  }

  broadcast(packet: Packet): void {
    this.inner?.broadcast(packet);
    this.sendFrame(encodePacket(packet));
  }

  /** Send a pre-encoded frame (console dispatch path). */
  sendFrame(frame: ArrayBuffer): void {
    if (this.ws?.readyState === OPEN) this.ws.send(frame);
  }

  onPacket(cb: (packet: Packet, relayVia?: string) => void): void {
    this.packetCbs.push(cb);
  }

  onMeshStatus(cb: (status: MeshStatus) => void): void {
    this.statusCbs.push(cb);
  }

  clearListeners(): void {
    this.packetCbs = [];
    this.statusCbs = [];
    this.inner?.clearListeners();
  }

  private connect(): void {
    const factory =
      this.opts.wsFactory ??
      ((url: string) => new (globalThis as any).WebSocket(url) as BridgeSocket);
    let ws: BridgeSocket;
    try {
      ws = factory(this.opts.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('open', () => this.pushStatus({ nearbyCount: 0, connected: true }));
    ws.addEventListener('message', (ev: { data: unknown }) => {
      const buf = ev.data;
      if (!(buf instanceof ArrayBuffer) || buf.byteLength !== PACKET_SIZE) return;
      try {
        this.emit(decodePacket(buf), 'bridge');
      } catch {
        // Malformed frame from the relay — drop it, never crash the console.
      }
    });
    ws.addEventListener('close', () => {
      this.pushStatus({ nearbyCount: 0, connected: false });
      this.scheduleReconnect();
    });
    ws.addEventListener('error', () => {
      // close fires after error; reconnect is handled there
    });
  }

  private scheduleReconnect(): void {
    const delay = this.opts.reconnectMs ?? 3000;
    if (!this.started || delay <= 0 || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.started) this.connect();
    }, delay);
  }

  private emit(p: Packet, relayVia?: string): void {
    for (const cb of this.packetCbs) cb(p, relayVia);
  }

  private pushStatus(s: MeshStatus): void {
    for (const cb of this.statusCbs) cb(s);
  }
}
