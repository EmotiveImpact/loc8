import type { MeshStatusEvent } from '../../modules/loc8-mesh';

/**
 * Field-screen rendering pressure control. A burst of native link/status events
 * produces at most one React update per window. This does not throttle native
 * scanning, relay work, diagnostics or exported event rows.
 */
export const FIELD_STATUS_WINDOW_MS = 100;

export interface MeshStatusTimerPort {
  setTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout>;
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
}

export function createMeshStatusCoalescer(
  publish: (status: MeshStatusEvent) => void,
  timerPort: MeshStatusTimerPort = {
    setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
    clearTimeout: (handle) => globalThis.clearTimeout(handle),
  },
) {
  let pending: MeshStatusEvent | null = null;
  let scheduled: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function push(status: MeshStatusEvent): void {
    if (closed || !Number.isSafeInteger(status?.nearbyCount) || status.nearbyCount < 0) return;
    // Latest topology count wins. Preserve a transient degraded=true warning
    // and the last known relay mode for the entire update window.
    pending = pending
      ? {
          ...status,
          degraded: pending.degraded === true || status.degraded === true,
          relayMode: status.relayMode ?? pending.relayMode,
        }
      : { ...status };
    if (scheduled !== null) return;
    scheduled = timerPort.setTimeout(() => {
      scheduled = null;
      const sample = pending;
      pending = null;
      if (!closed && sample) publish(sample);
    }, FIELD_STATUS_WINDOW_MS);
  }

  function close(): void {
    if (closed) return;
    closed = true;
    pending = null;
    if (scheduled !== null) timerPort.clearTimeout(scheduled);
    scheduled = null;
  }

  return { push, close };
}
