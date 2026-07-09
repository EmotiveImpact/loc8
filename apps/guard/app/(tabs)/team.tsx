// Team & status — teammates with live freshness, my status quick-replies
// (the shared GUARD_STATUS wire vocabulary), and end-of-shift.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCrewStore, freshnessSec, GHOST_SEC, STALE_SEC } from '@loc8/engine';
import { GUARD_STATUS, sendStatus } from '../../src/services/ops';
import { useGuardStore } from '../../src/store/guardStore';
import { Card, MeshBadge } from '../../src/ui/kit';
import { fonts, g } from '../../src/theme';

const nowSec = () => Math.floor(Date.now() / 1000);

export default function Team() {
  const friends = useCrewStore((s) => s.friends);
  const endShift = useGuardStore((s) => s.endShift);
  const [lastSent, setLastSent] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.hdr}>
        <View>
          <Text style={styles.title}>Team B</Text>
          <Text style={styles.sub}>YOU · Guard 07</Text>
        </View>
        <MeshBadge />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>MY STATUS — SENT OVER MESH</Text>
        <View style={styles.statusRow}>
          {GUARD_STATUS.map((s) => {
            const on = lastSent === s.code;
            return (
              <Pressable
                key={s.code}
                onPress={() => {
                  sendStatus(s.code);
                  setLastSent(s.code);
                }}
                style={[styles.statusChip, on && styles.statusChipOn]}
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.statusText, on && styles.statusTextOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>ON SHIFT</Text>
        <View style={{ gap: 7 }}>
          {Object.values(friends).map((f) => {
            const fresh = freshnessSec(f, nowSec());
            const state =
              fresh === null ? 'no contact' : fresh > GHOST_SEC ? 'went dark' : fresh > STALE_SEC ? 'stale' : 'live';
            const tone = state === 'live' ? g.ok : state === 'stale' ? g.caution : g.faint;
            return (
              <Card key={f.id} style={styles.member}>
                <View style={[styles.dot, { backgroundColor: f.color }]} />
                <Text style={styles.name}>{f.name}</Text>
                <Text style={[styles.state, { color: tone }]}>{state.toUpperCase()}</Text>
              </Card>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            endShift();
            useCrewStore.getState().endSession();
            router.replace('/shift');
          }}
          style={styles.endBtn}
        >
          <Text style={styles.endText}>End shift · clock out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: g.bg },
  hdr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  title: { fontFamily: fonts.bodyBold, fontSize: 13, color: g.ink },
  sub: { fontFamily: fonts.mono, fontSize: 9, color: g.muted, marginTop: 2 },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  section: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: g.faint,
    marginTop: 16,
    marginBottom: 8,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    backgroundColor: g.panel,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  statusChipOn: { backgroundColor: g.okBg, borderColor: g.okBorder },
  statusText: { fontFamily: fonts.bodySemi, fontSize: 12, color: g.muted },
  statusTextOn: { color: g.ok },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontFamily: fonts.bodySemi, fontSize: 13, color: g.ink },
  state: { fontFamily: fonts.monoBold, fontSize: 9, marginLeft: 'auto', letterSpacing: 0.5 },
  endBtn: { alignItems: 'center', marginTop: 26, padding: 12 },
  endText: { fontFamily: fonts.bodySemi, fontSize: 12, color: g.muted },
});
