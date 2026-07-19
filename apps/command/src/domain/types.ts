// src/domain/types.ts — Command's data model.
//
// PRIVACY BY CONSTRUCTION (see docs/strategy/identity-privacy-login.md):
// There is deliberately NO type here that represents "every attendee with a
// location." The crowd exists ONLY as anonymous per-zone counts (ZoneDensity).
// An individual is representable ONLY when there is a consent basis to see them
// (ConsentBasis). This is the structural reason god-mode "can't be built."

import type { Coordinate } from '../engine';

/** A named area of the venue — the ONLY spatial unit the crowd is expressed in. */
export interface Zone {
  id: string;
  name: string;
  /** real-world centroid — the map projects everything from geo, not fixed px */
  center: Coordinate;
  /** display size of the zone rectangle, 0..100 of the canvas */
  w: number;
  h: number;
}

export type DensityLevel = 'good' | 'thin' | 'gap';

/**
 * Anonymous crowd density for one zone. COUNTS ONLY — no ids, no names, no
 * per-person coordinates. This is the "safe operator overview": crowd-crush
 * prevention without surveillance.
 */
export interface ZoneDensity {
  zoneId: string;
  guardCount: number;
  /** aggregate headcount in the zone; no individual is derivable from it */
  attendeeCount: number;
  coveragePct: number; // 0..100
  level: DensityLevel;
}

/**
 * WHY an individual is visible to Command — the consent basis for any reveal.
 * Every member is a *consented* basis. There is intentionally no 'silent' /
 * 'god_mode' member, so a non-consensual reveal is unrepresentable in the type
 * system, not merely disallowed at runtime.
 */
export type ConsentBasis =
  | 'on_duty_staff' // employee, consented as a condition of the shift
  | 'sos' // the person initiated SOS / "I need help"
  | 'opt_in_medical' // opted into "findable by medical" (revocable)
  | 'family_crew'; // located by their own parent/guardian in a family crew

export type StaffStatus = 'on_post' | 'responding' | 'lone' | 'sos' | 'no_signal';

/** A deployed staff member (Guard user). On-duty consent → visible to Command. */
export interface StaffMember {
  id: number; // engine senderId (uint32)
  name: string;
  zoneId: string;
  status: StaffStatus;
  onSinceSec: number;
  lastPingSec: number;
  consent: ConsentBasis; // 'on_duty_staff'
  location?: Coordinate;
  batteryPct?: number;
  /** headcount state during an active muster */
  mustered?: boolean;
}

export type IncidentKind =
  | 'sos'
  | 'duress' // covert emergency — no acknowledgment is ever sent to the device
  | 'man_down' // watchdog-raised: on-duty device went silent
  | 'ejection'
  | 'capacity'
  | 'lone_worker'
  | 'medical'
  | 'field_report' // a guard's logged incident, arrived over the ops grammar
  | 'shift';
export type IncidentStatus = 'active' | 'acknowledged' | 'escalated' | 'resolved';

export interface TimelineEntry {
  atSec: number;
  tone: 'alert' | 'info' | 'ok';
  text: string;
  sub?: string;
}

export type ResponderState = 'en_route' | 'on_scene' | 'clear' | 'viewing';
export interface Responder {
  staffId: number; // 0 = control room (not a field staff id)
  name: string;
  /** straight-line distance to the incident, metres (computed via geoMath) */
  distanceM?: number;
  state: ResponderState;
}

export interface Incident {
  id: string; // e.g. "SOS-0442"
  kind: IncidentKind;
  status: IncidentStatus;
  /** the staff member who raised it, when applicable */
  raisedByStaffId?: number;
  /** shown only when a consent basis permits naming the subject */
  subjectName?: string;
  zoneId: string;
  /** present ONLY when consentBasis permits an individual location */
  location?: Coordinate;
  consentBasis: ConsentBasis;
  raisedAtSec: number;
  /** set when the incident leaves the active set — freezes the elapsed clock */
  closedAtSec?: number;
  meshConfirmed: boolean;
  timeline: TimelineEntry[];
  responders: Responder[];
  /** short summary line for the live feed */
  feedText: string;
  feedSub?: string;
}

/**
 * Append-only audit trail. EVERY reveal of an individual, every dispatch and
 * every escalation is recorded: who did it, why, and whom it touched. This is
 * what turns "assisted search" into a narrow, logged, audited tool rather than
 * a browsable live map.
 */
export interface AuditEntry {
  id: number;
  atSec: number;
  operatorId: string;
  action:
    | 'assisted_search'
    | 'reveal_subject'
    | 'dispatch'
    | 'acknowledge'
    | 'escalate'
    | 'resolve'
    | 'muster'
    | 'stand_down';
  reason: string;
  subjectIds: number[];
  detail?: string;
}

/** Live muster / evacuation headcount. */
export interface MusterState {
  active: boolean;
  startedAtSec: number;
  assemblyPoint: string;
}
