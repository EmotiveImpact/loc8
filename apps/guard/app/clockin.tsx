// apps/guard/app/clockin.tsx — start of shift (gallery: "Shift / clock-in").
// Venue, assigned zone, team preview, and one big button to go on-duty. Mesh is
// armed by the tabs once you're on duty. Also mints a guard profile if needed.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useCrewStore, haptics, anchorFloor } from '@loc8/engine';
import { ops, fonts, opsGradients, tint } from '../src/ui/opsTheme';
import { OpsBackground } from '../src/ui/OpsBackground';
import { MeshBadge } from '../src/ui/MeshBadge';
import { useGuardStore, badgeLabel } from '../src/state/guardStore';
import { GUARD_TEAM, VENUE_LEVELS } from '../src/state/guardTeam';

const TABS: Href = '/(tabs)' as Href;
const DEMO_NAME = 'Alex Okafor';

export default function ClockIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useCrewStore((s) => s.profile);
  const setProfile = useCrewStore((s) => s.setProfile);
  const shift = useGuardStore((s) => s.shift);
  const badge = useGuardStore((s) => s.badge);
  const goOnDuty = useGuardStore((s) => s.goOnDuty);
  const [startLevel, setStartLevel] = useState(0); // where you're clocking in

  const startShift = () => {
    if (!profile) {
      // Mint a stable-ish guard identity. id avoids the sim team ids (101–104).
      const id = 700000 + Math.floor(Math.random() * 200000);
      setProfile({ id, name: DEMO_NAME, color: ops.info });
    }
    haptics.success();
    // The clock-in anchor: "I'm on this level right now." From here the
    // barometer tracks movement; every floor the app shows traces back to this.
    anchorFloor(startLevel);
    goOnDuty();
    router.replace(TABS);
  };

  return (
    <View style={st.wrap}>
      <OpsBackground />
      <ScrollView contentContainerStyle={[st.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 }]}>
        <View style={st.top}>
          <Text style={st.tag}>◈ CLOCK IN</Text>
          <Text style={st.venue}>{shift.venue}</Text>
          <Text style={st.when}>Night Shift · {shift.window}</Text>
        </View>

        <View style={st.assign}>
          <View style={st.zc}>
            <MapPin size={22} color={ops.info} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.zt}>{shift.zone}</Text>
            <Text style={st.zsub}>Main Room · Bar · Smoking</Text>
          </View>
        </View>

        <Text style={st.teamTtl}>Starting level — where are you clocking in?</Text>
        <View style={st.levels}>
          {VENUE_LEVELS.map((l) => {
            const on = l.floor === startLevel;
            return (
              <Pressable
                key={l.floor}
                onPress={() => { haptics.select(); setStartLevel(l.floor); }}
                style={[st.levelChip, on && st.levelChipOn]}
              >
                <Text style={[st.levelShort, on && { color: '#06070d' }]}>{l.short}</Text>
                <Text style={[st.levelName, on && { color: 'rgba(6,7,13,0.75)' }]}>{l.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={st.teamTtl}>Team B · {GUARD_TEAM.length + 1} on shift</Text>
        <View style={st.team}>
          <View style={st.tmem}>
            <View style={[st.av, { backgroundColor: ops.info }]}><Text style={st.avTxt}>{badgeLabel(badge)}</Text></View>
            <Text style={st.tn}>You · {profile?.name ?? DEMO_NAME}</Text>
            <Text style={st.tz}>{shift.zone}</Text>
          </View>
          {GUARD_TEAM.map((m) => (
            <View key={m.id} style={st.tmem}>
              <View style={[st.av, { backgroundColor: m.status === 'caution' ? ops.caution : ops.ok }]}>
                <Text style={st.avTxt}>{badgeLabel(m.badge)}</Text>
              </View>
              <Text style={st.tn}>{m.name}</Text>
              <Text style={st.tz}>{m.zone}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={startShift}>
          <LinearGradient colors={opsGradients.safe} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.start}>
            <Text style={st.startTxt}>START SHIFT</Text>
          </LinearGradient>
        </Pressable>

        <View style={st.mesh}><MeshBadge /></View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: ops.bg },
  content: { paddingHorizontal: 18 },
  top: { alignItems: 'center' },
  tag: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 2, color: ops.ok },
  venue: { fontFamily: fonts.display, fontSize: 22, color: ops.ink, marginTop: 6, textAlign: 'center' },
  when: { fontFamily: fonts.mono, fontSize: 11, color: ops.muted, marginTop: 4 },
  assign: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20,
    backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line, borderRadius: 16, padding: 14,
  },
  zc: {
    width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(122,162,255,0.14)', borderWidth: 1, borderColor: 'rgba(122,162,255,0.35)',
  },
  zt: { fontFamily: fonts.displaySemi, fontSize: 16, color: ops.ink },
  zsub: { fontFamily: fonts.mono, fontSize: 10, color: ops.muted, marginTop: 2 },
  teamTtl: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1.5, color: ops.faint, marginTop: 20, marginBottom: 9 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line,
  },
  levelChipOn: { backgroundColor: tint(ops.info, 0.92), borderColor: ops.info },
  levelShort: { fontFamily: fonts.monoBold, fontSize: 11, color: ops.muted },
  levelName: { fontFamily: fonts.bodySemi, fontSize: 12, color: ops.ink },
  team: { gap: 6 },
  tmem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 11,
    backgroundColor: ops.panel2, borderWidth: 1, borderColor: ops.line,
  },
  av: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#06070d', fontFamily: fonts.displaySemi, fontSize: 11 },
  tn: { flex: 1, color: ops.ink, fontSize: 13, fontFamily: fonts.bodySemi },
  tz: { fontFamily: fonts.mono, fontSize: 10, color: ops.muted },
  start: {
    marginTop: 18, paddingVertical: 20, borderRadius: 20, alignItems: 'center',
    shadowColor: ops.ok, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
  },
  startTxt: { color: '#06120c', fontFamily: fonts.display, fontSize: 17, letterSpacing: 0.5 },
  mesh: { marginTop: 14, alignItems: 'center' },
});
