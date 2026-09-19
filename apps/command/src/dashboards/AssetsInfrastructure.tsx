import { useMemo, useState } from 'react';
import {
  Broadcast,
  Camera,
  CheckCircle,
  Door,
  MapPin,
  Pulse,
  Radio,
  Warning,
} from '@phosphor-icons/react';
import { useCommandStore } from '../store/commandStore';
import { Console, ConsoleTop, PageHead, SectionTitle } from '../ui/primitives';

type AssetTone = 'ok' | 'caution' | 'alert' | 'info';

interface SiteAsset {
  id: string;
  label: string;
  kind: 'gateway' | 'anchor' | 'camera' | 'door';
  location: string;
  status: string;
  freshness: string;
  tone: AssetTone;
}

const ASSETS: SiteAsset[] = [
  { id: 'GW-01', label: 'North Gate Gateway', kind: 'gateway', location: 'North Gate', status: 'Live', freshness: '2s', tone: 'ok' },
  { id: 'GW-03', label: 'Arena Interior Gateway', kind: 'gateway', location: 'Main Room', status: 'Live', freshness: '1s', tone: 'ok' },
  { id: 'GW-07', label: 'South Perimeter Gateway', kind: 'gateway', location: 'Perimeter', status: 'Degraded', freshness: '41s', tone: 'caution' },
  { id: 'AN-E04', label: 'Anchor E-04', kind: 'anchor', location: 'Gate C', status: 'Live', freshness: '2s', tone: 'ok' },
  { id: 'AN-L218', label: 'Anchor L2-18', kind: 'anchor', location: 'Level 2', status: 'Live', freshness: '3s', tone: 'ok' },
  { id: 'CAM-L218', label: 'Camera L2-18', kind: 'camera', location: 'Service corridor', status: 'Streaming', freshness: 'Live', tone: 'info' },
  { id: 'CAM-N02', label: 'Camera N-02', kind: 'camera', location: 'North concourse', status: 'Maintenance', freshness: '12m', tone: 'caution' },
  { id: 'DR-B14', label: 'Door B-14', kind: 'door', location: 'Back of house', status: 'Secured', freshness: '4s', tone: 'ok' },
];

const assetIcon = {
  gateway: Broadcast,
  anchor: Radio,
  camera: Camera,
  door: Door,
};

export function AssetsInfrastructure({ openCommissioning }: { openCommissioning: () => void }) {
  const store = useCommandStore();
  const [selectedId, setSelectedId] = useState('GW-07');
  const [scanRunning, setScanRunning] = useState(false);
  const [scanNotice, setScanNotice] = useState('');
  const selected = ASSETS.find((asset) => asset.id === selectedId) ?? ASSETS[0];
  const counts = useMemo(
    () => ({
      gateways: ASSETS.filter((asset) => asset.kind === 'gateway' && asset.tone === 'ok').length,
      anchors: ASSETS.filter((asset) => asset.kind === 'anchor' && asset.tone === 'ok').length,
      cameras: ASSETS.filter((asset) => asset.kind === 'camera').length,
      doors: ASSETS.filter((asset) => asset.kind === 'door').length,
    }),
    [],
  );
  const SelectedIcon = assetIcon[selected.kind];

  const runScan = () => {
    setScanRunning(true);
    setScanNotice('Survey request sent across the mesh · awaiting Gateway 07 response');
    window.setTimeout(() => {
      setScanRunning(false);
      setScanNotice('Scan complete · South perimeter remains degraded · inspect power and backhaul');
    }, 1200);
  };

  return (
    <>
      <PageHead
        title="Assets & infrastructure"
        sub="Gateways, anchors, cameras and doors — health, freshness and site context in one operational view."
      />
      <Console>
        <ConsoleTop
          site={<><span>· </span><b>Infrastructure</b> · {store.siteName}</>}
          tag={{ text: '7 / 8 GATEWAYS · 1 DEGRADED', variant: 'amber' }}
        />
        <div className="asset-workspace">
          <section className="asset-inventory">
            <div className="asset-kpis">
              <span><b>{counts.gateways}/3</b><small>Gateways live</small></span>
              <span><b>{counts.anchors}</b><small>Anchors live</small></span>
              <span><b>{counts.cameras}</b><small>Cameras</small></span>
              <span><b>{counts.doors}</b><small>Doors</small></span>
            </div>
            <SectionTitle>Registered site assets · {ASSETS.length}</SectionTitle>
            <div className="asset-table">
              {ASSETS.map((asset) => {
                const AssetIcon = assetIcon[asset.kind];
                return (
                  <button
                    type="button"
                    key={asset.id}
                    className={`asset-record ${selectedId === asset.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(asset.id)}
                  >
                    <AssetIcon size={18} />
                    <span><b>{asset.label}</b><small>{asset.id} · {asset.location}</small></span>
                    <em className={asset.tone}>{asset.status}</em>
                    <time>{asset.freshness}</time>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="asset-inspector">
            <div className={`asset-inspector-icon ${selected.tone}`}><SelectedIcon size={24} /></div>
            <span className="asset-eyebrow">{selected.kind.toUpperCase()} · {selected.id}</span>
            <h2>{selected.label}</h2>
            <p><MapPin size={14} /> {selected.location}</p>
            <div className="asset-state-grid">
              <span><small>STATE</small><b className={selected.tone}>{selected.status}</b></span>
              <span><small>LAST RELAY</small><b>{selected.freshness}</b></span>
              <span><small>SOURCE</small><b>{store.liveConnected ? 'LIVE BRIDGE' : 'SCRIPTED DEMO'}</b></span>
              <span><small>CONFIDENCE</small><b>{selected.tone === 'caution' ? '71%' : '98%'}</b></span>
            </div>
            <div className={`asset-diagnosis ${selected.tone}`}>
              {selected.tone === 'caution' ? <Warning size={18} /> : <CheckCircle size={18} />}
              <span>
                <b>{selected.tone === 'caution' ? 'Inspection recommended' : 'Asset operating normally'}</b>
                <small>
                  {selected.tone === 'caution'
                    ? 'Signal freshness exceeds the operational threshold. Check power, mounting and backhaul.'
                    : 'Telemetry is fresh and the asset is contributing to the current venue picture.'}
                </small>
              </span>
            </div>
            <button type="button" className="btn go" onClick={runScan} disabled={scanRunning}>
              <Pulse size={17} /> {scanRunning ? 'Running live scan…' : 'Run coverage scan'}
            </button>
            <button type="button" className="btn" onClick={openCommissioning}>
              <MapPin size={17} /> Open in Map Builder
            </button>
            {scanNotice && <div className="asset-scan-notice" role="status">{scanNotice}</div>}
          </aside>
        </div>
      </Console>
    </>
  );
}
