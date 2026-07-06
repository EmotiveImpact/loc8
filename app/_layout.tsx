// app/_layout.tsx
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
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
