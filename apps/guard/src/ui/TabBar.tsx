// apps/guard/src/ui/TabBar.tsx — ops 5-slot bottom nav.
// Slots: Map · Incidents · [ SOS raised red centre ] · Muster · Shift.
// SOS is NOT a tab route — it raises the SOS and pushes the /sos screen.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Map, TriangleAlert, Users, Clock, type LucideIcon } from 'lucide-react-native';
import { haptics } from '@loc8/engine';
import { ops, fonts } from './opsTheme';
import { raiseSosNow } from '../state/sos';
import { HoldSosButton } from './HoldSosButton';

interface TabDef { name: string; label: string; Icon: LucideIcon; }

// Declared route order in app/(tabs)/_layout.tsx.
const TABS: TabDef[] = [
  { name: 'index', label: 'Map', Icon: Map },
  { name: 'incidents', label: 'Incidents', Icon: TriangleAlert },
  { name: 'muster', label: 'Muster', Icon: Users },
  { name: 'shift', label: 'Shift', Icon: Clock },
];

const SOS: Href = '/sos' as Href;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeName = state.routes[state.index]?.name;

  const renderTab = (t: TabDef) => {
    const focused = activeName === t.name;
    const tint = focused ? ops.ok : ops.faint;
    return (
      <Pressable
        key={t.name}
        style={st.slot}
        onPress={() => { if (!focused) { haptics.select(); navigation.navigate(t.name); } }}
      >
        <t.Icon size={21} color={tint} strokeWidth={2} />
        <Text style={[st.label, { color: tint }]}>{t.label}</Text>
      </Pressable>
    );
  };

  return (
    <View pointerEvents="box-none" style={[st.host, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={st.bar}>
        {renderTab(TABS[0])}
        {renderTab(TABS[1])}

        {/* Raised red SOS — two safe paths to the same screen:
            TAP  → opens the SOS screen armed (a deliberate hold there sends);
            HOLD → ring fills 1s, the SOS fires, and the screen opens active. */}
        <HoldSosButton
          onPress={() => router.push(SOS)}
          onArmed={() => { raiseSosNow(); router.push(SOS); }}
        />

        {renderTab(TABS[2])}
        {renderTab(TABS[3])}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  bar: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    height: 62, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 9,
    backgroundColor: 'rgba(10,13,21,0.92)',
    borderWidth: 1, borderColor: ops.line,
  },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3, paddingBottom: 2 },
  label: { fontSize: 10, fontFamily: fonts.bodySemi },
});
