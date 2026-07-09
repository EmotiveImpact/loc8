// Guard app theme — the ops tactical register (docs/design/README.md §Ops).
// Same engine, different door: near-black, mono data, green/amber/red/blue.
export const g = {
  bg: '#06070d',
  panel: 'rgba(255,255,255,0.04)',
  panel2: 'rgba(255,255,255,0.02)',
  line: 'rgba(255,255,255,0.09)',
  ink: '#ffffff',
  muted: 'rgba(255,255,255,0.55)',
  faint: 'rgba(255,255,255,0.48)',

  ok: '#46e0a0',
  caution: '#ffb43a',
  alert: '#ff4053',
  info: '#7aa2ff',

  okBg: 'rgba(70,224,160,0.10)',
  okBorder: 'rgba(70,224,160,0.25)',
  alertBg: 'rgba(255,64,83,0.12)',
  alertBorder: 'rgba(255,64,83,0.4)',
  cautionBg: 'rgba(255,180,58,0.14)',
  cautionBorder: 'rgba(255,180,58,0.35)',
  infoBg: 'rgba(122,162,255,0.14)',
  infoBorder: 'rgba(122,162,255,0.35)',
} as const;

export const fonts = {
  disp: 'Unbounded_800ExtraBold',
  dispSemi: 'Unbounded_600SemiBold',
  body: 'Sora_400Regular',
  bodyMed: 'Sora_500Medium',
  bodySemi: 'Sora_600SemiBold',
  bodyBold: 'Sora_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

export const gradients = {
  danger: ['#ff4053', '#c81f30'] as const,
  safe: ['#46e0a0', '#1fa574'] as const,
  amber: ['#ffb43a', '#e08a12'] as const,
};
