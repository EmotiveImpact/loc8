// apps/guard/app/_layout.tsx — Guard root: fonts, dark tactical chrome, and a
// clock-in gate (you can't reach the tabs until you're on duty).
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Unbounded_600SemiBold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import { Sora_300Light, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useCrewStore } from '@loc8/engine';
import { ops } from '../src/ui/opsTheme';
import { useGuardStore } from '../src/state/guardStore';

const CLOCKIN: Href = '/clockin' as Href;
const TABS: Href = '/(tabs)' as Href;

export default function GuardRootLayout() {
  const hydrate = useCrewStore((s) => s.hydrate);
  const hydrated = useCrewStore((s) => s.hydrated);
  const onDuty = useGuardStore((s) => s.onDuty);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Unbounded_600SemiBold, Unbounded_800ExtraBold,
    Sora_300Light, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold,
    SpaceMono_400Regular, SpaceMono_700Bold,
  });

  useEffect(() => { hydrate(); }, []);

  // Gate: off-duty → clock-in; on-duty but stuck on clock-in → tabs.
  useEffect(() => {
    if (!hydrated) return;
    const onClockIn = (segments[0] as string) === 'clockin';
    if (!onDuty && !onClockIn) router.replace(CLOCKIN);
    if (onDuty && onClockIn) router.replace(TABS);
  }, [hydrated, onDuty, segments]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: ops.bg },
        }}
      >
        <Stack.Screen name="clockin" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sos" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="dispatch" options={{ presentation: 'card' }} />
        <Stack.Screen name="lone" options={{ presentation: 'modal' }} />
        <Stack.Screen name="floor" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
