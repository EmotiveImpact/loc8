// apps/guard/app/dispatch.tsx — Dispatch → navigate (gallery screen 3).
// A live arrow + distance to the incident (engine rally pin), plus one-tap status
// responses (En route / On scene / Need backup / Clear) sent back over the mesh
// via the engine's quick-reply mechanism (reskinned ops status codes).
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Navigation, X } from 'lucide-react-native';
import {
  useCrewStore,
  getMeshService,
  getHaversineDistance,
  getAbsoluteBearing,
  haptics,
  STATUS_REPLIES,
  STATUS_EN_ROUTE,
} from '@loc8/engine';
import { ops, fonts } from '../src/ui/opsTheme';
import { OpsBackground } from '../src/ui/OpsBackground';
import { useGuardStore } from '../src/state/guardStore';
import { useNowSec } from '../src/hooks/useNowSec';

export default function Dispatch() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const me = useCrewStore((s) => s.myLocation);
  const rallyPin = useCrewStore((s) => s.rallyPin);
  const label = useGuardStore((s) => s.dispatchLabel);
  useNowSec(); // re-render each second so distance/bearing track movement

  const targetId = rallyPin?.droppedById ?? 0;

  const sendStatus = (code: number) => {
    if (targetId) getMeshService().sendQuickReply(targetId, code);
    haptics.dispatch();
  };

  if (!rallyPin || !me) {
    return (
      <View style={[st.wrap, st.center]}>
        <OpsBackground />
        <Text style={st.empty}>No active dispatch.</Text>
        <Pressable style={st.closeBtn} onPress={() => router.back()}>
          <Text style={st.closeBtnTxt}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const dist = Math.round(getHaversineDistance(me, rallyPin));
  const bearing = getAbsoluteBearing(me, rallyPin);

  return (
    <View style={[st.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <OpsBackground />

      <Pressable style={st.closeX} onPress={() => router.back()} hitSlop={12}>
        <X size={22} color={ops.muted} strokeWidth={2} />
      </Pressable>

      <View style={st.hdr}>
        <Text style={st.tag}>◈ DISPATCHED TO</Text>
        <Text style={st.title}>{label ?? 'Incident'}</Text>
      </View>

      <View style={st.arrowWrap}>
        <View style={st.glow} />
        <View style={{ transform: [{ rotate: `${bearing}deg` }] }}>
          <Navigation size={110} color={ops.alert} strokeWidth={2.2} fill="rgba(255,64,83,0.14)" />
        </View>
      </View>

      <Text style={st.dist}>{dist}<Text style={st.distUnit}> m</Text></Text>
      <Text style={st.with}>North-up bearing {Math.round(bearing)}°</Text>

      {/* status responses — engine quick-reply, ops-reskinned */}
      <View style={st.chips}>
        {STATUS_REPLIES.map((r) => (
          <Pressable key={r.code} style={st.chip} onPress={() => sendStatus(r.code)}>
            <Text style={st.chipTxt}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={st.primary} onPress={() => { sendStatus(STATUS_EN_ROUTE); router.back(); }}>
        <Text style={st.primaryTxt}>EN ROUTE</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingHorizontal: 22, backgroundColor: ops.bg },
  center: { justifyContent: 'center' },
  empty: { color: ops.muted, fontFamily: fonts.mono, fontSize: 14 },
  closeBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line },
  closeBtnTxt: { color: ops.ink, fontFamily: fonts.bodySemi, fontSize: 14 },
  closeX: { position: 'absolute', right: 16, top: 52, zIndex: 10 },
  hdr: { alignItems: 'center', marginTop: 40 },
  tag: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 2, color: ops.alert },
  title: { fontFamily: fonts.displaySemi, fontSize: 22, color: ops.ink, marginTop: 4, textAlign: 'center' },
  arrowWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  glow: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,64,83,0.12)',
  },
  dist: { fontFamily: fonts.display, fontSize: 54, color: ops.ink },
  distUnit: { fontFamily: fonts.body, fontSize: 18, color: ops.muted },
  with: { fontFamily: fonts.mono, fontSize: 12, color: ops.muted, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 22 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line,
  },
  chipTxt: { color: ops.ink, fontFamily: fonts.bodySemi, fontSize: 13 },
  primary: {
    marginTop: 16, width: '100%', paddingVertical: 16, borderRadius: 18, alignItems: 'center',
    backgroundColor: ops.alert,
  },
  primaryTxt: { color: '#fff', fontFamily: fonts.display, fontSize: 15, letterSpacing: 0.5 },
});
