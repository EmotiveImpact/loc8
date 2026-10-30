/** Read-only, device-local MESH-01 pressure evidence. No remote clock or radio claims. */
import type { FieldSnapshot } from './meshFieldTelemetry';

const WINDOW_NS = 1_000_000_000n;
const MAX_EVENTS = 20_000;

type PressureSnapshot = Pick<FieldSnapshot, 'events' | 'overflowCount' | 'active'>;

export function analyseMeshFieldPressure(snapshot: PressureSnapshot) {
  if (!snapshot || !Array.isArray(snapshot.events) || snapshot.events.length > MAX_EVENTS ||
      !Number.isSafeInteger(snapshot.overflowCount) || snapshot.overflowCount < 0 ||
      typeof snapshot.active !== 'boolean') {
    throw new RangeError('invalid field pressure snapshot');
  }

  const events = snapshot.events;
  const first = events[0];
  const anomalies = new Set<string>();
  const outstanding = new Map<string, number>();
  const linkWindow: bigint[] = [];
  let windowStart = 0;
  let previousNs: bigint | null = null;
  let firstNs: bigint | null = null;
  let lastNs: bigint | null = null;
  let linkTransitions = 0;
  let peakLinkTransitions = 0;
  let pendingCount = 0;
  let peakPending = 0;
  let unmatchedResolutions = 0;
  let clockRegressions = 0;
  let invalidTimestamps = 0;
  let badRows = 0;

  for (const [index, event] of events.entries()) {
    if (!event || event.eventIndex !== index || !first ||
        event.runId !== first.runId || event.cohortId !== first.cohortId ||
        event.blockId !== first.blockId || event.deviceRole !== first.deviceRole) {
      badRows++;
      anomalies.add('invalid-event-sequence-or-context');
      continue;
    }

    // Native monotonic time is local to THIS phone. Sender wall time is never a
    // receive gate, and clocks from separate phones must never be subtracted.
    let nowNs: bigint | null = null;
    if (typeof event.monotonicNs !== 'string' || !/^[0-9]{1,20}$/.test(event.monotonicNs)) {
      invalidTimestamps++;
      anomalies.add('invalid-local-monotonic-time');
    } else {
      const parsed = BigInt(event.monotonicNs);
      if (previousNs !== null && parsed < previousNs) {
        clockRegressions++;
        anomalies.add('local-monotonic-regression');
      } else {
        nowNs = parsed;
        previousNs = parsed;
        if (firstNs === null) firstNs = parsed;
        lastNs = parsed;
      }
    }

    if (event.action === 'link-up' || event.action === 'link-down') {
      linkTransitions++;
      if (nowNs !== null) {
        linkWindow.push(nowNs);
        while (windowStart < linkWindow.length &&
            nowNs - linkWindow[windowStart] >= WINDOW_NS) windowStart++;
        peakLinkTransitions = Math.max(peakLinkTransitions, linkWindow.length - windowStart);
      }
    }

    if (event.action === 'relay-scheduled') {
      if (typeof event.frameId === 'string' && event.frameId.length > 0) {
        outstanding.set(event.frameId, (outstanding.get(event.frameId) ?? 0) + 1);
        pendingCount++;
        peakPending = Math.max(peakPending, pendingCount);
      } else {
        anomalies.add('unattributed-relay-schedule');
      }
    } else if (event.action === 'relay-forwarded' || event.action === 'relay-cancelled') {
      const count = event.frameId ? outstanding.get(event.frameId) ?? 0 : 0;
      if (count === 0) {
        unmatchedResolutions++;
      } else {
        if (count === 1) outstanding.delete(event.frameId!);
        else outstanding.set(event.frameId!, count - 1);
        pendingCount--;
      }
    }
  }

  if (snapshot.overflowCount > 0) anomalies.add('native-overflow');
  if (snapshot.active || events.length < 2 || first?.action !== 'diagnostics-started' ||
      events[events.length - 1]?.action !== 'diagnostics-stopped') anomalies.add('missing-boundary');

  return {
    schema: 'loc8.mesh-field-pressure.v1' as const,
    evidenceClass: 'device-local-native-recorder-not-rf' as const,
    clockDomain: 'one-device-monotonic-only' as const,
    quality: anomalies.size ? 'INCOMPLETE' as const : 'RECORDED' as const,
    observedLinkTransitions: linkTransitions,
    observedPeakLinkTransitionsPer1s: peakLinkTransitions,
    observedPeakOutstandingRelayScheduleRecords: peakPending,
    observedUnresolvedRelayScheduleRecords: pendingCount,
    unmatchedRelayResolutionEvents: unmatchedResolutions,
    localClockRegressions: clockRegressions,
    invalidLocalTimestamps: invalidTimestamps,
    invalidContextOrIndexRows: badRows,
    observedLocalDurationMs: firstNs === null || lastNs === null ? null : Number(lastNs - firstNs) / 1e6,
    anomalies: [...anomalies].sort(),
    productionRelayRecommendation: 'NO_CHANGE' as const,
  };
}
