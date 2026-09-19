import { useEffect, useMemo, useState } from 'react';
import { Radio } from '@phosphor-icons/react';
import { App as DigitalTwinApp } from '../../../prototypes/command-digital-twin/src/App.jsx';
import { emitGuardStatus, guardStatusScript } from './domain/guardFeed';
import { fmtHM } from './domain/time';
import { zoneName } from './domain/zones';
import { bridgeUrlFromLocation, connectLiveBridge } from './services/liveBridge';
import { useCommandStore } from './store/commandStore';
import { OperationalWorkspace } from './OperationalWorkspace';

export type TabId =
  | 'operations'
  | 'incident'
  | 'muster'
  | 'roster'
  | 'heatmap'
  | 'assets'
  | 'commissioning'
  | 'audit';

export interface Nav {
  open(tab: TabId, incidentId?: string): void;
}

const ZONE_SCENE_POSITIONS: Record<string, {
  floor: 'G' | 'L1' | 'L2' | 'L3';
  positions: Array<[number, number, number]>;
}> = {
  main_room: { floor: 'G', positions: [[-1.6, 0.55, 0.4], [1.8, 0.55, -1.1], [0.8, 0.55, 2.4]] },
  bar: { floor: 'L1', positions: [[4.8, 0.55, 2.2], [5.6, 0.55, -1.4]] },
  terrace: { floor: 'G', positions: [[-7.1, 0.55, 3.5], [-5.2, 0.55, 5.1]] },
  car_park: { floor: 'G', positions: [[14.1, 0.55, 8.2], [16.8, 0.55, 10.1]] },
  gate_c: { floor: 'G', positions: [[-3.1, 0.55, -5.35], [-5.4, 0.55, -6.2]] },
  foyer: { floor: 'L1', positions: [[-1.8, 0.55, -4.2], [1.4, 0.55, -4.4]] },
  perimeter: { floor: 'G', positions: [[10.2, 0.55, 1.8], [9.4, 0.55, 5.2]] },
};

const STAFF_COLOURS = {
  on_post: '#49e2b1',
  responding: '#53b9d8',
  lone: '#ffb23e',
  sos: '#ff5570',
  no_signal: '#5b746c',
};

