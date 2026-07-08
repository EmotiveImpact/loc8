// apps/guard/app/sos.tsx — SOS active (gallery screen 2).
// Your position is broadcasting to the team over the mesh (engine rally pin).
// Nearest guards show live distance; hold-to-cancel stands the SOS down.
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Siren } from 'lucide-react-native';
import { useCrewStore, getHaversineDistance, floorLabel } from '@loc8/engine';
import { ops, fonts } from '../src/ui/opsTheme';
import { HoldButton } from '../src/ui/HoldButton';
import { useGuardStore, badgeLabel } from '../src/state/guardStore';
import { guardFor } from '../src/state/guardTeam';
import { standDownSos } from '../src/state/sos';

export default function SosActive() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const friends = useCrewStore((s) => s.friends);
  const rallyPin = useCrewStore((s) => s.rallyPin);
  const sosActive = useGuardStore((s) => s.sosActive);

  // Two expanding rings.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // If SOS was stood down elsewhere, leave.
  useEffect(() => {
    if (!sosActive) router.back();
  }, [sosActive]);

  // Responders: guards with a known position, nearest first, distance to the SOS.
  const responders = Object.values(friends)
    .filter((f) => f.lastPacket)
    .map((f) => {
      const meta = guardFor(f.id);
      const dist = rallyPin
        ? Math.round(getHaversineDistance(rallyPin, { latitude: f.lastPacket!.latitude, longitude: f.lastPacket!.longitude }))
        : null;
      return { id: f.id, name: meta?.name ?? f.name, badge: meta?.badge ?? f.id % 100, dist };
    })
    .sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9))
    .slice(0, 3);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <View style={[st.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={st.ring}>
        <Animated.View style={[st.rr, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
        <View style={st.disc}>
          <Siren size={34} color="#fff" strokeWidth={2.4} />
        </View>
      </View>

      <Text style={st.title}>SOS ACTIVE</Text>
      <View style={st.floorChip}>
        <Text style={st.floorChipTxt}>◈ {floorLabel(rallyPin?.floor ?? 0)}</Text>
      </View>
      <Text style={st.p}>Your location and floor are broadcasting to the team — even with no signal.</Text>

      <View style={st.responders}>
        {responders.length === 0 && (
          <Text style={st.noResp}>Broadcasting… waiting for the team to acknowledge.</Text>
        )}
        {responders.map((r) => (
          <View key={r.id} style={st.resp}>
            <View style={st.ra}><Text style={st.raTxt}>{badgeLabel(r.badge)}</Text></View>
            <Text style={st.rn}>{r.name} · Guard {badgeLabel(r.badge)}</Text>
            <Text style={st.rd}>{r.dist != null ? `${r.dist}m · en route` : 'en route'}</Text>
          </View>
        ))}
        <View style={st.resp}>
          <View style={[st.ra, { backgroundColor: ops.info }]}><Text style={st.raTxt}>C</Text></View>
          <Text style={st.rn}>Control room</Text>
          <Text style={[st.rd, { color: ops.info }]}>notified</Text>
        </View>
      </View>

      <View style={st.cancelWrap}>
        <HoldButton
          label="I'M OK — STAND DOWN"
          sublabel="HOLD TO CANCEL"
          holdMs={1200}
          bg={ops.panel}
          borderColor={ops.line}
          textColor={ops.ink}
          fillColor="rgba(255,255,255,0.14)"
          height={58}
          onComplete={standDownSos}
        />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingHorizontal: 22, backgroundColor: '#0a0710' },
  ring: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  rr: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255,64,83,0.55)' },
  disc: {
    width: 74, height: 74, borderRadius: 37, backgroundColor: ops.alert,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: ops.alert, shadowOpacity: 0.6, shadowRadius: 24, elevation: 10,
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: ops.ink, marginTop: 26, letterSpacing: 0.5 },
  floorChip: {
    marginTop: 10, backgroundColor: 'rgba(255,64,83,0.16)', borderWidth: 1, borderColor: 'rgba(255,64,83,0.5)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  floorChipTxt: { color: ops.alert, fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.5 },
  p: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 19, fontFamily: fonts.body },
  responders: { width: '100%', marginTop: 22, gap: 8 },
  noResp: { color: ops.muted, fontFamily: fonts.mono, fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  resp: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line, borderRadius: 13, padding: 11,
  },
  ra: { width: 30, height: 30, borderRadius: 15, backgroundColor: ops.ok, alignItems: 'center', justifyContent: 'center' },
  raTxt: { color: '#06070d', fontFamily: fonts.displaySemi, fontSize: 12 },
  rn: { flex: 1, color: ops.ink, fontSize: 13, fontFamily: fonts.bodySemi },
  rd: { fontFamily: fonts.mono, fontSize: 11, color: ops.ok },
  cancelWrap: { marginTop: 'auto', width: '100%' },
});
