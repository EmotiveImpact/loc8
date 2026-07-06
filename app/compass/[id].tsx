// app/compass/[id].tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useCrewStore, freshnessSec } from '../../src/state/crewStore';
import { getHaversineDistance, getAbsoluteBearing } from '../../src/core/geoMath';
import { useSmoothedHeading } from '../../src/hooks/useSmoothedHeading';
import { useNowSec } from '../../src/hooks/useNowSec';
import { ShareSheet } from '../../src/ui/ShareSheet';
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

  const markCelebrated = useCrewStore((s) => s.markCelebrated);
  const clearCelebrated = useCrewStore((s) => s.clearCelebrated);
  const celebrated = useCrewStore((s) => s.celebrated[Number(id)]);
  const accuracy = friend?.lastPacket?.accuracyM ?? 15;
  // Proximity threshold adapts to GPS accuracy (spec §3): never pretend arrow precision we don't have.
  const proximityAt = Math.max(25, accuracy * 1.5);
  const inProximity = dist !== null && dist < proximityAt;
  const found = dist !== null && dist < 15;
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (inProximity) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [friend?.lastPacket?.timestampSec, inProximity]);

  useEffect(() => {
    if (found && !celebrated && !celebrationShown) {
      setCelebrationShown(true);
      markCelebrated(Number(id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [found]);

  useEffect(() => {
    // Drifted apart after celebrating: dismiss the 🎉 view and re-arm for a future reunion.
    if (dist !== null && dist > proximityAt && celebrated) {
      clearCelebrated(Number(id));
      setCelebrationShown(false);
    }
  }, [dist !== null && dist > proximityAt, celebrated]);

  useEffect(() => {
    // rotate the short way round
    const cur = rotation.value % 360;
    let delta = arrowDeg - cur;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    rotation.value = withTiming(rotation.value + delta, { duration: 400 });
  }, [arrowDeg]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value - 90}deg` }],
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

      {celebrationShown ? (
        <View style={st.center}>
          <Text style={{ fontSize: 90 }}>🎉</Text>
          <Text style={st.foundH}>You found each other!</Text>
          <Text style={st.warm}>{friend.name} is right here.</Text>
          <Pressable style={st.doneBtn} onPress={() => router.back()}>
            <Text style={st.doneText}>Back to radar</Text>
          </Pressable>
        </View>
      ) : inProximity ? (
        <View style={st.center}>
          <View style={st.pulse}><Text style={{ fontSize: 56 }}>👀</Text></View>
          <Text style={st.proxH}>You're basically there</Text>
          <Text style={st.warm}>GPS can't do better than ~{Math.round(accuracy)}m here — look around!</Text>
          <Text style={st.dist}>{Math.round(dist!)}m</Text>
        </View>
      ) : (
        <View style={st.center}>
          <Animated.Text style={[st.arrow, arrowStyle]}>➤</Animated.Text>
          <Text style={st.dist}>{dist !== null ? `${Math.round(dist)}m` : '—'}</Text>
          <Text style={st.who}>{friend.name} · this way</Text>
          <Text style={st.warm}>{warmth}</Text>
          {fresh !== null && fresh > 30 && <Text style={st.staleNote}>position is {fresh}s old</Text>}
        </View>
      )}
      <Pressable style={st.shareBtn} onPress={() => setShareOpen(true)}>
        <Text style={st.shareT}>Share {friend.name}'s spot</Text>
      </Pressable>
      <ShareSheet
        visible={shareOpen}
        title={`${friend.name}'s exact spot`}
        location={friendPos}
        onClose={() => setShareOpen(false)}
      />
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
  pulse: {
    width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.teal, backgroundColor: 'rgba(75,227,192,0.08)',
  },
  proxH: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 14 },
  foundH: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 10 },
  doneBtn: { backgroundColor: colors.pink, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 18 },
  doneText: { color: '#fff', fontWeight: '800' },
  shareBtn: {
    marginBottom: 40, borderRadius: 22, borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 22, paddingVertical: 12,
  },
  shareT: { color: colors.text, fontWeight: '700', fontSize: 14 },
});
