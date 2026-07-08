// app/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useCrewStore } from '../src/state/crewStore';
import { getMeshService, bootCrew } from '../src/services/appServices';
import { useMyLocation } from '../src/hooks/useMyLocation';
import { useBatteryGuard } from '../src/hooks/useBatteryGuard';
import { RadarView } from '../src/ui/RadarView';
import { CrewSheet } from '../src/ui/CrewSheet';
import { PrivacyModal } from '../src/ui/PrivacyModal';
import { DevMenu } from '../src/ui/DevMenu';
import { MeshDebugOverlay } from '../src/ui/MeshDebugOverlay';
import { useRouter, type Href } from 'expo-router';
import { colors } from '../src/ui/theme';
import { notifyPing } from '../src/services/notifications';
import { ensureBlePermissions } from '../src/services/blePermissions';
import { Play, TriangleAlert, BatteryLow, Users, Flag, Eye, EyeOff, Wrench, ChevronRight } from 'lucide-react-native';

// `/crew` (app/crew.tsx) is added in this task; the generated typed-routes
// union has not regenerated yet, so reference it through the documented `Href`
// escape hatch (same pattern as app/_layout.tsx for `/onboarding`).
const CREW: Href = '/crew' as Href;

export default function RadarHome() {
  const router = useRouter();
  const meshNearby = useCrewStore((s) => s.meshNearby);
  const banner = useCrewStore((s) => s.banner);
  const setBanner = useCrewStore((s) => s.setBanner);
  const sessionEndsAtSec = useCrewStore((s) => s.sessionEndsAtSec);
  const startSession = useCrewStore((s) => s.startSession);
  const locationStatus = useMyLocation();
  useBatteryGuard();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const privacyMode = useCrewStore((s) => s.privacyMode);
  const beaconMode = useCrewStore((s) => s.beaconMode);

  useEffect(() => {
    bootCrew();
    const mesh = getMeshService();
    let cancelled = false;
    (async () => {
      // Real BLE transport: Android 12+ needs runtime BLE permissions BEFORE
      // the native mesh starts — otherwise it rejects and the mesh stays dead.
      if (process.env.EXPO_PUBLIC_TRANSPORT === 'ble' && !(await ensureBlePermissions())) {
        setBanner({ text: 'Bluetooth permission needed — mesh is off' });
        return;
      }
      if (!cancelled) mesh.start();
    })();
    return () => { cancelled = true; mesh.stop(); };
  }, []);

  useEffect(() => {
    if (banner) {
      if (banner.friendId) notifyPing('Loc8', banner.text, banner.friendId);
      const t = setTimeout(() => setBanner(null), 5000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  return (
    <View style={st.wrap}>
      <View style={st.top}>
        <Text style={st.brand}>Loc<Text style={{ color: colors.pink }}>8</Text></Text>
      </View>

      {banner && (
        <Pressable
          style={st.banner}
          onPress={() => {
            if (banner.friendId) router.push(`/compass/${banner.friendId}` as Href);
            setBanner(null);
          }}
        >
          <View style={st.bannerRow}>
            <Text style={st.bannerText}>{banner.text}</Text>
            {banner.friendId ? <ChevronRight size={16} color={colors.text} strokeWidth={2} /> : null}
          </View>
        </Pressable>
      )}

      {sessionEndsAtSec === null && (
        <Pressable style={st.sessionCta} onPress={() => startSession(6)}>
          <Play size={15} color="#fff" strokeWidth={2} fill="#fff" />
          <Text style={st.sessionCtaText}>Start a 6h session — become findable</Text>
        </Pressable>
      )}

      {locationStatus === 'denied' && (
        <View style={st.warnRow}>
          <TriangleAlert size={12} color={colors.yellow} strokeWidth={2} />
          <Text style={st.warn}>Location denied — demo mode around Golden Gate Park</Text>
        </View>
      )}

      {meshNearby === 0 && (
        <Text style={st.warn}>No crew in range — last known positions shown</Text>
      )}

      <RadarView />
      <Pressable style={st.crewNav} onPress={() => router.push(CREW)}>
        <Users size={14} color={colors.textDim} strokeWidth={2} />
        <Text style={st.crewNavText}>Manage crew & session</Text>
      </Pressable>
      <View style={st.fabs}>
        <Pressable style={st.fab} onPress={() => { getMeshService().dropRally(); }}>
          <Flag size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={[st.fab, privacyMode === 'invisible' && st.fabOn]}
          onPress={() => setPrivacyOpen(true)}
        >
          {privacyMode === 'invisible'
            ? <EyeOff size={22} color="#fff" strokeWidth={2} />
            : <Eye size={22} color={colors.text} strokeWidth={2} />}
        </Pressable>
        {__DEV__ && (
          <Pressable style={st.fab} onPress={() => setDevOpen(true)}>
            <Wrench size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        )}
      </View>
      {beaconMode && (
        <View style={st.warnRow}>
          <BatteryLow size={12} color={colors.yellow} strokeWidth={2} />
          <Text style={st.warn}>Power saver — updating once a minute, you're still findable</Text>
        </View>
      )}
      <PrivacyModal visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <DevMenu visible={devOpen} onClose={() => setDevOpen(false)} />
      <MeshDebugOverlay />
      <CrewSheet />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  top: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  brand: { color: colors.text, fontSize: 20, fontWeight: '800' },
  banner: {
    marginHorizontal: 20, marginTop: 10, backgroundColor: colors.card, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: colors.cardBorder,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  bannerText: { color: colors.text, fontSize: 13, fontWeight: '600', flex: 1 },
  sessionCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 10, backgroundColor: colors.pink, borderRadius: 12, padding: 14,
  },
  sessionCtaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  warnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8 },
  warn: { color: colors.yellow, fontSize: 11, textAlign: 'center' },
  crewNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  crewNavText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  fabs: { position: 'absolute', right: 16, bottom: 300, gap: 12, zIndex: 20 },
  fab: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center',
  },
  fabOn: { backgroundColor: colors.pink },
});
