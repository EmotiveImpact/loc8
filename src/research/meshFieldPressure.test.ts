import { analyseMeshFieldPressure } from './meshFieldPressure';

const row = (eventIndex: number, action: string, ms: number, extra: Record<string, unknown> = {}) => ({
  eventIndex, action, monotonicNs: String(BigInt(ms) * 1_000_000n),
  frameId: null as string | null, linkHandle: null as string | null,
  runId: 'loc8-test-01', cohortId: 'crowd', blockId: 'relay-a-c-1', deviceRole: 'B',
  ...extra,
});
const snapshot = (events: ReturnType<typeof row>[], extra: Record<string, unknown> = {}) =>
  ({ events, overflowCount: 0, active: false, ...extra });

describe('R8 device-local field pressure evidence', () => {
  it('counts link churn within one second without claiming RF throughput', () => {
    const result = analyseMeshFieldPressure(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'link-up', 100, { linkHandle: 'private-handle' }),
      row(2, 'link-down', 200, { linkHandle: 'private-handle' }),
      row(3, 'link-up', 1100, { linkHandle: 'private-handle' }),
      row(4, 'diagnostics-stopped', 2000),
    ]));
    expect(result.quality).toBe('RECORDED');
    expect(result.observedLinkTransitions).toBe(3);
    expect(result.observedPeakLinkTransitionsPer1s).toBe(2);
    expect(result.clockDomain).toBe('one-device-monotonic-only');
    expect(JSON.stringify(result)).not.toContain('private-handle');
    expect(result).not.toHaveProperty('radioThroughput');
  });

  it('accounts for repeated same-frame schedules without exposing frame identity', () => {
    const result = analyseMeshFieldPressure(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'relay-scheduled', 10, { frameId: 'private-frame' }),
      row(2, 'relay-scheduled', 20, { frameId: 'private-frame' }),
      row(3, 'relay-cancelled', 30, { frameId: 'private-frame' }),
      row(4, 'relay-forwarded', 40, { frameId: 'private-frame' }),
      row(5, 'diagnostics-stopped', 50),
    ]));
    expect(result.observedPeakOutstandingRelayScheduleRecords).toBe(2);
    expect(result.observedUnresolvedRelayScheduleRecords).toBe(0);
    expect(result.unmatchedRelayResolutionEvents).toBe(0);
    expect(JSON.stringify(result)).not.toContain('private-frame');
  });

  it('reports unresolved and unmatched records separately from actual native queue depth', () => {
    const result = analyseMeshFieldPressure(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'relay-scheduled', 10, { frameId: 'a' }),
      row(2, 'relay-forwarded', 20, { frameId: 'b' }),
      row(3, 'diagnostics-stopped', 30),
    ]));
    expect(result.observedUnresolvedRelayScheduleRecords).toBe(1);
    expect(result.unmatchedRelayResolutionEvents).toBe(1);
    expect(result.evidenceClass).toBe('device-local-native-recorder-not-rf');
  });

  it('never uses an originator clock to gate arrival or derive inter-phone latency', () => {
    const uptime = 9_999_999_999_999_990_000n;
    const result = analyseMeshFieldPressure(snapshot([
      row(0, 'diagnostics-started', 0, { monotonicNs: String(uptime) }),
      row(1, 'link-up', 100, { monotonicNs: String(uptime + 123_000_000n), senderTimestampSec: -140 }),
      row(2, 'diagnostics-stopped', 1000, { monotonicNs: String(uptime + 1_000_000_000n) }),
    ]));
    expect(result.quality).toBe('RECORDED');
    expect(result.observedLocalDurationMs).toBe(1000);
    expect(result).not.toHaveProperty('crossDeviceLatencyMs');
    expect(result).not.toHaveProperty('senderTimestampSec');
  });

  it('marks local clock regressions and excludes them from burst peaks', () => {
    const result = analyseMeshFieldPressure(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'link-up', 100),
      row(2, 'link-down', 900),
      row(3, 'link-up', 200),
      row(4, 'diagnostics-stopped', 1200),
    ]));
    expect(result.localClockRegressions).toBe(1);
    expect(result.quality).toBe('INCOMPLETE');
    expect(result.observedPeakLinkTransitionsPer1s).toBe(2);
  });

  it('bounds snapshots and fails closed on invalid clock, context or capture boundaries', () => {
    const baseline = [row(0, 'diagnostics-started', 0), row(1, 'diagnostics-stopped', 1)];
    expect(analyseMeshFieldPressure(snapshot(baseline, { overflowCount: 1 })).quality).toBe('INCOMPLETE');
    expect(analyseMeshFieldPressure(snapshot(baseline, { active: true })).quality).toBe('INCOMPLETE');
    expect(analyseMeshFieldPressure(snapshot([baseline[0], { ...baseline[1], monotonicNs: 'bad' }])).invalidLocalTimestamps).toBe(1);
    expect(analyseMeshFieldPressure(snapshot([baseline[0], { ...baseline[1], deviceRole: 'C' }])).invalidContextOrIndexRows).toBe(1);
    expect(() => analyseMeshFieldPressure(snapshot(new Array(20001).fill(row(0, 'ingress', 0))))).toThrow('invalid field pressure snapshot');
  });
});
