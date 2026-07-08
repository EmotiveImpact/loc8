// apps/guard/src/state/guardStore.ts
//
// Guard-only state that the shared engine deliberately doesn't model: shift /
// duty status, the local SOS flag, muster (evacuation) accounting, the incident
// log, and the lone-worker check-in clock.
//
// Everything to do with the MESH itself — presence, positions, the SOS/dispatch
// TARGET location, status replies, team comms, the activity feed — stays in the
// engine's crewStore + meshService. This store is a thin ops layer on top; it
// never duplicates engine state. Pure logic, unit-tested.
import { create } from 'zustand';

export type IncidentType = 'Fight' | 'Medical' | 'Ejection' | 'Suspicious' | 'Lost person';

export const INCIDENT_TYPES: IncidentType[] = [
  'Fight',
  'Medical',
  'Ejection',
  'Suspicious',
  'Lost person',
];

export interface Incident {
  id: number;
  type: IncidentType;
  location: string;
  floor: number;
  atSec: number;
  byLabel: string;
}

export interface Shift {
  venue: string;
  zone: string;
  window: string; // e.g. "22:00 – 04:00"
}

/** Lone-worker auto check-in window, in seconds (spec/gallery: silence escalates). */
export const LONE_CHECKIN_SEC = 20;

export interface GuardState {
  /** Assigned shift (set at clock-in). Static demo default until then. */
  shift: Shift;
  /** Guard badge number shown on the map + roster (e.g. 07). */
  badge: number;
  onDuty: boolean;
  onDutySinceSec: number | null;

  /** MY SOS is live (the SOS-active screen). The shared location broadcast is the engine's rally pin. */
  sosActive: boolean;
  sosAtSec: number | null;

  /**
   * Human label for the current dispatch target (the engine rally pin), e.g.
   * "Gate C · fight" or "SOS · Guard 07". The coordinate lives in the engine
   * (crewStore.rallyPin); this is just the caption the Guard UI shows.
   */
  dispatchLabel: string | null;

  /** Evacuation muster is called; whether I've confirmed safe. */
  musterActive: boolean;
  mustered: boolean;

  /** Lone-worker check-in prompt is showing (solo patrol). */
  loneCheckInActive: boolean;

  /** Floor currently being VIEWED on the team map. null = follow my own floor. */
  viewFloor: number | null;

  incidents: Incident[];

  goOnDuty(shift?: Partial<Shift>, badge?: number, nowSec?: number): void;
  goOffDuty(): void;
  raiseSos(label: string, nowSec?: number): void;
  cancelSos(): void;
  setDispatch(label: string | null): void;
  callMuster(): void;
  endMuster(): void;
  markSafe(): void;
  startLoneCheckIn(): void;
  resolveLoneCheckIn(): void;
  setViewFloor(floor: number | null): void;
  logIncident(type: IncidentType, location: string, byLabel: string, floor: number, nowSec?: number): void;
  reset(): void;
}

const DEFAULT_SHIFT: Shift = {
  venue: 'Ministry of Sound',
  zone: 'Zone 2',
  window: '22:00 – 04:00',
};

let incidentSeq = 1;

const now = () => Math.floor(Date.now() / 1000);

const initial = {
  shift: DEFAULT_SHIFT,
  badge: 7,
  onDuty: false,
  onDutySinceSec: null as number | null,
  sosActive: false,
  sosAtSec: null as number | null,
  dispatchLabel: null as string | null,
  musterActive: false,
  mustered: false,
  loneCheckInActive: false,
  viewFloor: null as number | null,
  incidents: [] as Incident[],
};

export const useGuardStore = create<GuardState>((set, get) => ({
  ...initial,

  goOnDuty: (shift, badge, nowSec = now()) =>
    set({
      onDuty: true,
      onDutySinceSec: nowSec,
      shift: shift ? { ...get().shift, ...shift } : get().shift,
      badge: badge ?? get().badge,
    }),

  goOffDuty: () =>
    set({ onDuty: false, onDutySinceSec: null, sosActive: false, sosAtSec: null }),

  raiseSos: (label, nowSec = now()) =>
    set({ sosActive: true, sosAtSec: nowSec, dispatchLabel: label }),
  cancelSos: () => set({ sosActive: false, sosAtSec: null }),
  setDispatch: (dispatchLabel) => set({ dispatchLabel }),

  callMuster: () => set({ musterActive: true, mustered: false }),
  endMuster: () => set({ musterActive: false, mustered: false }),
  markSafe: () => set({ mustered: true }),

  startLoneCheckIn: () => set({ loneCheckInActive: true }),
  resolveLoneCheckIn: () => set({ loneCheckInActive: false }),

  setViewFloor: (viewFloor) => set({ viewFloor }),

  logIncident: (type, location, byLabel, floor, nowSec = now()) =>
    set({
      incidents: [
        { id: incidentSeq++, type, location, floor, atSec: nowSec, byLabel },
        ...get().incidents,
      ].slice(0, 50),
    }),

  reset: () => set({ ...initial, incidents: [] }),
}));

/** "07" — a two-digit guard badge for the map/roster. */
export function badgeLabel(badge: number): string {
  return String(badge % 100).padStart(2, '0');
}
