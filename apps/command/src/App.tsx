import { useState } from 'react';
import { useCommandStore } from './store/commandStore';
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

  const nav: Nav = {
    open(next, incidentId) {
      if (incidentId) store.setActiveIncident(incidentId);
      setTab(next);
    },
  };

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
    </div>
  );
}
