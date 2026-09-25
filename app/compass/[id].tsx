// app/compass/[id].tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import {
  colors,
  fonts,
  friendPositionFreshness,
  getAbsoluteBearing,
  getHaversineDistance,
  gradients,
  haptics,
  isFound,
  proximityRadiusM,
  shouldRearmCelebration,
  useCrewStore,
} from '@loc8/engine';
import { useSmoothedHeading } from '../../src/hooks/useSmoothedHeading';
import { useNowSec } from '../../src/hooks/useNowSec';
import { ShareSheet } from '../../src/ui/ShareSheet';
import { AuroraBackground } from '../../src/ui/AuroraBackground';
import { Navigation, ScanEye, PartyPopper, Flame, Compass, ChevronLeft } from 'lucide-react-native';

const AnimatedNavigation = Animated.createAnimatedComponent(Navigation);

// Proximity heartbeat: a pulse that speeds up + hardens as you close in.
// The zone opens at HEARTBEAT_START_M and runs down to the proximity threshold;
// the period lerps from HEARTBEAT_MAX_MS (far edge) to HEARTBEAT_MIN_MS (right on top).
const HEARTBEAT_START_M = 150;
const HEARTBEAT_MAX_MS = 1100;
const HEARTBEAT_MIN_MS = 300;

