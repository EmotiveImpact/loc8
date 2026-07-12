// app/(tabs)/activity.tsx — the Activity feed (5th tab) + crew messenger compose bar.
import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrewStore, type ActivityKind } from '@loc8/engine';
import { useNowSec } from '../../src/hooks/useNowSec';
import { getMeshService } from '@loc8/engine';
import { haptics } from '@loc8/engine';
import { AuroraBackground } from '../../src/ui/AuroraBackground';
import { colors, fonts } from '@loc8/engine';
import { Bell, MessageCircle, MessageSquare, Flag, PartyPopper, Moon, Clock, ChevronRight, Send, type LucideIcon } from 'lucide-react-native';

const KIND: Record<ActivityKind, { Icon: LucideIcon; color: string }> = {
  ping: { Icon: Bell, color: colors.coral },
  reply: { Icon: MessageCircle, color: colors.teal },
  message: { Icon: MessageSquare, color: colors.blue },
  rally: { Icon: Flag, color: colors.gold },
  found: { Icon: PartyPopper, color: colors.teal },
  dark: { Icon: Moon, color: colors.faint },
  session: { Icon: Clock, color: colors.blue },
};

function relTime(atSec: number, now: number): string {
  const d = Math.max(0, now - atSec);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const log = useCrewStore((s) => s.activityLog);
  const hasCrew = useCrewStore((s) => s.crew !== null);
  const now = useNowSec();
  const [draft, setDraft] = useState('');

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    getMeshService().sendCrewMessage(text);
    haptics.tap();
    setDraft('');
  };

  // Keep the feed clear of the compose bar (bar ~54 + tab bar ~62 + insets).
  const feedPad = 130 + insets.bottom;
  // Lift the compose bar above the floating tab bar.
  const barBottom = 62 + Math.max(insets.bottom, 10) + 6;

  return (
    <View style={st.wrap}>
      <AuroraBackground />
      <Text style={st.h1}>Activity</Text>
      {log.length === 0 ? (
        <View style={st.empty}>
          <Bell size={34} color={colors.faint} strokeWidth={1.6} />
          <Text style={st.emptyText}>
            No activity yet — pings, rally alerts, messages and found moments will show here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[st.list, { paddingBottom: feedPad }]} keyboardShouldPersistTaps="handled">
          {log.map((e) => {
            const meta = KIND[e.kind];
            const tappable = (e.kind === 'ping' || e.kind === 'reply' || e.kind === 'message') && e.friendId != null;
            return (
              <Pressable
                key={e.id}
                style={st.row}
                disabled={!tappable}
                onPress={() => tappable && router.push(`/compass/${e.friendId}` as Href)}
              >
                <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
                <View style={[st.iconWrap, { backgroundColor: meta.color + '22' }]}>
                  <meta.Icon size={18} color={meta.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.rowText}>{e.text}</Text>
                  <Text style={st.rowTime}>{relTime(e.atSec, now)}</Text>
                </View>
                {tappable && <ChevronRight size={16} color={colors.faint} strokeWidth={2} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[st.composeHost, { bottom: barBottom }]}
        pointerEvents="box-none"
      >
        <View style={st.compose}>
          <BlurView tint="dark" intensity={30} style={StyleSheet.absoluteFill} />
          <TextInput
            style={st.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={hasCrew ? 'Message your crew…' : 'Message nearby…'}
            placeholderTextColor={colors.faint}
            maxLength={140}
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <Pressable
            style={[st.sendBtn, { opacity: draft.trim() ? 1 : 0.4 }]}
            disabled={!draft.trim()}
            onPress={send}
          >
            <Send size={18} color={colors.bg} strokeWidth={2.4} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 60, paddingHorizontal: 20 },
  h1: { color: colors.text, fontSize: 24, fontFamily: fonts.display, marginBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 120, paddingHorizontal: 20 },
  emptyText: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21, fontFamily: fonts.body },
  list: { gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.glass, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
  },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { color: colors.text, fontSize: 14, fontFamily: fonts.bodySemi },
  rowTime: { color: colors.textDim, fontSize: 11, marginTop: 2, fontFamily: fonts.body },
  composeHost: { position: 'absolute', left: 20, right: 20 },
  compose: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(16,12,28,0.55)', borderRadius: 22,
    borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
    paddingLeft: 16, paddingRight: 6, paddingVertical: 6,
  },
  input: {
    flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.body,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4, maxHeight: 90,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.coral,
    alignItems: 'center', justifyContent: 'center',
  },
});
