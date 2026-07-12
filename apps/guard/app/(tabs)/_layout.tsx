// apps/guard/app/(tabs)/_layout.tsx — 5-slot ops nav (SOS centre is not a tab).
// Boots the shared engine mesh for the whole on-duty session.
import { Tabs } from 'expo-router';
import { TabBar } from '../../src/ui/TabBar';
import { useGuardBoot } from '../../src/hooks/useGuardBoot';
import { useMyLocation } from '../../src/hooks/useMyLocation';

export default function TabsLayout() {
  useMyLocation();
  useGuardBoot();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="incidents" />
      <Tabs.Screen name="muster" />
      <Tabs.Screen name="shift" />
    </Tabs>
  );
}
