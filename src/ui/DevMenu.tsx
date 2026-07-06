// src/ui/DevMenu.tsx
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { getTransport } from '../services/appServices';
import { useCrewStore } from '../state/crewStore';
import { colors } from './theme';

const ACTIONS: Array<{ label: string; run(): void }> = [
  { label: '🌑 Rae goes dark', run: () => getTransport().scenario('goDark', 104) },
  { label: '☀️ Rae comes back', run: () => getTransport().scenario('return', 104) },
  { label: '🏃 Maya approaches you (→ 🎉)', run: () => getTransport().scenario('approach', 101) },
  { label: '🚶 Maya wanders off again', run: () => getTransport().scenario('return', 101) },
  { label: '🪫 My battery low (beacon mode)', run: () => useCrewStore.getState().setBeacon(true) },
  { label: '🔋 Battery ok', run: () => useCrewStore.getState().setBeacon(false) },
];

export function DevMenu({ visible, onClose }: { visible: boolean; onClose(): void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={st.wrap}>
        <View style={st.card}>
          <Text style={st.h}>🛠 Demo scenarios</Text>
          {ACTIONS.map((a) => (
            <Pressable key={a.label} style={st.row} onPress={() => { a.run(); onClose(); }}>
              <Text style={st.rowT}>{a.label}</Text>
            </Pressable>
          ))}
          <Pressable style={st.row} onPress={onClose}><Text style={[st.rowT, { color: colors.textDim }]}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 30 },
  card: { backgroundColor: '#12141f', borderRadius: 20, padding: 18, gap: 4, borderWidth: 1, borderColor: colors.cardBorder },
  h: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  row: { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder },
  rowT: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
