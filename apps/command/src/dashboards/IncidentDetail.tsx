import { useEffect, useState } from 'react';
import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { projectToCanvas } from '../domain/coverage';
import { canReveal } from '../domain/privacy';
import { fmtElapsed, fmtHM } from '../domain/time';
import { Console, ConsoleTop, PageHead, Pill, SectionTitle } from '../ui/primitives';
import { DispatchPaths, GuardDot, IncidentMarker, MapCanvas, ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';
import { useElapsed } from '../ui/hooks';
import { emergencyHeadline, incidentStatusLabel, incidentStatusTone, isLiveEmergency } from '../ui/status';
import type { Nav } from '../App';

export function IncidentDetail({ nav }: { nav: Nav }) {
  const store = useCommandStore();
  const inc = store.activeIncident() ?? store.incidents.find((i) => i.kind === 'sos');
  const [dispatchText, setDispatchText] = useState('Converge on Gate C — hold cordon');
  const availableResponders = Object.values(store.staff).filter(
    (member) =>
      member.status !== 'no_signal' &&
      member.status !== 'sos' &&
      !inc?.responders.some((responder) => responder.staffId === member.id),
  );
  const [candidateStaffId, setCandidateStaffId] = useState(availableResponders[0]?.id ?? 0);
  const liveElapsed = useElapsed(inc?.raisedAtSec ?? 0);

  // Viewing an incident that names an individual + their coordinates IS a
  // reveal — log it to the audit trail (privacy model: every reveal is recorded).
  const incId = inc?.id;
  const hasSubject = Boolean(inc?.subjectName || inc?.location);
  useEffect(() => {
    if (incId && hasSubject) store.noteReveal(incId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incId, hasSubject]);

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

  const live = isLiveEmergency(inc);
  // Fail-closed consent gate: only render an individual's identity/location if
  // the consent basis permits it.
  const reveal = canReveal(inc.consentBasis);
  const coord = inc.location && reveal ? `${inc.location.latitude.toFixed(4)}, ${inc.location.longitude.toFixed(4)}` : '—';
  const subject = reveal ? (inc.subjectName ?? '—') : 'identity withheld';
  const elapsed = inc.closedAtSec ? fmtElapsed(inc.closedAtSec - inc.raisedAtSec) : liveElapsed;
  const tagText = live
    ? `SOS ${incidentStatusLabel(inc.status)} · MESH-CONFIRMED`
    : `${incidentStatusLabel(inc.status)} · #${inc.id}`;

  return (
    <>
      <PageHead title="Incident detail" sub="SOS drill-down — timeline, responders and dispatch, all over the mesh." />
      <Console>
        <ConsoleTop
          site={<><span>· </span><b>Incident</b> · #{inc.id}</>}
          tag={{ text: tagText, variant: live ? 'red' : inc.status === 'resolved' ? 'ok' : 'amber' }}
        />

        {live && (
          <div className="sosbanner" role="alert">
            <div className="bcore">
              <Icon name="alert" size={22} />
            </div>
            <div>
              <h2>
                {emergencyHeadline(inc)} · GUARD {String(inc.raisedByStaffId).padStart(2, '0')} ·{' '}
                {zoneName(store.zones, inc.zoneId)}
              </h2>
              <div className="subm">
                {inc.kind === 'duress'
                  ? `${subject} · covert — NO acknowledgment is sent to the device`
                  : inc.kind === 'man_down'
                    ? `${subject} · device silent · last known position held`
                    : `${subject} · panic hold triggered · ${inc.meshConfirmed ? 'mesh-confirmed' : 'unconfirmed'}`}
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

        {!live && (
          <div className="resolvedbar">
            <Pill tone={incidentStatusTone(inc.status)}>{incidentStatusLabel(inc.status)}</Pill>
            <span className="rbsub">
              {inc.kind === 'sos' ? 'SOS' : inc.kind} · {zoneName(store.zones, inc.zoneId)} · raised {fmtHM(inc.raisedAtSec)}
              {inc.closedAtSec ? ` · closed ${fmtHM(inc.closedAtSec)} · duration ${elapsed}` : ''}
            </span>
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
            <div className="statusrow">
              <span className="feedttl">Status</span>
              <Pill tone={incidentStatusTone(inc.status)}>{incidentStatusLabel(inc.status)}</Pill>
            </div>

            <SectionTitle>Responders · {inc.responders.length}</SectionTitle>
            <div className="resp">
              {inc.responders.map((r, i) => {
                const control = r.staffId === 0;
                const stateTone =
                  r.state === 'clear' ? 'ok' : r.state === 'on_scene' ? 'amber' : r.state === 'viewing' ? 'info' : 'info';
                return (
                  <div key={i} className="rcard">
                    <div className={`ra ${control ? 'info' : ''}`}>{r.name.charAt(0)}</div>
                    <div>
                      <div className="rname">{r.name}</div>
                      <div className="rd">
                        {r.distanceM != null ? `${r.distanceM}m · ` : ''}
                        <span style={{ color: `var(--${stateTone === 'ok' ? 'ok' : stateTone === 'amber' ? 'caution' : 'info'})` }}>
                          {r.state.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <SectionTitle>Assign / reassign responder</SectionTitle>
            <div className="field" style={{ marginBottom: 8 }}>
              <select
                className="sel"
                value={candidateStaffId}
                onChange={(event) => setCandidateStaffId(Number(event.target.value))}
                aria-label="Responder to assign"
                disabled={availableResponders.length === 0 || inc.status === 'resolved'}
              >
                {availableResponders.map((member) => (
                  <option key={member.id} value={member.id}>
                    Guard {String(member.id).padStart(2, '0')} · {member.name} · {zoneName(store.zones, member.zoneId)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn"
              disabled={!candidateStaffId || inc.status === 'resolved' || availableResponders.length === 0}
              onClick={() => store.assignResponder(inc.id, candidateStaffId)}
            >
              <Icon name="users" /> Assign responder
            </button>

            <SectionTitle>Dispatch (over mesh)</SectionTitle>
            <div className="field" style={{ marginBottom: 8 }}>
              <input value={dispatchText} onChange={(e) => setDispatchText(e.target.value)} aria-label="dispatch message" />
            </div>
            <button
              type="button"
              className="btn go"
              disabled={inc.status === 'resolved'}
              onClick={() => store.dispatch(dispatchText, { incidentId: inc.id })}
            >
              <Icon name="send" /> Send dispatch
            </button>

            <SectionTitle>Actions</SectionTitle>
            <div className="btnrow">
              <button
                type="button"
                className="btn go"
                disabled={inc.status !== 'active'}
                onClick={() => store.acknowledge(inc.id)}
              >
                <Icon name="check" /> Acknowledge
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={inc.status === 'resolved' || inc.status === 'escalated'}
                onClick={() => {
                  if (window.confirm('Escalate this incident to police? This is logged and externally consequential.'))
                    store.escalate(inc.id);
                }}
              >
                <Icon name="triangle" /> Escalate to police
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={inc.status === 'resolved'}
                onClick={() => { store.resolve(inc.id); nav.open('operations'); }}
              >
                <Icon name="doc" /> Log resolution
              </button>
            </div>
          </div>
        </div>
      </Console>
    </>
  );
}
