import { useGuardStore, badgeLabel, INCIDENT_TYPES } from '../guardStore';

beforeEach(() => useGuardStore.getState().reset());

describe('guardStore — duty lifecycle', () => {
  it('goOnDuty sets duty + stamps time + applies shift/badge', () => {
    useGuardStore.getState().goOnDuty({ venue: 'The Warehouse', zone: 'Zone 4' }, 12, 1000);
    const s = useGuardStore.getState();
    expect(s.onDuty).toBe(true);
    expect(s.onDutySinceSec).toBe(1000);
    expect(s.shift.venue).toBe('The Warehouse');
    expect(s.shift.zone).toBe('Zone 4');
    expect(s.badge).toBe(12);
  });

  it('goOffDuty clears duty and any live SOS', () => {
    const g = useGuardStore.getState();
    g.goOnDuty(undefined, undefined, 500);
    g.raiseSos('SOS · Guard 07', 600);
    g.goOffDuty();
    const s = useGuardStore.getState();
    expect(s.onDuty).toBe(false);
    expect(s.sosActive).toBe(false);
    expect(s.sosAtSec).toBeNull();
  });
});

describe('guardStore — SOS', () => {
  it('raiseSos activates, stamps and sets the dispatch label; cancelSos clears', () => {
    useGuardStore.getState().raiseSos('SOS · Guard 07', 4242);
    expect(useGuardStore.getState().sosActive).toBe(true);
    expect(useGuardStore.getState().sosAtSec).toBe(4242);
    expect(useGuardStore.getState().dispatchLabel).toBe('SOS · Guard 07');
    useGuardStore.getState().cancelSos();
    expect(useGuardStore.getState().sosActive).toBe(false);
    expect(useGuardStore.getState().sosAtSec).toBeNull();
  });

  it('setDispatch sets/clears the incident caption independently of SOS', () => {
    useGuardStore.getState().setDispatch('Gate C · fight');
    expect(useGuardStore.getState().dispatchLabel).toBe('Gate C · fight');
    expect(useGuardStore.getState().sosActive).toBe(false);
    useGuardStore.getState().setDispatch(null);
    expect(useGuardStore.getState().dispatchLabel).toBeNull();
  });
});

describe('guardStore — muster', () => {
  it('call → mark safe → end', () => {
    const g = useGuardStore.getState();
    g.callMuster();
    expect(useGuardStore.getState().musterActive).toBe(true);
    expect(useGuardStore.getState().mustered).toBe(false);
    g.markSafe();
    expect(useGuardStore.getState().mustered).toBe(true);
    g.endMuster();
    expect(useGuardStore.getState().musterActive).toBe(false);
    expect(useGuardStore.getState().mustered).toBe(false);
  });
});

describe('guardStore — incidents', () => {
  it('logs newest-first with an id, type, location, floor and reporter', () => {
    const g = useGuardStore.getState();
    g.logIncident('Fight', 'Gate C', 'Guard 07', 0, 100);
    g.logIncident('Medical', 'Bar', 'Guard 05', 2, 200);
    const list = useGuardStore.getState().incidents;
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ type: 'Medical', location: 'Bar', byLabel: 'Guard 05', floor: 2, atSec: 200 });
    expect(list[1]).toMatchObject({ type: 'Fight', floor: 0 });
    expect(list[0].id).not.toBe(list[1].id);
  });

  it('covers the five gallery incident types', () => {
    expect(INCIDENT_TYPES).toEqual(['Fight', 'Medical', 'Ejection', 'Suspicious', 'Lost person']);
  });
});

describe('badgeLabel', () => {
  it('two-digit, zero-padded, mod 100', () => {
    expect(badgeLabel(7)).toBe('07');
    expect(badgeLabel(105)).toBe('05');
    expect(badgeLabel(42)).toBe('42');
  });
});
