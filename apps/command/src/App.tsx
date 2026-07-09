import { useEffect, useState } from 'react';
import { useCommandStore } from './store/commandStore';
import { emitGuardStatus, guardStatusScript } from './domain/guardFeed';
import { bridgeUrlFromLocation, connectLiveBridge } from './services/liveBridge';
import { Icon } from './ui/Icon';
import { OperationsOverview } from './dashboards/OperationsOverview';
import { IncidentDetail } from './dashboards/IncidentDetail';
import { MusterBoard } from './dashboards/MusterBoard';
import { RosterShift } from './dashboards/RosterShift';
import { CoverageHeatmap } from './dashboards/CoverageHeatmap';
import { AuditSearch } from './dashboards/AuditSearch';

export type TabId = 'operations' | 'incident' | 'muster' | 'roster' | 'heatmap' | 'audit';

/** Navigation handle passed to dashboards so they can drill into each other. */
export interface Nav {
  open(tab: TabId, incidentId?: string): void;
}

const NAV: Array<{ id: TabId; label: string; icon: Parameters<typeof Icon>[0]['name'] }> = [
  { id: 'operations', label: 'Operations', icon: 'radar' },
  { id: 'incident', label: 'Incident', icon: 'alert' },
  { id: 'muster', label: 'Muster', icon: 'users' },
  { id: 'roster', label: 'Roster & shift', icon: 'clipboard' },
  { id: 'heatmap', label: 'Coverage', icon: 'grid' },
  { id: 'audit', label: 'Assisted search', icon: 'search' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('operations');
  const store = useCommandStore();
  const sosActive = store.sosCount() > 0;
  const inbound = useCommandStore((s) => s.lastInboundStatus);
  const [toastOn, setToastOn] = useState(false);

  const nav: Nav = {
    open(next, incidentId) {
      if (incidentId) store.setActiveIncident(incidentId);
      setTab(next);
    },
  };

  // LIVE mode: ?bridge=ws://<host>:8787 connects to the mesh-bridge relay and
  // renders real frames from a Guard gateway phone instead of the sim script.
  // The man-down watchdog only runs on live data — sim timestamps are frozen,
  // so it would cascade false positives against the demo scenario.
  useEffect(() => {
    const url = bridgeUrlFromLocation();
    if (!url) return;
    connectLiveBridge(url);
    const id = setInterval(
      () => useCommandStore.getState().runWatchdog(Math.floor(Date.now() / 1000)),
      10_000,
    );
    return () => clearInterval(id);
  }, []);

  // Live two-way flow (sim): a simulated Guard device replies over the mesh.
  // Each beat is a real quickReply frame encoded + decoded through @loc8/engine
  // before it reaches the store. Skipped entirely when a live bridge is set —
  // real frames must never mix with scripted ones.
  useEffect(() => {
    if (bridgeUrlFromLocation()) return;
    const incident = useCommandStore.getState().incidents.find((i) => i.kind === 'sos');
    if (!incident) return;
    const sosIncidentId = incident.id;
    const responderIds = incident.responders.map((r) => r.staffId).filter((id) => id !== 0);
    if (responderIds.length === 0) return;
    const script = guardStatusScript(responderIds);
    let i = 0;
    const id = setInterval(() => {
      if (i >= script.length) {
        clearInterval(id);
        return;
      }
      const [staffId, code] = script[i++];
      const decoded = emitGuardStatus(staffId, code);
      // Pin the update to the SOS incident this script belongs to — not
      // whatever incident the operator happens to be viewing.
      if (decoded) useCommandStore.getState().applyGuardStatus(decoded.fromId, decoded.code, sosIncidentId);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  // Show a transient toast whenever a new inbound status decodes.
  useEffect(() => {
    if (!inbound) return;
    setToastOn(true);
    const t = setTimeout(() => setToastOn(false), 4200);
    return () => clearTimeout(t);
  }, [inbound?.atSec]);

  return (
    <div className="app">
      <nav className="nav">
        <div className="brand">Loc<b>8</b></div>
        <div className="brandsub">Command</div>
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`navitem ${tab === n.id ? 'active' : ''}`}
            onClick={() => setTab(n.id)}
          >
            <Icon name={n.icon} size={17} />
            {n.label}
            {n.id === 'incident' && sosActive && <span className="badge">SOS</span>}
          </button>
        ))}
        <div className="navspacer" />
        <div className="op">
          <b>{store.operatorId}</b>
          <br />
          {store.siteName}
          <br />
          mesh · offline-first
        </div>
      </nav>

      <main className="main">
        {tab === 'operations' && <OperationsOverview nav={nav} />}
        {tab === 'incident' && <IncidentDetail nav={nav} />}
        {tab === 'muster' && <MusterBoard />}
        {tab === 'roster' && <RosterShift />}
        {tab === 'heatmap' && <CoverageHeatmap />}
        {tab === 'audit' && <AuditSearch />}
      </main>

      {toastOn && inbound && (
        <div className="toast" role="status" aria-live="polite">
          <Icon name="radar" size={16} />
          <span>
            <b>{inbound.name}</b> · {inbound.label}
            <span className="toastsub">inbound over mesh · Guard {String(inbound.staffId).padStart(2, '0')}</span>
          </span>
        </div>
      )}
    </div>
  );
}
