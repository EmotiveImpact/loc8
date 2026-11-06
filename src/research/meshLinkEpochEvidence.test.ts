import { analyseMeshLinkEpochEvidence } from './meshLinkEpochEvidence';

const row = (eventIndex: number, action: string, ms: number, handle: string | null = null,
  extra: Record<string, unknown> = {}) => ({
  eventIndex, action, monotonicNs: String(BigInt(ms) * 1_000_000n),
  frameId: null as string | null, linkHandle: handle,
  runId: 'loc8-epoch-test', cohortId: 'three-phones',
  blockId: 'relay-a-c-1', deviceRole: 'B', ...extra,
});
const snapshot = (events: ReturnType<typeof row>[], extra: Record<string, unknown> = {}) =>
  ({ events, overflowCount: 0, active: false, ...extra });

describe('R9 device-local GATT link epoch evidence', () => {
  it('counts recorded link sessions and activity without leaking run-scoped handles', () => {
    const r = analyseMeshLinkEpochEvidence(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'link-up', 100, 'private-link-01'),
      row(2, 'ingress', 110, 'private-link-01'),
      row(3, 'duplicate-drop', 120, 'private-link-01'),
      row(4, 'link-down', 200, 'private-link-01'),
      row(5, 'link-up', 300, 'private-link-01'),
      row(6, 'application-delivery', 310, 'private-link-01'),
      row(7, 'link-down', 400, 'private-link-01'),
      row(8, 'diagnostics-stopped', 500),
    ]));
    expect(r.quality).toBe('RECORDED');
    expect(r.observedDistinctLinkHandles).toBe(1);
    expect(r.observedReopenedLinkHandles).toBe(1);
    expect(r.observedInboundWithOpenLink).toBe(3);
    expect(r.observedOpenAtExport).toBe(0);
    expect(r.observedPeakOpenLinkHandles).toBe(1);
    expect(r.reviewSuggested).toBe(false);
    expect(JSON.stringify(r)).not.toContain('private-link-01');
  });

  it('flags ordering observations without calling them confirmed stale packets', () => {
    const r = analyseMeshLinkEpochEvidence(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'ingress', 10, 'A'),
      row(2, 'link-up', 20, 'A'),
      row(3, 'link-up', 21, 'A'),
      row(4, 'link-down', 30, 'A'),
      row(5, 'duplicate-drop', 31, 'A'),
      row(6, 'link-down', 40, 'A'),
      row(7, 'diagnostics-stopped', 50),
    ]));
    expect(r.quality).toBe('RECORDED');
    expect(r.reviewSuggested).toBe(true);
    expect(r.observedInboundWithoutPriorUp).toBe(1);
    expect(r.observedInboundAfterLastDown).toBe(1);
    expect(r.observedRepeatedLinkUps).toBe(1);
    expect(r.observedUnmatchedLinkDowns).toBe(1);
    expect(r).not.toHaveProperty('stalePackets');
    expect(r).not.toHaveProperty('collisionRate');
  });

  it('keeps different link handles distinct and never uses sender wall clocks', () => {
    const r = analyseMeshLinkEpochEvidence(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'link-up', 10, 'A', { senderTimestampSec: -140 }),
      row(2, 'link-up', 20, 'B', { senderTimestampSec: 999999 }),
      row(3, 'ingress', 25, 'B', { senderTimestampSec: -140 }),
      row(4, 'link-down', 30, 'A'),
      row(5, 'link-down', 40, 'B'),
      row(6, 'diagnostics-stopped', 50),
    ]));
    expect(r.observedPeakOpenLinkHandles).toBe(2);
    expect(r.observedInboundWithOpenLink).toBe(1);
    expect(r.quality).toBe('RECORDED');
    expect(JSON.stringify(r)).not.toContain('senderTimestampSec');
  });

  it('fails the evidence quality gate on overflow, context drift, bad time and incomplete export', () => {
    const clean = [row(0, 'diagnostics-started', 0), row(1, 'diagnostics-stopped', 50)];
    expect(analyseMeshLinkEpochEvidence(snapshot(clean, { overflowCount: 1 })).quality).toBe('INCOMPLETE');
    expect(analyseMeshLinkEpochEvidence(snapshot(clean, { active: true })).quality).toBe('INCOMPLETE');
    expect(analyseMeshLinkEpochEvidence(snapshot([clean[0], { ...clean[1], deviceRole: 'C' }])).invalidRows).toBe(1);
    expect(analyseMeshLinkEpochEvidence(snapshot([clean[0], { ...clean[1], monotonicNs: 'invalid' }])).invalidLocalClockEvents).toBe(1);
    expect(analyseMeshLinkEpochEvidence(snapshot([clean[0], { ...clean[1], monotonicNs: '-9' }])).quality).toBe('INCOMPLETE');
    expect(analyseMeshLinkEpochEvidence(snapshot([clean[0], { ...clean[1], monotonicNs: '0' }])).quality).toBe('RECORDED');
  });

  it('bounds link identities and the native snapshot', () => {
    const rows = [row(0, 'diagnostics-started', 0)];
    for (let i = 1; i <= 513; i++) rows.push(row(i, 'link-up', i, `link-${i}`));
    rows.push(row(514, 'diagnostics-stopped', 600));
    const r = analyseMeshLinkEpochEvidence(snapshot(rows));
    expect(r.observedDistinctLinkHandles).toBe(512);
    expect(r.untrackedLinkEvents).toBe(1);
    expect(r.quality).toBe('INCOMPLETE');
    expect(() => analyseMeshLinkEpochEvidence(snapshot(new Array(20001).fill(rows[0]))))
      .toThrow('invalid link epoch evidence snapshot');
  });

  it('does not classify origin/forwarding as ingress from a peer', () => {
    const r = analyseMeshLinkEpochEvidence(snapshot([
      row(0, 'diagnostics-started', 0),
      row(1, 'origin', 10),
      row(2, 'relay-forwarded', 20, 'A'),
      row(3, 'diagnostics-stopped', 30),
    ]));
    expect(r.observedInboundWithoutPriorUp).toBe(0);
    expect(r.unattributedRelevantEvents).toBe(0);
    expect(r.quality).toBe('RECORDED');
  });
});
