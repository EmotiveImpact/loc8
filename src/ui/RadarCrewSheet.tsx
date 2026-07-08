// src/ui/RadarCrewSheet.tsx
// The radar's "act on people" surface: a peek bar above the tab bar that opens
// the crew roster (Ping / Find) as a slide-up sheet. Management (code, QR,
// sessions) lives on the Crew tab; this is where you act on who's here.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrewStore, freshnessSec, GHOST_SEC } from '../state/crewStore';
import { useNowSec } from '../hooks/useNowSec';
import { CrewSheet } from './CrewSheet';
import { colors, fonts } from './theme';
import { ChevronUp, Users } from 'lucide-react-native';

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
      <Pressable style={[st.peek, { bottom: insets.bottom + 82 }]} onPress={() => setOpen(true)}>
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

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={st.modalRoot}>
          <Pressable style={st.scrim} onPress={() => setOpen(false)} />
          <View style={{ paddingBottom: insets.bottom }}>
            <CrewSheet />
          </View>
        </View>
      </Modal>
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
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
});
