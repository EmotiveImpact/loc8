import { create } from 'zustand';

/**
 * Live counters for the BLE mesh field test (shown only by MeshDebugOverlay when
 * EXPO_PUBLIC_TRANSPORT === 'ble'). BleMeshTransport pushes into this so the
 * overlay can turn "it's not working" into "sent 12, received 0" — a real signal.
 * Purely diagnostic; nothing in the product path reads it.
 */
interface MeshDebugState {
  sent: number;
  received: number;   // packets that decoded successfully
  dropped: number;    // frames that arrived but failed to decode
  nearbyCount: number;
  connected: boolean;
  degraded: boolean;  // scan-only mode (chipset can't advertise)
  lastRxSec: number | null;
  lastError: string | null;

  markSent(): void;
  markReceived(): void;
  markDropped(): void;
  setStatus(s: { nearbyCount: number; connected: boolean; degraded?: boolean }): void;
  setError(msg: string): void;
  reset(): void;
}

const nowSec = () => Math.floor(Date.now() / 1000);

const initial = {
  sent: 0, received: 0, dropped: 0,
  nearbyCount: 0, connected: false, degraded: false,
  lastRxSec: null as number | null, lastError: null as string | null,
};

export const useMeshDebugStore = create<MeshDebugState>((set) => ({
  ...initial,
  markSent: () => set((s) => ({ sent: s.sent + 1 })),
  markReceived: () => set((s) => ({ received: s.received + 1, lastRxSec: nowSec() })),
  markDropped: () => set((s) => ({ dropped: s.dropped + 1 })),
  setStatus: (st) => set({ nearbyCount: st.nearbyCount, connected: st.connected, degraded: !!st.degraded }),
  setError: (msg) => set({ lastError: msg }),
  reset: () => set(initial),
}));
