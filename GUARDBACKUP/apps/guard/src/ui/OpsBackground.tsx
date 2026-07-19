// apps/guard/src/ui/OpsBackground.tsx — the tactical near-black backdrop.
// Two faint corner glows (red top-right = alert, green top-left = OK) over a
// near-black base, echoing docs/design/gallery-guard.html.
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ops } from './opsTheme';

export function OpsBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: ops.bg }]} />
      <LinearGradient
        colors={['rgba(255,64,83,0.10)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(70,224,160,0.07)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
