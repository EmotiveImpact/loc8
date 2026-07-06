// src/ui/ShareSheet.tsx
import { Modal, View, Text, Pressable, StyleSheet, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { encodePlusCode } from '../core/plusCodes';
import type { Coordinate } from '../core/types';
import { colors } from './theme';

interface Props {
  visible: boolean;
  title: string;                // e.g. "Maya's exact spot" / "Rally point"
  location: Coordinate | null;
  onClose(): void;
}

export function ShareSheet({ visible, title, location, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const code = location ? encodePlusCode(location.latitude, location.longitude) : '—';

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={st.wrap}>
        <View style={st.card}>
          <Text style={st.h}>{title}</Text>
          <Text style={st.sub}>Plus Code — works offline, free. Shout it or text it.</Text>
          <Text style={st.code}>{code}</Text>
          <Text style={st.hint}>≈ 14m square · plus.codes</Text>
          <Pressable style={st.btn} onPress={copy}>
            <Text style={st.btnT}>{copied ? '✓ Copied' : 'Copy Plus Code'}</Text>
          </Pressable>
          <Pressable
            style={st.btnGhost}
            onPress={() => Share.share({ message: `Find me at ${code} — shared from Loc8` })}
          >
            <Text style={st.btnGhostT}>Share…</Text>
          </Pressable>
          <Pressable style={st.btnGhost} onPress={onClose}><Text style={st.btnGhostT}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#12141f', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, gap: 10 },
  h: { color: colors.text, fontSize: 19, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 13 },
  code: {
    color: colors.teal, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: 1,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 18, marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  hint: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
  btn: { backgroundColor: colors.pink, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 6 },
  btnT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnGhost: { borderRadius: 14, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  btnGhostT: { color: colors.text, fontWeight: '700', fontSize: 14 },
});
