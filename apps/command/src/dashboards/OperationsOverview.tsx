import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { Console, ConsoleTop, FeedItem, PageHead, RosterItem, SectionTitle, StatusTile } from '../ui/primitives';
import { AssemblyMarker, GuardDot, IncidentMarker, MapCanvas, ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';
import { incidentTone, staffDotTone, staffTone } from '../ui/status';
import type { Nav } from '../App';

// Percentage positions for staff dots on the ops map (by staff id).
const POS: Record<number, [number, number]> = {
  1: [20, 24],
  2: [66, 20],
  3: [80, 15],
  4: [82, 30],
  5: [74, 22],
  6: [16, 74],
  8: [30, 34],
  9: [70, 68],
  10: [12, 46],
  11: [30, 82],
  12: [93, 92],
};

export function OperationsOverview({ nav }: { nav: Nav }) {
  const store = useCommandStore();
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
            <SectionTitle>Live feed</SectionTitle>
            <div className="feed" style={{ maxHeight: 300 }}>
              {feed.map((i) => (
                <FeedItem
                  key={i.id}
                  tone={incidentTone(i)}
                  hot={i.kind === 'sos' && i.status !== 'resolved'}
                  text={i.feedText}
                  sub={i.feedSub}
                  onClick={() => nav.open('incident', i.id)}
                />
              ))}
            </div>
          </div>

          {/* center map */}
          <div className="ccenter">
            <MapCanvas>
              {zones.map((z) => (
                <ZoneRect key={z.id} zone={z} />
              ))}
              {staff
                .filter((s) => POS[s.id] && s.status !== 'sos')
                .map((s) => (
                  <GuardDot
                    key={s.id}
                    x={POS[s.id][0]}
                    y={POS[s.id][1]}
                    tone={staffDotTone(s.status)}
                    label={String(s.id).padStart(2, '0')}
                    onClick={() => nav.open('roster')}
                  />
                ))}
              {sos && (
                <IncidentMarker x={82} y={12} label={`SOS · Guard 07 · ${zoneName(store.zones, sos.zoneId)}`} />
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
