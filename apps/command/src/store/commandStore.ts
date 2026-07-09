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
  COMMAND_ID,
  SHIFT_LABEL,
  SITE_NAME,
  TEAM_TAG,
  ZONES,
} from '../domain/sim';
import type {
  AuditEntry,
  Incident,
  MusterState,
  ResponderState,
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
  /** Record that an operator viewed an incident that names an individual. */
  noteReveal(incidentId: string): void;
  acknowledge(id: string): void;
  escalate(id: string): void;
  resolve(id: string): void;
  dispatch(text: string, opts?: { incidentId?: string; toTag?: number }): void;
  applyGuardStatus(staffId: number, code: number, incidentId?: string): void;
  standDownMuster(): void;
  callMuster(): void;
  endMuster(): void;
  checkIn(staffId: number): void;
  runAssistedSearch(query: string, reason: string): { ok: boolean; error?: string };
}

// --- audit trail durability -------------------------------------------------
// The audit log is the product's accountability contract, so it must survive a
// reload and its ids must not restart. Entries persist to localStorage
// (append-only in usage: nothing in the store ever removes or mutates an
// entry), and the id sequence is seeded from what's already on disk. In a real
// deployment this becomes a server-side append-only ledger; the shape is ready.
const AUDIT_KEY = 'loc8.command.audit.v1';
const AUDIT_MAX = 2000; // generous shift-scale bound; oldest archived off, never silently at 200

