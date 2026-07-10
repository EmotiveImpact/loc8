import type { Packet, PacketType } from './types';

/** 24h — used for both the past (staleness) and future (skew) sanity bounds. */
const DAY_SEC = 24 * 60 * 60;

/**
 * Directed packet types are addressed to a specific peer (targetId). Two of them
 * from the same sender in the same second — but to DIFFERENT targets — are NOT a
 * replay of each other, so they must be keyed apart (targetId in the trust key).
 */
const DIRECTED: ReadonlySet<PacketType> = new Set<PacketType>([
  'quickReply',
  'pingWhere',
  'pingComeFind',
]);

/**
 * Packet acceptance rules (spec §5):
 *  - per-(sender, type[, target]) MONOTONIC last-write-wins — reject packets not
 *    newer than the last one accepted for that key. This is the REAL replay
 *    defense and it is clock-agnostic (no wall-clock comparison), so it holds
 *    even when peers' clocks disagree.
 *  - a coarse absolute window is only a sanity bound. On an OFFLINE mesh there is
 *    no NTP: peers can be minutes — even hours — skewed, so the window must be
 *    generous and asymmetric. A merely-skewed peer's live packets must not be
 *    silently dropped (the old symmetric 10-min gate dropped everything from a
 *    >10-min-skewed peer while their name still showed). We only reject the truly
 *    absurd: far-stale (replayed captures) or far-future (a poisoned +∞ timestamp
 *    that would otherwise pin the monotonic baseline unreachably high).
 */
export class TrustLayer {
  private lastSeen = new Map<string, number>();

  constructor(
    private maxAgeSec = DAY_SEC,      // past staleness bound (generous: offline clocks)
    private nowSec: () => number = () => Math.floor(Date.now() / 1000),
    private maxFutureSec = DAY_SEC,   // future-skew tolerance (reject only absurd far-future)
  ) {}

  accept(p: Packet): boolean {
    if (this.nowSec() - p.timestampSec > this.maxAgeSec) return false;      // far-stale replay
    if (p.timestampSec - this.nowSec() > this.maxFutureSec) return false;   // absurd far-future
    const key = DIRECTED.has(p.type)
      ? `${p.senderId}:${p.type}:${p.targetId}`
      : `${p.senderId}:${p.type}`;
    const last = this.lastSeen.get(key);
    if (last !== undefined && p.timestampSec <= last) return false;
    this.lastSeen.set(key, p.timestampSec);
    return true;
  }
}
