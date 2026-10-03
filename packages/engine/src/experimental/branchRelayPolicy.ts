/** R3 v2 detached experiment; no app export, timer, network or persistent store. */
import { nativeJitterMs, relayTTL } from './relayPolicy';

export interface BranchObservation {
  key: string;
  /** Already decoded canonical raw native frame: 47 bytes, TTL at index 2. */
  frame: Uint8Array;
  degree: number;
  /** A real local link/incarnation identity, not the frame's origin sender. */
  ingressLink: string;
  senderIsSelf?: boolean;
}
export interface BranchForward {
  key: string;
  ttl: number;
  attempt: 1;
  links: string[];
  /** Caller-owned exact existing frame; only TTL is rewritten. */
  frame: Uint8Array;
}
export interface BranchOptions {
  random: () => number;
  maxSeen?: number;
  maxPending?: number;
  maxIngressLinks?: number;
  seenLifetimeMs?: number;
  activeLifetimeMs?: number;
}
interface Seen { firstSeen: number; witness: Uint8Array }
interface Pending { firstSeen: number; transmitAt: number; ttl: number; ingress: Set<string> }

function boundedInt(value: number, low: number, high: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < low || value > high) throw new RangeError(`${name} outside [${low}, ${high}]`);
}
function identity(value: string): void {
  if (typeof value !== 'string' || value.length === 0 || value.length > 128) throw new RangeError('identity must contain 1..128 characters');
}
/** Native decode/unpadding and source-age guards remain transport responsibilities. */
function immutableWitness(frame: Uint8Array): Uint8Array {
  if (!(frame instanceof Uint8Array) || frame.length !== 47 || frame[0] !== 1 ||
      frame[1] !== 0x30 || frame[11] !== 0 || frame[12] !== 0 || frame[13] !== 25) {
    throw new RangeError('canonical validated raw 47-byte Loc8 frame required');
  }
  const witness = Uint8Array.from(frame);
  witness[2] = 0;
  return witness;
}
function sameWitness(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export class ExperimentalBranchRelayPolicy {
  private readonly options: Required<BranchOptions>;
  private readonly seen = new Map<string, Seen>();
  private readonly pending = new Map<string, Pending>();
  private lastNow = -Infinity;
  readonly stats = { accepted: 0, duplicates: 0, identityConflicts: 0, forwarded: 0,
    excludedLinks: 0, ingressOverflow: 0, capacityDrops: 0, evicted: 0, expired: 0 };

  constructor(options: BranchOptions) {
    this.options = { maxSeen: 1000, maxPending: 128, maxIngressLinks: 64,
      seenLifetimeMs: 300_000, activeLifetimeMs: 4550, ...options };
    if (typeof this.options.random !== 'function') throw new TypeError('random source required');
    for (const field of ['maxSeen', 'maxPending', 'maxIngressLinks', 'seenLifetimeMs', 'activeLifetimeMs'] as const) {
      boundedInt(this.options[field], 1, field === 'maxIngressLinks' ? 1000 : 1_000_000, field);
    }
    if (this.options.maxPending > this.options.maxSeen || this.options.activeLifetimeMs > this.options.seenLifetimeMs) {
      throw new RangeError('inconsistent budgets');
    }
  }

  /** First application admission is independent of relay capacity/TTL eligibility. */
  observe(input: BranchObservation, nowMs: number): boolean {
    identity(input.key); identity(input.ingressLink);
    const witness = immutableWitness(input.frame);
    const ttl = relayTTL(input.frame[2], input.degree);
    this.clock(nowMs); this.prune(nowMs);
    const previous = this.seen.get(input.key);
    if (previous) {
      if (!sameWitness(previous.witness, witness)) { this.stats.identityConflicts++; return false; }
      this.stats.duplicates++;
      const pending = this.pending.get(input.key);
      if (pending && !pending.ingress.has(input.ingressLink)) {
        if (pending.ingress.size < this.options.maxIngressLinks) pending.ingress.add(input.ingressLink);
        else this.stats.ingressOverflow++;
      }
      return false;
    }
    // Invalid scheduler output cannot consume first-delivery/cache admission.
    const delay = ttl === null || input.senderIsSelf ? 0 : nativeJitterMs(input.degree, this.options.random());
    this.remember(input.key, witness, nowMs);
    if (input.senderIsSelf) return false;
    this.stats.accepted++;
    if (ttl === null) return true;
    if (this.pending.size >= this.options.maxPending) { this.stats.capacityDrops++; return true; }
    this.pending.set(input.key, { firstSeen: nowMs, transmitAt: nowMs + delay,
      ttl, ingress: new Set([input.ingressLink]) });
    return true;
  }

  markOrigin(key: string, frame: Uint8Array, nowMs: number): void {
    identity(key);
    const witness = immutableWitness(frame);
    this.clock(nowMs); this.prune(nowMs);
    const previous = this.seen.get(key);
    if (previous && !sameWitness(previous.witness, witness)) { this.stats.identityConflicts++; return; }
    this.pending.delete(key);
    if (!previous) this.remember(key, witness, nowMs);
  }

  /** At the original timer, retain only current live branches without an ingress witness. */
  drain(nowMs: number, liveLinks: readonly string[]): BranchForward[] {
    if (!Array.isArray(liveLinks) || liveLinks.length > 1000) throw new RangeError('at most 1000 live links required');
    liveLinks.forEach(identity);
    this.clock(nowMs); this.prune(nowMs);
    const peers = [...new Set(liveLinks)]; // preserve native/caller link order
    const result: BranchForward[] = [];
    for (const [key, pending] of this.pending) {
      if (pending.transmitAt > nowMs) continue;
      this.pending.delete(key);
      const seen = this.seen.get(key);
      if (!seen) continue;
      const links = peers.filter(link => !pending.ingress.has(link));
      this.stats.excludedLinks += peers.length - links.length;
      this.stats.forwarded++;
      const frame = Uint8Array.from(seen.witness); frame[2] = pending.ttl;
      result.push({ key, ttl: pending.ttl, attempt: 1, links, frame });
    }
    return result;
  }

  nextDeadline(): number | null {
    let next = Infinity;
    for (const pending of this.pending.values()) next = Math.min(next, pending.transmitAt,
      pending.firstSeen + this.options.activeLifetimeMs);
    return next === Infinity ? null : next;
  }

  /** Churn fails open: a new link incarnation must establish its own receipt witness. */
  forgetLink(link: string, nowMs: number): void {
    identity(link); this.clock(nowMs); this.prune(nowMs);
    for (const pending of this.pending.values()) pending.ingress.delete(link);
  }

  sizes(): { seen: number; pending: number; exclusions: number; witnessBytes: number } {
    return { seen: this.seen.size, pending: this.pending.size,
      exclusions: [...this.pending.values()].reduce((sum, item) => sum + item.ingress.size, 0),
      witnessBytes: this.seen.size * 47 };
  }

  reset(): void { this.seen.clear(); this.pending.clear(); this.lastNow = -Infinity; }

  private clock(now: number): void {
    if (!Number.isFinite(now) || now < 0 || now < this.lastNow) throw new RangeError('monotonic time required');
    this.lastNow = now;
  }
  private remember(key: string, witness: Uint8Array, now: number): void {
    if (this.seen.size >= this.options.maxSeen) {
      const oldest = this.seen.keys().next().value as string;
      this.seen.delete(oldest); this.pending.delete(oldest); this.stats.evicted++;
    }
    this.seen.set(key, { witness, firstSeen: now });
  }
  private prune(now: number): void {
    for (const [key, seen] of this.seen) if (now - seen.firstSeen >= this.options.seenLifetimeMs) {
      this.seen.delete(key); this.pending.delete(key);
    }
    for (const [key, pending] of this.pending) if (now - pending.firstSeen >= this.options.activeLifetimeMs) {
      this.pending.delete(key); this.stats.expired++;
    }
  }
}
