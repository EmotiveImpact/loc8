// app/index.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useCrewStore } from '../src/state/crewStore';
import { getMeshService, getTransport, bootCrew } from '../src/services/appServices';
import { useMyLocation } from '../src/hooks/useMyLocation';
import { RadarView } from '../src/ui/RadarView';
import { colors } from '../src/ui/theme';

export default function RadarHome() {
  const meshNearby = useCrewStore((s) => s.meshNearby);
  const banner = useCrewStore((s) => s.banner);
  const setBanner = useCrewStore((s) => s.setBanner);
  const sessionEndsAtSec = useCrewStore((s) => s.sessionEndsAtSec);
  const startSession = useCrewStore((s) => s.startSession);
  const locationStatus = useMyLocation();

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
});
