import {
  projectToCanvas,
  requiredGuards,
  levelFromCoverage,
  computeZoneDensity,
  nearestResponders,
  guardsInZone,
  VENUE_BOUNDS,
} from '../coverage';
import type { StaffMember, Zone } from '../types';

const mk = (id: number, zoneId: string, status: StaffMember['status'], loc?: [number, number]): StaffMember => ({
  id,
  name: `Guard ${id}`,
  zoneId,
  status,
  onSinceSec: 0,
  lastPingSec: 0,
  consent: 'on_duty_staff',
  location: loc ? { latitude: loc[0], longitude: loc[1] } : undefined,
});

describe('geo → canvas projection', () => {
  it('maps the bounds corners to opposite canvas corners (north up)', () => {
    const nw = projectToCanvas({ latitude: VENUE_BOUNDS.latMax, longitude: VENUE_BOUNDS.lngMin });
    const se = projectToCanvas({ latitude: VENUE_BOUNDS.latMin, longitude: VENUE_BOUNDS.lngMax });
    expect(nw.x).toBeLessThan(se.x); // west is left
    expect(nw.y).toBeLessThan(se.y); // north is up (smaller y)
  });

  it('clamps out-of-bounds coordinates into the canvas', () => {
    const p = projectToCanvas({ latitude: 60, longitude: 5 });
    expect(p.x).toBeGreaterThanOrEqual(3);
    expect(p.x).toBeLessThanOrEqual(97);
    expect(p.y).toBeGreaterThanOrEqual(3);
    expect(p.y).toBeLessThanOrEqual(97);
  });
});

describe('coverage from real staffing', () => {
  it('needs one guard per ~150 attendees (min 1)', () => {
    expect(requiredGuards(0)).toBe(1);
    expect(requiredGuards(150)).toBe(1);
    expect(requiredGuards(151)).toBe(2);
    expect(requiredGuards(420)).toBe(3);
  });

  it('grades coverage good/thin/gap', () => {
    expect(levelFromCoverage(100)).toBe('good');
    expect(levelFromCoverage(80)).toBe('good');
    expect(levelFromCoverage(79)).toBe('thin');
    expect(levelFromCoverage(40)).toBe('thin');
    expect(levelFromCoverage(0)).toBe('gap');
  });

  it('a zone with no guards is a gap', () => {
    const zone: Zone = { id: 'perimeter', name: 'PERIMETER', center: { latitude: 51.495, longitude: -0.099 }, w: 10, h: 10 };
    const staff = [mk(12, 'perimeter', 'no_signal')]; // no location → not a guard
    const d = computeZoneDensity(zone, staff, 30);
    expect(d.guardCount).toBe(0);
    expect(d.level).toBe('gap');
    expect(d.coveragePct).toBe(0);
  });

  it('SOS subjects do not count as coverage', () => {
    const zone: Zone = { id: 'gate_c', name: 'GATE C', center: { latitude: 51.4928, longitude: -0.1006 }, w: 10, h: 10 };
    const staff = [mk(7, 'gate_c', 'sos', [51.4924, -0.1003])]; // present but is the emergency
    const d = computeZoneDensity(zone, staff, 60);
    expect(d.guardCount).toBe(1); // still counted as present…
    expect(d.coveragePct).toBe(0); // …but not as coverage
  });

  it('counts only guards physically in the zone', () => {
    const staff = [mk(1, 'bar', 'on_post', [51.495, -0.0995]), mk(2, 'main_room', 'on_post', [51.4947, -0.1013])];
    expect(guardsInZone(staff, 'bar').map((s) => s.id)).toEqual([1]);
  });
});

describe('nearest-responder dispatch (geoMath)', () => {
  const incident = { latitude: 51.4924, longitude: -0.1003 };
  const staff = [
    mk(3, 'gate_c', 'responding', [51.4931, -0.1006]),
    mk(5, 'gate_c', 'responding', [51.4929, -0.1009]),
    mk(2, 'bar', 'on_post', [51.495, -0.0995]),
    mk(7, 'gate_c', 'sos', [51.4924, -0.1003]), // the subject
    mk(12, 'perimeter', 'no_signal'), // no position
  ];

  it('returns the closest guards by real distance, excluding the subject', () => {
    const ranked = nearestResponders(incident, staff, { excludeId: 7, limit: 2 });
    expect(ranked).toHaveLength(2);
    expect(ranked[0].distanceM).toBeLessThanOrEqual(ranked[1].distanceM);
    expect(ranked.map((r) => r.staff.id)).not.toContain(7); // subject excluded
    expect(ranked.map((r) => r.staff.id)).not.toContain(12); // no position excluded
    // Guard 5 is nearest to the SOS; distances are real metres, not fiction.
    expect(ranked[0].staff.id).toBe(5);
    expect(ranked[0].distanceM).toBeGreaterThan(0);
    expect(ranked[0].distanceM).toBeLessThan(200);
  });
});
