/** Observation-only MESH-01 field telemetry. Never infer controller collisions or RF loss. */
export type FieldEvent = {
  eventIndex: number; monotonicNs: string; action: string; frameId: string | null;
  linkHandle: string | null; runId: string; cohortId: string; blockId: string; deviceRole: string;
};
export type FieldSnapshot = { events: readonly FieldEvent[]; overflowCount: number; active: boolean };
export function analyseMeshFieldTelemetry(snapshot: FieldSnapshot) {
  if (!snapshot || !Array.isArray(snapshot.events) || snapshot.events.length > 20000 ||
      !Number.isSafeInteger(snapshot.overflowCount) || snapshot.overflowCount < 0 ||
      typeof snapshot.active !== 'boolean') throw new RangeError('invalid field snapshot');
  const active = new Set<string>(), pending = new Map<string, number[]>();
  const times: number[] = [], anomalies = new Set<string>();
  let maxLinks = 0, up = 0, down = 0, repeats = 0, unknownDowns = 0, unknownHandles = 0;
  let scheduled = 0, forwarded = 0, cancelled = 0, skipped = 0, delivered = 0, duplicates = 0, unmatched = 0;
  let firstMs: number | null = null, lastMs: number | null = null;
  // These are recorder-event bursts, NOT measured controller throughput or RF airtime.
  // Keep each stream's sliding-window work linear even at the 20,000-row bound.
  const bursts = {
    ingress: { times: [] as number[], first: 0, peak: 0 },
    forwarding: { times: [] as number[], first: 0, peak: 0 },
    duplicates: { times: [] as number[], first: 0, peak: 0 },
  };
  function observeBurst(kind: keyof typeof bursts, atMs: number) {
    const burst = bursts[kind];
    burst.times.push(atMs);
    while (burst.first < burst.times.length && atMs - burst.times[burst.first] >= 1000) burst.first++;
    burst.peak = Math.max(burst.peak, burst.times.length - burst.first);
  }
  const first = snapshot.events[0];
  for (const [index, event] of snapshot.events.entries()) {
    if (!event || event.eventIndex !== index) anomalies.add('index-gap');
    if (!event || !first || event.runId !== first.runId || event.cohortId !== first.cohortId ||
        event.blockId !== first.blockId || event.deviceRole !== first.deviceRole) anomalies.add('context-mismatch');
    const ns = event?.monotonicNs;
    const now = typeof ns === 'string' && /^[0-9]{1,20}$/.test(ns) ? Number(ns) / 1e6 : NaN;
    if (!Number.isFinite(now) || (lastMs !== null && now < lastMs)) anomalies.add('invalid-monotonic-order');
    if (Number.isFinite(now)) {
      if (firstMs === null) firstMs = now;
      lastMs = now;
    }
    if (!event) continue;
    switch (event.action) {
      case 'ingress':
        if (Number.isFinite(now)) observeBurst('ingress', now);
        break;
      case 'link-up':
        up++;
        if (!event.linkHandle) { unknownHandles++; break; }
        if (active.has(event.linkHandle)) repeats++;
        active.add(event.linkHandle); maxLinks = Math.max(maxLinks, active.size); break;
      case 'link-down':
        down++;
        if (!event.linkHandle) { unknownHandles++; break; }
        if (!active.delete(event.linkHandle)) unknownDowns++;
        break;
      case 'relay-scheduled':
        scheduled++;
        if (event.frameId && Number.isFinite(now)) {
          const queue = pending.get(event.frameId) ?? [];
          queue.push(now); pending.set(event.frameId, queue);
        }
        break;
      case 'relay-cancelled':
        cancelled++;
        if (event.frameId) pending.get(event.frameId)?.shift();
        break;
      case 'relay-forwarded': {
        forwarded++;
        if (Number.isFinite(now)) observeBurst('forwarding', now);
        const start = event.frameId ? pending.get(event.frameId)?.shift() : undefined;
        if (start === undefined || !Number.isFinite(now) || now < start) unmatched++;
        else times.push(now - start);
        break;
      }
      case 'egress-skipped': skipped++; break;
      case 'application-delivery': delivered++; break;
      case 'duplicate-drop':
        duplicates++;
        if (Number.isFinite(now)) observeBurst('duplicates', now);
        break;
    }
  }
  if (snapshot.overflowCount > 0) anomalies.add('native-overflow');
  if (snapshot.active || first?.action !== 'diagnostics-started' ||
      snapshot.events[snapshot.events.length - 1]?.action !== 'diagnostics-stopped') anomalies.add('missing-boundary');
  if (unknownDowns) anomalies.add('unmatched-link-down');
  if (unknownHandles) anomalies.add('missing-link-handle');
  times.sort((a,b) => a-b);
  const percentile = (q: number) => times.length ? times[Math.ceil(q * times.length) - 1] : null;
  return {
    schema: 'loc8.mesh-field-telemetry.v1' as const,
    evidenceClass: 'native-app-observation-not-hci-or-rf' as const,
    quality: anomalies.size ? 'INCOMPLETE' as const : 'RECORDED' as const,
    eventCount: snapshot.events.length, windowMs: firstMs === null || lastMs === null ? null : lastMs - firstMs,
    observedMaxLinkHandles: maxLinks, linkUpEvents: up, linkDownEvents: down,
    repeatedLinkUpEvents: repeats, unmatchedLinkDownEvents: unknownDowns,
    unattributedLinkEvents: unknownHandles,
    relayScheduled: scheduled, relayForwarded: forwarded, relayCancelled: cancelled,
    egressSkipped: skipped, applicationDeliveries: delivered, duplicateDrops: duplicates,
    observedPeakIngressEventsPer1s: bursts.ingress.peak,
    observedPeakRelayForwardEventsPer1s: bursts.forwarding.peak,
    observedPeakDuplicateDropsPer1s: bursts.duplicates.peak,
    loadEvidenceScope: 'native-recorder-events-not-gatt-queue-or-rf' as const,
    pendingRelayMatched: times.length, pendingRelayP50Ms: percentile(0.5),
    pendingRelayP95Ms: percentile(0.95), unmatchedRelayForwarded: unmatched,
    anomalies: [...anomalies].sort(), productionRelayRecommendation: 'NO_CHANGE' as const,
  };
}
