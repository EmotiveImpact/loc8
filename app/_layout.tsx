// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useCrewStore } from '../src/state/crewStore';
import { colors } from '../src/ui/theme';

export default function RootLayout() {
  const profile = useCrewStore((s) => s.profile);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';
    if (!profile && !inOnboarding) router.replace('/onboarding');
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
