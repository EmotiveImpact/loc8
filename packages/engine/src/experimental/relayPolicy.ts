/**
 * R3 / SEC-01 E06: detached experiment, deliberately not exported by the engine.
 * Independently written from Loc8's native baseline and RFC 6206 principles.
 * No timers, payload rewrites, platform APIs, persistent storage or runtime wiring.
 * Native code remains the sole production relay owner.
 */
export type RelayPolicyName = 'current' | 'jitter' | 'trickle';

export interface RelayObservation {
  /** Existing native dedup identity, excluding TTL; this is not authentication. */
  key: string;
  ttl: number;
  degree: number;
  ingressLink: string;
  senderIsSelf?: boolean;
}

export interface RelayForward {
  key: string;
  ttl: number;
  excludeLink: string;
  attempt: number;
}

export interface RelayOptions {
  policy: RelayPolicyName;
  random: () => number;
  minIntervalMs?: number;
  maxIntervalMs?: number;
  maxIntervals?: number;
  maxTransmissions?: number;
  activeLifetimeMs?: number;
  seenLifetimeMs?: number;
  maxSeen?: number;
  maxPending?: number;
}

interface Pending {
  key: string;
  ttl: number;
  excludeLink: string;
  firstSeen: number;
  intervalStart: number;
  intervalMs: number;
  interval: number;
  transmitAt: number;
  checked: boolean;
  transmissions: number;
  redundancy: number;
  links: Set<string>;
}

/** Matches current native clamp/decrement; retrying never renews the hop budget. */
export function relayTTL(ttl: number, degree: number): number | null {
  boundedInt(ttl, 0, 255, 'ttl');
  boundedInt(degree, 0, 1000, 'degree');
  const cap = Math.min(ttl, 7);
  if (cap <= 1) return null;
  return Math.min(cap, degree >= 6 ? 5 : degree <= 2 ? cap : 6) - 1;
}

/** Inclusive native jitter bands; random must be in [0, 1). */
export function nativeJitterMs(degree: number, random: number): number {
  boundedInt(degree, 0, 1000, 'degree');
  unitRandom(random);
  const [low, high] = degree <= 2 ? [10, 40] : degree <= 5 ? [60, 150]
    : degree <= 9 ? [80, 180] : [100, 220];
  return low + Math.floor(random * (high - low + 1));
}

function boundedInt(value: number, low: number, high: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < low || value > high) {
    throw new RangeError(`${name} must be an integer in [${low}, ${high}]`);
  }
}
function unitRandom(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('random must be in [0, 1)');
}
function identity(value: string, name: string): void {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128) {
    throw new RangeError(`${name} must contain 1..128 characters`);
  }
}

export class ExperimentalRelayPolicy {
  private readonly options: Required<RelayOptions>;
  private readonly seen = new Map<string, number>();
  private readonly pending = new Map<string, Pending>();
  private lastNow = -Infinity;
  readonly stats = { accepted: 0, duplicates: 0, cancelled: 0, suppressed: 0,
    forwarded: 0, capacityDrops: 0, evicted: 0, expired: 0, lateDrops: 0 };

  constructor(options: RelayOptions) {
    this.options = { minIntervalMs: 80, maxIntervalMs: 640, maxIntervals: 7,
      maxTransmissions: 3, activeLifetimeMs: 4550, seenLifetimeMs: 300_000,
      maxSeen: 1000, maxPending: 128, ...options };
    if (!['current', 'jitter', 'trickle'].includes(options.policy)) throw new RangeError('unknown policy');
    if (typeof options.random !== 'function') throw new TypeError('random source required');
    for (const field of ['minIntervalMs', 'maxIntervalMs', 'maxIntervals', 'maxTransmissions',
      'activeLifetimeMs', 'seenLifetimeMs', 'maxSeen', 'maxPending'] as const) {
      boundedInt(this.options[field], 1, 1_000_000, field);
    }
    if (this.options.minIntervalMs > this.options.maxIntervalMs ||
        this.options.activeLifetimeMs > this.options.seenLifetimeMs ||
        this.options.maxPending > this.options.maxSeen) throw new RangeError('inconsistent relay budgets');
  }

