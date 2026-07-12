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
    useCommandStore.getState().applyGuardStatus(5, 21); // On scene
    const st = useCommandStore.getState();
    expect(st.lastInboundStatus).not.toBeNull();
    expect(st.lastInboundStatus!.staffId).toBe(5);
    expect(st.lastInboundStatus!.label).toBe('On scene');
    expect(st.staff[5].status).toBe('responding');
  });
});

describe('incident ↔ person state reconciliation', () => {
  it('resolving an SOS logs a resolve, closes it, and clears the SOS person', () => {
    const s = useCommandStore.getState();
    expect(s.sosCount()).toBe(1); // one open SOS incident
    expect(s.staff[7].status).toBe('sos');
    s.resolve('SOS-0442');
    const st = useCommandStore.getState();
    const inc = st.incidents.find((i) => i.id === 'SOS-0442')!;
    expect(inc.status).toBe('resolved');
    expect(inc.closedAtSec).toBeGreaterThan(0);
    expect(st.staff[7].status).toBe('on_post'); // person reconciled off 'sos'
    expect(st.sosCount()).toBe(0); // badge/tile clear
    expect(st.auditLog[0].action).toBe('resolve'); // not 'acknowledge'
  });

  it('acknowledge is a no-op once the incident has left active', () => {
    const s = useCommandStore.getState();
    s.escalate('SOS-0442');
    const before = useCommandStore.getState().auditLog.length;
    useCommandStore.getState().acknowledge('SOS-0442'); // should do nothing
    const st = useCommandStore.getState();
    expect(st.incidents.find((i) => i.id === 'SOS-0442')!.status).toBe('escalated');
    expect(st.auditLog.length).toBe(before); // no bogus "acknowledged after escalated"
  });

  it('applyGuardStatus routes to the named incident and syncs responder state', () => {
    useCommandStore.getState().applyGuardStatus(5, 23, 'SOS-0442'); // Clear
    const inc = useCommandStore.getState().incidents.find((i) => i.id === 'SOS-0442')!;
    expect(inc.responders.find((r) => r.staffId === 5)!.state).toBe('clear');
  });
});

describe('viewing a named incident is audited (reveal_subject)', () => {
  it('logs a reveal for an incident that names an individual', () => {
    useCommandStore.getState().noteReveal('SOS-0442');
    const st = useCommandStore.getState();
    expect(st.auditLog[0].action).toBe('reveal_subject');
    expect(st.auditLog[0].subjectIds).toContain(7);
  });
});

describe('muster safety', () => {
  it('a no-signal guard cannot be checked in from the console', () => {
    useCommandStore.getState().checkIn(12); // Kwame Osei, no_signal
    expect(useCommandStore.getState().staff[12].mustered).toBe(false);
  });

  it('stand down logs a stand_down audit entry', () => {
    useCommandStore.getState().callMuster();
    useCommandStore.getState().standDownMuster();
    const st = useCommandStore.getState();
    expect(st.muster.active).toBe(false);
    expect(st.auditLog[0].action).toBe('stand_down');
  });
});

describe('silent duress (covert quickReply channel)', () => {
  it('raises a duress incident, marks the subject, audits, and never duplicates', () => {
    useCommandStore.getState().raiseDuress(2, 1_000_100); // Luca Bianchi, Bar
    const st = useCommandStore.getState();
    const inc = st.incidents.find((i) => i.kind === 'duress');
    expect(inc).toBeDefined();
    expect(inc!.status).toBe('active');
    expect(inc!.raisedByStaffId).toBe(2);
    expect(inc!.feedText).toMatch(/SILENT DURESS/);
    expect(inc!.timeline.some((t) => t.text.includes('NO acknowledgment'))).toBe(true);
    expect(st.staff[2].status).toBe('sos');
    expect(st.auditLog[0].reason).toMatch(/duress/);
    // covert protocol: repeat signals must not spawn duplicate incidents
    useCommandStore.getState().raiseDuress(2, 1_000_160);
    expect(useCommandStore.getState().incidents.filter((i) => i.kind === 'duress')).toHaveLength(1);
  });

  it('auto-identifies the nearest responder', () => {
    useCommandStore.getState().raiseDuress(2, 1_000_100);
    const inc = useCommandStore.getState().incidents.find((i) => i.kind === 'duress')!;
    expect(inc.responders.length).toBeGreaterThanOrEqual(1);
    expect(inc.responders[0].distanceM).toBeGreaterThan(0);
  });
});

describe('man-down watchdog', () => {
  it('raises + auto-dispatches for an on-duty device gone silent, exactly once', () => {
    const base = 1_000_000;
    // Sofia (9) last pinged at base-240; jump the clock past the threshold.
    const later = base + 20 * 60;
    useCommandStore.getState().runWatchdog(later);
    const st = useCommandStore.getState();
    const md = st.incidents.filter((i) => i.kind === 'man_down');
    expect(md.length).toBeGreaterThanOrEqual(1);
    const sofia = md.find((i) => i.raisedByStaffId === 9)!;
    expect(sofia).toBeDefined();
    expect(sofia.feedSub).toMatch(/watchdog/);
    expect(sofia.responders.length).toBe(1); // nearest auto-dispatched
    expect(st.staff[9].status).toBe('no_signal');
    expect(st.auditLog.some((a) => a.reason === 'man-down auto-dispatch' && a.subjectIds.includes(9))).toBe(true);
    // idempotent: same silence must not raise a second incident
    useCommandStore.getState().runWatchdog(later + 60);
    expect(
      useCommandStore.getState().incidents.filter((i) => i.kind === 'man_down' && i.raisedByStaffId === 9),
    ).toHaveLength(1);
  });

  it('does nothing while everyone is inside the threshold', () => {
    const before = useCommandStore.getState().incidents.length;
    useCommandStore.getState().runWatchdog(1_000_000 + 30); // 30s after seed
    expect(useCommandStore.getState().incidents.length).toBe(before);
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
