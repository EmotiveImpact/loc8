// src/domain/sim.ts — the demo scenario behind the gallery mockups.
//
// This stands in for a live mesh bridge: in the field, staff + incidents arrive
// as decoded engine packets from Guard devices. Here we seed the same shapes so
// the console is fully explorable offline. NOTE the deliberate absence of any
// "all attendees" list — the crowd is only ever the anonymous zoneDensity below.

import { nowSec } from './time';
import { toZoneDensity } from './zones';
import type {
  Incident,
  MusterState,
  StaffMember,
  Zone,
  ZoneDensity,
} from './types';

export const SITE_NAME = 'Ministry of Sound';
export const SHIFT_LABEL = 'Night Shift';
/** The signed-in supervisor — every audited action is attributed to them. */
export const OPERATOR_ID = 'SUP · Night Control';

/** A team/crew tag guards + command share, so dispatch is addressed to the team. */
export const TEAM_TAG = 4242;

/** Venue zones with layout hints (0..100 of the tactical canvas). */
export const ZONES: Zone[] = [
  { id: 'main_room', name: 'MAIN ROOM', x: 6, y: 8, w: 40, h: 40 },
  { id: 'bar', name: 'BAR', x: 54, y: 8, w: 40, h: 32 },
  { id: 'terrace', name: 'SMOKING TERRACE', x: 6, y: 56, w: 40, h: 36 },
  { id: 'car_park', name: 'CAR PARK', x: 54, y: 50, w: 40, h: 42 },
  { id: 'gate_c', name: 'GATE C', x: 70, y: 6, w: 24, h: 22 },
  { id: 'foyer', name: 'FOYER', x: 6, y: 8, w: 30, h: 24 },
  { id: 'perimeter', name: 'PERIMETER', x: 2, y: 2, w: 96, h: 96 },
];

export function buildStaff(base = nowSec()): Record<number, StaffMember> {
  const onSince = base - 6600; // ~22:00 shift start
  // onSinceSec + consent are stamped uniformly in the map() below.
  const staff: Array<Omit<StaffMember, 'onSinceSec' | 'consent'>> = [
    { id: 1, name: 'Kofi Adeyemi', zoneId: 'main_room', status: 'on_post', lastPingSec: base - 60, mustered: true, location: { latitude: 51.4948, longitude: -0.1015 } },
    { id: 2, name: 'Luca Bianchi', zoneId: 'bar', status: 'on_post', lastPingSec: base - 60, mustered: true, location: { latitude: 51.4951, longitude: -0.0996 } },
    { id: 3, name: 'Paulo Okafor', zoneId: 'gate_c', status: 'responding', lastPingSec: base - 30, mustered: true, location: { latitude: 51.4931, longitude: -0.1006 } },
    { id: 4, name: 'Jan Novak', zoneId: 'bar', status: 'on_post', lastPingSec: base - 90, mustered: true, location: { latitude: 51.4950, longitude: -0.0993 } },
    { id: 5, name: 'Marcus Reyes', zoneId: 'gate_c', status: 'responding', lastPingSec: base - 30, mustered: true, location: { latitude: 51.4929, longitude: -0.1009 } },
    { id: 6, name: 'Rami Haddad', zoneId: 'terrace', status: 'on_post', lastPingSec: base - 45, mustered: true, location: { latitude: 51.4941, longitude: -0.1018 } },
    { id: 7, name: 'Priya Okafor', zoneId: 'gate_c', status: 'sos', lastPingSec: base - 68, mustered: false, location: { latitude: 51.4924, longitude: -0.1003 } },
    { id: 8, name: 'Erik Larsson', zoneId: 'main_room', status: 'on_post', lastPingSec: base - 55, mustered: true, location: { latitude: 51.4946, longitude: -0.1012 } },
    { id: 9, name: 'Sofia Delgado', zoneId: 'car_park', status: 'lone', lastPingSec: base - 240, mustered: false, location: { latitude: 51.4938, longitude: -0.0988 } },
    { id: 10, name: 'Ana Ferreira', zoneId: 'foyer', status: 'on_post', lastPingSec: base - 120, mustered: true, location: { latitude: 51.4949, longitude: -0.1008 } },
    { id: 11, name: 'Minh Nguyen', zoneId: 'terrace', status: 'on_post', lastPingSec: base - 80, mustered: true, location: { latitude: 51.4940, longitude: -0.1020 } },
    { id: 12, name: 'Kwame Osei', zoneId: 'perimeter', status: 'no_signal', lastPingSec: base - 600, mustered: false },
  ];
  const map: Record<number, StaffMember> = {};
  for (const s of staff) map[s.id] = { ...s, onSinceSec: onSince, consent: 'on_duty_staff' };
  return map;
}

export function buildIncidents(base = nowSec()): Incident[] {
  return [
    {
      id: 'SOS-0442',
      kind: 'sos',
      status: 'active',
      raisedByStaffId: 7,
      subjectName: 'Priya Okafor',
      zoneId: 'gate_c',
      location: { latitude: 51.4924, longitude: -0.1003 },
      consentBasis: 'on_duty_staff',
      raisedAtSec: base - 68,
      meshConfirmed: true,
      feedText: 'SOS — Guard 07 at Gate C',
      feedSub: '2 dispatched · panic hold',
      responders: [
        { staffId: 5, name: 'Marcus · Guard 05', etaMin: 40, state: 'en_route' },
        { staffId: 3, name: 'Paulo · Guard 03', etaMin: 85, state: 'en_route' },
        { staffId: 0, name: 'Control room', state: 'viewing' },
      ],
      timeline: [
        { atSec: base - 68, tone: 'alert', text: 'SOS raised — Guard 07', sub: 'panic hold · Gate C' },
        { atSec: base - 67, tone: 'info', text: 'Location broadcast over mesh', sub: '6 nodes relayed' },
        { atSec: base - 65, tone: 'info', text: 'Nearest 2 auto-dispatched', sub: 'Guard 05, Guard 03' },
        { atSec: base - 52, tone: 'info', text: 'Guard 05 acknowledged — en route', sub: 'ETA 40m' },
        { atSec: base - 47, tone: 'info', text: 'Guard 03 acknowledged — en route', sub: 'ETA 85m' },
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

/** Anonymous crowd density per zone — COUNTS ONLY, the safe operator overview. */
export function buildZoneDensity(): ZoneDensity[] {
  return [
    toZoneDensity({ zoneId: 'main_room', guardCount: 2, attendeeCount: 420, coveragePct: 100 }),
    toZoneDensity({ zoneId: 'bar', guardCount: 2, attendeeCount: 260, coveragePct: 100 }),
    toZoneDensity({ zoneId: 'terrace', guardCount: 2, attendeeCount: 140, coveragePct: 100 }),
    toZoneDensity({ zoneId: 'gate_c', guardCount: 1, attendeeCount: 60, coveragePct: 88 }),
    toZoneDensity({ zoneId: 'car_park', guardCount: 1, attendeeCount: 90, coveragePct: 55 }),
    toZoneDensity({ zoneId: 'perimeter', guardCount: 0, attendeeCount: 30, coveragePct: 20 }),
  ];
}

export function buildMuster(base = nowSec()): MusterState {
  // Not active by default — the supervisor triggers it from Operations.
  return { active: false, startedAtSec: base - 150, assemblyPoint: 'Assembly Point A' };
}
