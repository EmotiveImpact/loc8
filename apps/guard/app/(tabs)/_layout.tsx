// Tab shell with the raised-centre SOS — the ops version of the consumer
// raised-centre Rally slot (product-architecture.md §navigation).
import { Tabs, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Radar, ClipboardList, Users } from 'lucide-react-native';
import { sendSos } from '../../src/services/ops';
import { fonts, g, gradients } from '../../src/theme';

const TABS = [
  { name: 'map', label: 'Map', Icon: Radar },
  { name: 'log', label: 'Log', Icon: ClipboardList },
  { name: 'team', label: 'Team', Icon: Users },
];

// Minimal structural typing for the react-navigation tab-bar props we use
// (the package is a transitive dep of expo-router; no direct type import).
interface TabBarProps {
  state: { index: number; routes: Array<{ name: string }> };
  navigation: { navigate(name: string): void };
}

function GuardTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const active = state.routes[state.index]?.name;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Map · Log · [SOS] · Team */}
      {TABS.slice(0, 2).map((t) => (
        <TabBtn key={t.name} tab={t} active={active === t.name} onPress={() => navigation.navigate(t.name)} />
      ))}
      <Pressable
        accessibilityLabel="SOS — hold to send"
        onPress={() => router.push('/sos')}
        onLongPress={() => {
          sendSos();
          router.push('/sos');
        }}
        style={styles.sosWrap}
      >
        <LinearGradient colors={gradients.danger} style={styles.sos}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSub}>HOLD</Text>
        </LinearGradient>
      </Pressable>
      {TABS.slice(2).map((t) => (
        <TabBtn key={t.name} tab={t} active={active === t.name} onPress={() => navigation.navigate(t.name)} />
      ))}
    </View>
  );
}

function TabBtn({
  tab,
  active,
  onPress,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? g.ink : g.faint;
  return (
    <Pressable accessibilityLabel={tab.label} onPress={onPress} style={styles.tab}>
      <tab.Icon size={20} color={color} strokeWidth={2} />
      <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: g.bg } }}
      tabBar={(props) => <GuardTabBar {...props} />}
    >
      <Tabs.Screen name="map" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="team" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(6,7,13,0.94)',
    borderTopColor: g.line,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  tab: { alignItems: 'center', gap: 3, paddingVertical: 6, width: 64 },
  tabLabel: { fontFamily: fonts.bodySemi, fontSize: 10 },
  sosWrap: { marginTop: -26 },
  sos: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: g.alert,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  sosText: { fontFamily: fonts.disp, fontSize: 15, color: '#fff' },
  sosSub: { fontFamily: fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
});
