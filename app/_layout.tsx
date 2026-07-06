// app/_layout.tsx
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useCrewStore } from '../src/state/crewStore';
import { colors } from '../src/ui/theme';

// `/onboarding` (app/onboarding.tsx) is created in the next task, so the
// generated typed-routes union does not include it yet. Reference it through
// the documented `Href` escape hatch so this layout type-checks standalone and
// keeps working once the route regenerates into the union.
const ONBOARDING: Href = '/onboarding' as Href;

export default function RootLayout() {
  const profile = useCrewStore((s) => s.profile);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inOnboarding = (segments[0] as string) === 'onboarding';
    if (!profile && !inOnboarding) router.replace(ONBOARDING);
    if (profile && inOnboarding) router.replace('/');
  }, [profile, segments]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const url = resp.notification.request.content.data?.url as string | undefined;
      if (url) router.push(url as never);
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}
