import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { projectToCanvas } from '../domain/coverage';
import { Console, ConsoleTop, PageHead } from '../ui/primitives';
import { AssemblyMarker, GuardDot, IncidentMarker, MapCanvas, ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';
import { useElapsed } from '../ui/hooks';
import { staffDotTone } from '../ui/status';

export function MusterBoard() {
  const store = useCommandStore();
  const staff = Object.values(store.staff).sort((a, b) => a.id - b.id);
  const total = staff.length;
  const accounted = store.musteredCount();
  const outstanding = store.outstandingStaff();
  const pct = total ? Math.round((accounted / total) * 100) : 0;
  const elapsed = useElapsed(store.muster.startedAtSec);

  return (
    <>
      <PageHead title="Muster / evacuation board" sub="Live headcount to the assembly point — who is accounted for, who is still out." />
      <Console>
        <ConsoleTop
          site={<><span>· </span><b>Muster</b> · {store.muster.assemblyPoint}</>}
          tag={{ text: 'HEADCOUNT · MESH-LIVE', variant: 'amber' }}
        />

        {!store.muster.active ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>No muster in progress.</p>
            <button type="button" className="btn primary" style={{ margin: '0 auto' }} onClick={() => store.callMuster()}>
              <Icon name="users" /> Call muster / evacuation
            </button>
          </div>
        ) : (
          <>
            <div className="musterbanner" role="alert">
              <span className="mpulse" />
              <div>
                <h2>MUSTER IN PROGRESS</h2>
                <div className="subm">all staff to {store.muster.assemblyPoint}</div>
              </div>
              <span className="clock" aria-live="polite">{elapsed}</span>
              <button type="button" className="btn amber" style={{ marginLeft: 12 }} onClick={() => store.standDownMuster()}>
                <Icon name="check" /> Stand down
              </button>
            </div>

            <div className="countwrap">
              <div className="bignum">
                {accounted}
                <small> / {total}</small>
                <span className="cl">ACCOUNTED FOR</span>
              </div>
              <div className="prog">
                <div className="bar">
                  <div className="fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="lbls">
                  <span>{accounted} checked in</span>
                  <span>{outstanding.length} outstanding · {100 - pct}%</span>
                </div>
              </div>
            </div>

            <div className="musterbody">
              <div className="mustergrid">
                {staff.map((s) => {
                  const out = !s.mustered;
                  // A no-signal guard cannot self-report over the mesh, so the
                  // console must not let a tap mark them "safe" — that is the
                  // exact failure a muster board exists to prevent.
                  const unreachable = s.status === 'no_signal';
                  const checkable = out && !unreachable;
                  const detail = out
                    ? s.status === 'sos'
                      ? `SOS · ${zoneName(store.zones, s.zoneId).split(' ')[0]}`
                      : unreachable
                        ? 'NO SIGNAL'
                        : zoneName(store.zones, s.zoneId).split(' ')[0].toUpperCase()
                    : 'ACCOUNTED';
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`gcard ${out ? 'out' : 'acc'}`}
                      disabled={out && unreachable}
                      onClick={() => checkable && store.checkIn(s.id)}
                      title={
                        !out
                          ? 'Accounted for'
                          : unreachable
                            ? 'No mesh signal — cannot self-report; locate physically before marking safe'
                            : 'Tap to check in'
                      }
                    >
                      <div className="gid">{String(s.id).padStart(2, '0')}</div>
                      <div className="gname">{s.name.split(' ').slice(-1)[0]}</div>
                      <div className="gstat">
                        <span className="gs-dot" />
                        {detail}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="ccenter">
                <MapCanvas label="Muster map — assembly point and outstanding staff">
                  {store.zones
                    .filter((z) => ['main_room', 'gate_c', 'car_park'].includes(z.id))
                    .map((z) => (
                      <ZoneRect key={z.id} zone={z} />
                    ))}
                  <AssemblyMarker x={30} y={88} label={`ASSEMBLY POINT A · ${accounted}`} />
                  {outstanding.map((s, i) => {
                    const p = s.location ? projectToCanvas(s.location) : { x: 90, y: 90 + i };
                    if (s.status === 'sos')
                      return <IncidentMarker key={s.id} x={p.x} y={p.y} label={`${String(s.id).padStart(2, '0')} · still out`} />;
                    return (
                      <GuardDot
                        key={s.id}
                        x={p.x}
                        y={p.y}
                        tone={staffDotTone(s.status)}
                        label={String(s.id).padStart(2, '0')}
                        sublabel={`${String(s.id).padStart(2, '0')} · ${s.status === 'no_signal' ? 'no signal' : zoneName(store.zones, s.zoneId).split(' ')[0].toLowerCase()}`}
                      />
                    );
                  })}
                </MapCanvas>
              </div>
            </div>
          </>
        )}
      </Console>
    </>
  );
}
