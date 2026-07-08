// src/ui/Blip.tsx
import { Text, View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Waypoints } from 'lucide-react-native';
import { colors, fonts } from './theme';

interface Props {
  x: number; y: number;                 // px offsets from radar center
  name: string; color: string;
  distanceM: number;
  freshness: number | null;             // seconds since last packet
  relayVia?: string;
  stale: boolean; ghost: boolean;
  onPress(): void;
}

// friend base colour → a 2-stop gradient for a bit of depth
const AV_GRAD: Record<string, [string, string]> = {
  '#5ef2c8': ['#5ef2c8', '#39c9a5'],
  '#ff7a45': ['#ffb038', '#ff7a45'],
  '#7aa2ff': ['#7aa2ff', '#5a78e0'],
  '#ffce4d': ['#ffce4d', '#ff9a3c'],
};

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

  const grad = AV_GRAD[color] ?? [color, color];
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
        <LinearGradient colors={grad as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.avatar}>
          <Text style={st.initial}>{name[0]}</Text>
        </LinearGradient>
        <View style={st.tag}>
          <Text style={st.tagName}>{name}</Text>
          <View style={st.tagSubRow}>
            <Text style={st.tagSub}>{sub}</Text>
            {showRelay && <Waypoints size={8} color={colors.signal2} strokeWidth={2} />}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -20 },
  inner: { alignItems: 'center', gap: 4 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(10,8,19,0.9)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  initial: { color: '#0a0813', fontFamily: fonts.display, fontSize: 15 },
  tag: { backgroundColor: 'rgba(6,5,12,0.72)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignItems: 'center' },
  tagSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagName: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 10 },
  tagSub: { color: colors.signal, fontFamily: fonts.bodySemi, fontSize: 9 },
});
