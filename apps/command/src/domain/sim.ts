// src/domain/sim.ts — the demo scenario behind the gallery mockups.
//
// This stands in for a live mesh bridge: in the field, staff + incidents arrive
// as decoded engine packets from Guard devices. Here we seed the same shapes so
// the console is fully explorable offline. NOTE the deliberate absence of any
// "all attendees" list — the crowd is only ever anonymous per-zone counts.
//
// Coverage and responder distances are NOT hand-authored: they are computed from
// the seeded staff positions (see coverage.ts), so the map and the numbers agree.

import { nowSec } from './time';
import { computeZoneDensity, nearestResponders } from './coverage';
import type { Incident, MusterState, StaffMember, Zone, ZoneDensity } from './types';

// An invented venue. Never ship a real, trademarked venue name in demo data —
// it reads as an implied customer and it isn't ours to use.
export const SITE_NAME = 'The Chapelgate Rooms';
export const SHIFT_LABEL = 'Night Shift';
/** The signed-in supervisor — every audited action is attributed to them. */
export const OPERATOR_ID = 'SUP · Night Control';

/** Command console's own mesh id (fits uint32; 0xC0 = "control"). */
export const COMMAND_ID = 0xc0;
/** A team/crew tag guards + command share, so dispatch is addressed to the team. */
export const TEAM_TAG = 4242;

/** Venue zones with real centroids (the map is a projection, not fixed px). */
export const ZONES: Zone[] = [
  { id: 'main_room', name: 'MAIN ROOM', center: { latitude: 51.4947, longitude: -0.1013 }, w: 34, h: 30 },
  { id: 'bar', name: 'BAR', center: { latitude: 51.495, longitude: -0.0995 }, w: 30, h: 24 },
  { id: 'terrace', name: 'SMOKING TERRACE', center: { latitude: 51.494, longitude: -0.1019 }, w: 30, h: 26 },
  { id: 'car_park', name: 'CAR PARK', center: { latitude: 51.4938, longitude: -0.099 }, w: 28, h: 26 },
  { id: 'gate_c', name: 'GATE C', center: { latitude: 51.4928, longitude: -0.1006 }, w: 22, h: 20 },
  { id: 'foyer', name: 'FOYER', center: { latitude: 51.4949, longitude: -0.1008 }, w: 22, h: 18 },
  { id: 'perimeter', name: 'PERIMETER', center: { latitude: 51.4952, longitude: -0.0987 }, w: 20, h: 16 },
];

/** Anonymous crowd counts per zone (the density sensor feed — counts only). */
export const ATTENDEES_BY_ZONE: Record<string, number> = {
  main_room: 420,
  bar: 260,
  terrace: 140,
  gate_c: 60,
  car_park: 90,
  perimeter: 30,
};

/** Zones that appear on the coverage heatmap (foyer is back-of-house). */
export const HEATMAP_ZONE_IDS = ['main_room', 'bar', 'terrace', 'car_park', 'gate_c', 'perimeter'];

export function buildStaff(base = nowSec()): Record<number, StaffMember> {
  const onSince = base - 6600; // ~22:00 shift start
  // onSinceSec + consent are stamped uniformly in the map() below.
  const staff: Array<Omit<StaffMember, 'onSinceSec' | 'consent'>> = [
    { id: 1, name: 'Kofi Adeyemi', zoneId: 'main_room', status: 'on_post', lastPingSec: base - 60, mustered: true, location: { latitude: 51.4948, longitude: -0.1015 } },
    { id: 2, name: 'Luca Bianchi', zoneId: 'bar', status: 'on_post', lastPingSec: base - 60, mustered: true, location: { latitude: 51.4951, longitude: -0.0996 } },
    { id: 3, name: 'Paulo Okafor', zoneId: 'gate_c', status: 'responding', lastPingSec: base - 30, mustered: true, location: { latitude: 51.4931, longitude: -0.1006 } },
    { id: 4, name: 'Jan Novak', zoneId: 'bar', status: 'on_post', lastPingSec: base - 90, mustered: true, location: { latitude: 51.495, longitude: -0.0993 } },
    { id: 5, name: 'Marcus Reyes', zoneId: 'gate_c', status: 'responding', lastPingSec: base - 30, mustered: true, location: { latitude: 51.4929, longitude: -0.1009 } },
    { id: 6, name: 'Rami Haddad', zoneId: 'terrace', status: 'on_post', lastPingSec: base - 45, mustered: true, location: { latitude: 51.4941, longitude: -0.1018 } },
    { id: 7, name: 'Priya Okafor', zoneId: 'gate_c', status: 'sos', lastPingSec: base - 68, mustered: false, location: { latitude: 51.4924, longitude: -0.1003 } },
    { id: 8, name: 'Erik Larsson', zoneId: 'main_room', status: 'on_post', lastPingSec: base - 55, mustered: true, location: { latitude: 51.4946, longitude: -0.1012 } },
    { id: 9, name: 'Sofia Delgado', zoneId: 'car_park', status: 'lone', lastPingSec: base - 240, mustered: false, location: { latitude: 51.4938, longitude: -0.0988 } },
    { id: 10, name: 'Ana Ferreira', zoneId: 'foyer', status: 'on_post', lastPingSec: base - 120, mustered: true, location: { latitude: 51.4949, longitude: -0.1008 } },
    { id: 11, name: 'Minh Nguyen', zoneId: 'terrace', status: 'on_post', lastPingSec: base - 80, mustered: true, location: { latitude: 51.494, longitude: -0.102 } },
    { id: 12, name: 'Kwame Osei', zoneId: 'perimeter', status: 'no_signal', lastPingSec: base - 600, mustered: false },
  ];
  const map: Record<number, StaffMember> = {};
  for (const s of staff) map[s.id] = { ...s, onSinceSec: onSince, consent: 'on_duty_staff' };
  return map;
}

