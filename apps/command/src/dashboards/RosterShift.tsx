import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { fmtHM } from '../domain/time';
import { Console, ConsoleTop, CoverageBar, PageHead, Pill } from '../ui/primitives';
import { Icon } from '../ui/Icon';
import { staffStatusLabel, staffTone, type Tone } from '../ui/status';

// Roster & shift management. The table + live zone coverage are real (driven by
// the same store as every other dashboard); assign/reassign is a clean stub —
// the interaction surface is wired but the write path is a TODO for the shift
// back-office, not the live-ops critical path.
export function RosterShift() {
  const store = useCommandStore();
  const staff = Object.values(store.staff).sort((a, b) => a.id - b.id);

  const pillTone = (t: Tone): 'ok' | 'amber' | 'alert' | 'off' =>
    t === 'info' ? 'ok' : (t as 'ok' | 'amber' | 'alert' | 'off');

  const coverageRows = store.zoneDensity.map((d) => ({
    name: zoneName(store.zones, d.zoneId),
    pct: d.coveragePct,
    tone: (d.level === 'good' ? 'ok' : d.level === 'thin' ? 'amber' : 'alert') as Tone,
    right: `${d.guardCount} · ${d.level === 'gap' ? 'gap' : `${d.coveragePct}%`}`,
  }));

  return (
    <>
      <PageHead title="Roster & shift management" sub="Who's on, where, and since when — plus live zone coverage." />
      <Console>
        <ConsoleTop
          site={<><span>· </span><b>Roster</b> · {store.shiftLabel} · Team B</>}
          tag={{ text: 'MESH · NETWORK-INDEPENDENT', variant: 'ok' }}
        />
        <div className="rosterbody">
          <div className="tblwrap">
            <table className="rt">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Zone</th>
                  <th>Status</th>
                  <th>On since</th>
                  <th>Last ping</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{String(s.id).padStart(2, '0')}</td>
                    <td className="name">{s.name}</td>
                    <td className="mono">{zoneName(store.zones, s.zoneId)}</td>
                    <td>
                      <Pill tone={pillTone(staffTone(s.status))}>{staffStatusLabel(s.status)}</Pill>
                    </td>
                    <td className="mono">{fmtHM(s.onSinceSec)}</td>
                    <td className="mono">{fmtHM(s.lastPingSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rostergrid">
            <div className="card">
              <h4>Zone coverage</h4>
              {coverageRows.map((r) => (
                <CoverageBar key={r.name} name={r.name} pct={r.pct} tone={r.tone} right={r.right} />
              ))}
            </div>

            <div className="card">
              <h4>Assign / reassign zone</h4>
              <select className="sel" disabled aria-label="Guard to reassign" title="Available when shift back-office ships">
                <option>Guard 01 · Adeyemi</option>
              </select>
              <select className="sel" disabled aria-label="Target zone" title="Available when shift back-office ships">
                <option>→ Perimeter</option>
              </select>
              <div className="btnrow" style={{ marginTop: 4 }}>
                <button type="button" className="btn go" disabled title="Available when shift back-office ships">
                  <Icon name="arrow" /> Reassign zone
                </button>
                <button type="button" className="btn" disabled title="Available when shift back-office ships">
                  <Icon name="plus" /> Add guard to shift
                </button>
              </div>
            </div>
          </div>
        </div>
      </Console>
    </>
  );
}
