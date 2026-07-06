import { SimulatedTransport } from '../SimulatedTransport';
import type { Packet } from '../../core/types';

const ORIGIN = { latitude: 37.7749, longitude: -122.4194 };
const FRIENDS = [
  { id: 101, name: 'Maya', color: '#4be3c0', startBearingDeg: 45, startDistanceM: 80 },
  { id: 102, name: 'Jules', color: '#ff9a5a', startBearingDeg: 210, startDistanceM: 140 },
  { id: 103, name: 'Sam', color: '#8c9aff', startBearingDeg: 270, startDistanceM: 210, relayVia: 'Maya', lagTicks: 2 },
];

function collect(t: SimulatedTransport, ticks: number): Packet[] {
  const out: Packet[] = [];
  t.onPacket((p) => out.push(p));
  for (let i = 0; i < ticks; i++) t.tick();
  return out;
}

function makeTransport(seed = 7) {
  let clock = 1000;
  return new SimulatedTransport({
    seed, origin: ORIGIN, friends: FRIENDS,
    nowSec: () => (clock += 2), // each tick advances sim time 2s
  });
}

describe('SimulatedTransport', () => {
  it('same seed → identical packet streams (deterministic)', () => {
    const a = collect(makeTransport(7), 5).map((p) => `${p.senderId}:${p.latitude.toFixed(8)},${p.longitude.toFixed(8)}`);
    const b = collect(makeTransport(7), 5).map((p) => `${p.senderId}:${p.latitude.toFixed(8)},${p.longitude.toFixed(8)}`);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });
  it('different seeds → different walks', () => {
    const a = collect(makeTransport(7), 5).map((p) => p.latitude);
    const b = collect(makeTransport(8), 5).map((p) => p.latitude);
    expect(a).not.toEqual(b);
  });
  it('friends move at festival amble (~2.6m per 2s tick)', () => {
    const t = makeTransport();
    const pks = collect(t, 2).filter((p) => p.senderId === 101);
    expect(pks.length).toBe(2);
    const meters =
      Math.hypot(
        (pks[1].latitude - pks[0].latitude) * 111320,
        (pks[1].longitude - pks[0].longitude) * 111320 * Math.cos((ORIGIN.latitude * Math.PI) / 180),
      );
    expect(meters).toBeGreaterThan(0.5);
    expect(meters).toBeLessThan(6);
  });
  it('lagged relay friend delivers packets late with relayVia set', () => {
    const t = makeTransport();
    const relayed: string[] = [];
    t.onPacket((p, via) => { if (p.senderId === 103 && via) relayed.push(via); });
    for (let i = 0; i < 4; i++) t.tick();
    expect(relayed.length).toBeGreaterThan(0);   // arrives after lagTicks
    expect(relayed[0]).toBe('Maya');
  });
  it('goDark stops packets; return resumes', () => {
    const t = makeTransport();
    t.scenario('goDark', 101);
    const dark = collect(t, 3).filter((p) => p.senderId === 101);
    expect(dark.length).toBe(0);
    t.scenario('return', 101);
    const back: Packet[] = [];
    t.onPacket((p) => { if (p.senderId === 101) back.push(p); });
    t.tick();
    expect(back.length).toBe(1);
  });
});
