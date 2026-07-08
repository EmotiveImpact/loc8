// src/ui/TabBar.tsx — custom 5-slot bottom bar for expo-router <Tabs tabBar={...} />
// Slots: Radar · Activity · [Rally raised gold centre] · Crew · Me.
// Rally is NOT a tab route — it pushes the /rally modal.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Radar, Bell, Flag, Users, User, type LucideIcon } from 'lucide-react-native';
import { haptics } from '@loc8/engine';
import { colors, gradients, fonts } from '@loc8/engine';

interface TabDef { name: string; label: string; Icon: LucideIcon; }

// Declared route order in app/(tabs)/_layout.tsx.
const TABS: TabDef[] = [
  { name: 'index', label: 'Radar', Icon: Radar },
  { name: 'activity', label: 'Activity', Icon: Bell },
  { name: 'crew', label: 'Crew', Icon: Users },
  { name: 'me', label: 'Me', Icon: User },
];

const RALLY: Href = '/rally' as Href;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeName = state.routes[state.index]?.name;

  const renderTab = (t: TabDef) => {
    const focused = activeName === t.name;
    const tint = focused ? colors.coral : colors.faint;
    return (
      <Pressable
        key={t.name}
        style={st.slot}
        onPress={() => { if (!focused) { haptics.select(); navigation.navigate(t.name); } }}
      >
        <t.Icon size={22} color={tint} strokeWidth={2} />
        <Text style={[st.label, { color: tint }]}>{t.label}</Text>
      </Pressable>
    );
  };

  return (
    <View pointerEvents="box-none" style={[st.host, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={st.bar}>
        <BlurView tint="dark" intensity={30} style={st.glass} />
        {renderTab(TABS[0])}
        {renderTab(TABS[1])}

        {/* Raised gold Rally — not a tab route */}
        <Pressable style={st.rallySlot} onPress={() => { haptics.tap(); router.push(RALLY); }}>
          <LinearGradient colors={gradients.rally} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.rbtn}>
            <Flag size={24} color="#1a0a10" strokeWidth={2.4} />
          </LinearGradient>
          <Text style={[st.label, st.rallyLabel]}>Rally</Text>
        </Pressable>

        {renderTab(TABS[2])}
        {renderTab(TABS[3])}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  host: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 14,
  },
  bar: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    height: 62, borderRadius: 24, paddingHorizontal: 6, paddingVertical: 9,
    backgroundColor: 'rgba(16,12,28,0.55)',
    borderWidth: 1, borderColor: colors.line,
  },
  glass: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, overflow: 'hidden' },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3, paddingBottom: 2 },
  label: { fontSize: 10, fontFamily: fonts.bodySemi },
  rallySlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  rbtn: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    marginTop: -26, borderWidth: 3, borderColor: colors.bg,
    shadowColor: colors.gold, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  rallyLabel: { color: colors.gold },
});