function useOperationalTransport() {
  const inbound = useCommandStore((state) => state.lastInboundStatus);
  const [toastOn, setToastOn] = useState(false);

  useEffect(() => {
    const url = bridgeUrlFromLocation();
    if (!url) return;
    connectLiveBridge(url);
    const id = window.setInterval(
      () => useCommandStore.getState().runWatchdog(Math.floor(Date.now() / 1000)),
      10_000,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (bridgeUrlFromLocation()) return;
    const incident = useCommandStore.getState().incidents.find((item) => item.kind === 'sos');
    if (!incident) return;
    const responderIds = incident.responders.map((responder) => responder.staffId).filter((id) => id !== 0);
    if (responderIds.length === 0) return;
    const script = guardStatusScript(responderIds);
    let index = 0;
    const id = window.setInterval(() => {
      if (index >= script.length) {
        window.clearInterval(id);
        return;
      }
      const [staffId, code] = script[index++];
      const decoded = emitGuardStatus(staffId, code);
      if (decoded) {
        useCommandStore.getState().applyGuardStatus(decoded.fromId, decoded.code, incident.id);
      }
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!inbound) return;
    setToastOn(true);
    const timer = window.setTimeout(() => setToastOn(false), 4200);
    return () => window.clearTimeout(timer);
  }, [inbound?.atSec]);

  return { inbound, toastOn };
}

export default function App() {
  const store = useCommandStore();
  const { inbound, toastOn } = useOperationalTransport();
  const activeIncident =
    store.activeIncident() ??
    store.incidents.find((incident) => incident.status !== 'resolved') ??
    store.incidents[0];

  const commandState = useMemo(() => {
    const staff = Object.values(store.staff).sort((a, b) => a.id - b.id);
    const openIncidents = store.incidents.filter((incident) => incident.status !== 'resolved');
    const scenePeople = staff.map((member, index) => {
      const zone = ZONE_SCENE_POSITIONS[member.zoneId] ?? ZONE_SCENE_POSITIONS.perimeter;
      return {
        id: `staff-${member.id}`,
        staffId: member.id,
        label: member.name,
        floor: zone.floor,
        position: zone.positions[index % zone.positions.length],
        colour: STAFF_COLOURS[member.status],
        status: member.status,
        zoneId: member.zoneId,
      };
    });
    const sceneIncidents = openIncidents
      .filter((incident) => incident.kind !== 'shift')
      .map((incident, index) => {
        const zone = ZONE_SCENE_POSITIONS[incident.zoneId] ?? ZONE_SCENE_POSITIONS.perimeter;
        return {
          id: incident.id,
          label: incident.feedText,
          floor: zone.floor,
          position: zone.positions[index % zone.positions.length],
          severity: incident.kind === 'sos' || incident.kind === 'duress' || incident.kind === 'man_down'
            ? 'critical'
            : 'warning',
          incidentId: incident.id,
        };
      });
    return {
      siteName: store.siteName,
      shiftLabel: store.shiftLabel,
      operatorId: store.operatorId,
      sourceLabel: store.liveConnected ? 'LIVE BRIDGE' : 'SCRIPTED DEMO',
      liveConnected: store.liveConnected,
      onDuty: store.onDutyCount(),
      openEvents: openIncidents.length,
      coverage: store.venueCoveragePct(),
      gateways: '7/8',
      auditCount: store.auditLog.length,
      dispatchCount: store.dispatchLog.length,
      muster: {
        active: store.muster.active,
        accounted: store.musteredCount(),
        total: staff.length,
        outstanding: store.outstandingStaff().length,
        assemblyPoint: store.muster.assemblyPoint,
      },
      searchOperation: store.searchOperation,
      activeIncident: activeIncident
        ? {
            id: activeIncident.id,
            kind: activeIncident.kind,
            status: activeIncident.status,
            title: activeIncident.kind === 'sos'
              ? `SOS · ${zoneName(store.zones, activeIncident.zoneId)}`
              : activeIncident.feedText,
            subjectName: activeIncident.subjectName ?? `Guard ${String(activeIncident.raisedByStaffId ?? 0).padStart(2, '0')}`,
            zoneName: zoneName(store.zones, activeIncident.zoneId),
            raisedAt: fmtHM(activeIncident.raisedAtSec),
            responders: activeIncident.responders.map((responder) => ({
              ...responder,
              displayName: responder.name,
              eta: responder.distanceM == null ? 'VIEWING' : `${Math.max(20, Math.round(responder.distanceM / 1.25))}s`,
            })),
            timeline: activeIncident.timeline.map((event) => ({
              ...event,
              time: fmtHM(event.atSec),
            })),
          }
        : null,
      incidents: store.incidents.map((incident) => ({
        id: incident.id,
        kind: incident.kind,
        status: incident.status,
        title: incident.feedText,
        sub: incident.feedSub ?? zoneName(store.zones, incident.zoneId),
        zoneName: zoneName(store.zones, incident.zoneId),
      })),
      staff: staff.map((member) => ({
        id: member.id,
        name: member.name,
        status: member.status,
        zoneName: zoneName(store.zones, member.zoneId),
        lastPing: fmtHM(member.lastPingSec),
        mustered: Boolean(member.mustered),
      })),
      scenePeople,
      sceneIncidents,
      sceneTeams: [
        { id: 'team-alpha', label: 'Team Alpha', position: [-15.7, 0.5, -6.8], colour: '#49e2b1' },
        { id: 'team-bravo', label: 'Team Bravo', position: [14.7, 0.5, 7.4], colour: '#53b9d8' },
        { id: 'team-response', label: 'Response Team', position: [-12.8, 0.5, 11.6], colour: '#ffb23e' },
      ],
      coverageRows: store.zoneDensity.map((row) => ({
        id: row.zoneId,
        label: zoneName(store.zones, row.zoneId),
        coverage: row.coveragePct,
        guards: row.guardCount,
        attendees: row.attendeeCount,
        level: row.level,
      })),
    };
  }, [activeIncident, store]);

  const commandActions = useMemo(() => ({
    selectIncident: (id: string) => store.setActiveIncident(id),
    acknowledgeIncident: (id: string) => store.acknowledge(id),
    escalateIncident: (id: string) => store.escalate(id),
    resolveIncident: (id: string) => store.resolve(id),
    dispatchIncident: (id: string, text: string) => store.dispatch(text, { incidentId: id }),
    assignResponder: (incidentId: string, staffId: number) => store.assignResponder(incidentId, staffId),
    callMuster: () => store.callMuster(),
    standDownMuster: () => store.standDownMuster(),
    checkIn: (staffId: number) => store.checkIn(staffId),
    runAssistedSearch: (query: string, reason: string) => store.runAssistedSearch(query, reason),
    startSearch: (subjectName: string) => store.startSearch(subjectName),
    reassignSearchTeam: (teamId: string, sectorId: string) => store.reassignSearchTeam(teamId, sectorId),
    markSearchSectorClear: (sectorId: string) => store.markSearchSectorClear(sectorId),
  }), [store]);

  return (
    <div className="command-runtime">
      <DigitalTwinApp
        commandState={commandState}
        commandActions={commandActions}
        renderWorkspace={({ workspace, onClose, onNavigate }: {
          workspace: TabId;
          onClose: () => void;
          onNavigate: (tab: TabId) => void;
        }) => (
          <OperationalWorkspace active={workspace} onClose={onClose} onNavigate={onNavigate} />
        )}
      />

      {toastOn && inbound && (
        <div className="spatial-toast" role="status" aria-live="polite">
          <Radio size={17} weight="fill" />
          <span>
            <b>{inbound.name}</b>
            <small>{inbound.label} · inbound over mesh · Guard {String(inbound.staffId).padStart(2, '0')}</small>
          </span>
        </div>
      )}
    </div>
  );
}
