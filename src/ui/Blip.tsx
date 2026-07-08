// src/ui/Blip.tsx
import { Text, View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Waypoints } from 'lucide-react-native';
import { colors } from './theme';

interface Props {
  x: number; y: number;                 // px offsets from radar center
  name: string; color: string;
  distanceM: number;
  freshness: number | null;             // seconds since last packet
  relayVia?: string;
  stale: boolean; ghost: boolean;
  onPress(): void;
}

export function Blip({ x, y, name, color, distanceM, freshness, relayVia, stale, ghost, onPress }: Props) {
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  useEffect(() => {
    tx.value = withTiming(x, { duration: 900 });   // glide between packets — no teleporting dots
    ty.value = withTiming(y, { duration: 900 });
  }, [x, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const opacity = ghost ? 0.3 : stale ? 0.55 : 1;
  const showRelay = !ghost && !!relayVia;
  const sub = ghost
    ? `last seen ${Math.floor((freshness ?? 0) / 60)}m ago`
    : relayVia
      ? `${Math.round(distanceM)}m · via ${relayVia}`
      : `${Math.round(distanceM)}m · ${freshness ?? 0}s`;

  return (
    <Animated.View style={[st.wrap, style, { opacity }]}>
      <Pressable onPress={onPress} style={st.inner}>
        <View style={[st.avatar, { backgroundColor: color }]}>
          <Text style={st.initial}>{name[0]}</Text>
        </View>
        <View style={st.tag}>
          <Text style={st.tagName}>{name}</Text>
          <View style={st.tagSubRow}>
            <Text style={st.tagSub}>{sub}</Text>
            {showRelay && <Waypoints size={8} color={colors.teal} strokeWidth={2} />}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: '50%', top: '50%', marginLeft: -19, marginTop: -19 },
  inner: { alignItems: 'center', gap: 3 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)',
  },
  initial: { color: colors.bg, fontWeight: '800', fontSize: 14 },
  tag: { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 2, alignItems: 'center' },
  tagSubRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tagName: { color: colors.text, fontSize: 10, fontWeight: '700' },
  tagSub: { color: colors.teal, fontSize: 9, fontWeight: '600' },
});
