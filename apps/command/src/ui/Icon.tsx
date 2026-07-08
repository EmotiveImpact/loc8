// Lucide-style inline stroke icons (no emoji in UI, per design README).
import type { CSSProperties, ReactElement } from 'react';

type IconName =
  | 'radar'
  | 'alert'
  | 'users'
  | 'shield'
  | 'grid'
  | 'clipboard'
  | 'check'
  | 'siren'
  | 'doc'
  | 'search'
  | 'send'
  | 'plus'
  | 'arrow'
  | 'triangle'
  | 'info';

const PATHS: Record<IconName, ReactElement> = {
  radar: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 12l6-4" />
      <circle cx="12" cy="12" r="1.6" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5v.01" />
    </>
  ),
  users: (
    <>
      <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
      <circle cx="9.5" cy="8" r="3" />
      <path d="M21 19v-1a4 4 0 0 0-3-3.8" />
      <path d="M15 5.2A3 3 0 0 1 15 11" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v2.5H9z" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" />,
  siren: (
    <>
      <path d="M6 18v-4a6 6 0 0 1 12 0v4" />
      <path d="M4 18h16" />
      <path d="M12 4V2" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M10 12h5M10 16h5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4-4" />
    </>
  ),
  send: <path d="M4 12l16-8-6 16-3-6-7-2z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  triangle: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17v.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg className="icn" width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
