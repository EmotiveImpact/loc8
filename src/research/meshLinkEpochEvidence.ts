/** Device-local link lifecycle analysis for the internal MESH-01 field kit.
 * This is observational. A hashed link handle is NOT an authenticated peer ID,
 * and a recorded down event may describe only one of two concurrent GATT roles.
 */
import type { FieldSnapshot } from './meshFieldTelemetry';

const MAX_EVENTS = 20_000;
const MAX_HANDLES = 512;
const INBOUND = new Set(['ingress', 'duplicate-drop', 'malformed-drop', 'application-delivery']);
type LinkEpoch = { open: boolean; everOpened: boolean };

export function analyseMeshLinkEpochEvidence(snapshot: FieldSnapshot) {
  if (!snapshot || !Array.isArray(snapshot.events) ||
      snapshot.events.length > MAX_EVENTS ||
      !Number.isSafeInteger(snapshot.overflowCount) || snapshot.overflowCount < 0 ||
      typeof snapshot.active !== 'boolean') {
    throw new RangeError('invalid link epoch evidence snapshot');
  }

  const links = new Map<string, LinkEpoch>();
  const events = snapshot.events;
  const first = events[0];
  const evidenceGaps = new Set<string>();
  let previousNs: bigint | null = null;
  let invalidRows = 0;
  let invalidClocks = 0;
  let repeatedLinkUps = 0;
  let unmatchedLinkDowns = 0;
  let reusedLinkHandles = 0;
  let missingLinkHandles = 0;
  let untrackedLinkEvents = 0;
  let inboundWithoutObservedUp = 0;
  let inboundAfterObservedDown = 0;
  let inboundWhileObservedOpen = 0;
  let active = 0;
  let peakActive = 0;

  for (const [index, event] of events.entries()) {
    if (!event || event.eventIndex !== index || !first ||
        event.runId !== first.runId || event.cohortId !== first.cohortId ||
        event.blockId !== first.blockId || event.deviceRole !== first.deviceRole) {
      invalidRows++;
      evidenceGaps.add('event-context-or-index');
      continue;
    }

    if (typeof event.monotonicNs !== 'string' ||
        !/^[0-9]{1,20}$/.test(event.monotonicNs)) {
      invalidClocks++;
      evidenceGaps.add('invalid-local-clock');
    } else {
      const now = BigInt(event.monotonicNs);
      if (previousNs !== null && now < previousNs) {
        invalidClocks++;
        evidenceGaps.add('regressed-local-clock');
      } else {
        previousNs = now;
      }
    }

    const isLinkTransition = event.action === 'link-up' || event.action === 'link-down';
    const isInbound = INBOUND.has(event.action);
    if (!isLinkTransition && !isInbound) continue;

    const handle = event.linkHandle;
    if (typeof handle !== 'string' || handle.length === 0 || handle.length > 128) {
      missingLinkHandles++;
      if (isLinkTransition) evidenceGaps.add('unattributed-link-transition');
      continue;
    }

    let link = links.get(handle);
    if (!link) {
      if (links.size >= MAX_HANDLES) {
        untrackedLinkEvents++;
        evidenceGaps.add('distinct-link-limit');
        continue;
      }
      link = { open: false, everOpened: false };
      links.set(handle, link);
    }

    if (event.action === 'link-up') {
      if (link.open) repeatedLinkUps++;
      else {
        if (link.everOpened) reusedLinkHandles++;
        link.everOpened = true;
        link.open = true;
        active++;
        peakActive = Math.max(peakActive, active);
      }
    } else if (event.action === 'link-down') {
      if (!link.open) unmatchedLinkDowns++;
      else {
        link.open = false;
        active--;
      }
    } else if (!link.everOpened) {
      inboundWithoutObservedUp++;
    } else if (!link.open) {
      inboundAfterObservedDown++;
    } else {
      inboundWhileObservedOpen++;
    }
  }

  if (snapshot.overflowCount > 0) evidenceGaps.add('native-recorder-overflow');
  if (snapshot.active || events.length < 2 ||
      first?.action !== 'diagnostics-started' ||
      events[events.length - 1]?.action !== 'diagnostics-stopped') {
    evidenceGaps.add('capture-boundary');
  }

  return {
    schema: 'loc8.mesh-link-epoch-evidence.v1' as const,
    evidenceClass: 'local-recorder-link-order-not-verified-peer-or-rf' as const,
    quality: evidenceGaps.size ? 'INCOMPLETE' as const : 'RECORDED' as const,
    observedDistinctLinkHandles: links.size,
    observedPeakOpenLinkHandles: peakActive,
    observedOpenAtExport: active,
    observedRepeatedLinkUps: repeatedLinkUps,
    observedUnmatchedLinkDowns: unmatchedLinkDowns,
    observedReopenedLinkHandles: reusedLinkHandles,
    observedInboundWithOpenLink: inboundWhileObservedOpen,
    observedInboundWithoutPriorUp: inboundWithoutObservedUp,
    observedInboundAfterLastDown: inboundAfterObservedDown,
    unattributedRelevantEvents: missingLinkHandles,
    untrackedLinkEvents,
    invalidRows,
    invalidLocalClockEvents: invalidClocks,
    reviewSuggested: unmatchedLinkDowns > 0 || repeatedLinkUps > 0 ||
      inboundWithoutObservedUp > 0 || inboundAfterObservedDown > 0,
    evidenceGaps: [...evidenceGaps].sort(),
    // Neither packets nor route policies are altered by this analysis.
    productionRelayRecommendation: 'NO_CHANGE' as const,
  };
}
