// Shift / clock-in — the pre-duty screen (gallery-guard §7).
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { useCrewStore } from '@loc8/engine';
import { useGuardStore } from '../src/store/guardStore';
import { GUARD_TEAM } from '../src/services/ops';
import { Card, GradientBtn, MeshBadge, Tag } from '../src/ui/kit';
import { fonts, g } from '../src/theme';

const nowSec = () => Math.floor(Date.now() / 1000);

export default function Shift() {
  const startShift = useGuardStore((s) => s.startShift);
  const zoneLabel = useGuardStore((s) => s.zoneLabel);

  const clockIn = () => {
    const crew = useCrewStore.getState();
    // On-duty consent: the shift IS the consent basis (identity-privacy doc).
    if (!crew.profile) {
      crew.setProfile({ id: 7, name: 'Priya · Guard 07', color: g.info });
    }
    crew.startSession(8); // broadcast for the 8h shift
    startShift(nowSec());
    router.replace('/(tabs)/map');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Tag color={g.ok}>CLOCK IN</Tag>
          <Text style={styles.venue}>Ministry of Sound</Text>
          <Text style={styles.when}>Night Shift · 22:00 – 04:00</Text>
        </View>

        <Card style={styles.assign}>
          <View style={styles.zc}>
            <MapPin size={22} color={g.info} strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.zoneB}>{zoneLabel}</Text>
            <Text style={styles.zoneSub}>Main Room · Bar · Smoking</Text>
          </View>
        </Card>

        <Text style={styles.teamttl}>TEAM B · {GUARD_TEAM.length + 1} ON SHIFT</Text>
        <View style={styles.team}>
          <TeamRow label="07" name="You · Guard 07" zone={zoneLabel} you />
          {GUARD_TEAM.map((m) => (
            <TeamRow
              key={m.id}
              label={m.name.split('Guard ')[1] ?? '—'}
              name={m.name}
              zone={m.id === 103 ? 'Car Park' : 'Zone 1'}
            />
          ))}
        </View>

        <GradientBtn kind="safe" title="START SHIFT" onPress={clockIn} style={styles.start} />
        <View style={styles.meshRow}>
          <MeshBadge label="MESH · offline-ready" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TeamRow({ label, name, zone, you }: { label: string; name: string; zone: string; you?: boolean }) {
  return (
    <View style={styles.tmem}>
      <View style={[styles.av, { backgroundColor: you ? g.info : g.ok }]}>
        <Text style={styles.avText}>{label}</Text>
      </View>
      <Text style={styles.tn}>{name}</Text>
      <Text style={styles.tz}>{zone}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: g.bg },
  scroll: { padding: 18, paddingTop: 24, flexGrow: 1 },
  top: { alignItems: 'center', gap: 6, marginBottom: 18 },
  venue: { fontFamily: fonts.disp, fontSize: 20, color: g.ink },
  when: { fontFamily: fonts.mono, fontSize: 11, color: g.muted },
  assign: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16 },
  zc: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: g.infoBg,
    borderColor: g.infoBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneB: { fontFamily: fonts.dispSemi, fontSize: 16, color: g.ink },
  zoneSub: { fontFamily: fonts.mono, fontSize: 10, color: g.muted, marginTop: 2 },
  teamttl: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: g.faint,
    marginTop: 18,
    marginBottom: 8,
  },
  team: { gap: 6 },
  tmem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: g.panel2,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  av: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avText: { fontFamily: fonts.disp, fontSize: 11, color: '#06070d' },
  tn: { fontFamily: fonts.bodySemi, fontSize: 13, color: g.ink },
  tz: { fontFamily: fonts.mono, fontSize: 10, color: g.muted, marginLeft: 'auto' },
  start: { marginTop: 22 },
  meshRow: { alignItems: 'center', marginTop: 14 },
});
