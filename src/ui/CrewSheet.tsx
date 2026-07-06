// src/ui/CrewSheet.tsx
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useCrewStore, freshnessSec, GHOST_SEC } from '../state/crewStore';
import { getMeshService } from '../services/appServices';
import { getHaversineDistance } from '../core/geoMath';
import { useNowSec } from '../hooks/useNowSec';
import { colors } from './theme';

export function CrewSheet() {
  const friends = useCrewStore((s) => s.friends);
  const myLocation = useCrewStore((s) => s.myLocation);
  const now = useNowSec();
  const router = useRouter();

  const ping = (id: number, name: string) =>
    Alert.alert(`Ping ${name}`, undefined, [
      { text: '📍 Where are you?', onPress: () => getMeshService().pingFriend(id, 'pingWhere') },
      { text: '📣 Come find me', onPress: () => getMeshService().pingFriend(id, 'pingComeFind') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const online = Object.values(friends).filter(
    (f) => f.lastPacket && (freshnessSec(f, now) ?? Infinity) <= GHOST_SEC,
  ).length;

  return (
    <View style={st.sheet}>
      <View style={st.grab} />
      <Text style={st.h}>YOUR CREW · {online} online</Text>
      {Object.values(friends).map((f) => {
        const fresh = freshnessSec(f, now);
        const dist =
          f.lastPacket && myLocation
            ? Math.round(getHaversineDistance(myLocation, {
                latitude: f.lastPacket.latitude, longitude: f.lastPacket.longitude,
              }))
            : null;
        const sub = !f.lastPacket
          ? 'not seen yet'
          : fresh! > GHOST_SEC
            ? `went dark · ${Math.floor(fresh! / 60)}m ago`
            : `${dist}m · ${fresh}s ago${f.relayVia ? ` · via ${f.relayVia} 🔗` : ''}`;
        return (
          <View key={f.id} style={st.row}>
            <View style={[st.av, { backgroundColor: f.color }]}>
              <Text style={st.avText}>{f.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{f.name}</Text>
              <Text style={st.sub}>{sub}</Text>
            </View>
            <Pressable style={st.pingBtn} onPress={() => ping(f.id, f.name)}>
              <Text style={st.pingText}>Ping</Text>
            </Pressable>
            <Pressable style={st.findBtn} onPress={() => router.push(`/compass/${f.id}` as Href)}>
              <Text style={st.findText}>Find →</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  sheet: {
    backgroundColor: 'rgba(16,19,32,0.96)', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    borderTopWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
  },
  grab: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 10 },
  h: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  av: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avText: { color: colors.bg, fontWeight: '800', fontSize: 13 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sub: { color: colors.textDim, fontSize: 11 },
  pingBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder },
  pingText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  findBtn: { backgroundColor: colors.pink, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  findText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
