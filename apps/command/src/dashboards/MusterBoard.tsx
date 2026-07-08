import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { Console, ConsoleTop, PageHead } from '../ui/primitives';
import { AssemblyMarker, GuardDot, IncidentMarker, MapCanvas, ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';
import { useElapsed } from '../ui/hooks';
import { staffDotTone } from '../ui/status';
import type { Zone } from '../domain/types';

const MUSTER_ZONES: Zone[] = [
  { id: 'venue', name: 'VENUE', x: 6, y: 8, w: 50, h: 60 },
  { id: 'gate_c', name: 'GATE C', x: 64, y: 8, w: 30, h: 26 },
];

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
            <div className="musterbanner">
              <span className="mpulse" />
              <div>
                <h2>MUSTER IN PROGRESS</h2>
                <div className="subm">all staff to {store.muster.assemblyPoint}</div>
              </div>
              <span className="clock">{elapsed}</span>
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
                  const detail = out
                    ? s.status === 'sos'
                      ? `SOS · ${zoneName(store.zones, s.zoneId).split(' ')[0]}`
                      : s.status === 'no_signal'
                        ? 'NO SIGNAL'
                        : zoneName(store.zones, s.zoneId).split(' ')[0].toUpperCase()
                    : 'ACCOUNTED';
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`gcard ${out ? 'out' : 'acc'}`}
                      onClick={() => !s.mustered && store.checkIn(s.id)}
                      title={out ? 'Tap to check in' : 'Accounted for'}
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
                <MapCanvas>
                  {MUSTER_ZONES.map((z) => (
                    <ZoneRect key={z.id} zone={z} />
                  ))}
                  <AssemblyMarker x={30} y={82} label={`ASSEMBLY POINT A · ${accounted}`} />
                  {outstanding.map((s, i) => {
                    if (s.status === 'sos') return <IncidentMarker key={s.id} x={78} y={18} label={`${String(s.id).padStart(2, '0')} · still out`} />;
                    return (
                      <GuardDot
                        key={s.id}
                        x={70 + i * 6}
                        y={50 + i * 8}
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
