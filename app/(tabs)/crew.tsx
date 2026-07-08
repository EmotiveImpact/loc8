// app/(tabs)/crew.tsx
import { View, Text, Pressable, StyleSheet, Modal, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useCrewStore } from '../../src/state/crewStore';
import { useNowSec } from '../../src/hooks/useNowSec';
import { colors, fonts } from '../../src/ui/theme';
import { CrewSheet } from '../../src/ui/CrewSheet';
import { Link2, QrCode, Plus } from 'lucide-react-native';

export default function CrewScreen() {
  const now = useNowSec();
  const sessionEndsAtSec = useCrewStore((s) => s.sessionEndsAtSec);
  const startSession = useCrewStore((s) => s.startSession);
  const extendSession = useCrewStore((s) => s.extendSession);
  const endSession = useCrewStore((s) => s.endSession);
  const [qrVisible, setQrVisible] = useState(false);

  const remaining = sessionEndsAtSec ? Math.max(0, sessionEndsAtSec - now) : 0;
  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);

  return (
    <ScrollView style={st.wrap} contentContainerStyle={st.content}>
      <Text style={st.h1}>Crew &amp; session</Text>

      <View style={st.card}>
        <Text style={st.cardH}>SESSION</Text>
        {sessionEndsAtSec ? (
          <>
            <Text style={st.big}>{hh}h {mm}m left</Text>
            <Text style={st.p}>Auto-expires — you'll stop broadcasting automatically.</Text>
            <View style={st.row}>
              <Pressable style={st.btnGhost} onPress={() => extendSession(2)}>
                <Text style={st.btnGhostText}>+2h</Text>
              </Pressable>
              <Pressable style={[st.btnGhost, { borderColor: colors.danger }]} onPress={endSession}>
                <Text style={[st.btnGhostText, { color: colors.danger }]}>End now</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={st.p}>Not broadcasting. Start a session to become findable.</Text>
            <View style={st.row}>
              {[4, 6, 12].map((h) => (
                <Pressable key={h} style={st.btn} onPress={() => startSession(h)}>
                  <Text style={st.btnText}>{h}h</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={st.card}>
        <Text style={st.cardH}>ADD FRIENDS</Text>
        <Pressable style={st.btn} onPress={() => setQrVisible(true)}>
          <Plus size={16} color="#fff" strokeWidth={2.5} />
          <Text style={st.btnText}>Add friend via QR</Text>
        </Pressable>
        <Pressable
          style={st.btnGhost}
          onPress={() => Alert.alert('Mocked in v1', 'Crew invite links ship with the real mesh (v2).')}
        >
          <Link2 size={16} color={colors.text} strokeWidth={2} />
          <Text style={st.btnGhostText}>Create crew link</Text>
        </Pressable>
      </View>

      <CrewSheet />

      <Modal visible={qrVisible} transparent animationType="slide">
        <View style={st.modalWrap}>
          <View style={st.modalCard}>
            <Text style={st.h1}>Add a friend nearby</Text>
            <Text style={st.p}>Have them scan this — pairs over Bluetooth, no internet.</Text>
            <View style={st.qr}><QrCode size={96} color="#12141f" strokeWidth={1.5} /></View>
            <Text style={[st.p, { fontSize: 11 }]}>Mocked in v1 — real BLE pairing lands in v2.</Text>
            <Pressable style={st.btn} onPress={() => setQrVisible(false)}>
              <Text style={st.btnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 60, paddingBottom: 130, gap: 14 },
  h1: { color: colors.text, fontSize: 24, fontFamily: fonts.display },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.cardBorder },
  cardH: { color: colors.textDim, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  big: { color: colors.text, fontSize: 28, fontFamily: fonts.display },
  p: { color: colors.textDim, fontSize: 13, lineHeight: 19, fontFamily: fonts.body },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flexDirection: 'row', gap: 8, backgroundColor: colors.pink, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 },
  btnGhost: { flexDirection: 'row', gap: 8, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  btnGhostText: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#12141f', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 24, gap: 12, alignItems: 'center',
  },
  qr: {
    width: 170, height: 170, borderRadius: 16, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
});
