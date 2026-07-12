// src/ui/DevMenu.tsx
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Moon, Sun, PersonStanding, Footprints, MapPin, Megaphone, BatteryLow, BatteryFull, Wrench, type LucideIcon } from 'lucide-react-native';
import { getSimTransport } from '@loc8/engine';
import { useCrewStore } from '@loc8/engine';
import { colors } from '@loc8/engine';

// Sim-only demo scenarios: on the real BLE mesh (EXPO_PUBLIC_TRANSPORT=ble)
// getSimTransport() is null and these actions no-op.
const ACTIONS: Array<{ Icon: LucideIcon; label: string; run(): void }> = [
  { Icon: Moon, label: 'Rae goes dark', run: () => getSimTransport()?.scenario('goDark', 104) },
  { Icon: Sun, label: 'Rae comes back', run: () => getSimTransport()?.scenario('return', 104) },
  { Icon: PersonStanding, label: 'Maya approaches you', run: () => getSimTransport()?.scenario('approach', 101) },
  { Icon: Footprints, label: 'Maya wanders off again', run: () => getSimTransport()?.scenario('return', 101) },
  { Icon: MapPin, label: 'Maya asks where you are', run: () => getSimTransport()?.simulateIncomingPing(101, 'pingWhere') },
  { Icon: Megaphone, label: 'Jules: come find me', run: () => getSimTransport()?.simulateIncomingPing(102, 'pingComeFind') },
  { Icon: BatteryLow, label: 'My battery low (beacon mode)', run: () => useCrewStore.getState().setBeacon(true) },
  { Icon: BatteryFull, label: 'Battery ok', run: () => useCrewStore.getState().setBeacon(false) },
];

export function DevMenu({ visible, onClose }: { visible: boolean; onClose(): void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={st.wrap}>
        <View style={st.card}>
          <View style={st.hRow}>
            <Wrench size={16} color={colors.text} strokeWidth={2} />
            <Text style={st.h}>Demo scenarios</Text>
          </View>
          {ACTIONS.map((a) => (
            <Pressable key={a.label} style={st.row} onPress={() => { a.run(); onClose(); }}>
              <a.Icon size={16} color={colors.text} strokeWidth={2} />
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
  hRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  h: { color: colors.text, fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder },
  rowT: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
