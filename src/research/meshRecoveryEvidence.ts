/** Bounded, read-only same-handle reconnect evidence for the internal MESH-01 kit.
 * A local GATT handle is not a stable peer identity. These intervals cannot
 * establish controller scan recovery, physical coverage or BLE radio uptime.
 */
import type { FieldSnapshot } from './meshFieldTelemetry';

type Link = {
  open: boolean;
  lastDownNs: bigint | null;
  awaitingIngressSinceNs: bigint | null;
};

const MAX_EVENTS = 20_000;
const MAX_HANDLES = 512;
const INBOUND = new Set(['ingress', 'application-delivery', 'duplicate-drop', 'malformed-drop']);
const percentile = (values: number[], fraction: number): number | null => {
  if (values.length === 0) return null;
  values.sort((a, b) => a - b);
  return values[Math.ceil(values.length * fraction) - 1];
};

export function analyseMeshRecoveryEvidence(snapshot: FieldSnapshot) {
  if (!snapshot || !Array.isArray(snapshot.events) || snapshot.events.length > MAX_EVENTS ||
      !Number.isSafeInteger(snapshot.overflowCount) || snapshot.overflowCount < 0 ||
      typeof snapshot.active !== 'boolean') {
    throw new RangeError('invalid recovery evidence snapshot');
  }

  const events = snapshot.events;
  const first = events[0];
  const gaps = new Set<string>();
  const links = new Map<string, Link>();
  const recoveryGapMs: number[] = [];
  const firstInboundMs: number[] = [];
  let lastNs: bigint | null = null;
  let badContextRows = 0;
  let invalidLocalTimes = 0;
  let untrackedLinks = 0;
  let missingTransitionHandles = 0;
  let observedLinkDowns = 0;
  let pairedReopens = 0;
  let firstInboundAfterReopen = 0;
  let repeatedUp = 0;
  let unmatchedDown = 0;

  for (const [index, event] of events.entries()) {
    if (!event || event.eventIndex !== index || !first ||
        event.runId !== first.runId || event.cohortId !== first.cohortId ||
        event.blockId !== first.blockId || event.deviceRole !== first.deviceRole) {
      badContextRows++;
      gaps.add('context-or-index');
      continue;
    }
    if (typeof event.monotonicNs !== 'string' || !/^[0-9]{1,20}$/.test(event.monotonicNs)) {
      invalidLocalTimes++;
      gaps.add('invalid-local-clock');
      continue;
    }
    const now = BigInt(event.monotonicNs);
    if (lastNs !== null && now < lastNs) {
      invalidLocalTimes++;
      gaps.add('regressed-local-clock');
      continue;
    }
    lastNs = now;
    const isTransition = event.action === 'link-up' || event.action === 'link-down';
    if (!isTransition && !INBOUND.has(event.action)) continue;
    const handle = event.linkHandle;
    if (typeof handle !== 'string' || !handle || handle.length > 128) {
      if (isTransition) {
        missingTransitionHandles++;
        gaps.add('missing-transition-handle');
      }
      continue;
    }
    let link = links.get(handle);
    if (!link) {
      if (links.size >= MAX_HANDLES) {
        untrackedLinks++;
        gaps.add('distinct-handle-limit');
        continue;
      }
      link = { open: false, lastDownNs: null, awaitingIngressSinceNs: null };
      links.set(handle, link);
    }
    if (event.action === 'link-down') {
      observedLinkDowns++;
      if (!link.open) unmatchedDown++;
      else {
        link.open = false;
        link.lastDownNs = now;
        link.awaitingIngressSinceNs = null;
      }
    } else if (event.action === 'link-up') {
      if (link.open) repeatedUp++;
      else {
        link.open = true;
        if (link.lastDownNs !== null) {
          pairedReopens++;
          recoveryGapMs.push(Number(now - link.lastDownNs) / 1e6);
          link.lastDownNs = null;
          link.awaitingIngressSinceNs = now;
        }
      }
    } else if (link.open && link.awaitingIngressSinceNs !== null) {
      firstInboundAfterReopen++;
      firstInboundMs.push(Number(now - link.awaitingIngressSinceNs) / 1e6);
      link.awaitingIngressSinceNs = null;
    }
  }

  if (snapshot.overflowCount > 0) gaps.add('native-recorder-overflow');
  if (snapshot.active || events.length < 2 ||
      first?.action !== 'diagnostics-started' ||
      events[events.length - 1]?.action !== 'diagnostics-stopped') {
    gaps.add('capture-boundary');
  }

  return {
    schema: 'loc8.mesh-recovery-evidence.v1' as const,
    evidenceClass: 'same-local-handle-app-events-not-scanner-controller-or-rf' as const,
    quality: gaps.size ? 'INCOMPLETE' as const : 'RECORDED' as const,
    observedDistinctHandles: links.size,
    observedLinkDownEvents: observedLinkDowns,
    observedSameHandleReopens: pairedReopens,
    observedSameHandleReconnectP50Ms: percentile(recoveryGapMs, 0.5),
    observedSameHandleReconnectP95Ms: percentile(recoveryGapMs, 0.95),
    observedReopenFirstInboundCount: firstInboundAfterReopen,
    observedReopenToFirstInboundP95Ms: percentile(firstInboundMs, 0.95),
    observedReopensWithoutSubsequentInbound: [...links.values()]
      .filter(link => link.awaitingIngressSinceNs !== null).length,
    observedDownWithoutSameHandleReopen: [...links.values()]
      .filter(link => link.lastDownNs !== null && !link.open).length,
    repeatedLinkUpEvents: repeatedUp,
    unmatchedLinkDownEvents: unmatchedDown,
    unattributedLinkTransitions: missingTransitionHandles,
    untrackedLinkEvents: untrackedLinks,
    invalidContextRows: badContextRows,
    invalidLocalClockRows: invalidLocalTimes,
    reviewSuggested: repeatedUp > 0 || unmatchedDown > 0 || untrackedLinks > 0 ||
      invalidLocalTimes > 0,
    evidenceGaps: [...gaps].sort(),
    productionRelayRecommendation: 'NO_CHANGE' as const,
  };
}
