// src/ui/RadarCrewSheet.tsx
// The radar's "act on people" surface: a peek bar above the tab bar that opens
// the crew roster (Ping / Find) as a slide-up sheet. Management (code, QR,
// sessions) lives on the Crew tab; this is where you act on who's here.
//
// The expanded sheet is an in-screen overlay (NOT a modal) so the tab bar stays
// visible and tappable — the frosted nav floats over the sheet (Find My pattern).
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrewStore, freshnessSec, GHOST_SEC, haptics, colors, fonts } from '@loc8/engine';
import { useNowSec } from '../hooks/useNowSec';
import { CrewSheet } from './CrewSheet';
import { ChevronUp, Users } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RadarCrewSheet() {
  const [open, setOpen] = useState(false);
  const friends = useCrewStore((s) => s.friends);
  const meshNearby = useCrewStore((s) => s.meshNearby);
  const now = useNowSec();
  const insets = useSafeAreaInsets();

  const count = Object.keys(friends).length;
  const online = Object.values(friends).filter(
    (f) => f.lastPacket && (freshnessSec(f, now) ?? Infinity) <= GHOST_SEC,
  ).length;

  if (count === 0) return null; // no crew yet — nothing to act on

  return (
    <>
      {/* collapsed peek — sits just above the floating tab bar */}
      {!open && (
        <Pressable style={[st.peek, { bottom: insets.bottom + 82 }]} onPress={() => { haptics.tap(); setOpen(true); }}>
          <BlurView tint="dark" intensity={30} style={st.peekBlur}>
            <View style={st.grab} />
            <View style={st.peekRow}>
              <Users size={16} color={colors.signal} strokeWidth={2} />
              <Text style={st.peekText}>Your crew · {online} online</Text>
              {meshNearby > 0 && <Text style={st.mesh}>· mesh {meshNearby}</Text>}
              <View style={{ flex: 1 }} />
              <ChevronUp size={18} color={colors.faint} strokeWidth={2.5} />
            </View>
          </BlurView>
        </Pressable>
      )}

      {/* expanded roster — dims only the radar; the tab bar floats on top and stays live */}
      {open && (
        <>
          <AnimatedPressable
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(160)}
            style={st.scrim}
            onPress={() => setOpen(false)}
          />
          <Animated.View
            entering={SlideInDown.duration(240)}
            exiting={SlideOutDown.duration(200)}
            style={st.sheetHost}
          >
            <CrewSheet />
          </Animated.View>
        </>
      )}
    </>
  );
}

const st = StyleSheet.create({
  peek: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.line,
  },
  peekBlur: { paddingTop: 8, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: colors.glass },
  grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 8 },
  peekRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  peekText: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 13 },
  mesh: { color: colors.signal, fontFamily: fonts.bodySemi, fontSize: 12 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetHost: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
