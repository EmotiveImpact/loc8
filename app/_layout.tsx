// app/_layout.tsx
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useFonts, Unbounded_600SemiBold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import { Sora_300Light, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useCrewStore, parseCrewDeepLink, resolveNotificationNav } from '@loc8/engine';
import { colors, fonts } from '@loc8/engine';

// `/onboarding` (app/onboarding.tsx) is created in the next task, so the
// generated typed-routes union does not include it yet. Reference it through
// the documented `Href` escape hatch so this layout type-checks standalone and
// keeps working once the route regenerates into the union.
const ONBOARDING: Href = '/onboarding' as Href;

export default function RootLayout() {
  const profile = useCrewStore((s) => s.profile);
  const hydrated = useCrewStore((s) => s.hydrated);
  const hydrate = useCrewStore((s) => s.hydrate);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Unbounded_600SemiBold, Unbounded_800ExtraBold,
    Sora_300Light, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold,
    SpaceMono_400Regular, SpaceMono_700Bold,
  });

  // Load the persisted profile before deciding onboarding-vs-home (no flash).
  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (!hydrated) return; // wait for AsyncStorage — the id may already exist
    const inOnboarding = (segments[0] as string) === 'onboarding';
    if (!profile && !inOnboarding) router.replace(ONBOARDING);
    if (profile && inOnboarding) router.replace('/');
  }, [hydrated, profile, segments]);

  // Notification taps → deep-link. `seenNotifIds` dedupes so the warm-tap listener
  // and the cold-start handler below never both navigate for the same tap.
  const seenNotifIds = useRef<Set<string>>(new Set());

  // Warm tap: app already running when the notification is tapped.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const url = resolveNotificationNav(resp, seenNotifIds.current);
      if (url) router.push(url as never);
    });
    return () => sub.remove();
  }, []);

  // Cold start: the app was LAUNCHED by tapping a notification. The live listener
  // above never fires for that tap (it happened before the listener existed), so
  // route it once from the last-response hook (SDK 57). undefined → not resolved
  // yet; null → no response; dedupe via the shared seen-set.
  const lastNotifResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const url = resolveNotificationNav(lastNotifResponse, seenNotifIds.current);
    if (url) router.push(url as never);
  }, [lastNotifResponse]);

  // Deep link: loc8://crew/<CODE> — join the crew, then route to the Crew tab.
  // Wrapped so a malformed link (bad %-encoding, etc.) can never crash the app.
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      try {
        const code = parseCrewDeepLink(url);
        if (!code) return;
        useCrewStore.getState().joinCrew(code);
        router.push('/(tabs)/crew' as Href);
      } catch {
        // A bad deep link must never take down the root layout.
      }
    };
    Linking.getInitialURL().then(handleUrl).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null; // brief; native splash covers it

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="compass/[id]" />
        <Stack.Screen name="rally" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Settings',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: fonts.displaySemi },
          }}
        />
      </Stack>
    </>
  );
}
