import { useState } from 'react';
import { staffPositionFreshness } from '../domain/position';
import { useNowSec } from '../ui/hooks';
import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { fmtHM } from '../domain/time';
import { Console, ConsoleTop, CoverageBar, PageHead, Pill } from '../ui/primitives';
import { Icon } from '../ui/Icon';
import { staffStatusLabel, staffTone, type Tone } from '../ui/status';

export function RosterShift() {
  const store = useCommandStore();
  const now = useNowSec();
  const staff = Object.values(store.staff).sort((a, b) => a.id - b.id);
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id ?? 0);
  const [selectedZoneId, setSelectedZoneId] = useState(store.zones[0]?.id ?? '');
  const [assignmentNotice, setAssignmentNotice] = useState('');

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
                  <th>Last contact / report</th>
                  <th>Position report age</th>
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
                    <td className="mono">{staffPositionFreshness(s, now).label}</td>
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
              <select
                className="sel"
                aria-label="Guard to reassign"
                value={selectedStaffId}
                onChange={(event) => setSelectedStaffId(Number(event.target.value))}
              >
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    Guard {String(member.id).padStart(2, '0')} · {member.name}
                  </option>
                ))}
              </select>
              <select
                className="sel"
                aria-label="Target zone"
                value={selectedZoneId}
                onChange={(event) => setSelectedZoneId(event.target.value)}
              >
                {store.zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>→ {zone.name}</option>
                ))}
              </select>
              <div className="btnrow" style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className="btn go"
                  onClick={() => {
                    const member = store.staff[selectedStaffId];
                    const zone = store.zones.find((item) => item.id === selectedZoneId);
                    if (!member || !zone) return;
                    store.assignZone(selectedStaffId, selectedZoneId);
                    setAssignmentNotice(`${member.name} assigned to ${zone.name}`);
                  }}
                >
                  <Icon name="arrow" /> Reassign zone
                </button>
              </div>
              {assignmentNotice && <div className="assignmentnotice" role="status">{assignmentNotice}</div>}
            </div>
          </div>
        </div>
      </Console>
    </>
  );
}
