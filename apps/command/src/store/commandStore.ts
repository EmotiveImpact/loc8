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
  encodePacket,
  getHaversineDistance,
  opsMsg,
  STATUS_CLEAR,
  STATUS_EN_ROUTE,
  type Coordinate,
  type OpsEvent,
  type Packet,
} from '../engine';
import { nearestResponders } from '../domain/coverage';
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
  SearchOperationState,
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
  searchOperation: SearchOperationState;
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
  assignResponder(incidentId: string, staffId: number): void;
  applyGuardStatus(staffId: number, code: number, incidentId?: string): void;
  standDownMuster(): void;
  /** live bridge: real mesh frames rendered by the console */
  liveConnected: boolean;
  setLiveConnected(v: boolean): void;
  applyLivePosition(staffId: number, coord: Coordinate, atSec: number): void;
  raiseLiveSos(staffId: number, coord: Coordinate, atSec: number): void;
  receiveTeamText(fromId: number, text: string): void;
  /** covert emergency (DURESS_CODE quickReply) — never acknowledged to the device */
  raiseDuress(staffId: number, atSec: number): void;
  /** a parsed ops-grammar event from the live mesh (muster, field reports, …) */
  applyOpsEvent(fromId: number, ev: OpsEvent): void;
  /** man-down watchdog: raise + auto-dispatch for on-duty devices gone silent */
  runWatchdog(nowSec: number): void;
  callMuster(): void;
  endMuster(): void;
  checkIn(staffId: number): void;
  assignZone(staffId: number, zoneId: string): void;
  startSearch(subjectName: string): void;
  reassignSearchTeam(teamId: string, sectorId: string): void;
  markSearchSectorClear(sectorId: string): void;
  runAssistedSearch(query: string, reason: string): { ok: boolean; error?: string };
}

// --- audit trail durability -------------------------------------------------
// The audit log is the product's accountability contract, so it must survive a
// reload and its ids must not restart. Entries persist to localStorage
// (append-only in usage: nothing in the store ever removes or mutates an
// entry), and the id sequence is seeded from what's already on disk. In a real
// deployment this becomes a server-side append-only ledger; the shape is ready.
const AUDIT_KEY = 'loc8.command.audit.v1';
// Shift-scale bound. NOTE: entries past this are DROPPED, not archived — there
// is no second store. A true append-only ledger is the server-side production
// form; do not describe this as append-only without that caveat.
const AUDIT_MAX = 2000;

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

/** An on-duty device silent this long is a suspected man-down (demo-scaled). */
export const MAN_DOWN_AFTER_SEC = 15 * 60;

// When the live bridge is up, dispatch frames are ALSO transmitted for real.
// The bridge service plugs itself in here (avoids a store↔service import cycle).
let frameSink: ((frames: ArrayBuffer[]) => void) | null = null;
export function setFrameSink(sink: ((frames: ArrayBuffer[]) => void) | null): void {
  frameSink = sink;
}

/** Broadcast an ops-grammar message over the live bridge (no-op when sim-only). */
function broadcastOps(text: string): void {
  if (!frameSink) return;
  const frames = encodeDispatch({
    fromId: COMMAND_ID,
    toTag: TEAM_TAG,
    text,
    msgId: (dispatchMsgSeq = (dispatchMsgSeq + 1) & 0xffff),
    nowSec: nowSec(),
  });
  frameSink(frames);
}

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
const searchBase = nowSec();
const searchOperation0: SearchOperationState = {
  active: true,
  phase: 'search',
  subjectName: 'Priya Okafor',
  startedAtSec: searchBase - 522,
  lastConfirmedSec: searchBase - 732,
  sectors: [
    { id: 'C1', label: 'North concourse', progressPct: 100, status: 'clear' },
    { id: 'C2', label: 'Service corridor', progressPct: 92, status: 'searching' },
    { id: 'C3', label: 'Lower hospitality', progressPct: 64, status: 'priority' },
    { id: 'C4', label: 'East perimeter', progressPct: 28, status: 'searching' },
    { id: 'C5', label: 'Back-of-house stores', progressPct: 0, status: 'unsearched' },
  ],
  teams: [
    { id: 'alpha', label: 'Alpha', personnel: 6, assignment: 'C3', etaSec: 130, status: 'searching' },
    { id: 'bravo', label: 'Bravo', personnel: 6, assignment: 'C4', etaSec: 205, status: 'searching' },
    { id: 'k9', label: 'K9 Unit', personnel: 2, assignment: 'C3', etaSec: 105, status: 'searching' },
  ],
  radio: [
    { atSec: searchBase - 31, source: 'ALPHA', text: 'C3 corridor clear, moving south.' },
    { atSec: searchBase - 24, source: 'COMMAND', text: 'Copy Alpha. Check service doors.' },
    { atSec: searchBase - 15, source: 'BRAVO', text: 'Crowd build-up at East Gate.' },
    { atSec: searchBase - 4, source: 'K9 UNIT', text: 'Indication at lower hospitality.' },
  ],
};

