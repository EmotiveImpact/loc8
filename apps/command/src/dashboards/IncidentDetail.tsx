import { useState } from 'react';
import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { fmtHM } from '../domain/time';
import { Console, ConsoleTop, PageHead, SectionTitle } from '../ui/primitives';
import { DispatchPaths, GuardDot, IncidentMarker, MapCanvas, ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';
import { useElapsed } from '../ui/hooks';
import type { Zone } from '../domain/types';
import type { Nav } from '../App';

const INC_ZONES: Zone[] = [
  { id: 'concourse', name: 'MAIN CONCOURSE', x: 6, y: 8, w: 44, h: 44 },
  { id: 'gate_c', name: 'GATE C', x: 60, y: 8, w: 34, h: 30 },
  { id: 'foyer', name: 'FOYER', x: 6, y: 58, w: 44, h: 34 },
];

export function IncidentDetail({ nav }: { nav: Nav }) {
  const store = useCommandStore();
  const inc = store.activeIncident() ?? store.incidents.find((i) => i.kind === 'sos');
  const [dispatchText, setDispatchText] = useState('Converge on Gate C — hold cordon');
  const elapsed = useElapsed(inc?.raisedAtSec ?? 0);

  if (!inc) {
    return (
      <>
        <PageHead title="Incident detail" sub="No incident selected." />
        <Console>
          <div className="stubnote">
            <Icon name="info" /> Select an incident from the Operations feed.
          </div>
        </Console>
      </>
    );
  }

  const isSos = inc.kind === 'sos';
  const coord = inc.location ? `${inc.location.latitude.toFixed(4)}, ${inc.location.longitude.toFixed(4)}` : '—';

  return (
    <>
      <PageHead title="Incident detail" sub="SOS drill-down — timeline, responders and dispatch, all over the mesh." />
      <Console>
        <ConsoleTop
          site={<><span>· </span><b>Incident</b> · #{inc.id}</>}
          tag={{ text: isSos ? 'SOS ACTIVE · MESH-CONFIRMED' : 'INCIDENT · MESH-CONFIRMED', variant: isSos ? 'red' : 'amber' }}
        />

        {isSos && (
          <div className="sosbanner">
            <div className="bcore">
              <Icon name="alert" size={22} />
            </div>
            <div>
              <h2>SOS · GUARD {String(inc.raisedByStaffId).padStart(2, '0')} · {zoneName(store.zones, inc.zoneId)}</h2>
              <div className="subm">
                {inc.subjectName} · panic hold triggered · {inc.meshConfirmed ? 'mesh-confirmed' : 'unconfirmed'}
              </div>
            </div>
            <div className="meta">
              RAISED <b>{fmtHM(inc.raisedAtSec)}</b>
              <br />
              ELAPSED <b>{elapsed}</b>
              <br />
              COORD <b>{coord}</b>
            </div>
          </div>
        )}

        <div className="cbody incident">
          {/* timeline */}
          <div className="cleft">
            <SectionTitle>Incident timeline</SectionTitle>
            <div className="timeline">
              {inc.timeline.map((t, i) => (
                <div key={i} className={`tnode ${t.tone}`}>
                  <div className="rail">
                    <span className="rn" />
                    {i < inc.timeline.length - 1 && <span className="line" />}
                  </div>
                  <div>
                    <div className="tt">{t.text}</div>
                    <div className="ts">{fmtHM(t.atSec)} · {t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* map */}
          <div className="ccenter">
            <MapCanvas>
              {INC_ZONES.map((z) => (
                <ZoneRect key={z.id} zone={z} />
              ))}
              <DispatchPaths segments={[[40, 80, 77, 22], [18, 40, 77, 22]]} />
              <IncidentMarker x={77} y={22} label={`GUARD ${String(inc.raisedByStaffId).padStart(2, '0')} · SOS`} />
              <GuardDot x={40} y={80} tone="caution" label="05" sublabel="05 · 40m" />
              <GuardDot x={18} y={40} tone="caution" label="03" sublabel="03 · 85m" />
            </MapCanvas>
          </div>

          {/* responders + actions */}
          <div className="cright">
            <SectionTitle>Responders · {inc.responders.length}</SectionTitle>
            <div className="resp">
              {inc.responders.map((r, i) => {
                const control = r.staffId === 0;
                return (
                  <div key={i} className="rcard">
                    <div className={`ra ${control ? 'info' : ''}`}>{r.name.charAt(0)}</div>
                    <div>
                      <div className="rname">{r.name}</div>
                      <div className="rd">
                        {r.etaMin ? `${r.etaMin}m · ` : ''}
                        {r.state.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <SectionTitle>Dispatch (over mesh)</SectionTitle>
            <div className="field" style={{ marginBottom: 8 }}>
              <input value={dispatchText} onChange={(e) => setDispatchText(e.target.value)} aria-label="dispatch message" />
            </div>
            <button type="button" className="btn go" onClick={() => store.dispatch(dispatchText, { incidentId: inc.id })}>
              <Icon name="send" /> Send dispatch
            </button>

            <SectionTitle>Actions</SectionTitle>
            <div className="btnrow">
              <button type="button" className="btn go" onClick={() => store.acknowledge(inc.id)}>
                <Icon name="check" /> Acknowledge
              </button>
              <button type="button" className="btn primary" onClick={() => store.escalate(inc.id)}>
                <Icon name="triangle" /> Escalate to police
              </button>
              <button type="button" className="btn ghost" onClick={() => { store.resolve(inc.id); nav.open('operations'); }}>
                <Icon name="doc" /> Log resolution
              </button>
            </div>
          </div>
        </div>
      </Console>
    </>
  );
}
