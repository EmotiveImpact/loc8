// src/store/commandStore.ts — the control-room state.
//
// Privacy note on shape: this store holds `staff` (consented on-duty) and
// `incidents` (consent-carrying subjects), plus `zoneDensity` (anonymous crowd
// counts). It holds NO collection of attendee identities/locations — there is
// nothing to browse. Individuals become nameable ONLY through the audited
// `runAssistedSearch`, which routes through domain/privacy.ts.

import { create } from 'zustand';
import { encodeDispatch, GUARD_STATUS } from '../domain/dispatch';
import { assistedSearch, type SearchableSubject } from '../domain/privacy';
import { nowSec } from '../domain/time';
import { venueCoverage } from '../domain/zones';
import {
  buildIncidents,
  buildMuster,
  buildStaff,
  buildZoneDensity,
  OPERATOR_ID,
  SHIFT_LABEL,
  SITE_NAME,
  TEAM_TAG,
  ZONES,
} from '../domain/sim';
import type {
  AuditEntry,
  Incident,
  MusterState,
  StaffMember,
  Zone,
  ZoneDensity,
} from '../domain/types';

export interface DispatchLogEntry {
  atSec: number;
  toTag: number;
  text: string;
  frames: number; // how many mesh frames the message fragmented into
  incidentId?: string;
}

export interface AssistedSearchOutcome {
  atSec: number;
  reason: string;
  query: string;
  matches: SearchableSubject[];
}

interface CommandState {
  operatorId: string;
  siteName: string;
  shiftLabel: string;
  zones: Zone[];
  staff: Record<number, StaffMember>;
  incidents: Incident[];
  zoneDensity: ZoneDensity[];
  muster: MusterState;
  auditLog: AuditEntry[];
  dispatchLog: DispatchLogEntry[];
  activeIncidentId: string | null;
  lastSearch: AssistedSearchOutcome | null;
  /** most recent status decoded from an inbound Guard mesh frame (for the toast) */
  lastInboundStatus: { staffId: number; name: string; label: string; atSec: number } | null;

  // --- selectors (computed) ---
  activeIncident(): Incident | undefined;
  onDutyCount(): number;
  respondingCount(): number;
  sosCount(): number;
  venueCoveragePct(): number;
  musteredCount(): number;
  outstandingStaff(): StaffMember[];
  searchablePool(): SearchableSubject[];

  // --- actions (all state-changing individual actions write to the audit log) ---
  setActiveIncident(id: string | null): void;
  acknowledge(id: string): void;
  escalate(id: string): void;
  resolve(id: string): void;
  dispatch(text: string, opts?: { incidentId?: string; toTag?: number }): void;
  applyGuardStatus(staffId: number, code: number): void;
  callMuster(): void;
  endMuster(): void;
  checkIn(staffId: number): void;
  runAssistedSearch(query: string, reason: string): { ok: boolean; error?: string };
}

let auditSeq = 1;
function audit(prev: AuditEntry[], e: Omit<AuditEntry, 'id'>): AuditEntry[] {
  return [{ ...e, id: auditSeq++ }, ...prev].slice(0, 200);
}

function patchIncident(list: Incident[], id: string, patch: (i: Incident) => Incident): Incident[] {
  return list.map((i) => (i.id === id ? patch(i) : i));
}

const staff0 = buildStaff();

