// apps/guard/app/(tabs)/muster.tsx — Muster / evacuation (gallery screen 6).
// Declare an evacuation (broadcast over the mesh) or, once called, confirm safe.
// A live count tells everyone who's still unaccounted.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, ShieldAlert } from 'lucide-react-native';
import { getMeshService, haptics, opsMsg, useCrewStore } from '@loc8/engine';
import { ops, fonts, opsGradients, tint } from '../../src/ui/opsTheme';
import { OpsBackground } from '../../src/ui/OpsBackground';
import { HoldButton } from '../../src/ui/HoldButton';
import { useGuardStore } from '../../src/state/guardStore';
import { GUARD_TEAM, friendFloor, levelName } from '../../src/state/guardTeam';

// Demo: this many teammates have already reached the assembly point.
const SAFE_BASELINE = GUARD_TEAM.length - 1;

export default function Muster() {
  const insets = useSafeAreaInsets();
  const musterActive = useGuardStore((s) => s.musterActive);
  const mustered = useGuardStore((s) => s.mustered);
  const callMuster = useGuardStore((s) => s.callMuster);
  const endMuster = useGuardStore((s) => s.endMuster);
  const markSafe = useGuardStore((s) => s.markSafe);

  const myFloor = useCrewStore((s) => s.myFloor);
  const friends = useCrewStore((s) => s.friends);

  const total = GUARD_TEAM.length + 1; // team + you
  const accounted = SAFE_BASELINE + (mustered ? 1 : 0);
  const pct = Math.round((accounted / total) * 100);

  // Head-count per floor (control needs to know who's still where).
  const byFloor: Record<number, number> = {};
  for (const m of GUARD_TEAM) {
    const fl = friendFloor(friends[m.id] ?? { id: m.id });
    byFloor[fl] = (byFloor[fl] ?? 0) + 1;
  }
  byFloor[myFloor] = (byFloor[myFloor] ?? 0) + 1;
  const floorRows = Object.keys(byFloor).map(Number).sort((a, b) => b - a);

  const badge = useGuardStore.getState().badge;
  const declare = () => {
    haptics.warning();
    callMuster();
    // Shared ops grammar — Command activates its muster board off this.
    getMeshService().sendCrewMessage(opsMsg.musterCall('Assembly Point A'));
  };
  const confirmSafe = () => {
    haptics.success();
    markSafe();
    // Command's live muster board counts this check-in (sender id is identity).
    getMeshService().sendCrewMessage(opsMsg.musterSafe(badge, 'Assembly Point A'));
  };
  const standDown = () => {
    endMuster();
    getMeshService().sendCrewMessage(opsMsg.musterClear(accounted, total));
  };

  if (!musterActive) {
    return (
      <View style={[st.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 90 }]}>
        <OpsBackground />
        <View style={st.iconWrap}><Users size={44} color={ops.muted} strokeWidth={2} /></View>
        <Text style={st.idleTtl}>No active muster</Text>
        <Text style={st.idleP}>Declare an evacuation to alert the whole team over the mesh and start accounting for everyone.</Text>
        <View style={st.declareWrap}>
          <HoldButton
            label="DECLARE MUSTER"
            sublabel="HOLD 2.5s TO CONFIRM"
            holdMs={2500}
            bg={ops.alert}
            textColor="#fff"
            fillColor="rgba(255,255,255,0.28)"
            height={64}
            icon={<ShieldAlert size={20} color="#fff" strokeWidth={2.2} />}
            onComplete={declare}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[st.wrap, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 90 }]}>
      <OpsBackground />
      <Text style={st.tag}>◈ EVACUATION</Text>
      <Text style={st.title}>MUSTER{'\n'}CALLED</Text>
      <View style={st.mustIcon}><Users size={44} color={ops.alert} strokeWidth={2} /></View>
      <Text style={st.p}>Tap when you're at the assembly point.</Text>

      <Pressable style={[st.safe, mustered && st.safeDone]} onPress={confirmSafe} disabled={mustered}>
        <LinearGradient
          colors={mustered ? [ops.panel, ops.panel] : opsGradients.safe}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={st.safeGrad}
        >
          <Text style={[st.safeTxt, mustered && { color: ops.ok }]}>{mustered ? "YOU'RE SAFE" : "I'M SAFE"}</Text>
          <Text style={[st.safeSub, mustered && { color: ops.ok }]}>{mustered ? 'ACCOUNTED FOR' : 'CONFIRM ACCOUNTED FOR'}</Text>
        </LinearGradient>
      </Pressable>

      <View style={st.count}>
        <Text style={st.cn}><Text style={{ color: ops.ok }}>{accounted}</Text> / {total} accounted for</Text>
        <View style={st.bar}><View style={[st.barFill, { width: `${pct}%` }]} /></View>
        <Text style={st.sub}>{total - accounted} not yet at muster point</Text>
        <View style={st.floors}>
          {floorRows.map((fl) => (
            <View key={fl} style={st.floorTag}>
              <Text style={st.floorTagName}>{levelName(fl)}</Text>
              <Text style={st.floorTagCount}>{byFloor[fl]}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable style={st.end} onPress={() => { haptics.tap(); standDown(); }}>
        <Text style={st.endTxt}>End muster</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingHorizontal: 22, backgroundColor: ops.bg },
  // idle
  iconWrap: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line, marginTop: 20,
  },
  idleTtl: { fontFamily: fonts.display, fontSize: 20, color: ops.ink, marginTop: 20 },
  idleP: { color: ops.muted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 10, fontFamily: fonts.body },
  declareWrap: { alignSelf: 'stretch', marginTop: 26 },
  // active
  tag: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 3, color: ops.alert },
  title: { fontFamily: fonts.display, fontSize: 28, color: ops.ink, marginTop: 8, textAlign: 'center', lineHeight: 30 },
  mustIcon: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginTop: 24,
    backgroundColor: tint(ops.alert, 0.14), borderWidth: 1, borderColor: tint(ops.alert, 0.4),
  },
  p: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 10, textAlign: 'center', fontFamily: fonts.body },
  safe: { width: '100%', marginTop: 26, borderRadius: 22, overflow: 'hidden' },
  safeDone: { opacity: 0.9 },
  safeGrad: { paddingVertical: 22, alignItems: 'center', borderRadius: 22 },
  safeTxt: { color: '#06120c', fontFamily: fonts.display, fontSize: 18, letterSpacing: 0.5 },
  safeSub: { color: 'rgba(6,18,12,0.8)', fontFamily: fonts.monoBold, fontSize: 10, marginTop: 3, letterSpacing: 1 },
  count: { width: '100%', marginTop: 26 },
  cn: { fontFamily: fonts.display, fontSize: 16, color: ops.ink },
  bar: { height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6, backgroundColor: ops.ok },
  sub: { fontFamily: fonts.mono, fontSize: 10, color: ops.muted, marginTop: 6 },
  floors: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  floorTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line, borderRadius: 9,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  floorTagName: { fontFamily: fonts.mono, fontSize: 10, color: ops.muted },
  floorTagCount: { fontFamily: fonts.monoBold, fontSize: 11, color: ops.ink },
  end: { marginTop: 'auto', paddingVertical: 12 },
  endTxt: { color: ops.muted, fontFamily: fonts.bodySemi, fontSize: 13 },
});