function loadAudit(): AuditEntry[] {
  try {
    const raw = globalThis.localStorage?.getItem(AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistAudit(log: AuditEntry[]): void {
  try {
    globalThis.localStorage?.setItem(AUDIT_KEY, JSON.stringify(log));
  } catch {
    // Storage full/unavailable — keep the in-memory trail going regardless.
  }
}

const audit0 = loadAudit();
let auditSeq = (audit0[0]?.id ?? 0) + 1;
// Rolling uint16 message id for outgoing dispatches (see dispatch()).
let dispatchMsgSeq = 0;

function audit(prev: AuditEntry[], e: Omit<AuditEntry, 'id'>): AuditEntry[] {
  const next = [{ ...e, id: auditSeq++ }, ...prev].slice(0, AUDIT_MAX);
  persistAudit(next);
  return next;
}

/** Serialize the trail for an after-action report (newest first). */
export function exportAuditLog(log: AuditEntry[]): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), format: 'loc8-command-audit-v1', entries: log },
    null,
    2,
  );
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
  auditLog: audit0,
  dispatchLog: [],
  activeIncidentId: 'SOS-0442',
  lastSearch: null,
  lastInboundStatus: null,

  activeIncident: () => get().incidents.find((i) => i.id === get().activeIncidentId),
  onDutyCount: () =>
    Object.values(get().staff).filter((s) => s.status !== 'no_signal').length,
  respondingCount: () =>
    Object.values(get().staff).filter((s) => s.status === 'responding').length,
  // Tied to OPEN SOS *incidents*, not raw staff status — so resolving an
  // incident actually clears the badge/tile instead of leaving them lit.
  sosCount: () => get().incidents.filter((i) => i.kind === 'sos' && i.status !== 'resolved').length,
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

  noteReveal: (incidentId) =>
    set((st) => {
      const inc = st.incidents.find((i) => i.id === incidentId);
      if (!inc || (!inc.subjectName && !inc.location)) return {};
      // Debounce repeat views of the same incident (also absorbs StrictMode's
      // dev double-mount) — distinct viewing sessions still log separately.
      const last = st.auditLog[0];
      if (
        last?.action === 'reveal_subject' &&
        last.detail?.startsWith(inc.id) &&
        nowSec() - last.atSec < 30
      )
        return {};
      return {
        auditLog: audit(st.auditLog, {
          atSec: nowSec(),
          operatorId: st.operatorId,
          action: 'reveal_subject',
          reason: `viewed incident ${inc.id}${inc.subjectName ? ` (${inc.subjectName})` : ''}`,
          subjectIds: inc.raisedByStaffId ? [inc.raisedByStaffId] : [],
          detail: `${inc.id} · ${inc.location ? 'name + coordinates shown' : 'name shown'}`,
        }),
      };
    }),

  acknowledge: (id) =>
    set((st) => {
      const inc = st.incidents.find((i) => i.id === id);
      // No-op once the incident has left the active state — prevents the
      // "escalated, then acknowledged" nonsense in the timeline/audit.
      if (!inc || inc.status !== 'active') return {};
      return {
        incidents: patchIncident(st.incidents, id, (i) => ({
          ...i,
          status: 'acknowledged',
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
      };
    }),

  escalate: (id) =>
    set((st) => {
      const inc = st.incidents.find((i) => i.id === id);
      if (!inc || inc.status === 'escalated' || inc.status === 'resolved') return {};
      return {
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
          subjectIds: inc.raisedByStaffId ? [inc.raisedByStaffId] : [],
          detail: id,
        }),
      };
    }),

  resolve: (id) =>
    set((st) => {
      const inc = st.incidents.find((i) => i.id === id);
      if (!inc || inc.status === 'resolved') return {};
      const at = nowSec();
      // Reconcile the raising staff member: an SOS subject stops being 'sos'
      // once their incident is resolved, so the badge/tile/roster all clear.
      let staff = st.staff;
      if (inc.raisedByStaffId && st.staff[inc.raisedByStaffId]?.status === 'sos') {
        const s = st.staff[inc.raisedByStaffId];
        staff = { ...st.staff, [s.id]: { ...s, status: 'on_post', lastPingSec: at } };
      }
      return {
        staff,
        incidents: patchIncident(st.incidents, id, (i) => ({
          ...i,
          status: 'resolved',
          closedAtSec: at,
          timeline: [...i.timeline, { atSec: at, tone: 'ok', text: 'Resolution logged', sub: st.operatorId }],
        })),
        auditLog: audit(st.auditLog, {
          atSec: at,
          operatorId: st.operatorId,
          action: 'resolve',
          reason: 'resolution logged',
          subjectIds: inc.raisedByStaffId ? [inc.raisedByStaffId] : [],
          detail: id,
        }),
      };
    }),

  dispatch: (text, opts) =>
    set((st) => {
      const toTag = opts?.toTag ?? TEAM_TAG;
      const at = nowSec();
      // Reuse the shared engine wire codec — these are the actual mesh frames.
      // msgId is a true monotonic counter: the receiver's TextReassembler keys
      // buffers by (senderId, msgId), so a clock-derived id would merge two
      // same-second dispatches into one corrupted message.
      const frames = encodeDispatch({
        fromId: COMMAND_ID,
        toTag,
        text,
        msgId: (dispatchMsgSeq = (dispatchMsgSeq + 1) & 0xffff),
        nowSec: at,
      });
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

  applyGuardStatus: (staffId, code, incidentId) =>
    set((st) => {
      const label = GUARD_STATUS.find((s) => s.code === code)?.label ?? '…';
      // Map the Guard status code to both the staff status and the responder
      // card state, so the timeline and the responder rail always agree.
      const respState: ResponderState = code === 4 ? 'clear' : code >= 2 ? 'on_scene' : 'en_route';
      const staffStatus: StaffMember['status'] = code === 4 ? 'on_post' : 'responding';
      const cur = st.staff[staffId];
      if (!cur) return {};
      const at = nowSec();
      // Route to the incident this beat belongs to — NOT whatever is on screen,
      // so responder chatter can't bleed into an unrelated incident.
      const targetId = incidentId ?? st.activeIncidentId;
      return {
        staff: { ...st.staff, [staffId]: { ...cur, status: staffStatus, lastPingSec: at } },
        lastInboundStatus: { staffId, name: cur.name, label, atSec: at },
        incidents: targetId
          ? patchIncident(st.incidents, targetId, (i) => ({
              ...i,
              responders: i.responders.map((r) => (r.staffId === staffId ? { ...r, state: respState } : r)),
              timeline: [
                ...i.timeline,
                { atSec: at, tone: 'info', text: `${cur.name}: ${label}`, sub: `Guard ${staffId}` },
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

  standDownMuster: () =>
    set((st) => {
      if (!st.muster.active) return {};
      return {
        muster: { ...st.muster, active: false },
        auditLog: audit(st.auditLog, {
          atSec: nowSec(),
          operatorId: st.operatorId,
          action: 'stand_down',
          reason: 'muster stood down',
          subjectIds: [],
          detail: `${Object.values(st.staff).filter((s) => s.mustered).length}/${Object.keys(st.staff).length} accounted`,
        }),
      };
    }),

  checkIn: (staffId) =>
    set((st) => {
      const cur = st.staff[staffId];
      if (!cur) return {};
      // A no-signal guard cannot self-report — never let a tap mark them safe.
      if (cur.status === 'no_signal') return {};
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
