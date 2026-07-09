// Guard door state — everything shift/ops-specific. Presence (profile,
// location, teammates, mesh) stays in the engine's crewStore; this store only
// holds what is unique to the Guard surface.
import { create } from 'zustand';
import {
  armPrompt,
  checkinPhase,
  confirmOk,
  startCheckins,
  type CheckinPhase,
  type CheckinState,
} from '../domain/loneWorker';

export type IncidentType = 'Fight' | 'Medical' | 'Ejection' | 'Suspicious' | 'Lost person';
export const INCIDENT_TYPES: IncidentType[] = ['Fight', 'Medical', 'Ejection', 'Suspicious', 'Lost person'];

export interface LogEntry {
  id: number;
  type: IncidentType;
  place: string;
  atSec: number;
  byLabel: string; // e.g. "Guard 07"
  tone: 'alert' | 'caution' | 'ok' | 'info';
}

export interface DispatchOrder {
  label: string; // e.g. "Gate C · fight"
  text: string; // the raw order received over the mesh
  atSec: number;
  acknowledged: boolean;
}

interface GuardState {
  onDuty: boolean;
  clockInAtSec: number | null;
  zoneLabel: string;
  sosActiveSince: number | null;
  checkin: CheckinState;
  dispatch: DispatchOrder | null;
  musterActive: boolean;
  musterSelfSafe: boolean;
  log: LogEntry[];

  startShift(nowSec: number): void;
  endShift(): void;
  raiseSos(nowSec: number): void;
  cancelSos(): void;
  /** lone-worker machine */
  checkinTick(nowSec: number): CheckinPhase;
  checkinOk(nowSec: number): void;
  receiveDispatch(text: string, nowSec: number): void;
  acknowledgeDispatch(): void;
  clearDispatch(): void;
  setMuster(active: boolean): void;
  markSelfSafe(): void;
  logIncident(e: Omit<LogEntry, 'id'>): void;
}

let logSeq = 1;

export const useGuardStore = create<GuardState>((set, get) => ({
  onDuty: false,
  clockInAtSec: null,
  zoneLabel: 'Zone 2',
  sosActiveSince: null,
  checkin: { nextPromptAtSec: Number.MAX_SAFE_INTEGER, promptExpiresAtSec: null },
  dispatch: null,
  musterActive: false,
  musterSelfSafe: false,
  log: [],

  startShift: (nowSec) =>
    set({ onDuty: true, clockInAtSec: nowSec, checkin: startCheckins(nowSec) }),

  endShift: () =>
    set({
      onDuty: false,
      clockInAtSec: null,
      sosActiveSince: null,
      dispatch: null,
      musterActive: false,
      musterSelfSafe: false,
    }),

  raiseSos: (nowSec) => set({ sosActiveSince: nowSec }),
  cancelSos: () => set({ sosActiveSince: null }),

  checkinTick: (nowSec) => {
    const phase = checkinPhase(get().checkin, nowSec);
    if (phase === 'prompt' && get().checkin.promptExpiresAtSec === null) {
      set({ checkin: armPrompt(get().checkin, nowSec) });
    }
    return phase;
  },

  checkinOk: (nowSec) => set({ checkin: confirmOk(get().checkin, nowSec) }),

  receiveDispatch: (text, nowSec) =>
    set({
      dispatch: {
        label: text.length > 42 ? `${text.slice(0, 42)}…` : text,
        text,
        atSec: nowSec,
        acknowledged: false,
      },
    }),

  acknowledgeDispatch: () =>
    set((s) => (s.dispatch ? { dispatch: { ...s.dispatch, acknowledged: true } } : {})),

  clearDispatch: () => set({ dispatch: null }),

  setMuster: (musterActive) =>
    set((s) => ({ musterActive, musterSelfSafe: musterActive ? s.musterSelfSafe : false })),

  markSelfSafe: () => set({ musterSelfSafe: true }),

  logIncident: (e) => set((s) => ({ log: [{ ...e, id: logSeq++ }, ...s.log].slice(0, 50) })),
}));
