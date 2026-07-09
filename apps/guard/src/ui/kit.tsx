// Small shared tactical primitives for the Guard door.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, Pressable, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, g, gradients } from '../theme';

/** Mono kicker tag, e.g. "◈ LONE-WORKER CHECK-IN". */
export function Tag({ color, children }: { color: string; children: ReactNode }) {
  return <Text style={[styles.tag, { color }]}>◈ {children}</Text>;
}

/** The persistent mesh trust badge. */
export function MeshBadge({ label = 'MESH · OFFLINE-READY' }: { label?: string }) {
  return (
    <View style={styles.meshb}>
      <Text style={styles.meshbText}>◈ {label}</Text>
    </View>
  );
}

/** Big gradient CTA (SOS / I'M SAFE / START SHIFT / EN ROUTE). */
export function GradientBtn({
  kind,
  title,
  sub,
  onPress,
  onLongPress,
  style,
}: {
  kind: 'danger' | 'safe' | 'amber';
  title: string;
  sub?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}) {
  const dark = kind !== 'danger';
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [pressed && { opacity: 0.85 }, style]}>
      <LinearGradient colors={gradients[kind]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gbtn}>
        <Text style={[styles.gbtnTitle, dark && styles.gbtnTitleDark]}>{title}</Text>
        {sub ? <Text style={[styles.gbtnSub, dark && styles.gbtnSubDark]}>{sub}</Text> : null}
      </LinearGradient>
    </Pressable>
  );
}

/** Panel card. */
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export const styles = StyleSheet.create({
  tag: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  meshb: {
    backgroundColor: g.okBg,
    borderColor: g.okBorder,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  meshbText: { fontFamily: fonts.monoBold, fontSize: 9, color: g.ok },
  gbtn: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gbtnTitle: { fontFamily: fonts.disp, fontSize: 17, color: '#fff', letterSpacing: 0.5 },
  gbtnTitleDark: { color: '#06120c' },
  gbtnSub: { fontFamily: fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  gbtnSubDark: { color: 'rgba(6,18,12,0.75)' },
  card: {
    backgroundColor: g.panel,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
  },
});
