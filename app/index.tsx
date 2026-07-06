// app/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useCrewStore } from '../src/state/crewStore';
import { getMeshService, getTransport, bootCrew } from '../src/services/appServices';
import { useMyLocation } from '../src/hooks/useMyLocation';
import { RadarView } from '../src/ui/RadarView';
import { CrewSheet } from '../src/ui/CrewSheet';
import { PrivacyModal } from '../src/ui/PrivacyModal';
import { DevMenu } from '../src/ui/DevMenu';
import { useRouter, type Href } from 'expo-router';
import { colors } from '../src/ui/theme';

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
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const privacyMode = useCrewStore((s) => s.privacyMode);
  const beaconMode = useCrewStore((s) => s.beaconMode);

  useEffect(() => {
    bootCrew();
    getMeshService().start();
    getTransport().start();
    return () => { getTransport().stop(); };
  }, []);

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 4000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  const hasAny = Object.values(useCrewStore((s) => s.friends)).some((f) => f.lastPacket);

  return (
    <View style={st.wrap}>
      <View style={st.top}>
        <Text style={st.brand}>Loc<Text style={{ color: colors.pink }}>8</Text></Text>
        <View style={st.mesh}>
          <View style={st.dot} />
          <Text style={st.meshText}>MESH · {meshNearby} nearby</Text>
        </View>
      </View>

      {banner && <View style={st.banner}><Text style={st.bannerText}>{banner}</Text></View>}

      {sessionEndsAtSec === null && (
        <Pressable style={st.sessionCta} onPress={() => startSession(6)}>
          <Text style={st.sessionCtaText}>▶ Start a 6h session — become findable</Text>
        </Pressable>
      )}

      {locationStatus === 'denied' && (
        <Text style={st.warn}>⚠ Location denied — demo mode around Golden Gate Park</Text>
      )}

      {meshNearby === 0 && (
        <Text style={st.warn}>No crew in range — last known positions shown</Text>
      )}

      <RadarView />
      <Pressable style={st.crewNav} onPress={() => router.push(CREW)}>
        <Text style={st.crewNavText}>👥 Manage crew & session</Text>
      </Pressable>
      <View style={st.fabs}>
        <Pressable style={st.fab} onPress={() => { getMeshService().dropRally(); }}>
          <Text style={st.fabT}>🚩</Text>
        </Pressable>
        <Pressable
          style={[st.fab, privacyMode === 'invisible' && st.fabOn]}
          onPress={() => setPrivacyOpen(true)}
        >
          <Text style={st.fabT}>{privacyMode === 'invisible' ? '🚫' : '👁️'}</Text>
        </Pressable>
        {__DEV__ && (
          <Pressable style={st.fab} onPress={() => setDevOpen(true)}>
            <Text style={st.fabT}>🛠</Text>
          </Pressable>
        )}
      </View>
      {beaconMode && (
        <Text style={st.warn}>🪫 Power saver — updating once a minute, you're still findable</Text>
      )}
      <PrivacyModal visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <DevMenu visible={devOpen} onClose={() => setDevOpen(false)} />
      <CrewSheet />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  brand: { color: colors.text, fontSize: 20, fontWeight: '800' },
  mesh: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(75,227,192,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(75,227,192,0.25)',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal },
  meshText: { color: colors.teal, fontSize: 11, fontWeight: '700' },
  banner: {
    marginHorizontal: 20, marginTop: 10, backgroundColor: colors.card, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: colors.cardBorder,
  },
  bannerText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  sessionCta: {
    marginHorizontal: 20, marginTop: 10, backgroundColor: colors.pink, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  sessionCtaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  warn: { color: colors.yellow, fontSize: 11, textAlign: 'center', marginTop: 8 },
  crewNav: { alignItems: 'center', paddingVertical: 6 },
  crewNavText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  fabs: { position: 'absolute', right: 16, bottom: 300, gap: 12, zIndex: 20 },
  fab: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center',
  },
  fabOn: { backgroundColor: colors.pink },
  fabT: { fontSize: 20 },
});
