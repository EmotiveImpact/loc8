// apps/guard/src/ui/MeshBadge.tsx — the "◈ MESH · OFFLINE-READY" pill.
// Green when peers are in range, amber when the mesh is up but you're alone.
//
// COVERT DURESS: a long (1.2s) press on this badge sends DURESS_CODE on an
// ordinary-looking quickReply frame. Nothing changes on screen — the only
// confirmation is one subtle tap in the pocket. To anyone watching the guard
// (or the traffic) it's indistinguishable from idly touching the status pill;
// only the control room decodes its meaning. Trained gesture, by design.
import { Pressable, Text, StyleSheet } from 'react-native';
import { useCrewStore, getMeshService, haptics, DURESS_CODE } from '@loc8/engine';
import { ops, fonts, tint } from './opsTheme';

export function MeshBadge() {
  const nearby = useCrewStore((s) => s.meshNearby);
  const color = nearby > 0 ? ops.ok : ops.caution;
  const label = nearby > 0 ? `MESH · ${nearby} IN RANGE` : 'MESH · OFFLINE-READY';
  return (
    <Pressable
      accessibilityLabel="Mesh status"
      delayLongPress={1200}
      onLongPress={() => {
        getMeshService().sendQuickReply(0, DURESS_CODE); // 0 = broadcast; Command decodes
        haptics.tap(); // the only acknowledgment there will ever be
      }}
      style={[st.pill, { borderColor: tint(color, 0.35), backgroundColor: tint(color, 0.12) }]}
    >
      <Text style={[st.txt, { color }]}>◈ {label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, borderWidth: 1 },
  txt: { fontFamily: fonts.monoBold, fontSize: 9, letterSpacing: 0.5 },
});
