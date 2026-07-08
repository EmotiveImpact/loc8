// src/ui/AuroraBackground.tsx — the plum-black aurora that sits behind every screen.
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { colors } from './theme';

export function AuroraBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="rose" cx="0.82" cy="0.02" r="0.75">
            <Stop offset="0" stopColor="#ff4d7d" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#ff4d7d" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="peri" cx="0.1" cy="0.08" r="0.72">
            <Stop offset="0" stopColor="#7aa2ff" stopOpacity="0.13" />
            <Stop offset="1" stopColor="#7aa2ff" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="mint" cx="0.5" cy="1.08" r="0.7">
            <Stop offset="0" stopColor="#5ef2c8" stopOpacity="0.11" />
            <Stop offset="1" stopColor="#5ef2c8" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#rose)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#peri)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#mint)" />
      </Svg>
    </View>
  );
}

/** Screen wrapper: base bg + aurora behind the content. */
export function Screen({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      <AuroraBackground />
      {children}
    </View>
  );
}
