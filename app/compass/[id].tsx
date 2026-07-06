// app/compass/[id].tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useCrewStore, freshnessSec } from '../../src/state/crewStore';
import { getHaversineDistance, getAbsoluteBearing } from '../../src/core/geoMath';
import { useSmoothedHeading } from '../../src/hooks/useSmoothedHeading';
import { useNowSec } from '../../src/hooks/useNowSec';
import { colors } from '../../src/ui/theme';

export default function CompassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const friend = useCrewStore((s) => s.friends[Number(id)]);
  const myLocation = useCrewStore((s) => s.myLocation);
  const heading = useSmoothedHeading();
  const now = useNowSec();
  const rotation = useSharedValue(0);

  const friendPos = friend?.lastPacket
    ? { latitude: friend.lastPacket.latitude, longitude: friend.lastPacket.longitude }
    : null;
  const dist = friendPos && myLocation ? getHaversineDistance(myLocation, friendPos) : null;
  const bearing = friendPos && myLocation ? getAbsoluteBearing(myLocation, friendPos) : 0;
  const arrowDeg = ((bearing - heading) + 360) % 360;

  useEffect(() => {
    // rotate the short way round
    const cur = rotation.value % 360;
    let delta = arrowDeg - cur;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    rotation.value = withTiming(rotation.value + delta, { duration: 400 });
  }, [arrowDeg]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!friend) return null;
  const fresh = friend.lastPacket ? freshnessSec(friend, now) : null;
  const warmth =
    dist === null ? '' : dist < 70 ? '🔥 very warm — almost there' : dist < 150 ? '🔥 getting warmer' : '🧭 keep walking';

  return (
    <View style={st.wrap}>
      <Pressable style={st.back} onPress={() => router.back()}>
        <Text style={st.backText}>‹ Back to radar</Text>
      </Pressable>
      <View style={st.pill}><Text style={st.pillText}>Following · {friend.name}</Text></View>

      <View style={st.center}>
        <Animated.Text style={[st.arrow, arrowStyle]}>➤</Animated.Text>
        <Text style={st.dist}>{dist !== null ? `${Math.round(dist)}m` : '—'}</Text>
        <Text style={st.who}>{friend.name} · this way</Text>
        <Text style={st.warm}>{warmth}</Text>
        {fresh !== null && fresh > 30 && (
          <Text style={st.staleNote}>position is {fresh}s old</Text>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 56, alignItems: 'center' },
  back: { position: 'absolute', top: 56, left: 18, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, zIndex: 5 },
  backText: { color: colors.text, fontSize: 13 },
  pill: { backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, marginTop: 50 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  arrow: {
    fontSize: 130, color: colors.teal, marginBottom: 12,
    textShadowColor: 'rgba(75,227,192,0.6)', textShadowRadius: 30, textShadowOffset: { width: 0, height: 0 },
  },
  dist: { color: colors.text, fontSize: 52, fontWeight: '800' },
  who: { color: colors.teal, fontSize: 14, fontWeight: '600' },
  warm: { color: colors.textDim, fontSize: 12, marginTop: 8 },
  staleNote: { color: colors.yellow, fontSize: 11, marginTop: 4 },
});
