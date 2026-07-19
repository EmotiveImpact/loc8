// apps/guard/app/(tabs)/index.tsx — Team map (Guard home).
// Live team map (engine positions), incoming-dispatch alert + haptic, and a
// respond affordance when there's an active incident. SOS lives in the tab bar.
import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Check, Navigation, Layers } from 'lucide-react-native';
import { useCrewStore, haptics, venueLevelName, confirmCurrentFloor } from '@loc8/engine';
import { ops, fonts, tint } from '../../src/ui/opsTheme';
import { VENUE_LEVELS } from '../../src/state/guardTeam';
import { OpsBackground } from '../../src/ui/OpsBackground';
import { GuardHeader } from '../../src/ui/GuardHeader';
import { TeamMap } from '../../src/ui/TeamMap';
import { useGuardStore } from '../../src/state/guardStore';

const DISPATCH: Href = '/dispatch' as Href;

export default function TeamMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const nearby = useCrewStore((s) => s.meshNearby);
  const friends = useCrewStore((s) => s.friends);
  const rallyPin = useCrewStore((s) => s.rallyPin);
  const myId = useCrewStore((s) => s.profile?.id);
  const banner = useCrewStore((s) => s.banner);
  const setBanner = useCrewStore((s) => s.setBanner);
  const dispatchLabel = useGuardStore((s) => s.dispatchLabel);
  const sosActive = useGuardStore((s) => s.sosActive);
  const myFloor = useCrewStore((s) => s.myFloor);
  const floorConfidence = useCrewStore((s) => s.floorConfidence);
  const floorConfirmNeeded = useCrewStore((s) => s.floorConfirmNeeded);

  const inRange = Object.values(friends).filter((f) => f.lastPacket).length;

  // Incoming dispatch: a pin from SOMEONE ELSE lands → un-missable alert buzz.
  const lastPinRef = useRef<string | null>(null);
  useEffect(() => {
    if (!rallyPin) { lastPinRef.current = null; return; }
    const key = `${rallyPin.droppedById}:${rallyPin.atSec}`;
    if (key !== lastPinRef.current && rallyPin.droppedById !== myId) {
      haptics.dispatch();
    }
    lastPinRef.current = key;
  }, [rallyPin?.droppedById, rallyPin?.atSec, myId]);

  // Auto-dismiss the engine banner (incoming messages / status replies).
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(t);
  }, [banner]);

  const incidentForMe = rallyPin && rallyPin.droppedById !== myId;

  return (
    <View style={st.wrap}>
      <OpsBackground />
      <View style={{ paddingTop: insets.top + 8 }}>
        <GuardHeader />
        <View style={st.floorRow}>
          <Pressable
            style={[st.floorPill, floorConfidence !== 'anchored' && st.floorPillUnsure]}
            onPress={() => { haptics.tap(); router.push('/floor' as Href); }}
          >
            <Layers size={13} color={floorConfidence === 'anchored' ? ops.info : ops.caution} strokeWidth={2} />
            <Text style={st.floorPillTxt}>
              {floorConfidence === 'unknown'
                ? 'Set your level'
                : `Your level · ${venueLevelName(VENUE_LEVELS, myFloor)}`}
            </Text>
            <Text style={[st.floorBadge, { color: floorConfidence === 'anchored' ? ops.info : ops.caution }]}>
              {floorConfidence === 'anchored' ? 'ANCHORED' : floorConfidence === 'estimated' ? 'ESTIMATED' : 'TAP'}
            </Text>
          </Pressable>

          {/* Moved ≥2 floors since the last anchor — honesty check-in */}
          {floorConfirmNeeded && (
            <Pressable style={st.floorConfirm} onPress={() => { haptics.success(); confirmCurrentFloor(); }}>
              <Check size={14} color="#06120c" strokeWidth={2.6} />
              <Text style={st.floorConfirmTxt}>
                Still on {venueLevelName(VENUE_LEVELS, myFloor)}? Tap to confirm
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {banner && (
        <View style={st.banner}>
          <Text style={st.bannerTxt}>{banner.text}</Text>
        </View>
      )}

      <View style={st.mapWrap}>
        <TeamMap onPressIncident={() => { haptics.tap(); router.push(DISPATCH); }} />
      </View>

      <View style={[st.bottom, { paddingBottom: insets.bottom + 84 }]}>
        <View style={st.statusPill}>
          <Check size={15} color={ops.ok} strokeWidth={2.4} />
          <Text style={st.statusTxt}>On duty · {inRange || nearby} in range</Text>
        </View>

        {incidentForMe && (
          <Pressable
            style={st.respond}
            onPress={() => { haptics.dispatch(); router.push(DISPATCH); }}
          >
            <Navigation size={18} color="#fff" strokeWidth={2.2} />
            <Text style={st.respondTxt}>DISPATCH · {dispatchLabel ?? 'Incident'}</Text>
            <Text style={st.respondSub}>RESPOND</Text>
          </Pressable>
        )}

        {sosActive && (
          <Pressable style={st.sosLive} onPress={() => router.push('/sos' as Href)}>
            <Text style={st.sosLiveTxt}>◈ YOUR SOS IS LIVE — tap to manage</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: ops.bg },
  banner: {
    marginHorizontal: 16, marginTop: 10, backgroundColor: ops.panel,
    borderWidth: 1, borderColor: ops.line, borderRadius: 12, padding: 11,
  },
  bannerTxt: { color: ops.ink, fontSize: 13, fontFamily: fonts.bodySemi },
  floorRow: { paddingHorizontal: 18, marginTop: 8, gap: 6 },
  floorPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    backgroundColor: tint(ops.info, 0.1), borderWidth: 1, borderColor: tint(ops.info, 0.3),
    borderRadius: 11, paddingHorizontal: 10, paddingVertical: 6,
  },
  floorPillUnsure: { backgroundColor: tint(ops.caution, 0.1), borderColor: tint(ops.caution, 0.35) },
  floorPillTxt: { color: ops.ink, fontFamily: fonts.bodySemi, fontSize: 12 },
  floorBadge: { fontFamily: fonts.monoBold, fontSize: 9, letterSpacing: 0.5 },
  floorConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    backgroundColor: ops.ok, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 7,
  },
  floorConfirmTxt: { color: '#06120c', fontFamily: fonts.bodyBold, fontSize: 12 },
  mapWrap: { flex: 1, marginTop: 10, marginHorizontal: 0 },
  bottom: { position: 'absolute', left: 14, right: 14, bottom: 0, gap: 10 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: tint(ops.ok, 0.1), borderWidth: 1, borderColor: tint(ops.ok, 0.25),
    borderRadius: 14, paddingVertical: 9,
  },
  statusTxt: { color: ops.ok, fontSize: 12, fontFamily: fonts.bodySemi },
  respond: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: ops.alert, borderRadius: 16, paddingVertical: 14,
  },
  respondTxt: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13, flexShrink: 1 },
  respondSub: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.monoBold, fontSize: 10 },
  sosLive: {
    backgroundColor: tint(ops.alert, 0.14), borderWidth: 1, borderColor: tint(ops.alert, 0.5),
    borderRadius: 14, paddingVertical: 10, alignItems: 'center',
  },
  sosLiveTxt: { color: ops.alert, fontFamily: fonts.monoBold, fontSize: 11 },
});
