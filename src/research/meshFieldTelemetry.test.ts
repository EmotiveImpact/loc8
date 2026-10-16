import { analyseMeshFieldTelemetry } from './meshFieldTelemetry';

const row = (eventIndex: number, action: string, ms: number, extra: Record<string, unknown> = {}) => ({
  eventIndex, action, monotonicNs: String(ms * 1_000_000),
  frameId: null as string | null, linkHandle: null as string | null,
  runId: 'run-01', cohortId: 'two-devices', blockId: 'relay-a-c-1', deviceRole: 'B',
  ...extra,
});
describe('R6 native field observation integration', () => {
  test('link handles and pending timers are summaries, not RF claims', () => {
    const events = [
      row(0, 'diagnostics-started', 0),
      row(1, 'link-up', 1, {linkHandle: 'opaque-1'}),
      row(2, 'link-up', 2, {linkHandle: 'opaque-2'}),
      row(3, 'relay-scheduled', 4, {frameId: 'opaque-packet'}),
      row(4, 'relay-forwarded', 9, {frameId: 'opaque-packet'}),
      row(5, 'diagnostics-stopped', 20),
    ];
    const r = analyseMeshFieldTelemetry({ events, overflowCount: 0, active: false });
    expect(r.quality).toBe('RECORDED');
    expect(r.observedMaxLinkHandles).toBe(2);
    expect(r.pendingRelayP95Ms).toBe(5);
    expect(r.productionRelayRecommendation).toBe('NO_CHANGE');
    expect(JSON.stringify(r)).not.toContain('opaque-packet');
    expect(JSON.stringify(r)).not.toContain('opaque-1');
    expect(r).not.toHaveProperty('packetLoss');
  });
  test('unclosed and overflowed snapshots are incomplete', () => {
    const events = [row(0, 'diagnostics-started', 0), row(1, 'diagnostics-stopped', 1)];
    expect(analyseMeshFieldTelemetry({events,overflowCount:1,active:false}).quality).toBe('INCOMPLETE');
    expect(analyseMeshFieldTelemetry({events,overflowCount:0,active:true}).quality).toBe('INCOMPLETE');
  });
});
