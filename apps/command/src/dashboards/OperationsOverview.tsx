import { staffPositionFreshness } from '../domain/position';
import { useNowSec } from '../ui/hooks';
import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { projectToCanvas } from '../domain/coverage';
import { Console, ConsoleTop, FeedItem, PageHead, RosterItem, SectionTitle, StatusTile } from '../ui/primitives';
import { AssemblyMarker, GuardDot, IncidentMarker, MapCanvas, ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';
import { CommsStatus } from '../ui/CommsStatus';
import { incidentTone, staffDotTone, staffStatusLabel, staffTone } from '../ui/status';
import type { Nav } from '../App';

export function OperationsOverview({ nav }: { nav: Nav }) {
  const store = useCommandStore();
  const now = useNowSec();
  const zones = store.zones.filter((z) => ['main_room', 'bar', 'terrace', 'car_park', 'gate_c'].includes(z.id));
  const staff = Object.values(store.staff);
  const feed = [...store.incidents].sort((a, b) => b.raisedAtSec - a.raisedAtSec);
  const sos = store.incidents.find((i) => i.kind === 'sos' && i.status !== 'resolved');

  return (
    <>
      <PageHead title="Operations overview" sub="Live team status, incident feed and tactical map — network-independent over the mesh." />
      <Console>
        <ConsoleTop site={<><span>· </span><b>{store.siteName}</b> · {store.shiftLabel}</>} tag={{ text: 'MESH · NETWORK-INDEPENDENT', variant: 'ok' }} />
        <div className="cbody ops">
          {/* left rail */}
          <div className="cleft">
            <div className="tiles">
              <StatusTile n={store.onDutyCount()} label="On duty" variant="ok" />
              <StatusTile n={store.respondingCount()} label="Responding" variant="amber" />
              <StatusTile n={store.sosCount()} label="SOS active" variant="alert" />
              <StatusTile n={`${store.venueCoveragePct()}%`} label="Coverage" variant="ok" />
            </div>
            <CommsStatus />
            <SectionTitle>Live feed</SectionTitle>
            <div className="feed" style={{ maxHeight: 300 }}>
              {feed.map((i) => (
                <FeedItem
                  key={i.id}
                  tone={incidentTone(i)}
                  hot={i.kind === 'sos' && i.status !== 'resolved'}
                  resolved={i.status === 'resolved'}
                  text={i.feedText}
                  sub={i.status === 'resolved' ? `${i.feedSub ?? ''} · resolved` : i.feedSub}
                  onClick={() => nav.open('incident', i.id)}
                />
              ))}
            </div>
          </div>

          {/* center map */}
          <div className="ccenter">
            <p className="mono">Muted points: ageing or unverified position reports.</p>
            <MapCanvas label="Venue map — guard positions and active incident">
              {zones.map((z) => (
                <ZoneRect key={z.id} zone={z} />
              ))}
              {staff
                .filter((s) => s.location && s.status !== 'sos')
                .map((s) => {
                  const position = staffPositionFreshness(s, now);
                  if (!position.location) return null;
                  const p = projectToCanvas(position.location);
                  return (
                    <GuardDot
                      key={s.id}
                      x={p.x}
                      y={p.y}
                      tone={position.isCurrent ? staffDotTone(s.status) : 'off'}
                      label={String(s.id).padStart(2, '0')}
                      title={`Guard ${String(s.id).padStart(2, '0')} · ${s.name.split(' ')[0]} · ${s.status} · ${position.label}`}
                      sublabel={position.state === 'clock-uncertain' ? 'Age unverified' : position.label}
                      onClick={() => nav.open('roster')}
                    />
                  );
                })}
              {sos?.location && (
                <IncidentMarker
                  {...projectToCanvas(sos.location)}
                  label={`SOS · Guard ${String(sos.raisedByStaffId).padStart(2, '0')} · ${zoneName(store.zones, sos.zoneId)}`}
                />
              )}
              {store.muster.active && <AssemblyMarker x={48} y={94} label={`ASSEMBLY · ${store.musteredCount()}`} />}
            </MapCanvas>
          </div>

          {/* right rail */}
          <div className="cright">
            <SectionTitle>Roster · {staff.length}</SectionTitle>
            <div className="roster" style={{ maxHeight: 360 }}>
              {staff
                .slice()
                .sort((a, b) => a.id - b.id)
                .map((s) => (
                  <RosterItem
                    key={s.id}
                    tone={staffTone(s.status)}
                    name={`Guard ${String(s.id).padStart(2, '0')} · ${s.name.split(' ')[0]}`}
                    status={s.status === 'on_post' ? undefined : staffStatusLabel(s.status)}
                    zone={zoneName(store.zones, s.zoneId).split(' ')[0]}
                    onClick={() => nav.open('roster')}
                  />
                ))}
            </div>
            <button type="button" className="btn primary mt" onClick={() => { store.callMuster(); nav.open('muster'); }}>
              <Icon name="users" /> Call muster
            </button>
          </div>
        </div>
      </Console>
    </>
  );
}