export default function CompassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const friend = useCrewStore((s) => s.friends[Number(id)]);
  const myLocation = useCrewStore((s) => s.myLocation);
  const heading = useSmoothedHeading();
  const now = useNowSec();
  const rotation = useSharedValue(0);

  const position = friendPositionFreshness(friend ?? {}, now);
  const friendPos = position.location;
  const dist = friendPos && myLocation ? getHaversineDistance(myLocation, friendPos) : null;
  const bearing = friendPos && myLocation ? getAbsoluteBearing(myLocation, friendPos) : 0;
  const arrowDeg = ((bearing - heading) + 360) % 360;

  const markCelebrated = useCrewStore((s) => s.markCelebrated);
  const clearCelebrated = useCrewStore((s) => s.clearCelebrated);
  const celebrated = useCrewStore((s) => s.celebrated[Number(id)]);
  const accuracy = friend?.lastPacket?.accuracyM ?? 15;
  // Proximity threshold adapts to GPS accuracy (spec §3): never pretend arrow precision we don't have.
  const proximityAt = proximityRadiusM(accuracy);
  const inProximity = position.isCurrent && dist !== null && dist < proximityAt;
  const found = position.isCurrent && isFound(dist);
  const [celebrationFriend, setCelebrationFriend] = useState<number | null>(null);
  const celebrationShown = celebrationFriend === Number(id);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmedFriend, setConfirmedFriend] = useState<number | null>(null);
  const confirmedByUser = confirmedFriend === Number(id);

  // Proximity heartbeat. Once you're inside the zone (and not yet found/celebrating)
  // a self-rescheduling pulse fires; it reads the LATEST distance via a ref so the
  // rhythm tightens smoothly without tearing the timer down on every GPS update.
  // closeness ∈ 0..1 is distance measured against the proximity threshold:
  //   dist = HEARTBEAT_START_M → 0 (slow, Light) … dist ≤ proximityAt → 1 (fast, Heavy).
  const distRef = useRef(dist);
  useEffect(() => {
    distRef.current = dist;
  }, [dist]);
  const inHeartbeatZone =
    position.isCurrent && dist !== null && dist <= HEARTBEAT_START_M && !found && !celebrationShown;

  useEffect(() => {
    if (!inHeartbeatZone) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const span = Math.max(1, HEARTBEAT_START_M - proximityAt);
    const beat = () => {
      if (cancelled) return;
      const d = distRef.current;
      if (d === null || d > HEARTBEAT_START_M) {
        timer = setTimeout(beat, HEARTBEAT_MAX_MS);
        return;
      }
      const closeness = Math.min(1, Math.max(0, (HEARTBEAT_START_M - d) / span));
      haptics.proximityPulse(closeness);
      const period = HEARTBEAT_MAX_MS - (HEARTBEAT_MAX_MS - HEARTBEAT_MIN_MS) * closeness;
      timer = setTimeout(beat, period);
    };
    // fire one immediately so entering the zone is felt, then self-schedule
    beat();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [inHeartbeatZone, proximityAt]);

  useEffect(() => {
    if (found && !celebrated && !celebrationShown) {
      // GPS is the external source; this screen-local latch preserves the
      // specified once-per-visible-reunion celebration independently of store persistence.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCelebrationFriend(Number(id));
      markCelebrated(Number(id));
      haptics.found();
    }
  }, [celebrated, celebrationShown, found, id, markCelebrated]);

  // Drifted apart after celebrating: dismiss the celebration view and re-arm for a
  // future reunion — but only past the hysteresis margin (proximity radius + margin),
  // so GPS jitter around the found radius can't flap the celebration or re-fire found().
  const drifted = position.isCurrent && !confirmedByUser && shouldRearmCelebration(dist, accuracy);
  useEffect(() => {
    if (drifted && celebrated) {
      clearCelebrated(Number(id));
      // This is the corresponding external-GPS hysteresis transition.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCelebrationFriend(null);
    }
  }, [clearCelebrated, drifted, celebrated, id]);

  useEffect(() => {
    // rotate the short way round
    const cur = rotation.value % 360;
    let delta = arrowDeg - cur;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    rotation.value = withTiming(rotation.value + delta, { duration: 400 });
  }, [arrowDeg, rotation]);

  const arrowStyle = useAnimatedStyle(() => ({
    // Navigation icon points UP at 0°, so arrowDeg=0 renders straight up (no -90 offset).
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!friend) return null;
  const warmth =
    dist === null || !position.isCurrent
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
      <Text style={st.staleNote}>{position.label}</Text>

      {celebrationShown && (confirmedByUser || position.isCurrent) ? (
        <View style={st.center}>
          <PartyPopper size={90} color={colors.pink} strokeWidth={2} />
          <Text style={st.foundH}>You found each other!</Text>
          <Text style={st.warm}>{confirmedByUser ? 'You confirmed your reunion.' : `${friend.name} is right here.`}</Text>
          <Pressable style={st.doneBtn} onPress={() => router.back()}>
            <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.doneInner}>
              <Text style={st.doneText}>Back to radar</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : inProximity ? (
        <View style={st.center}>
          <View style={st.pulse}><ScanEye size={56} color={colors.teal} strokeWidth={2} /></View>
          <Text style={st.proxH}>You’re basically there</Text>
          <Text style={st.warm}>GPS can’t do better than ~{Math.round(accuracy)}m here — look around!</Text>
          <Text style={st.dist}>{Math.round(dist!)}m</Text>
        </View>
      ) : (
        <View style={st.center}>
          <AnimatedNavigation
            size={130}
            color={colors.teal}
            strokeWidth={2}
            fill={colors.teal}
            style={[st.arrow, arrowStyle, !friendPos && { opacity: 0 }]}
          />
          <Text style={st.dist}>{dist !== null ? `${Math.round(dist)}m` : '—'}</Text>
          <Text style={st.who}>{friend.name} · {position.isCurrent ? 'this way' : friendPos ? 'last reported position' : 'position unavailable'}</Text>
          {warmth && (
            <BlurView tint="dark" intensity={16} style={st.warmRow}>
              <warmth.Icon size={13} color={warmth.color} strokeWidth={2} />
              <Text style={[st.warm, { color: warmth.color }]}>{warmth.text}</Text>
            </BlurView>
          )}
          {!position.isCurrent && <Text style={st.warm}>This does not confirm where they are now.</Text>}
          {!position.isCurrent && (
            <Pressable style={st.doneBtn} accessibilityLabel="I have found this person" onPress={() => {
              setConfirmedFriend(Number(id));
              setCelebrationFriend(Number(id));
              markCelebrated(Number(id));
              haptics.found();
            }}>
              <Text style={st.doneText}>I’ve found them</Text>
            </Pressable>
          )}
        </View>
      )}
      <Pressable disabled={!friendPos} accessibilityState={{ disabled: !friendPos }} style={[st.shareBtn, !friendPos && { opacity: 0.4 }]} onPress={() => setShareOpen(true)}>
        <BlurView tint="dark" intensity={24} style={st.shareInner}>
          <Text style={st.shareT}>Share {friend.name}’s reported spot</Text>
        </BlurView>
      </Pressable>
      <ShareSheet
        visible={shareOpen && !!friendPos}
        title={`${friend.name}'s last reported spot · ${position.label}`}
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
