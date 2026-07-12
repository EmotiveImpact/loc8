// src/ui/theme.ts — "Signal in the dark" palette
// Existing keys keep their names (so every screen upgrades automatically);
// values are upgraded and new tokens added.
export const colors = {
  // base
  bg: '#08070d',
  card: '#141221',
  cardBorder: 'rgba(255,255,255,0.09)',
  line: 'rgba(255,255,255,0.09)',
  glass: 'rgba(255,255,255,0.05)',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.56)',
  faint: 'rgba(255,255,255,0.32)',

  // sunset (YOU) — rose → coral → amber
  pink: '#ff4d7d',   // rose (kept key `pink` for back-compat)
  rose: '#ff4d7d',
  orange: '#ff7a45', // coral
  coral: '#ff7a45',
  amber: '#ffb038',

  // signal / crew
  teal: '#5ef2c8',   // mint (kept key `teal`)
  signal: '#5ef2c8',
  blue: '#7aa2ff',   // periwinkle (kept key `blue`)
  signal2: '#7aa2ff',

  // rally
  yellow: '#ffce4d', // gold (kept key `yellow`)
  gold: '#ffce4d',

  danger: '#ff4053',
};

// gradient stop arrays for expo-linear-gradient
export const gradients = {
  sunset: ['#ff4d7d', '#ff7a45', '#ffb038'] as const,   // YOU / primary CTA
  rally: ['#ffce4d', '#ff9a3c'] as const,               // Rally gold
  mint: ['#5ef2c8', '#39c9a5'] as const,                // crew avatar
  peri: ['#7aa2ff', '#5a78e0'] as const,
};

// aurora background radial stops (used by AuroraBackground)
export const aurora = {
  base: '#08070d',
  rose: 'rgba(255,77,125,0.16)',
  peri: 'rgba(122,162,255,0.12)',
  mint: 'rgba(94,242,200,0.10)',
};

// font families (loaded in app/_layout.tsx via @expo-google-fonts)
export const fonts = {
  display: 'Unbounded_800ExtraBold',
  displaySemi: 'Unbounded_600SemiBold',
  body: 'Sora_400Regular',
  bodyMed: 'Sora_500Medium',
  bodySemi: 'Sora_600SemiBold',
  bodyBold: 'Sora_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
};

export const FRIEND_COLORS = [colors.signal, colors.coral, colors.signal2, colors.gold];
