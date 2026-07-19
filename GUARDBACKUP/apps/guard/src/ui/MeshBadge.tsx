// apps/guard/src/ui/MeshBadge.tsx — the "◈ MESH · OFFLINE-READY" pill.
// Green when peers are in range, amber when the mesh is up but you're alone.
import { View, Text, StyleSheet } from 'react-native';
import { useCrewStore } from '@loc8/engine';
import { ops, fonts, tint } from './opsTheme';

export function MeshBadge() {
  const nearby = useCrewStore((s) => s.meshNearby);
  const color = nearby > 0 ? ops.ok : ops.caution;
  const label = nearby > 0 ? `MESH · ${nearby} IN RANGE` : 'MESH · OFFLINE-READY';
  return (
    <View style={[st.pill, { borderColor: tint(color, 0.35), backgroundColor: tint(color, 0.12) }]}>
      <Text style={[st.txt, { color }]}>◈ {label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, borderWidth: 1 },
  txt: { fontFamily: fonts.monoBold, fontSize: 9, letterSpacing: 0.5 },
});
