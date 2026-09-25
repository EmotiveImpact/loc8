import type { SourceLocationInput } from '../core/sourceLocation';

export type SourceLocationStatus = 'pending' | 'granted' | 'denied' | 'unavailable';
export interface SourceLocationSubscription { remove(): void; }
/** Dependency-injected SDK boundary: no native imports, timers or permissions prompts. */
export interface SourceLocationPort {
  permitted(): Promise<boolean>;
  watch(onSample: (sample: SourceLocationInput) => void, onError: (reason: string) => void): Promise<SourceLocationSubscription>;
}
export interface SourceLocationSink {
  accept(sample: SourceLocationInput): boolean;
  unavailable(): void;
  status(status: SourceLocationStatus): void;
}

/** Each lifecycle owns its callbacks and subscription, including late async setup. */
export function startSourceLocationWatch(port: SourceLocationPort, sink: SourceLocationSink): {
  stop(): void;
  ready: Promise<void>;
} {
  let stopped = false;
  let sub: SourceLocationSubscription | null = null;
  const remove = (value: SourceLocationSubscription | null) => {
    try { value?.remove(); } catch { /* cleanup must not create an unhandled rejection */ }
  };
  const fail = (status: 'denied' | 'unavailable') => {
    if (stopped) return;
    sink.unavailable(); // clears real coordinates; only the owning demo may seed a fallback
    sink.status(status);
  };
  const ready = (async () => {
    sink.status('pending');
    try {
      if (!await port.permitted()) { fail('denied'); return; }
      if (stopped) return;
      sink.status('granted');
      const pending = await port.watch((sample) => {
        if (stopped) return;
        if (sink.accept(sample)) sink.status('granted');
      }, () => fail('unavailable'));
      if (stopped) remove(pending);
      else sub = pending;
    } catch {
      fail('unavailable');
    }
  })();
  return {
    ready,
    stop() {
      if (stopped) return;
      stopped = true;
      remove(sub);
      sub = null;
    },
  };
}
