import {
  ArrowLeft,
  Broadcast,
  Buildings,
  ClipboardText,
  GridFour,
  MapPin,
  MagnifyingGlass,
  Siren,
  SlidersHorizontal,
  UsersThree,
  X,
} from '@phosphor-icons/react';
import { useCommandStore } from './store/commandStore';
import { OperationsOverview } from './dashboards/OperationsOverview';
import { IncidentDetail } from './dashboards/IncidentDetail';
import { MusterBoard } from './dashboards/MusterBoard';
import { RosterShift } from './dashboards/RosterShift';
import { CoverageHeatmap } from './dashboards/CoverageHeatmap';
import { AuditSearch } from './dashboards/AuditSearch';
import { Commissioning } from './dashboards/Commissioning';
import { AssetsInfrastructure } from './dashboards/AssetsInfrastructure';
import type { Nav, TabId } from './App';

const WORKSPACES: Array<{
  id: TabId;
  label: string;
  icon: typeof GridFour;
}> = [
  { id: 'operations', label: 'Live site', icon: GridFour },
  { id: 'incident', label: 'Incidents', icon: Siren },
  { id: 'roster', label: 'Team', icon: UsersThree },
  { id: 'heatmap', label: 'Coverage', icon: Broadcast },
  { id: 'muster', label: 'Muster', icon: ClipboardText },
  { id: 'assets', label: 'Assets', icon: Buildings },
  { id: 'audit', label: 'Search & audit', icon: MagnifyingGlass },
  { id: 'commissioning', label: 'Commissioning', icon: SlidersHorizontal },
];

export function OperationalWorkspace({
  active,
  onNavigate,
  onClose,
}: {
  active: TabId;
  onNavigate: (tab: TabId) => void;
  onClose: () => void;
}) {
  const store = useCommandStore();
  const activeLabel = WORKSPACES.find((item) => item.id === active)?.label ?? 'Workspace';
  const nav: Nav = {
    open(tab, incidentId) {
      if (incidentId) store.setActiveIncident(incidentId);
      onNavigate(tab);
    },
  };

  return (
    <section className="integrated-workspace" aria-label={`${activeLabel} operational workspace`}>
      <header className="integrated-workspace-header">
        <button type="button" className="workspace-return" onClick={onClose}>
          <ArrowLeft size={17} /> Site
        </button>
        <div className="workspace-title">
          <span>OPERATIONAL WORKSPACE</span>
          <strong>{activeLabel}</strong>
        </div>
        <div className="workspace-health">
          <span><i /> {store.liveConnected ? 'LIVE BRIDGE' : 'SCRIPTED DEMO'}</span>
          <span><MapPin size={13} /> {store.siteName}</span>
        </div>
        <button type="button" className="workspace-close" onClick={onClose} aria-label="Close workspace">
          <X size={17} />
        </button>
      </header>

      <nav className="integrated-workspace-tabs" aria-label="Operational workspaces">
        {WORKSPACES.map(({ id, label, icon: WorkspaceIcon }) => (
          <button
            type="button"
            key={id}
            className={active === id ? 'active' : ''}
            aria-current={active === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}
          >
            <WorkspaceIcon size={15} />
            <span>{label}</span>
            {id === 'incident' && store.sosCount() > 0 && <em>{store.sosCount()}</em>}
          </button>
        ))}
      </nav>

      <div className="integrated-workspace-scroll">
        {active === 'operations' && <OperationsOverview nav={nav} />}
        {active === 'incident' && (
          <>
            <section className="incident-queue-strip" aria-label="Incident queue">
              <div>
                <span>INCIDENT QUEUE</span>
                <b>{store.incidents.filter((incident) => incident.status !== 'resolved').length} OPEN</b>
              </div>
              {store.incidents
                .slice()
                .sort((a, b) => b.raisedAtSec - a.raisedAtSec)
                .map((incident) => (
                  <button
                    type="button"
                    key={incident.id}
                    className={store.activeIncidentId === incident.id ? 'active' : ''}
                    onClick={() => store.setActiveIncident(incident.id)}
                  >
                    <i className={incident.status === 'resolved' ? 'resolved' : incident.kind === 'sos' ? 'alert' : 'caution'} />
                    <span><b>{incident.id}</b><small>{incident.feedText}</small></span>
                    <em>{incident.status}</em>
                  </button>
                ))}
            </section>
            <IncidentDetail nav={nav} />
          </>
        )}
        {active === 'muster' && <MusterBoard />}
        {active === 'roster' && <RosterShift />}
        {active === 'heatmap' && <CoverageHeatmap />}
        {active === 'assets' && <AssetsInfrastructure openCommissioning={() => onNavigate('commissioning')} />}
        {active === 'commissioning' && <Commissioning />}
        {active === 'audit' && <AuditSearch />}
      </div>
    </section>
  );
}
