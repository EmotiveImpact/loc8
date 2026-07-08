import { useCommandStore } from '../store/commandStore';
import { coverageGaps, zoneName } from '../domain/zones';
import { Console, ConsoleTop, PageHead } from '../ui/primitives';
import { ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';
import type { Zone } from '../domain/types';

// Coverage heatmap — the PRIVACY-SAFE operator overview. It renders ONLY
// aggregate zone density (from store.zoneDensity, which holds counts, never
// identities). There is no individual dot, track, or movement history here by
// design. Roster-level detail lives elsewhere; this view can never become a
// person-tracker because it has no person data to draw from.

const HEAT_ZONES: Zone[] = [
  { id: 'main_room', name: 'MAIN ROOM', x: 6, y: 8, w: 40, h: 40 },
  { id: 'bar', name: 'BAR', x: 54, y: 8, w: 40, h: 32 },
  { id: 'terrace', name: 'SMOKING TERRACE', x: 6, y: 56, w: 40, h: 36 },
  { id: 'car_park', name: 'CAR PARK', x: 54, y: 50, w: 40, h: 42 },
];

// Blob centre per zone (percentage of canvas).
const BLOB_POS: Record<string, [number, number, number]> = {
  main_room: [26, 28, 60],
  bar: [74, 24, 52],
  terrace: [26, 74, 50],
  car_park: [74, 70, 58],
  perimeter: [8, 8, 44],
  gate_c: [88, 12, 40],
};

export function CoverageHeatmap() {
  const store = useCommandStore();
  const gaps = coverageGaps(store.zoneDensity);

  return (
    <>
      <PageHead title="Coverage heatmap" sub="Anonymised aggregate density — crowd-crush prevention without surveillance. (Clean stub.)" />
      <Console>
        <ConsoleTop site={<><span>· </span><b>Coverage</b> · aggregate density</>} tag={{ text: 'MESH · ANONYMISED', variant: 'ok' }} />
        <div className="heatbody">
          <div className="heatmap">
            {store.zoneDensity.map((d) => {
              const p = BLOB_POS[d.zoneId];
              if (!p) return null;
              const cls = d.level === 'good' ? 'good' : d.level === 'thin' ? 'mid' : 'gap';
              return (
                <div
                  key={d.zoneId}
                  className={`blob ${cls}`}
                  style={{ left: `${p[0]}%`, top: `${p[1]}%`, width: p[2] * 3, height: p[2] * 3 }}
                />
              );
            })}
            <div className="heatgrid" />
            {HEAT_ZONES.map((z) => (
              <ZoneRect key={z.id} zone={z} />
            ))}
            {gaps.map((zid) => {
              const p = BLOB_POS[zid];
              if (!p) return null;
              return (
                <div key={zid} className="gaplab" style={{ left: `${p[0]}%`, top: `${p[1]}%` }}>
                  GAP · {zoneName(store.zones, zid)}
                </div>
              );
            })}
          </div>

          <div className="heatright">
            <div className="covbig">
              {store.venueCoveragePct()}%<span className="cl">VENUE COVERAGE</span>
            </div>

            <div>
              <div className="feedttl" style={{ marginBottom: 10 }}>Density legend</div>
              <div className="legend">
                <div className="legrow">
                  <span className="sw good" />
                  <div>
                    <div className="lt">Well covered</div>
                    <div className="ls">guard within 20m</div>
                  </div>
                </div>
                <div className="legrow">
                  <span className="sw mid" />
                  <div>
                    <div className="lt">Thin</div>
                    <div className="ls">single guard · 20–40m</div>
                  </div>
                </div>
                <div className="legrow">
                  <span className="sw gap" />
                  <div>
                    <div className="lt">Gap</div>
                    <div className="ls">no guard nearby</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="privacy">
              <Icon name="shield" size={18} />
              <span>
                Aggregate coverage only — this heatmap shows <b>zone density</b>, not any individual's
                location or movement history.
              </span>
            </div>
          </div>
        </div>
      </Console>
    </>
  );
}
