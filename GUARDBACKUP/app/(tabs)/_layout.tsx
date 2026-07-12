// app/(tabs)/_layout.tsx — 5-slot bottom nav (Rally centre is a modal, not a tab).
import { Tabs } from 'expo-router';
import { TabBar } from '../../src/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="crew" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
