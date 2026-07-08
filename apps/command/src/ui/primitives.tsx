import type { ReactNode } from 'react';
import { useClock } from './hooks';

type Tone = 'ok' | 'amber' | 'alert' | 'off' | 'info';

/** The console shell + shared topbar. */
export function ConsoleTop({
  site,
  tag,
}: {
  site: ReactNode;
  tag: { text: string; variant?: 'ok' | 'red' | 'amber' };
}) {
  const clock = useClock();
  return (
    <div className="ctop">
      <span className="logo">
        Loc<b>8</b> Command
      </span>
      <span className="site">{site}</span>
      <span className="spacer" />
      <span className={`ctag ${tag.variant === 'red' ? 'red' : tag.variant === 'amber' ? 'amber' : ''}`}>
        ◈ {tag.text}
      </span>
      <span className="ctime">{clock}</span>
    </div>
  );
}

export function Console({ children }: { children: ReactNode }) {
  return <div className="console">{children}</div>;
}

export function PageHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="pagehead">
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
  );
}

export function StatusTile({
  n,
  label,
  variant,
}: {
  n: ReactNode;
  label: string;
  variant?: 'ok' | 'amber' | 'alert';
}) {
  return (
    <div className={`tile ${variant ?? ''}`}>
      <div className="n">{n}</div>
      <div className="l">{label}</div>
    </div>
  );
}

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`pill ${tone}`}>
      <span className="pd" />
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="feedttl">{children}</div>;
}

const TONE_COLOR: Record<Tone, string> = {
  ok: 'var(--ok)',
  amber: 'var(--caution)',
  alert: 'var(--alert)',
  off: 'var(--faint)',
  info: 'var(--info)',
};

export function FeedItem({
  tone,
  text,
  sub,
  hot,
  onClick,
}: {
  tone: Tone;
  text: string;
  sub?: string;
  hot?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`fitem ${hot ? 'hot' : ''}`} onClick={onClick}>
      <span className="fdot" style={{ background: TONE_COLOR[tone] }} />
      <span className="ft">
        {text}
        {sub && <span className="sub">{sub}</span>}
      </span>
    </button>
  );
}

export function RosterItem({
  tone,
  name,
  zone,
  onClick,
}: {
  tone: Tone;
  name: string;
  zone: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="ritem" onClick={onClick}>
      <span className="fdot" style={{ background: TONE_COLOR[tone] }} />
      <span className="rn">{name}</span>
      <span className="rz">{zone}</span>
    </button>
  );
}

export function CoverageBar({
  name,
  pct,
  tone,
  right,
}: {
  name: string;
  pct: number;
  tone: Tone;
  right: string;
}) {
  return (
    <div className="zcov">
      <span className="zn">{name}</span>
      <span className="zbar">
        <span className="zf" style={{ width: `${pct}%`, background: TONE_COLOR[tone] }} />
      </span>
      <span className="zc">{right}</span>
    </div>
  );
}
