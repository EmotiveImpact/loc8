// apps/guard/app/floor.tsx — set your floor (barometric auto, or pin manually).
// Auto uses the phone's barometer; pinning a floor switches to manual and
// recalibrates the baseline so auto agrees if you switch back.
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useCrewStore, floorLabel, isFloorSensingActive, setManualFloor, setAutoFloor, haptics } from '@loc8/engine';
import { ops, fonts, tint } from '../src/ui/opsTheme';
import { OpsBackground } from '../src/ui/OpsBackground';

// Offer a sensible venue range.
const FLOORS = [5, 4, 3, 2, 1, 0, -1, -2];

export default function FloorPicker() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const myFloor = useCrewStore((s) => s.myFloor);
  const mode = useCrewStore((s) => s.floorMode);
  const sensing = isFloorSensingActive();

  const pick = (f: number) => { haptics.select(); setManualFloor(f); };
  const auto = () => { haptics.tap(); setAutoFloor(); };

  return (
    <View style={[st.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <OpsBackground />
      <View style={st.head}>
        <View style={{ flex: 1 }}>
          <Text style={st.tag}>◈ YOUR LEVEL</Text>
          <Text style={st.title}>{floorLabel(myFloor)}</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}><X size={22} color={ops.muted} strokeWidth={2} /></Pressable>
      </View>

      <Text style={st.sense}>
        {sensing ? '◈ Barometer active — floor detected automatically' : '◈ No barometer here — set your level manually'}
      </Text>

      <Pressable style={[st.auto, mode === 'auto' && st.autoOn]} onPress={auto}>
        <Text style={[st.autoTxt, mode === 'auto' && { color: ops.ok }]}>
          AUTOMATIC {mode === 'auto' ? '· ON' : ''}
        </Text>
        {mode === 'auto' && <Check size={16} color={ops.ok} strokeWidth={2.4} />}
      </Pressable>

      <Text style={st.or}>or pin manually</Text>
      <ScrollView contentContainerStyle={st.list}>
        {FLOORS.map((f) => {
          const on = mode === 'manual' && f === myFloor;
          return (
            <Pressable key={f} style={[st.cell, on && st.cellOn]} onPress={() => pick(f)}>
              <Text style={[st.cellTxt, on && { color: '#06070d' }]}>{floorLabel(f)}</Text>
              {on && <Check size={16} color="#06070d" strokeWidth={2.6} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: ops.bg, paddingHorizontal: 20 },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  tag: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 2, color: ops.info },
  title: { fontFamily: fonts.display, fontSize: 26, color: ops.ink, marginTop: 4 },
  sense: { fontFamily: fonts.mono, fontSize: 11, color: ops.muted, marginTop: 12 },
  auto: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, padding: 15, borderRadius: 14, backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line,
  },
  autoOn: { backgroundColor: tint(ops.ok, 0.1), borderColor: tint(ops.ok, 0.4) },
  autoTxt: { fontFamily: fonts.bodyBold, fontSize: 14, color: ops.ink },
  or: { fontFamily: fonts.mono, fontSize: 10, color: ops.faint, textAlign: 'center', marginTop: 16, marginBottom: 8, letterSpacing: 1 },
  list: { gap: 8, paddingBottom: 10 },
  cell: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, paddingHorizontal: 16, borderRadius: 12, backgroundColor: ops.panel2, borderWidth: 1, borderColor: ops.line,
  },
  cellOn: { backgroundColor: ops.info, borderColor: ops.info },
  cellTxt: { fontFamily: fonts.bodySemi, fontSize: 15, color: ops.ink },
});
