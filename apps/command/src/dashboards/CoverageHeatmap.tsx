import { useCommandStore } from '../store/commandStore';
import { coverageGaps, zoneName } from '../domain/zones';
import { projectToCanvas } from '../domain/coverage';
import { Console, ConsoleTop, PageHead } from '../ui/primitives';
import { ZoneRect } from '../ui/map';
import { Icon } from '../ui/Icon';

// Coverage heatmap — the PRIVACY-SAFE operator overview. It renders ONLY
// aggregate zone density (from store.zoneDensity, which holds counts, never
// identities). There is no individual dot, track, or movement history here by
// design. Roster-level detail lives elsewhere; this view can never become a
// person-tracker because it has no person data to draw from.

// Blob radius (px) scales with the anonymous crowd load in the zone.
const blobSize = (attendeeCount: number) => 120 + Math.min(attendeeCount, 500) * 0.5;

export function CoverageHeatmap() {
  const store = useCommandStore();
  const gaps = coverageGaps(store.zoneDensity);
  const zoneById = Object.fromEntries(store.zones.map((z) => [z.id, z]));

  return (
    <>
      <PageHead title="Coverage heatmap" sub="Anonymised aggregate density — crowd-crush prevention without surveillance." />
      <Console>
        <ConsoleTop site={<><span>· </span><b>Coverage</b> · aggregate density</>} tag={{ text: 'MESH · ANONYMISED', variant: 'ok' }} />
        <div className="heatbody">
          <div className="heatmap" role="img" aria-label="Anonymised coverage density by zone">
            {store.zoneDensity.map((d) => {
              const z = zoneById[d.zoneId];
              if (!z) return null;
              const p = projectToCanvas(z.center);
              const cls = d.level === 'good' ? 'good' : d.level === 'thin' ? 'mid' : 'gap';
              const size = blobSize(d.attendeeCount);
              return (
                <div
                  key={d.zoneId}
                  className={`blob ${cls}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: size, height: size }}
                />
              );
            })}
            <div className="heatgrid" />
            {store.zones
              .filter((z) => store.zoneDensity.some((d) => d.zoneId === z.id))
              .map((z) => (
                <ZoneRect key={z.id} zone={z} />
              ))}
            {gaps.map((zid) => {
              const z = zoneById[zid];
              if (!z) return null;
              const p = projectToCanvas(z.center);
              return (
                <div key={zid} className="gaplab" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
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
