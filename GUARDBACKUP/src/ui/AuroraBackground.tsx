// src/ui/AuroraBackground.tsx — the app background layer (behind every screen).
// Currently a clean flat dark; kept as one component so the whole app's
// background can be re-tuned in a single place.
import { View, StyleSheet } from 'react-native';
import { colors } from '@loc8/engine';

export function AuroraBackground() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} pointerEvents="none" />;
}

/** Screen wrapper: base bg behind the content. */
export function Screen({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      <AuroraBackground />
      {children}
    </View>
  );
}
