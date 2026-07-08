// Tactical map primitives. Positions are percentages (0..100) of the canvas so
// the map scales responsively. Renders only the entities Command may show:
// consented staff dots, incident markers, assembly points — never anonymous
// attendees.
import type { ReactNode } from 'react';
import type { Zone } from '../domain/types';

type DotTone = 'ok' | 'info' | 'caution' | 'sos' | 'off';

export function MapCanvas({ children, staticSize }: { children: ReactNode; staticSize?: boolean }) {
  return <div className={`cmap ${staticSize ? 'static' : ''}`}>{children}</div>;
}

export function ZoneRect({ zone }: { zone: Zone }) {
  return (
    <>
      <div
        className="zone"
        style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
      />
      <div className="zlab" style={{ left: `${zone.x + 1.5}%`, top: `${zone.y + 2}%` }}>
        {zone.name}
      </div>
    </>
  );
}

export function GuardDot({
  x,
  y,
  tone,
  label,
  sublabel,
  onClick,
}: {
  x: number;
  y: number;
  tone: DotTone;
  label: string;
  sublabel?: string;
  onClick?: () => void;
}) {
  return (
    <>
      <div
        className={`dot ${tone}`}
        style={{ left: `${x}%`, top: `${y}%`, cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
        title={sublabel}
      >
        {label}
      </div>
      {sublabel && (
        <div className="dotlab" style={{ left: `${x}%`, top: `${y}%` }}>
          {sublabel}
        </div>
      )}
    </>
  );
}

export function IncidentMarker({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div className="inc" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="r" />
      <div className="core">
        <svg className="icn" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 4l9 16H3z" />
          <path d="M12 10v4M12 17v.01" />
        </svg>
      </div>
      <div className="inclab">{label}</div>
    </div>
  );
}

export function AssemblyMarker({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div className="assembly" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="core">
        <svg className="icn" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
          <circle cx="9.5" cy="8" r="3" />
          <path d="M21 19v-1a4 4 0 0 0-3-3.8" />
        </svg>
      </div>
      <div className="lab">{label}</div>
    </div>
  );
}

/** Animated blue dashed dispatch path between two percentage points. */
export function DispatchPaths({ segments }: { segments: Array<[number, number, number, number]> }) {
  return (
    <svg className="paths" viewBox="0 0 100 100" preserveAspectRatio="none">
      {segments.map(([x1, y1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
