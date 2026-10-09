/** R5 research-only single-radio GATT scheduling proxy. Overlaps are NOT packet losses. */
export interface GattLinkSchedule {
  id: string; intervalMs: number; phaseMs: number; eventMs: number; driftPpm: number;
  activeFromMs?: number; activeUntilMs?: number;
}
export interface GattScheduleOptions {
  horizonMs: number; links: readonly GattLinkSchedule[]; bucketMs?: number; maxEvents?: number;
}
type Slot = { link: number; start: number; end: number; overlaps: boolean };
function bound(n: number, min: number, max: number, name: string, whole = false): void {
  if (!Number.isFinite(n) || n < min || n > max || (whole && !Number.isSafeInteger(n))) {
    throw new RangeError(name + ' outside budget');
  }
}
/** Count opportunities for overlapping BLE connection events on one controller.
 * No RF channel/packet model, native scheduler, or inferred phone clock samples.
 * O(E log E + E * L) with at most 16 links and 200k default events. */
export function analyseGattSchedule(input: GattScheduleOptions) {
  if (!input || !Array.isArray(input.links)) throw new TypeError('links array required');
  const { horizonMs, links } = input, bucketMs = input.bucketMs ?? Math.min(10_000, horizonMs);
  const maxEvents = input.maxEvents ?? 200_000;
  bound(horizonMs,1,3_600_000,'horizonMs');
  bound(links.length,1,16,'link count',true);
  bound(bucketMs,1,horizonMs,'bucketMs');
  bound(maxEvents,1,500_000,'maxEvents',true);
  const bucketCount = Math.ceil(horizonMs / bucketMs);
  bound(bucketCount,1,10_000,'bucket count',true);
  const buckets = Array.from({length:bucketCount},(_,i) => ({startMs:i*bucketMs,eventCount:0,overlappingEventCount:0}));
  const seen = new Set<string>(), events: Slot[] = [];
  const byLink = links.map(link => ({id:link.id,eventCount:0,overlappingEventCount:0,overlapOpportunityRate:0}));
  for (const [i,link] of links.entries()) {
    if (typeof link?.id !== 'string' || !/^[a-zA-Z0-9_.-]{1,48}$/.test(link.id) || seen.has(link.id)) {
      throw new RangeError('unique non-identifying link label required');
    }
    seen.add(link.id);
    bound(link.intervalMs,7.5,4000,'intervalMs');
    bound(link.phaseMs,0,link.intervalMs,'phaseMs');
    if (link.phaseMs >= link.intervalMs) throw new RangeError('phase must be less than interval');
    bound(link.eventMs,0.001,link.intervalMs,'eventMs');
    bound(link.driftPpm,-1000,1000,'driftPpm');
    const from = link.activeFromMs ?? 0, until = link.activeUntilMs ?? horizonMs;
    bound(from,0,horizonMs,'activeFromMs'); bound(until,from,horizonMs,'activeUntilMs');
    if (from === until) throw new RangeError('empty link lifetime');
    const step = link.intervalMs * (1 + link.driftPpm / 1_000_000);
    const first = Math.max(0,Math.ceil((from-link.phaseMs)/step));
    const count = Math.max(0,Math.ceil((until-(link.phaseMs+first*step))/step));
    if (events.length+count > maxEvents) throw new RangeError('event budget exceeded');
    for (let k=0;k<count;k++) {
      const start = link.phaseMs + (first+k)*step;
      if (start >= from && start < until) events.push({link:i,start,end:Math.min(start+link.eventMs,until),overlaps:false});
    }
  }
  events.sort((a,b)=>a.start-b.start || a.link-b.link);
  const active: Slot[] = [], pairs = new Map<string,number>();
  let overlappingPairs=0, maximumSimultaneousEvents=0, overlappingEvents=0;
  for (const event of events) {
    for (let i=active.length-1;i>=0;i--) if (active[i].end <= event.start) active.splice(i,1);
    for (const prev of active) if (prev.link !== event.link && prev.end > event.start) {
      prev.overlaps = event.overlaps = true; overlappingPairs++;
      const a=Math.min(prev.link,event.link),b=Math.max(prev.link,event.link),key=a+':'+b;
      pairs.set(key,(pairs.get(key)??0)+1);
    }
    active.push(event); maximumSimultaneousEvents=Math.max(maximumSimultaneousEvents,active.length);
  }
  for (const event of events) {
    const bucket=buckets[Math.floor(event.start/bucketMs)], link=byLink[event.link];
    bucket.eventCount++; link.eventCount++;
    if (event.overlaps) {overlappingEvents++;bucket.overlappingEventCount++;link.overlappingEventCount++;}
  }
  for (const link of byLink) link.overlapOpportunityRate=link.eventCount ? link.overlappingEventCount/link.eventCount : 0;
  const byPair=[...pairs].map(([key,n])=>{const [a,b]=key.split(':').map(Number);return {a:byLink[a].id,b:byLink[b].id,overlappingPairs:n};})
    .sort((a,b)=>a.a.localeCompare(b.a)||a.b.localeCompare(b.b));
  return {model:'loc8.gatt-schedule-overlap.v1' as const,
    evidenceClass:'synthetic-single-controller-conflict-opportunities' as const,
    horizonMs,totalEvents:events.length,overlappingEvents,overlappingPairs,
    overlapOpportunityRate:events.length ? overlappingEvents/events.length : 0,
    maximumSimultaneousEvents,byLink,byPair,buckets,productionRelayRecommendation:'NO_CHANGE' as const};
}