export const useCommandStore = create<CommandState>((set, get) => ({
  operatorId: OPERATOR_ID,
  siteName: SITE_NAME,
  shiftLabel: SHIFT_LABEL,
  zones: ZONES,
  staff: staff0,
  incidents: buildIncidents(staff0),
  zoneDensity: buildZoneDensity(staff0),
  muster: buildMuster(),
  auditLog: [],
  dispatchLog: [],
  activeIncidentId: 'SOS-0442',
  lastSearch: null,
  lastInboundStatus: null,

  activeIncident: () => get().incidents.find((i) => i.id === get().activeIncidentId),
  onDutyCount: () =>
    Object.values(get().staff).filter((s) => s.status !== 'no_signal').length,
  respondingCount: () =>
    Object.values(get().staff).filter((s) => s.status === 'responding').length,
  sosCount: () => Object.values(get().staff).filter((s) => s.status === 'sos').length,
  venueCoveragePct: () => venueCoverage(get().zoneDensity),
  musteredCount: () => Object.values(get().staff).filter((s) => s.mustered).length,
  outstandingStaff: () => Object.values(get().staff).filter((s) => !s.mustered),
  searchablePool: () =>
    Object.values(get().staff).map((s) => ({
      id: s.id,
      name: s.name,
      zoneId: s.zoneId,
      basis: s.consent,
    })),

  setActiveIncident: (id) => set({ activeIncidentId: id }),

  acknowledge: (id) =>
    set((st) => ({
      incidents: patchIncident(st.incidents, id, (i) => ({
        ...i,
        status: i.status === 'active' ? 'acknowledged' : i.status,
        timeline: [
          ...i.timeline,
          { atSec: nowSec(), tone: 'ok', text: 'Acknowledged by control room', sub: st.operatorId },
        ],
      })),
      auditLog: audit(st.auditLog, {
        atSec: nowSec(),
        operatorId: st.operatorId,
        action: 'acknowledge',
        reason: 'incident acknowledged',
        subjectIds: [],
        detail: id,
      }),
    })),

  escalate: (id) =>
    set((st) => ({
      incidents: patchIncident(st.incidents, id, (i) => ({
        ...i,
        status: 'escalated',
        timeline: [
          ...i.timeline,
          { atSec: nowSec(), tone: 'alert', text: 'Escalated to police', sub: st.operatorId },
        ],
      })),
      auditLog: audit(st.auditLog, {
        atSec: nowSec(),
        operatorId: st.operatorId,
        action: 'escalate',
        reason: 'escalated to law enforcement',
        subjectIds: [],
        detail: id,
      }),
    })),

  resolve: (id) =>
    set((st) => ({
      incidents: patchIncident(st.incidents, id, (i) => ({
        ...i,
        status: 'resolved',
        timeline: [
          ...i.timeline,
          { atSec: nowSec(), tone: 'ok', text: 'Resolution logged', sub: st.operatorId },
        ],
      })),
      auditLog: audit(st.auditLog, {
        atSec: nowSec(),
        operatorId: st.operatorId,
        action: 'acknowledge',
        reason: 'resolution logged',
        subjectIds: [],
        detail: id,
      }),
    })),

  dispatch: (text, opts) =>
    set((st) => {
      const toTag = opts?.toTag ?? TEAM_TAG;
      const at = nowSec();
      // Reuse the shared engine wire codec — these are the actual mesh frames.
      const frames = encodeDispatch({ fromId: 0xc0, toTag, text, msgId: at & 0xffff, nowSec: at });
      const log: DispatchLogEntry = {
        atSec: at,
        toTag,
        text,
        frames: frames.length,
        incidentId: opts?.incidentId,
      };
      return {
        dispatchLog: [log, ...st.dispatchLog].slice(0, 100),
        incidents: opts?.incidentId
          ? patchIncident(st.incidents, opts.incidentId, (i) => ({
              ...i,
              timeline: [
                ...i.timeline,
                { atSec: at, tone: 'info', text: `Dispatch: ${text}`, sub: `${frames.length} frames · team` },
              ],
            }))
          : st.incidents,
        auditLog: audit(st.auditLog, {
          atSec: at,
          operatorId: st.operatorId,
          action: 'dispatch',
          reason: 'dispatch order',
          subjectIds: [],
          detail: `→ tag ${toTag}: "${text}"`,
        }),
      };
    }),

  applyGuardStatus: (staffId, code) =>
    set((st) => {
      const label = GUARD_STATUS.find((s) => s.code === code)?.label ?? '…';
      const status: StaffMember['status'] =
        code === 2 ? 'responding' : code === 4 ? 'on_post' : code === 3 ? 'responding' : 'responding';
      const cur = st.staff[staffId];
      if (!cur) return {};
      return {
        staff: { ...st.staff, [staffId]: { ...cur, status, lastPingSec: nowSec() } },
        lastInboundStatus: { staffId, name: cur.name, label, atSec: nowSec() },
        incidents: st.activeIncidentId
          ? patchIncident(st.incidents, st.activeIncidentId, (i) => ({
              ...i,
              timeline: [
                ...i.timeline,
                { atSec: nowSec(), tone: 'info', text: `${cur.name}: ${label}`, sub: `Guard ${staffId}` },
              ],
            }))
          : st.incidents,
      };
    }),

  callMuster: () =>
    set((st) => ({
      muster: { ...st.muster, active: true, startedAtSec: nowSec() },
      auditLog: audit(st.auditLog, {
        atSec: nowSec(),
        operatorId: st.operatorId,
        action: 'muster',
        reason: 'muster / evacuation called',
        subjectIds: [],
        detail: st.muster.assemblyPoint,
      }),
    })),

  endMuster: () => set((st) => ({ muster: { ...st.muster, active: false } })),

  checkIn: (staffId) =>
    set((st) => {
      const cur = st.staff[staffId];
      if (!cur) return {};
      return { staff: { ...st.staff, [staffId]: { ...cur, mustered: true } } };
    }),

  runAssistedSearch: (query, reason) => {
    const st = get();
    try {
      const res = assistedSearch(st.searchablePool(), {
        operatorId: st.operatorId,
        reason,
        query,
        nowSec: nowSec(),
      });
      set({
        auditLog: audit(st.auditLog, res.audit),
        lastSearch: { atSec: nowSec(), reason: reason.trim(), query: query.trim(), matches: res.matches },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'search failed' };
    }
  },
}));
