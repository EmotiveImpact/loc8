import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useMeshDebugStore } from '@loc8/engine';
import { ChevronDown, TriangleAlert } from 'lucide-react-native';
import { colors } from '@loc8/engine';

/**
 * Field-test HUD for the BLE mesh — only rendered when EXPO_PUBLIC_TRANSPORT === 'ble'.
 * Turns "it's not working" into concrete numbers (sent / received / peers / last error)
 * so a two-phone test is debuggable at a glance. Tap to collapse to a dot.
 */
export function MeshDebugOverlay() {
  if (process.env.EXPO_PUBLIC_TRANSPORT !== 'ble') return null;
  return <Hud />;
}

function Hud() {
  const s = useMeshDebugStore();
  const [open, setOpen] = useState(true);
  const [, tick] = useState(0);

  // re-render once a second so "last rx" age counts up
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const rxAgo = s.lastRxSec == null ? '—' : `${Math.max(0, Math.floor(Date.now() / 1000) - s.lastRxSec)}s`;
  const health = s.connected ? (s.received > 0 ? colors.teal : colors.yellow) : colors.danger;

  if (!open) {
    return (
      <Pressable style={[st.dot, { backgroundColor: health }]} onPress={() => setOpen(true)}>
        <Text style={st.dotText}>BLE</Text>
      </Pressable>
    );
  }

  return (
    <View style={st.panel}>
      <Pressable style={st.header} onPress={() => setOpen(false)}>
        <View style={[st.led, { backgroundColor: health }]} />
        <Text style={st.title}>BLE MESH</Text>
        {s.degraded && <Text style={st.degraded}>SCAN-ONLY</Text>}
        <ChevronDown size={12} color={colors.textDim} strokeWidth={2} />
      </Pressable>
      <Row label="peers" value={`${s.nearbyCount}${s.connected ? '' : ' (down)'}`} />
      <Row label="sent" value={String(s.sent)} />
      <Row label="recv" value={String(s.received)} good={s.received > 0} />
      <Row label="dropped" value={String(s.dropped)} bad={s.dropped > 0} />
      <Row label="last rx" value={rxAgo} />
      {s.lastError && (
        <View style={st.errRow}>
          <TriangleAlert size={9} color={colors.danger} strokeWidth={2} />
          <Text style={st.err} numberOfLines={3}>{s.lastError}</Text>
        </View>
      )}
      <Pressable style={st.resetBtn} onPress={() => useMeshDebugStore.getState().reset()}>
        <Text style={st.resetText}>reset counters</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <View style={st.row}>
      <Text style={st.rowLabel}>{label}</Text>
      <Text style={[st.rowValue, good && { color: colors.teal }, bad && { color: colors.danger }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  panel: {
    position: 'absolute', left: 12, bottom: 90, zIndex: 100, width: 168,
    backgroundColor: 'rgba(8,10,18,0.92)', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  led: { width: 8, height: 8, borderRadius: 4 },
  title: { color: colors.text, fontSize: 11, fontWeight: '800', letterSpacing: 1, flex: 1 },
  degraded: { color: colors.yellow, fontSize: 8, fontWeight: '700' },
  errRow: { flexDirection: 'row', gap: 4, marginTop: 6, alignItems: 'flex-start' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rowLabel: { color: colors.textDim, fontSize: 11 },
  rowValue: { color: colors.text, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  err: { color: colors.danger, fontSize: 9, lineHeight: 12, flex: 1 },
  resetBtn: { marginTop: 8, alignItems: 'center' },
  resetText: { color: colors.textDim, fontSize: 9, textDecorationLine: 'underline' },
  dot: {
    position: 'absolute', left: 12, bottom: 90, zIndex: 100,
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  dotText: { color: '#0a0b12', fontSize: 9, fontWeight: '800' },
});