export const useCommandStore = create<CommandState>((set, get) => ({
  operatorId: OPERATOR_ID,
  siteName: SITE_NAME,
  shiftLabel: SHIFT_LABEL,
  zones: ZONES,
  staff: staff0,
  incidents: buildIncidents(staff0),
  zoneDensity: buildZoneDensity(staff0),
  muster: buildMuster(),
  searchOperation: searchOperation0,
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
      // The wire text rides the shared ops grammar (DISPATCH — …) so Guard's
      // inbox parses it into the RESPOND flow instead of plain chat.
      // msgId is a true monotonic counter: the receiver's TextReassembler keys
      // buffers by (senderId, msgId), so a clock-derived id would merge two
      // same-second dispatches into one corrupted message.
      const frames = encodeDispatch({
        fromId: COMMAND_ID,
        toTag,
        text: opsMsg.dispatch(text),
        msgId: (dispatchMsgSeq = (dispatchMsgSeq + 1) & 0xffff),
        nowSec: at,
      });
      frameSink?.(frames); // live bridge up → the order actually leaves the console
      // Dispatching TO an incident with a known location also drops a rally
      // frame there — Guard's converge target: the map marker, the RESPOND bar
      // and the navigate arrow all key off it. Order + destination, one gesture.
      const target = opts?.incidentId
        ? st.incidents.find((i) => i.id === opts.incidentId)?.location
        : undefined;
      if (target && frameSink) {
        const rally: Packet = {
          type: 'rally',
          senderId: COMMAND_ID,
          targetId: toTag,
          latitude: target.latitude,
          longitude: target.longitude,
          headingDeg: 0,
          batteryPct: 100,
          timestampSec: at,
          accuracyM: 10,
        };
        frameSink([encodePacket(rally)]);
      }
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

  assignResponder: (incidentId, staffId) =>
    set((st) => {
      const incident = st.incidents.find((item) => item.id === incidentId);
      const member = st.staff[staffId];
      if (
        !incident ||
        incident.status === 'resolved' ||
        !member ||
        member.status === 'no_signal' ||
        incident.responders.some((responder) => responder.staffId === staffId)
      )
        return {};
      const at = nowSec();
      const distanceM =
        incident.location && member.location
          ? Math.round(getHaversineDistance(member.location, incident.location))
          : undefined;
      const text = `Respond to ${incident.id} · ${incident.zoneId}`;
      const frames = encodeDispatch({
        fromId: COMMAND_ID,
        toTag: staffId,
        text: opsMsg.dispatch(text),
        msgId: (dispatchMsgSeq = (dispatchMsgSeq + 1) & 0xffff),
        nowSec: at,
      });
      frameSink?.(frames);
      return {
        staff: {
          ...st.staff,
          [staffId]: { ...member, status: 'responding', lastPingSec: at },
        },
        incidents: patchIncident(st.incidents, incidentId, (item) => ({
          ...item,
          responders: [
            ...item.responders,
            {
              staffId,
              name: `${member.name.split(' ')[0]} · Guard ${String(staffId).padStart(2, '0')}`,
              distanceM,
              state: 'en_route',
            },
          ],
          timeline: [
            ...item.timeline,
            {
              atSec: at,
              tone: 'info',
              text: `${member.name} assigned as responder`,
              sub: `${distanceM == null ? 'distance unavailable' : `${distanceM}m`} · ${frames.length} mesh frame${frames.length === 1 ? '' : 's'}`,
            },
          ],
        })),
        dispatchLog: [
          {
            atSec: at,
            toTag: staffId,
            text,
            frames: frames.length,
            incidentId,
          },
          ...st.dispatchLog,
        ].slice(0, 100),
        auditLog: audit(st.auditLog, {
          atSec: at,
          operatorId: st.operatorId,
          action: 'dispatch',
          reason: 'incident responder assigned',
          subjectIds: [staffId],
          detail: `${incidentId} → ${member.name}`,
        }),
      };
    }),

  applyGuardStatus: (staffId, code, incidentId) =>
    set((st) => {
      const label = GUARD_STATUS.find((s) => s.code === code)?.label ?? '…';
      // Map the Guard status code to both the staff status and the responder
      // card state, so the timeline and the responder rail always agree.
      const respState: ResponderState =
        code === STATUS_CLEAR ? 'clear' : code === STATUS_EN_ROUTE ? 'en_route' : 'on_scene';
      const staffStatus: StaffMember['status'] = code === STATUS_CLEAR ? 'on_post' : 'responding';
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
    set((st) => {
      // Live bridge up → the whole team's phones enter muster mode.
      broadcastOps(opsMsg.musterCall(st.muster.assemblyPoint));
      return {
        muster: { ...st.muster, active: true, startedAtSec: nowSec() },
        auditLog: audit(st.auditLog, {
          atSec: nowSec(),
          operatorId: st.operatorId,
          action: 'muster',
          reason: 'muster / evacuation called',
          subjectIds: [],
          detail: st.muster.assemblyPoint,
        }),
      };
    }),

  endMuster: () => set((st) => ({ muster: { ...st.muster, active: false } })),

  liveConnected: false,
  setLiveConnected: (liveConnected) => set({ liveConnected }),

  applyLivePosition: (staffId, coord, atSec) =>
    set((st) => {
      // Nearest zone centroid → the guard's zone (real geo, not hand-set).
      const zone = [...st.zones].sort(
        (a, b) => getHaversineDistance(coord, a.center) - getHaversineDistance(coord, b.center),
      )[0];
      const cur = st.staff[staffId];
      const member: StaffMember = cur
        ? { ...cur, location: coord, lastPingSec: atSec, zoneId: zone?.id ?? cur.zoneId,
            status: cur.status === 'no_signal' ? 'on_post' : cur.status }
        : {
            // Unknown sender broadcasting on the shift channel = a live guard
            // device; on-duty consent is the basis (identity-privacy doc).
            id: staffId,
            name: `Guard ${String(staffId % 100).padStart(2, '0')}`,
            zoneId: zone?.id ?? 'perimeter',
            status: 'on_post',
            onSinceSec: atSec,
            lastPingSec: atSec,
            consent: 'on_duty_staff',
            location: coord,
          };
      const staff = { ...st.staff, [staffId]: member };
      return { staff, zoneDensity: buildZoneDensity(staff) };
    }),

  raiseLiveSos: (staffId, coord, atSec) =>
    set((st) => {
      const cur = st.staff[staffId];
      const name = cur?.name ?? `Guard ${String(staffId % 100).padStart(2, '0')}`;
      const staff: Record<number, StaffMember> = {
        ...st.staff,
        [staffId]: {
          ...(cur ?? {
            id: staffId,
            name,
            zoneId: 'perimeter',
            onSinceSec: atSec,
            consent: 'on_duty_staff' as const,
          }),
          status: 'sos',
          location: coord,
          lastPingSec: atSec,
          mustered: cur?.mustered ?? false,
        },
      };
      // One open SOS per raiser: refresh it if it exists, else open a new one.
      const open = st.incidents.find(
        (i) => i.kind === 'sos' && i.raisedByStaffId === staffId && i.status !== 'resolved',
      );
      if (open) {
        return {
          staff,
          incidents: patchIncident(st.incidents, open.id, (i) => ({ ...i, location: coord })),
        };
      }
      const zone = [...st.zones].sort(
        (a, b) => getHaversineDistance(coord, a.center) - getHaversineDistance(coord, b.center),
      )[0];
      const ranked = nearestResponders(coord, Object.values(staff), { excludeId: staffId, limit: 2 });
      const id = `SOS-${String(atSec % 10000).padStart(4, '0')}`;
      const incident: Incident = {
        id,
        kind: 'sos',
        status: 'active',
        raisedByStaffId: staffId,
        subjectName: name,
        zoneId: zone?.id ?? 'perimeter',
        location: coord,
        consentBasis: 'on_duty_staff',
        raisedAtSec: atSec,
        meshConfirmed: true,
        feedText: `SOS — ${name} (live mesh)`,
        feedSub: `${ranked.length} nearest identified`,
        responders: [
          ...ranked.map((r) => ({
            staffId: r.staff.id,
            name: r.staff.name,
            distanceM: r.distanceM,
            state: 'en_route' as const,
          })),
          { staffId: 0, name: 'Control room', state: 'viewing' as const },
        ],
        timeline: [
          { atSec, tone: 'alert', text: `SOS raised — ${name}`, sub: 'live over mesh bridge' },
          ...(ranked.length
            ? [{
                atSec,
                tone: 'info' as const,
                text: `Nearest ${ranked.length} identified`,
                sub: ranked.map((r) => `${r.staff.name} · ${r.distanceM}m`).join(', '),
              }]
            : []),
        ],
      };
      return { staff, incidents: [incident, ...st.incidents], activeIncidentId: id };
    }),

  raiseDuress: (staffId, atSec) =>
    set((st) => {
      const cur = st.staff[staffId];
      if (!cur) return {};
      // One open duress per raiser.
      if (st.incidents.some((i) => i.kind === 'duress' && i.raisedByStaffId === staffId && i.status !== 'resolved'))
        return {};
      const ranked = cur.location
        ? nearestResponders(cur.location, Object.values(st.staff), { excludeId: staffId, limit: 1 })
        : [];
      const id = `DUR-${String(atSec % 10000).padStart(4, '0')}`;
      const incident: Incident = {
        id,
        kind: 'duress',
        status: 'active',
        raisedByStaffId: staffId,
        subjectName: cur.name,
        zoneId: cur.zoneId,
        location: cur.location,
        consentBasis: 'on_duty_staff',
        raisedAtSec: atSec,
        meshConfirmed: true,
        feedText: `SILENT DURESS — ${cur.name}`,
        feedSub: 'covert · no device acknowledgment',
        responders: ranked.map((r) => ({
          staffId: r.staff.id,
          name: r.staff.name,
          distanceM: r.distanceM,
          state: 'en_route' as const,
        })),
        timeline: [
          { atSec, tone: 'alert', text: `Silent duress — ${cur.name}`, sub: 'covert signal · rode an ordinary status frame' },
          { atSec, tone: 'info', text: 'NO acknowledgment sent to the device', sub: 'covert protocol' },
          ...(ranked.length
            ? [{ atSec, tone: 'info' as const, text: `Nearest responder: ${ranked[0].staff.name}`, sub: `${ranked[0].distanceM}m · dispatch quietly` }]
            : []),
        ],
      };
      return {
        staff: { ...st.staff, [staffId]: { ...cur, status: 'sos' } },
        incidents: [incident, ...st.incidents],
        auditLog: audit(st.auditLog, {
          atSec,
          operatorId: 'system · mesh',
          action: 'escalate',
          reason: 'silent duress decoded',
          subjectIds: [staffId],
          detail: id,
        }),
      };
    }),

  applyOpsEvent: (fromId, ev) =>
    set((st) => {
      const at = nowSec();
      const sender = st.staff[fromId];
      const name = sender?.name ?? `Guard ${String(fromId % 100).padStart(2, '0')}`;

      switch (ev.kind) {
        case 'muster_call': {
          // A guard declared an evacuation in the field — the board activates.
          if (st.muster.active) return {};
          return {
            muster: { ...st.muster, active: true, startedAtSec: at, assemblyPoint: ev.assembly || st.muster.assemblyPoint },
            auditLog: audit(st.auditLog, {
              atSec: at,
              operatorId: `field · ${name}`,
              action: 'muster',
              reason: 'muster declared in the field',
              subjectIds: [fromId],
              detail: ev.assembly,
            }),
          };
        }

        case 'muster_safe': {
          // Sender id is the identity (the badge in the text is display-only).
          // An unknown sender reporting safe on the shift channel is an on-duty
          // consented guard — register them like a position frame would.
          const cur = st.staff[fromId];
          if (cur?.mustered) return {};
          const member: StaffMember = cur
            ? { ...cur, mustered: true, lastPingSec: at }
            : {
                id: fromId,
                name,
                zoneId: 'perimeter',
                status: 'on_post',
                onSinceSec: at,
                lastPingSec: at,
                consent: 'on_duty_staff',
                mustered: true,
              };
          return { staff: { ...st.staff, [fromId]: member } };
        }

        case 'muster_clear':
          if (!st.muster.active) return {};
          return { muster: { ...st.muster, active: false } };

        case 'sos_clear': {
          // The raiser stood their own SOS down in the field.
          const open = st.incidents.find(
            (i) => i.kind === 'sos' && i.raisedByStaffId === fromId && i.status !== 'resolved',
          );
          if (!open) return {};
          let staff = st.staff;
          if (st.staff[fromId]?.status === 'sos') {
            staff = { ...st.staff, [fromId]: { ...st.staff[fromId], status: 'on_post', lastPingSec: at } };
          }
          return {
            staff,
            incidents: patchIncident(st.incidents, open.id, (i) => ({
              ...i,
              status: 'resolved',
              closedAtSec: at,
              timeline: [...i.timeline, { atSec: at, tone: 'ok', text: `Stood down in the field — ${name}`, sub: 'ops message · mesh' }],
            })),
          };
        }

        case 'incident': {
          // A guard's logged report becomes a real (informational) incident.
          const id = `RPT-${String((at + fromId) % 10000).padStart(4, '0')}`;
          const incident: Incident = {
            id,
            kind: 'field_report',
            status: 'active',
            raisedByStaffId: fromId,
            subjectName: name,
            zoneId: sender?.zoneId ?? 'perimeter',
            location: sender?.location,
            consentBasis: 'on_duty_staff',
            raisedAtSec: at,
            meshConfirmed: true,
            feedText: `${ev.type} — reported by ${name}`,
            feedSub: `${ev.level} · ${ev.zone}`,
            responders: [],
            timeline: [
              { atSec: at, tone: 'info', text: `${ev.type} reported`, sub: `${ev.level} · ${ev.zone} · ${name}` },
            ],
          };
          return { incidents: [incident, ...st.incidents] };
        }

        case 'lone_overdue': {
          // Missed check-in: raise a lone-worker incident at last known position
          // (the guard's device also escalates to SOS — that arrives separately).
          if (st.incidents.some((i) => i.kind === 'lone_worker' && i.raisedByStaffId === fromId && i.status !== 'resolved'))
            return {};
          const id = `LW-${String((at + fromId) % 10000).padStart(4, '0')}`;
          const incident: Incident = {
            id,
            kind: 'lone_worker',
            status: 'active',
            raisedByStaffId: fromId,
            subjectName: name,
            zoneId: sender?.zoneId ?? 'perimeter',
            location: sender?.location,
            consentBasis: 'on_duty_staff',
            raisedAtSec: at,
            meshConfirmed: true,
            feedText: `Lone-worker overdue — ${name}`,
            feedSub: ev.plusCode ? `last position ${ev.plusCode}` : 'no position reported',
            responders: [],
            timeline: [
              { atSec: at, tone: 'alert', text: `Check-in missed — ${name}`, sub: ev.plusCode ? `last known @ ${ev.plusCode}` : 'auto-escalation' },
            ],
          };
          return { incidents: [incident, ...st.incidents] };
        }

        default:
          // sos_text rides alongside the sos packet; dispatch echoes are ours.
          return {};
      }
    }),

  runWatchdog: (now) =>
    set((st) => {
      // A device that was reporting and has gone silent past the threshold is
      // a man-down until proven otherwise (regulated lone-worker duty of care).
      const silent = Object.values(st.staff).filter(
        (s) =>
          s.status !== 'no_signal' &&
          s.status !== 'sos' &&
          s.location &&
          now - s.lastPingSec > MAN_DOWN_AFTER_SEC &&
          !st.incidents.some((i) => i.kind === 'man_down' && i.raisedByStaffId === s.id && i.status !== 'resolved'),
      );
      if (silent.length === 0) return {};
      let staff = st.staff;
      const incidents = [...st.incidents];
      let auditLog = st.auditLog;
      for (const s of silent) {
        staff = { ...staff, [s.id]: { ...s, status: 'no_signal' } };
        const ranked = nearestResponders(s.location!, Object.values(staff), { excludeId: s.id, limit: 1 });
        const id = `MD-${String((now + s.id) % 10000).padStart(4, '0')}`;
        incidents.unshift({
          id,
          kind: 'man_down',
          status: 'active',
          raisedByStaffId: s.id,
          subjectName: s.name,
          zoneId: s.zoneId,
          location: s.location,
          consentBasis: 'on_duty_staff',
          raisedAtSec: now,
          meshConfirmed: false,
          feedText: `MAN DOWN? — ${s.name} silent ${Math.round((now - s.lastPingSec) / 60)}m`,
          feedSub: 'auto-raised · watchdog',
          responders: ranked.map((r) => ({
            staffId: r.staff.id,
            name: r.staff.name,
            distanceM: r.distanceM,
            state: 'en_route' as const,
          })),
          timeline: [
            { atSec: now, tone: 'alert', text: `Device silent — ${s.name}`, sub: `last ping ${Math.round((now - s.lastPingSec) / 60)}m ago · last known position held` },
            ...(ranked.length
              ? [{ atSec: now, tone: 'info' as const, text: `Auto-dispatched ${ranked[0].staff.name}`, sub: `${ranked[0].distanceM}m to last known position` }]
              : []),
          ],
        });
        auditLog = audit(auditLog, {
          atSec: now,
          operatorId: 'system · watchdog',
          action: 'dispatch',
          reason: 'man-down auto-dispatch',
          subjectIds: [s.id],
          detail: id,
        });
      }
      return { staff, incidents, auditLog };
    }),

  receiveTeamText: (fromId, text) =>
    set((st) => {
      const name = st.staff[fromId]?.name ?? `Guard ${String(fromId % 100).padStart(2, '0')}`;
      const at = nowSec();
      const short = text.length > 60 ? `${text.slice(0, 60)}…` : text;
      return {
        lastInboundStatus: { staffId: fromId, name, label: short, atSec: at },
        incidents: st.activeIncidentId
          ? patchIncident(st.incidents, st.activeIncidentId, (i) => ({
              ...i,
              timeline: [...i.timeline, { atSec: at, tone: 'info', text: `${name}: ${short}`, sub: 'team comms · mesh' }],
            }))
          : st.incidents,
      };
    }),

  standDownMuster: () =>
    set((st) => {
      if (!st.muster.active) return {};
      const accounted = Object.values(st.staff).filter((s) => s.mustered).length;
      // Live bridge up → release every phone from muster mode.
      broadcastOps(opsMsg.musterClear(accounted, Object.keys(st.staff).length));
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
      if (cur.mustered) return {};
      return {
        staff: { ...st.staff, [staffId]: { ...cur, mustered: true } },
        auditLog: audit(st.auditLog, {
          atSec: nowSec(),
          operatorId: st.operatorId,
          action: 'check_in',
          reason: 'muster check-in confirmed',
          subjectIds: [staffId],
          detail: `${cur.name} · ${cur.zoneId}`,
        }),
      };
    }),

  assignZone: (staffId, zoneId) =>
    set((st) => {
      const cur = st.staff[staffId];
      const zone = st.zones.find((item) => item.id === zoneId);
      if (!cur || !zone || cur.zoneId === zoneId) return {};
      const staff = {
        ...st.staff,
        [staffId]: {
          ...cur,
          zoneId,
          lastPingSec: nowSec(),
        },
      };
      return {
        staff,
        zoneDensity: buildZoneDensity(staff),
        auditLog: audit(st.auditLog, {
          atSec: nowSec(),
          operatorId: st.operatorId,
          action: 'assign_zone',
          reason: 'zone assignment changed',
          subjectIds: [staffId],
          detail: `${cur.name}: ${cur.zoneId} → ${zone.id}`,
        }),
      };
    }),

  startSearch: (subjectName) =>
    set((st) => {
      const name = subjectName.trim() || st.searchOperation.subjectName;
      if (st.searchOperation.active && st.searchOperation.subjectName === name) return {};
      const at = nowSec();
      return {
        searchOperation: {
          ...searchOperation0,
          active: true,
          phase: 'search',
          subjectName: name,
          startedAtSec: at,
          lastConfirmedSec: at,
          radio: [
            { atSec: at, source: 'COMMAND', text: `Search opened for ${name}. Confirm sector assignments.` },
          ],
        },
        auditLog: audit(st.auditLog, {
          atSec: at,
          operatorId: st.operatorId,
          action: 'search_start',
          reason: 'authorised search operation started',
          subjectIds: st.activeIncident()?.raisedByStaffId ? [st.activeIncident()!.raisedByStaffId!] : [],
          detail: name,
        }),
      };
    }),

  reassignSearchTeam: (teamId, sectorId) =>
    set((st) => {
      const team = st.searchOperation.teams.find((item) => item.id === teamId);
      const sector = st.searchOperation.sectors.find((item) => item.id === sectorId);
      if (!team || !sector) return {};
      const at = nowSec();
      return {
        searchOperation: {
          ...st.searchOperation,
          teams: st.searchOperation.teams.map((item) =>
            item.id === teamId
              ? { ...item, assignment: sectorId, status: 'reassigned' as const, etaSec: Math.max(45, item.etaSec - 30) }
              : item,
          ),
          sectors: st.searchOperation.sectors.map((item) =>
            item.id === sectorId && item.status === 'unsearched'
              ? { ...item, status: 'searching' as const }
              : item,
          ),
          radio: [
            ...st.searchOperation.radio,
            { atSec: at, source: 'COMMAND', text: `${team.label} reassigned to ${sectorId} · ${sector.label}.` },
          ],
        },
        auditLog: audit(st.auditLog, {
          atSec: at,
          operatorId: st.operatorId,
          action: 'search_reassign',
          reason: 'search team reassigned',
          subjectIds: [],
          detail: `${team.label}: ${team.assignment} → ${sectorId}`,
        }),
      };
    }),

  markSearchSectorClear: (sectorId) =>
    set((st) => {
      const sector = st.searchOperation.sectors.find((item) => item.id === sectorId);
      if (!sector || sector.status === 'clear') return {};
      const at = nowSec();
      return {
        searchOperation: {
          ...st.searchOperation,
          sectors: st.searchOperation.sectors.map((item) =>
            item.id === sectorId ? { ...item, progressPct: 100, status: 'clear' as const } : item,
          ),
          radio: [
            ...st.searchOperation.radio,
            { atSec: at, source: 'COMMAND', text: `${sectorId} marked clear. Move to adjacent unsearched area.` },
          ],
        },
        auditLog: audit(st.auditLog, {
          atSec: at,
          operatorId: st.operatorId,
          action: 'search_clear',
          reason: 'search sector marked clear',
          subjectIds: [],
          detail: `${sectorId} · ${sector.label}`,
        }),
      };
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