  /** True means first application delivery, independently of relay admission. */
  observe(input: RelayObservation, nowMs: number): boolean {
    identity(input.key, 'key'); identity(input.ingressLink, 'ingressLink');
    const ttl = relayTTL(input.ttl, input.degree);
    this.clock(nowMs);
    this.prune(nowMs);
    if (this.seen.has(input.key)) {
      this.stats.duplicates++;
      const pending = this.pending.get(input.key);
      if (pending && this.options.policy === 'current') {
        this.pending.delete(input.key); this.stats.cancelled++;
      } else if (pending && this.options.policy === 'trickle') {
        // A late timer is never caught up by manufacturing transmissions.
        this.rollIntervals(pending, nowMs);
        // Distinct local links, not authenticated peers. Saturate at k to bound memory.
        if (this.pending.has(input.key) && Number.isFinite(pending.redundancy) && pending.links.size < pending.redundancy) {
          pending.links.add(input.ingressLink);
        }
      }
      return false;
    }
    // Validate an injected scheduler before committing first-delivery/dedup state.
    const trickle = this.options.policy === 'trickle';
    const intervalMs = this.options.minIntervalMs;
    const delay = input.senderIsSelf || ttl === null ? 0 : trickle
      ? this.trickleDelay(intervalMs) : nativeJitterMs(input.degree, this.draw());
    this.remember(input.key, nowMs);
    if (input.senderIsSelf) return false;
    this.stats.accepted++;
    if (ttl === null) return true;
    if (this.pending.size >= this.options.maxPending) {
      this.stats.capacityDrops++; return true;
    }
    const pending: Pending = { key: input.key, ttl, excludeLink: input.ingressLink,
      firstSeen: nowMs, intervalStart: nowMs, intervalMs, interval: 1,
      transmitAt: 0, checked: false, transmissions: 0,
      // Preserve thin chains: they never suppress from a duplicate alone.
      redundancy: input.degree <= 2 ? Infinity : Math.max(2, Math.ceil(Math.log2(input.degree + 1))),
      links: new Set() };
    pending.transmitAt = nowMs + delay;
    this.pending.set(input.key, pending);
    return true;
  }

  /** Origin frames enter the same dedup cache, so echoes cannot trigger retries. */
  markOrigin(key: string, nowMs: number): void {
    identity(key, 'key'); this.clock(nowMs); this.prune(nowMs);
    this.pending.delete(key);
    if (!this.seen.has(key)) this.remember(key, nowMs);
  }

  /** Call at nextDeadline(). An overdue callback emits at most one send per frame. */
  drain(nowMs: number): RelayForward[] {
    this.clock(nowMs); this.prune(nowMs);
    const forwards: RelayForward[] = [];
    for (const pending of this.pending.values()) {
      if (this.options.policy === 'trickle') this.rollIntervals(pending, nowMs);
      if (!this.pending.has(pending.key) || pending.checked || nowMs < pending.transmitAt) continue;
      pending.checked = true;
      if (this.options.policy === 'trickle' && pending.links.size >= pending.redundancy) {
        this.stats.suppressed++;
      } else {
        pending.transmissions++;
        this.stats.forwarded++;
        forwards.push({ key: pending.key, ttl: pending.ttl, excludeLink: pending.excludeLink,
          attempt: pending.transmissions });
      }
      if (this.options.policy !== 'trickle' || pending.transmissions >= this.options.maxTransmissions) {
        this.pending.delete(pending.key);
      }
    }
    return forwards;
  }

  nextDeadline(): number | null {
    let next = Infinity;
    for (const pending of this.pending.values()) {
      next = Math.min(next, pending.firstSeen + this.options.activeLifetimeMs,
        pending.checked ? pending.intervalStart + pending.intervalMs : pending.transmitAt);
    }
    return next === Infinity ? null : next;
  }

  sizes(): { seen: number; pending: number } { return { seen: this.seen.size, pending: this.pending.size }; }

  /** Lifecycle reset must accompany native start/stop generations in a future port. */
  reset(): void { this.seen.clear(); this.pending.clear(); this.lastNow = -Infinity; }

  private clock(now: number): void {
    if (!Number.isFinite(now) || now < 0 || now < this.lastNow) throw new RangeError('monotonic time required');
    this.lastNow = now;
  }
  private draw(): number { const value = this.options.random(); unitRandom(value); return value; }
  private trickleDelay(interval: number): number { return interval / 2 + this.draw() * interval / 2; }
  private remember(key: string, now: number): void {
    if (this.seen.size >= this.options.maxSeen) {
      // FIFO at first receipt: duplicates cannot pin an entry or renew its lifetime.
      const oldest = this.seen.keys().next().value as string;
      this.seen.delete(oldest); this.pending.delete(oldest); this.stats.evicted++;
    }
    this.seen.set(key, now);
  }
  private prune(now: number): void {
    for (const [key, first] of this.seen) {
      if (now - first >= this.options.seenLifetimeMs) { this.seen.delete(key); this.pending.delete(key); }
    }
    for (const [key, pending] of this.pending) {
      if (now - pending.firstSeen >= this.options.activeLifetimeMs) {
        this.pending.delete(key); this.stats.expired++;
      }
    }
  }
  private rollIntervals(pending: Pending, now: number): void {
    while (now >= pending.intervalStart + pending.intervalMs) {
      if (!pending.checked) this.stats.lateDrops++;
      pending.interval++;
      if (pending.interval > this.options.maxIntervals) { this.pending.delete(pending.key); return; }
      pending.intervalStart += pending.intervalMs;
      pending.intervalMs = Math.min(pending.intervalMs * 2, this.options.maxIntervalMs);
      pending.transmitAt = pending.intervalStart + this.trickleDelay(pending.intervalMs);
      pending.checked = false; pending.links.clear();
    }
  }
}
