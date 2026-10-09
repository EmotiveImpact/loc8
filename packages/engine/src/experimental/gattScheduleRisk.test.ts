import { analyseGattSchedule, type GattLinkSchedule } from './gattScheduleRisk';
const link = (id: string, phaseMs = 0, driftPpm = 0): GattLinkSchedule => ({
  id, intervalMs:100, phaseMs, eventMs:4, driftPpm,
});
const sim = (links: GattLinkSchedule[], horizonMs = 10_000) =>
  analyseGattSchedule({links,horizonMs,bucketMs:1000});

describe('R5 BLE timing research model', () => {
  test('does not invent packet loss or change the production relay', () => {
    const r=sim([link('a')]);
    expect(r.totalEvents).toBe(100);
    expect(r.overlappingPairs).toBe(0);
    expect(r.productionRelayRecommendation).toBe('NO_CHANGE');
    expect(Object.hasOwn(r,'packetLoss')).toBe(false);
  });
  test('co-phased and just-touching windows differ', () => {
    expect(sim([link('a'),link('b')]).overlappingPairs).toBe(100);
    expect(sim([link('a'),link('b',4)]).overlappingPairs).toBe(0);
  });
  test('a clock-drift fixture eventually creates recurring opportunities', () => {
    expect(sim([link('a'),link('b',10)],240_000).overlappingPairs).toBe(0);
    const r=sim([link('a',0,50),link('b',10,-50)],240_000);
    expect(r.overlappingPairs).toBe(800);
    expect(r.overlappingEvents).toBe(1600);
  });
  test('churn and admission budgets remain bounded', () => {
    const r=sim([{...link('a'),activeUntilMs:1000},{...link('b'),activeFromMs:1000}]);
    expect(r.totalEvents).toBe(100);
    expect(r.overlappingPairs).toBe(0);
    expect(()=>sim([link('a'),link('a')])).toThrow();
  });
});
