// Store-level tests: the audit trail is the privacy contract, so we assert that
// every accountable action writes exactly the audit entry we expect (and that a
// refused search writes nothing).
import { useCommandStore } from '../commandStore';
import { buildIncidents, buildStaff } from '../../domain/sim';

const reset = () => {
  const staff = buildStaff(1_000_000);
  useCommandStore.setState({
    staff,
    incidents: buildIncidents(staff, 1_000_000),
    auditLog: [],
    dispatchLog: [],
    lastSearch: null,
    lastInboundStatus: null,
    activeIncidentId: 'SOS-0442',
  });
};

beforeEach(reset);

describe('incident actions write audit + timeline', () => {
  it('escalate marks the incident and logs an alert', () => {
    useCommandStore.getState().escalate('SOS-0442');
    const st = useCommandStore.getState();
    const inc = st.incidents.find((i) => i.id === 'SOS-0442')!;
    expect(inc.status).toBe('escalated');
    expect(inc.timeline.at(-1)!.text).toMatch(/Escalated to police/);
    expect(st.auditLog[0].action).toBe('escalate');
  });

  it('acknowledge transitions active → acknowledged and logs', () => {
    useCommandStore.getState().acknowledge('SOS-0442');
    const st = useCommandStore.getState();
    expect(st.incidents.find((i) => i.id === 'SOS-0442')!.status).toBe('acknowledged');
    expect(st.auditLog[0].action).toBe('acknowledge');
  });
});

describe('dispatch reuses the engine wire codec', () => {
  it('records the frame count and an audit entry', () => {
    useCommandStore.getState().dispatch('Converge on Gate C — hold cordon', { incidentId: 'SOS-0442' });
    const st = useCommandStore.getState();
    expect(st.dispatchLog[0].frames).toBeGreaterThanOrEqual(1);
    expect(st.dispatchLog[0].text).toMatch(/Converge/);
    expect(st.auditLog[0].action).toBe('dispatch');
    expect(st.incidents.find((i) => i.id === 'SOS-0442')!.timeline.at(-1)!.text).toMatch(/Dispatch:/);
  });
});

describe('muster is logged', () => {
  it('activates and audits', () => {
    useCommandStore.getState().callMuster();
    const st = useCommandStore.getState();
    expect(st.muster.active).toBe(true);
    expect(st.auditLog[0].action).toBe('muster');
  });
});

describe('inbound Guard status', () => {
  it('updates the responder and records it for the toast', () => {
    useCommandStore.getState().applyGuardStatus(5, 2); // On scene
    const st = useCommandStore.getState();
    expect(st.lastInboundStatus).not.toBeNull();
    expect(st.lastInboundStatus!.staffId).toBe(5);
    expect(st.lastInboundStatus!.label).toBe('On scene');
    expect(st.staff[5].status).toBe('responding');
  });
});

describe('assisted search through the store', () => {
  it('a valid search logs one assisted_search entry', () => {
    const res = useCommandStore.getState().runAssistedSearch('Priya', 'lost-child report at Gate C');
    const st = useCommandStore.getState();
    expect(res.ok).toBe(true);
    expect(st.auditLog[0].action).toBe('assisted_search');
    expect(st.lastSearch!.matches.length).toBeGreaterThan(0);
  });

  it('a refused search (no reason) writes NOTHING to the audit log', () => {
    const before = useCommandStore.getState().auditLog.length;
    const res = useCommandStore.getState().runAssistedSearch('Priya', '');
    const st = useCommandStore.getState();
    expect(res.ok).toBe(false);
    expect(st.auditLog.length).toBe(before); // nothing logged, but nothing revealed either
    expect(st.lastSearch).toBeNull();
  });
});
