// src/ui/PrivacyModal.tsx
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useCrewStore, type PrivacyMode } from '../state/crewStore';
import { colors } from './theme';

const OPTIONS: Array<{ mode: PrivacyMode; title: string; desc: string }> = [
  { mode: 'live', title: 'Live (background)', desc: 'Broadcast even in your pocket. Radar stays true. Best experience.' },
  { mode: 'open', title: 'Only while app is open', desc: 'Battery-saver. Visible only with Loc8 on screen.' },
  { mode: 'invisible', title: 'Invisible / on-demand', desc: 'You disappear. Show up only when you share or answer a ping.' },
];

export function PrivacyModal({ visible, onClose }: { visible: boolean; onClose(): void }) {
  const privacyMode = useCrewStore((s) => s.privacyMode);
  const setPrivacy = useCrewStore((s) => s.setPrivacy);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={st.wrap}>
        <View style={st.card}>
          <Text style={st.h}>Who can see you?</Text>
          <Text style={st.sub}>Switch anytime. Go dark is one tap.</Text>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.mode}
              style={[st.opt, privacyMode === o.mode && st.optSel]}
              onPress={() => setPrivacy(o.mode)}
            >
              <View style={[st.dot, privacyMode === o.mode && st.dotSel]} />
              <View style={{ flex: 1 }}>
                <Text style={st.optT}>{o.title}</Text>
                <Text style={st.optD}>{o.desc}</Text>
              </View>
            </Pressable>
          ))}
          <Pressable style={st.done} onPress={onClose}><Text style={st.doneT}>Done</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#12141f', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, gap: 10 },
  h: { color: colors.text, fontSize: 19, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 13, marginBottom: 6 },
  opt: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder },
  optSel: { borderColor: colors.pink, backgroundColor: 'rgba(255,90,140,0.08)' },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', marginTop: 2 },
  dotSel: { borderColor: colors.pink, backgroundColor: colors.pink },
  optT: { color: colors.text, fontSize: 14, fontWeight: '700' },
  optD: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  done: { backgroundColor: colors.card, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: colors.cardBorder },
  doneT: { color: colors.text, fontWeight: '700' },
});
