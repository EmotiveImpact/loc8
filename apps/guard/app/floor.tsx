// apps/guard/app/floor.tsx — anchor your level.
// The user asserting "I'm on the Balcony" IS the source of truth; the barometer
// then tracks movement from that anchor (and asks to re-confirm after big
// travel). No auto/manual toggle — assist is always on where a sensor exists.
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, X, Anchor } from 'lucide-react-native';
import {
  useCrewStore,
  venueLevelName,
  isFloorSensingActive,
  anchorFloor,
  haptics,
} from '@loc8/engine';
import { ops, fonts, tint } from '../src/ui/opsTheme';
import { OpsBackground } from '../src/ui/OpsBackground';
import { VENUE_LEVELS } from '../src/state/guardTeam';

export default function FloorPicker() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const myFloor = useCrewStore((s) => s.myFloor);
  const confidence = useCrewStore((s) => s.floorConfidence);
  const sensing = isFloorSensingActive();

  const pick = (f: number) => {
    haptics.success();
    anchorFloor(f);
    router.back();
  };

  return (
    <View style={[st.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <OpsBackground />
      <View style={st.head}>
        <View style={{ flex: 1 }}>
          <Text style={st.tag}>◈ YOUR LEVEL</Text>
          <Text style={st.title}>
            {confidence === 'unknown' ? 'Not set' : venueLevelName(VENUE_LEVELS, myFloor)}
          </Text>
          <Text style={st.conf}>
            {confidence === 'anchored' && 'Anchored — you set this'}
            {confidence === 'estimated' && 'Estimated — tracked from your last anchor'}
            {confidence === 'unknown' && 'Pick the level you are on now'}
          </Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <X size={22} color={ops.muted} strokeWidth={2} />
        </Pressable>
      </View>

      <Text style={st.sense}>
        {sensing
          ? '◈ Barometer active — movement between levels is tracked automatically'
          : '◈ No barometer on this device — update your level here when you move'}
      </Text>

      <ScrollView contentContainerStyle={st.list}>
        {VENUE_LEVELS.map((l) => {
          const on = confidence !== 'unknown' && l.floor === myFloor;
          return (
            <Pressable key={l.floor} style={[st.cell, on && st.cellOn]} onPress={() => pick(l.floor)}>
              <Text style={[st.cellShort, on && { color: '#06070d' }]}>{l.short}</Text>
              <Text style={[st.cellTxt, on && { color: '#06070d' }]}>{l.name}</Text>
              {on ? (
                <Check size={16} color="#06070d" strokeWidth={2.6} />
              ) : (
                <Anchor size={14} color={ops.faint} strokeWidth={2} />
              )}
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
  conf: { fontFamily: fonts.mono, fontSize: 10, color: ops.muted, marginTop: 4 },
  sense: { fontFamily: fonts.mono, fontSize: 11, color: ops.muted, marginTop: 14, lineHeight: 16 },
  list: { gap: 8, paddingTop: 16, paddingBottom: 10 },
  cell: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 15, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: ops.panel2, borderWidth: 1, borderColor: ops.line,
  },
  cellOn: { backgroundColor: tint(ops.info, 0.92), borderColor: ops.info },
  cellShort: { fontFamily: fonts.monoBold, fontSize: 12, color: ops.muted, width: 28 },
  cellTxt: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: ops.ink },
});
