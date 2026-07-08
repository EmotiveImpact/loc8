// apps/guard/src/ui/opsTheme.ts — the Guard "tactical" register.
//
// A local palette (screens + branding live in the app, per the engine boundary
// rules), but it reuses the engine's shared font tokens so type stays 1:1 with
// the rest of the family. Values track docs/design/README.md §Ops and
// docs/design/gallery-guard.html: near-black surfaces, monospace data,
// green = OK / amber = caution / red = SOS / blue = you·info.
import { fonts } from '@loc8/engine';

export const ops = {
  // base — near-black, denser than the consumer aurora
  bg: '#06070d',
  bg2: '#0a0d15', // map / raised surface
  panel: 'rgba(255,255,255,0.04)',
  panel2: 'rgba(255,255,255,0.02)',
  line: 'rgba(255,255,255,0.09)',

  ink: '#ffffff',
  muted: 'rgba(255,255,255,0.55)',
  faint: 'rgba(255,255,255,0.30)',

  // status semantics
  ok: '#46e0a0', // on-duty / OK / safe / clear
  caution: '#ffb43a', // lone-worker / caution
  alert: '#ff4053', // SOS / active incident
  info: '#7aa2ff', // you / info
} as const;

// Tint helpers for translucent fills/borders keyed to a status colour.
export const tint = (hex: string, alpha: number) => {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
};

// Gradient stops for the two big ops buttons.
export const opsGradients = {
  sos: ['#ff4053', '#c81f30'] as const,
  safe: ['#46e0a0', '#1fa574'] as const,
  caution: ['#ffb43a', '#e08a12'] as const,
};

export { fonts };
