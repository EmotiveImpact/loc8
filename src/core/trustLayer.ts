import type { Packet } from './types';

/**
 * Packet acceptance rules (spec §5):
 *  - reject packets older than maxAgeSec (blocks stale-capture replays)
 *  - reject packets not newer than the last accepted one per (sender, type) — last-write-wins
 */
export class TrustLayer {
  private lastSeen = new Map<string, number>();

  constructor(
    private maxAgeSec = 600,
    private nowSec: () => number = () => Math.floor(Date.now() / 1000),
  ) {}

  accept(p: Packet): boolean {
    if (this.nowSec() - p.timestampSec > this.maxAgeSec) return false;
    const key = `${p.senderId}:${p.type}`;
    const last = this.lastSeen.get(key);
    if (last !== undefined && p.timestampSec <= last) return false;
    this.lastSeen.set(key, p.timestampSec);
    return true;
  }
}
