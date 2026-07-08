// app/compass/[id].tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useCrewStore, freshnessSec } from '../../src/state/crewStore';
import { getHaversineDistance, getAbsoluteBearing } from '../../src/core/geoMath';
import { useSmoothedHeading } from '../../src/hooks/useSmoothedHeading';
import { useNowSec } from '../../src/hooks/useNowSec';
import { ShareSheet } from '../../src/ui/ShareSheet';
import { AuroraBackground } from '../../src/ui/AuroraBackground';
import { colors, fonts, gradients } from '../../src/ui/theme';
import { Navigation, ScanEye, PartyPopper, Flame, Compass, ChevronLeft } from 'lucide-react-native';

const AnimatedNavigation = Animated.createAnimatedComponent(Navigation);

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
    // Drifted apart after celebrating: dismiss the celebration view and re-arm for a future reunion.
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
    // Navigation icon points UP at 0°, so arrowDeg=0 renders straight up (no -90 offset).
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!friend) return null;
  const fresh = friend.lastPacket ? freshnessSec(friend, now) : null;
  const warmth =
    dist === null
      ? null
      : dist < 70
        ? { Icon: Flame, text: 'very warm — almost there', color: colors.pink }
        : dist < 150
          ? { Icon: Flame, text: 'getting warmer', color: colors.orange }
          : { Icon: Compass, text: 'keep walking', color: colors.textDim };

  return (
    <View style={st.wrap}>
      <AuroraBackground />
      <Pressable style={st.back} onPress={() => router.back()}>
        <BlurView tint="dark" intensity={24} style={st.backInner}>
          <ChevronLeft size={16} color={colors.text} strokeWidth={2} />
          <Text style={st.backText}>Back to radar</Text>
        </BlurView>
      </Pressable>
      <BlurView tint="dark" intensity={24} style={st.pill}><Text style={st.pillText}>Following · {friend.name}</Text></BlurView>

      {celebrationShown ? (
        <View style={st.center}>
          <PartyPopper size={90} color={colors.pink} strokeWidth={2} />
          <Text style={st.foundH}>You found each other!</Text>
          <Text style={st.warm}>{friend.name} is right here.</Text>
          <Pressable style={st.doneBtn} onPress={() => router.back()}>
            <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.doneInner}>
              <Text style={st.doneText}>Back to radar</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : inProximity ? (
        <View style={st.center}>
          <View style={st.pulse}><ScanEye size={56} color={colors.teal} strokeWidth={2} /></View>
          <Text style={st.proxH}>You're basically there</Text>
          <Text style={st.warm}>GPS can't do better than ~{Math.round(accuracy)}m here — look around!</Text>
          <Text style={st.dist}>{Math.round(dist!)}m</Text>
        </View>
      ) : (
        <View style={st.center}>
          <AnimatedNavigation
            size={130}
            color={colors.teal}
            strokeWidth={2}
            fill={colors.teal}
            style={[st.arrow, arrowStyle]}
          />
          <Text style={st.dist}>{dist !== null ? `${Math.round(dist)}m` : '—'}</Text>
          <Text style={st.who}>{friend.name} · this way</Text>
          {warmth && (
            <BlurView tint="dark" intensity={16} style={st.warmRow}>
              <warmth.Icon size={13} color={warmth.color} strokeWidth={2} />
              <Text style={[st.warm, { color: warmth.color }]}>{warmth.text}</Text>
            </BlurView>
          )}
          {fresh !== null && fresh > 30 && <Text style={st.staleNote}>position is {fresh}s old</Text>}
        </View>
      )}
      <Pressable style={st.shareBtn} onPress={() => setShareOpen(true)}>
        <BlurView tint="dark" intensity={24} style={st.shareInner}>
          <Text style={st.shareT}>Share {friend.name}'s spot</Text>
        </BlurView>
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
  back: { position: 'absolute', top: 56, left: 18, borderRadius: 20, overflow: 'hidden', zIndex: 5, borderWidth: 1, borderColor: colors.line },
  backInner: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.glass, paddingHorizontal: 14, paddingVertical: 8 },
  backText: { color: colors.text, fontSize: 13, fontFamily: fonts.bodyMed },
  pill: { borderRadius: 20, overflow: 'hidden', marginTop: 50, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 7 },
  pillText: { color: colors.text, fontSize: 12, fontFamily: fonts.bodySemi },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  arrow: { marginBottom: 12 },
  dist: { color: colors.text, fontSize: 52, fontFamily: fonts.display },
  who: { color: colors.teal, fontSize: 14, fontFamily: fonts.bodySemi },
  warmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, overflow: 'hidden',
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line,
  },
  warm: { color: colors.textDim, fontSize: 12, fontFamily: fonts.bodyMed },
  staleNote: { color: colors.yellow, fontSize: 11, marginTop: 4, fontFamily: fonts.body },
  pulse: {
    width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.teal, backgroundColor: 'rgba(75,227,192,0.08)',
  },
  proxH: { color: colors.text, fontSize: 24, fontFamily: fonts.display, marginTop: 14 },
  foundH: { color: colors.text, fontSize: 28, fontFamily: fonts.display, marginTop: 10 },
  doneBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 18 },
  doneInner: { paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center' },
  doneText: { color: '#fff', fontFamily: fonts.bodyBold },
  shareBtn: { marginBottom: 40, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  shareInner: { backgroundColor: colors.glass, paddingHorizontal: 22, paddingVertical: 12 },
  shareT: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14 },
});
