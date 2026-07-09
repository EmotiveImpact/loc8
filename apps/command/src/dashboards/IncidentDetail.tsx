import { useState } from 'react';
import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { projectToCanvas } from '../domain/coverage';
import { fmtHM } from '../domain/time';
import { Console, ConsoleTop, PageHead, SectionTitle } from '../ui/primitives';
import { DispatchPaths, GuardDot, IncidentMarker, MapCanvas, ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';
import { useElapsed } from '../ui/hooks';
import type { Nav } from '../App';

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

          {/* map — projected from real coordinates */}
          <div className="ccenter">
            <MapCanvas label="Incident map — SOS location and converging responders">
              {store.zones
                .filter((z) => ['main_room', 'gate_c', 'foyer', 'terrace'].includes(z.id))
                .map((z) => (
                  <ZoneRect key={z.id} zone={z} />
                ))}
              {inc.location &&
                inc.responders
                  .map((r) => store.staff[r.staffId])
                  .filter((s) => s?.location)
                  .map((s) => {
                    const from = projectToCanvas(s.location!);
                    const to = projectToCanvas(inc.location!);
                    return (
                      <DispatchPaths key={`p${s.id}`} segments={[[from.x, from.y, to.x, to.y]]} />
                    );
                  })}
              {inc.location && (
                <IncidentMarker
                  {...projectToCanvas(inc.location)}
                  label={`GUARD ${String(inc.raisedByStaffId).padStart(2, '0')} · SOS`}
                />
              )}
              {inc.responders
                .filter((r) => r.staffId !== 0)
                .map((r) => {
                  const s = store.staff[r.staffId];
                  if (!s?.location) return null;
                  const p = projectToCanvas(s.location);
                  return (
                    <GuardDot
                      key={r.staffId}
                      x={p.x}
                      y={p.y}
                      tone="caution"
                      label={String(r.staffId).padStart(2, '0')}
                      sublabel={`${String(r.staffId).padStart(2, '0')} · ${r.distanceM}m`}
                    />
                  );
                })}
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
                        {r.distanceM != null ? `${r.distanceM}m · ` : ''}
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
