// src/ui/CrewSheet.tsx
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import {
  QUICK_REPLIES,
  colors,
  fonts,
  friendPositionFreshness,
  getHaversineDistance,
  getMeshService,
  haptics,
  useCrewStore,
} from '@loc8/engine';
import { useNowSec } from '../hooks/useNowSec';
import { Radio, Waypoints, ChevronRight } from 'lucide-react-native';

export function CrewSheet() {
  const friends = useCrewStore((s) => s.friends);
  const myLocation = useCrewStore((s) => s.myLocation);
  const meshNearby = useCrewStore((s) => s.meshNearby);
  const now = useNowSec();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const meshOn = meshNearby > 0;

  // The friend currently targeted by the send-chooser modal (null = closed).
  const [chooser, setChooser] = useState<{ id: number; name: string } | null>(null);

  const ping = (id: number, name: string) => setChooser({ id, name });

  const count = Object.keys(friends).length;

  return (
    <BlurView tint="dark" intensity={28} style={[st.sheet, { paddingBottom: insets.bottom + 76 }]}>
      <View style={st.grab} />
      <View style={[st.mesh, meshOn ? st.meshOn : st.meshOff]}>
        {meshOn
          ? <Radio size={13} color={colors.teal} strokeWidth={2} />
          : <Waypoints size={13} color={colors.textDim} strokeWidth={2} />}
        <Text style={[st.meshText, { color: meshOn ? colors.teal : colors.textDim }]}>
          MESH · {meshNearby} nearby
        </Text>
      </View>
      <Text style={st.h}>YOUR CREW · {count} members</Text>
      {Object.values(friends).map((f) => {
        const position = friendPositionFreshness(f, now);
        const dist = position.location && myLocation
          ? Math.round(getHaversineDistance(myLocation, position.location)) : null;
        const relayed = !!position.location && !position.ghost && !!f.relayVia;
        const sub = `${position.label}${dist === null ? '' : ` · ${position.isCurrent ? '' : 'last reported '}~${dist}m`}${relayed ? ` · via ${f.relayVia}` : ''}`;
        return (
          <View key={f.id} style={st.row}>
            <View style={[st.av, { backgroundColor: f.color }]}>
              <Text style={st.avText}>{f.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{f.name}</Text>
              <View style={st.subRow}>
                <Text style={st.sub}>{sub}</Text>
                {relayed && <Waypoints size={10} color={colors.teal} strokeWidth={2} />}
              </View>
            </View>
            <Pressable style={st.pingBtn} onPress={() => ping(f.id, f.name)}>
              <Text style={st.pingText}>Ping</Text>
            </Pressable>
            <Pressable disabled={!position.location} accessibilityState={{ disabled: !position.location }} style={[st.findBtn, !position.location && { opacity: 0.4 }]} onPress={() => { haptics.tap(); router.push(`/compass/${f.id}` as Href); }}>
              <Text style={st.findText}>Find</Text>
              <ChevronRight size={12} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>
        );
      })}

      <Modal
        visible={chooser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setChooser(null)}
      >
        <Pressable style={st.backdrop} onPress={() => setChooser(null)}>
          <Pressable style={st.chooser} onPress={() => {}}>
            <Text style={st.chooserTitle}>Send to {chooser?.name}</Text>
            <View style={st.options}>
              <Pressable
                style={st.option}
                onPress={() => {
                  if (chooser) { haptics.pingSent(); getMeshService().pingFriend(chooser.id, 'pingWhere'); }
                  setChooser(null);
                }}
              >
                <Text style={st.optionText}>Where are you?</Text>
              </Pressable>
              <Pressable
                style={st.option}
                onPress={() => {
                  if (chooser) { haptics.pingSent(); getMeshService().pingFriend(chooser.id, 'pingComeFind'); }
                  setChooser(null);
                }}
              >
                <Text style={st.optionText}>Come find me</Text>
              </Pressable>
              {QUICK_REPLIES.map((q) => (
                <Pressable
                  key={q.code}
                  style={st.option}
                  onPress={() => {
                    if (chooser) { haptics.pingSent(); getMeshService().sendQuickReply(chooser.id, q.code); }
                    setChooser(null);
                  }}
                >
                  <Text style={st.optionText}>{q.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={st.cancel} onPress={() => setChooser(null)}>
              <Text style={st.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </BlurView>
  );
}

const st = StyleSheet.create({
  sheet: {
    backgroundColor: colors.glass, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden',
    borderTopWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingTop: 12,
  },
  grab: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 10 },
  mesh: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, borderWidth: 1,
  },
  meshOn: { backgroundColor: 'rgba(75,227,192,0.12)', borderColor: 'rgba(75,227,192,0.25)' },
  meshOff: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.cardBorder },
  meshText: { fontSize: 11, fontWeight: '700' },
  h: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  av: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avText: { color: colors.bg, fontFamily: fonts.display, fontSize: 12 },
  name: { color: colors.text, fontSize: 14, fontFamily: fonts.bodySemi },
  sub: { color: colors.textDim, fontSize: 11, fontFamily: fonts.body },
  pingBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  pingText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  findBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.pink, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  findText: { color: '#fff', fontSize: 12, fontFamily: fonts.bodySemi },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  chooser: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: colors.cardBorder, padding: 20, paddingBottom: 36,
  },
  chooserTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bodyBold, marginBottom: 14, textAlign: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  option: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
    backgroundColor: colors.pink + '22', borderWidth: 1, borderColor: colors.pink + '55',
  },
  optionText: { color: colors.text, fontSize: 13, fontFamily: fonts.bodySemi },
  cancel: { marginTop: 18, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  cancelText: { color: colors.textDim, fontSize: 13, fontFamily: fonts.bodySemi },
});
