import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFonts, Unbounded_600SemiBold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import { Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useCrewStore } from '@loc8/engine';
import { bootGuard } from '../src/services/ops';
import { useGuardStore } from '../src/store/guardStore';
import { g } from '../src/theme';

const nowSec = () => Math.floor(Date.now() / 1000);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Unbounded_600SemiBold,
    Unbounded_800ExtraBold,
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    useCrewStore.getState().hydrate();
    bootGuard();
  }, []);

  // Event-driven takeovers: an inbound dispatch order opens the dispatch
  // screen; the lone-worker machine opens the check-in prompt on schedule.
  useEffect(() => {
    let lastDispatchAt = 0;
    const unsub = useGuardStore.subscribe((s) => {
      if (s.dispatch && !s.dispatch.acknowledged && s.dispatch.atSec !== lastDispatchAt) {
        lastDispatchAt = s.dispatch.atSec;
        router.push('/dispatch');
      }
    });
    const tick = setInterval(() => {
      const st = useGuardStore.getState();
      if (!st.onDuty) return;
      const wasIdle = st.checkin.promptExpiresAtSec === null;
      if (st.checkinTick(nowSec()) === 'prompt' && wasIdle) router.push('/checkin');
    }, 1000);
    return () => {
      unsub();
      clearInterval(tick);
    };
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: g.bg }} />;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: g.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="shift" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sos" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="checkin" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="muster" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="dispatch" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
