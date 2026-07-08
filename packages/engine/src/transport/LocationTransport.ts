import type { Packet } from '../core/types';

export interface MeshStatus {
  nearbyCount: number;
  connected: boolean;
  /** Android BLE only: chipset can't advertise — scan-only degraded mode (undiscoverable). */
  degraded?: boolean;
}

export interface LocationTransport {
  start(): void;
  stop(): void;
  /** Send my packet into the mesh (position | ping | rally). */
  broadcast(packet: Packet): void;
  /** Deduped/replay-checked packets arriving from the mesh. relayVia = name of the hop, if any. */
  onPacket(cb: (packet: Packet, relayVia?: string) => void): void;
  onMeshStatus(cb: (status: MeshStatus) => void): void;
  /** Drop all registered onPacket/onMeshStatus callbacks (so restarts don't accumulate them). */
  clearListeners(): void;
}
