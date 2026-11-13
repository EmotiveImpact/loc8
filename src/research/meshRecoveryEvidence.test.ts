import { analyseMeshRecoveryEvidence } from './meshRecoveryEvidence';

const row = (eventIndex: number, action: string, ms: number, linkHandle: string | null = null,
  overrides: Record<string, unknown> = {}) => ({
  eventIndex, action, monotonicNs: String(BigInt(ms) * 1_000_000n),
  frameId: null as string | null, linkHandle,
  runId: 'loc8-recovery-test', cohortId: 'ios-android', blockId: 'relay-a-c-1',
  deviceRole: 'B', ...overrides,
});
const snapshot = (events: ReturnType<typeof row>[], extra: Record<string, unknown> = {}) =>
  ({ events, active: false, overflowCount: 0, ...extra });

describe('R10 local reconnect evidence', () => {
  it('pairs down/up on one handle and measures first inbound on the local monotonic clock', () => {
    const result = analyseMeshRecoveryEvidence(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'link-up', 10, 'secret-1'),
      row(2, 'link-down', 40, 'secret-1'),
      row(3, 'link-up', 140, 'secret-1'),
      row(4, 'ingress', 160, 'secret-1'),
      row(5, 'ingress', 180, 'secret-1'),
      row(6, 'diagnostics-stopped', 200),
    ]));
    expect(result.quality).toBe('RECORDED');
    expect(result.observedSameHandleReopens).toBe(1);
    expect(result.observedSameHandleReconnectP95Ms).toBe(100);
    expect(result.observedReopenFirstInboundCount).toBe(1);
    expect(result.observedReopenToFirstInboundP95Ms).toBe(20);
    expect(result.observedDownWithoutSameHandleReopen).toBe(0);
    expect(JSON.stringify(result)).not.toContain('secret-1');
  });

  it('does not mistake a new privacy address/handle for the old peer', () => {
    const result = analyseMeshRecoveryEvidence(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'link-up', 10, 'old'),
      row(2, 'link-down', 20, 'old'),
      row(3, 'link-up', 35, 'new'),
      row(4, 'ingress', 40, 'new'),
      row(5, 'diagnostics-stopped', 50),
    ]));
    expect(result.observedSameHandleReopens).toBe(0);
    expect(result.observedDownWithoutSameHandleReopen).toBe(1);
    expect(result.observedReopenFirstInboundCount).toBe(0);
    expect(result.observedSameHandleReconnectP95Ms).toBeNull();
  });

  it('counts a reopened idle link without calling it a failed transport', () => {
    const result = analyseMeshRecoveryEvidence(snapshot([
      row(0, 'diagnostics-started', 0), row(1, 'link-up', 1, 'A'),
      row(2, 'link-down', 2, 'A'), row(3, 'link-up', 12, 'A'),
      row(4, 'diagnostics-stopped', 20),
    ]));
    expect(result.observedReopensWithoutSubsequentInbound).toBe(1);
    expect(result.observedReopenToFirstInboundP95Ms).toBeNull();
    expect(result.quality).toBe('RECORDED');
    expect(result).not.toHaveProperty('scanRecovered');
    expect(result).not.toHaveProperty('radioUptime');
  });

  it('does not double-count repeated up or unexplained down as recovery', () => {
    const result = analyseMeshRecoveryEvidence(snapshot([
      row(0, 'diagnostics-started', 0), row(1, 'link-down', 1, 'A'),
      row(2, 'link-up', 2, 'A'), row(3, 'link-up', 3, 'A'),
      row(4, 'diagnostics-stopped', 4),
    ]));
    expect(result.observedSameHandleReopens).toBe(0);
    expect(result.unmatchedLinkDownEvents).toBe(1);
    expect(result.repeatedLinkUpEvents).toBe(1);
    expect(result.reviewSuggested).toBe(true);
  });

  it('rejects impossible capture size and degrades missing context, overflow and clock regression', () => {
    const good = [row(0, 'diagnostics-started', 5), row(1, 'diagnostics-stopped', 10)];
    expect(() => analyseMeshRecoveryEvidence(snapshot(new Array(20001).fill(good[0])))).toThrow();
    expect(analyseMeshRecoveryEvidence(snapshot(good, { overflowCount: 1 })).quality).toBe('INCOMPLETE');
    expect(analyseMeshRecoveryEvidence(snapshot(good, { active: true })).quality).toBe('INCOMPLETE');
    expect(analyseMeshRecoveryEvidence(snapshot([good[0], { ...good[1], runId: 'different' }])).quality).toBe('INCOMPLETE');
    expect(analyseMeshRecoveryEvidence(snapshot([good[0], { ...good[1], monotonicNs: '0' }])).invalidLocalClockRows).toBe(1);
  });

  it('bounds identities and refuses to correlate other phones by sender clock', () => {
    const rows = [row(0, 'diagnostics-started', 0)];
    for (let i = 1; i <= 513; i++) rows.push(row(i, 'link-up', i, 'hidden-' + i, { senderTimestampSec: -140 }));
    rows.push(row(514, 'diagnostics-stopped', 514));
    const result = analyseMeshRecoveryEvidence(snapshot(rows));
    expect(result.observedDistinctHandles).toBe(512);
    expect(result.untrackedLinkEvents).toBe(1);
    expect(result.quality).toBe('INCOMPLETE');
    expect(JSON.stringify(result)).not.toContain('hidden-');
    expect(JSON.stringify(result)).not.toContain('senderTimestampSec');
  });
});