export function buildIncidents(staff: Record<number, StaffMember>, base = nowSec()): Incident[] {
  const sosLoc = { latitude: 51.4924, longitude: -0.1003 };
  const ranked = nearestResponders(sosLoc, Object.values(staff), { excludeId: 7, limit: 2 });
  const responders = [
    ...ranked.map((r) => ({
      staffId: r.staff.id,
      name: `${r.staff.name.split(' ')[0]} · Guard ${String(r.staff.id).padStart(2, '0')}`,
      distanceM: r.distanceM,
      state: 'en_route' as const,
    })),
    { staffId: 0, name: 'Control room', state: 'viewing' as const },
  ];

  return [
    {
      id: 'SOS-0442',
      kind: 'sos',
      status: 'active',
      raisedByStaffId: 7,
      subjectName: 'Priya Okafor',
      zoneId: 'gate_c',
      location: sosLoc,
      consentBasis: 'on_duty_staff',
      raisedAtSec: base - 68,
      meshConfirmed: true,
      feedText: 'SOS — Guard 07 at Gate C',
      feedSub: `${ranked.length} dispatched · panic hold`,
      responders,
      timeline: [
        { atSec: base - 68, tone: 'alert', text: 'SOS raised — Guard 07', sub: 'panic hold · Gate C' },
        { atSec: base - 67, tone: 'info', text: 'Location broadcast over mesh', sub: '6 nodes relayed' },
        { atSec: base - 65, tone: 'info', text: 'Nearest 2 auto-dispatched', sub: ranked.map((r) => `Guard ${String(r.staff.id).padStart(2, '0')}`).join(', ') },
        ...ranked.map((r) => ({ atSec: base - 52, tone: 'info' as const, text: `Guard ${String(r.staff.id).padStart(2, '0')} acknowledged — en route`, sub: `${r.distanceM}m out` })),
        { atSec: base - 46, tone: 'ok', text: 'Control room notified', sub: 'supervisor viewing' },
      ],
    },
    {
      id: 'LW-0091',
      kind: 'lone_worker',
      status: 'acknowledged',
      raisedByStaffId: 9,
      zoneId: 'car_park',
      consentBasis: 'on_duty_staff',
      raisedAtSec: base - 240,
      meshConfirmed: true,
      feedText: 'Guard 09 lone in Car Park',
      feedSub: 'auto check-in ok',
      responders: [],
      timeline: [
        { atSec: base - 240, tone: 'info', text: 'Lone-worker check-in due', sub: 'Guard 09 · Car Park' },
        { atSec: base - 238, tone: 'ok', text: 'Auto check-in acknowledged', sub: 'no action needed' },
      ],
    },
    {
      id: 'EJ-0203',
      kind: 'ejection',
      status: 'resolved',
      raisedByStaffId: 5,
      zoneId: 'bar',
      consentBasis: 'on_duty_staff',
      raisedAtSec: base - 540,
      meshConfirmed: true,
      feedText: 'Ejection logged — Bar',
      feedSub: 'Guard 05',
      responders: [],
      timeline: [{ atSec: base - 540, tone: 'info', text: 'Ejection logged', sub: 'Bar · Guard 05' }],
    },
    {
      id: 'CAP-0117',
      kind: 'capacity',
      status: 'resolved',
      zoneId: 'main_room',
      consentBasis: 'on_duty_staff',
      raisedAtSec: base - 1620,
      meshConfirmed: true,
      feedText: 'Capacity check — Main Room',
      feedSub: '78% full',
      responders: [],
      timeline: [{ atSec: base - 1620, tone: 'info', text: 'Capacity check', sub: 'Main Room · 78% full' }],
    },
    {
      id: 'SH-0001',
      kind: 'shift',
      status: 'resolved',
      zoneId: 'perimeter',
      consentBasis: 'on_duty_staff',
      raisedAtSec: base - 6600,
      meshConfirmed: true,
      feedText: 'Shift start — 12 checked in',
      feedSub: 'Team B',
      responders: [],
      timeline: [{ atSec: base - 6600, tone: 'ok', text: 'Shift start', sub: '12 checked in' }],
    },
  ];
}

/** Anonymous crowd density per zone — computed from real staff positions. */
export function buildZoneDensity(staff: Record<number, StaffMember>): ZoneDensity[] {
  const list = Object.values(staff);
  return ZONES.filter((z) => HEATMAP_ZONE_IDS.includes(z.id)).map((z) =>
    computeZoneDensity(z, list, ATTENDEES_BY_ZONE[z.id] ?? 0),
  );
}

export function buildMuster(base = nowSec()): MusterState {
  // Not active by default — the supervisor triggers it from Operations.
  return { active: false, startedAtSec: base - 150, assemblyPoint: 'Assembly Point A' };
}
