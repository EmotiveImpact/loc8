// apps/guard/app/(tabs)/shift.tsx — Shift: who's on, team comms, lone-worker, end.
// Team comms is the engine's free-text fragmentation reskinned for the crew.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { UserCheck, Send, LogOut } from 'lucide-react-native';
import { useCrewStore, getMeshService, freshnessSec, STALE_SEC, haptics, MAX_MESSAGE_BYTES } from '@loc8/engine';
import { ops, fonts, tint } from '../../src/ui/opsTheme';
import { OpsBackground } from '../../src/ui/OpsBackground';
import { GuardHeader } from '../../src/ui/GuardHeader';
import { useGuardStore, badgeLabel } from '../../src/state/guardStore';
import { GUARD_TEAM, friendFloor, levelName } from '../../src/state/guardTeam';
import { useNowSec } from '../../src/hooks/useNowSec';

const CLOCKIN: Href = '/clockin' as Href;
const LONE: Href = '/lone' as Href;

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export default function Shift() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const now = useNowSec();
  const friends = useCrewStore((s) => s.friends);
  const activity = useCrewStore((s) => s.activityLog);
  const onDutySince = useGuardStore((s) => s.onDutySinceSec);
  const myBadge = useGuardStore((s) => s.badge);
  const myFloor = useCrewStore((s) => s.myFloor);
  const goOffDuty = useGuardStore((s) => s.goOffDuty);
  const [draft, setDraft] = useState('');

  const messages = activity.filter((e) => e.kind === 'message').slice(0, 6);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    getMeshService().sendCrewMessage(t);
    haptics.pingSent();
    setDraft('');
  };

  const endShift = () => {
    haptics.tap();
    goOffDuty();
    router.replace(CLOCKIN);
  };

  return (
    <KeyboardAvoidingView style={st.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <OpsBackground />
      <View style={{ paddingTop: insets.top + 8 }}>
        <GuardHeader title="Shift" />
      </View>
      <ScrollView contentContainerStyle={[st.content, { paddingBottom: insets.bottom + 96 }]} keyboardShouldPersistTaps="handled">
        {onDutySince != null && (
          <View style={st.onDuty}>
            <Text style={st.onDutyLabel}>ON DUTY</Text>
            <Text style={st.onDutyTime}>{fmtDuration(Math.max(0, now - onDutySince))}</Text>
          </View>
        )}

        <Pressable style={st.lone} onPress={() => { haptics.tap(); router.push(LONE); }}>
          <UserCheck size={20} color={ops.caution} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={st.loneTtl}>Lone-worker check-in</Text>
            <Text style={st.loneSub}>Solo patrol — timed safety prompt</Text>
          </View>
          <Text style={st.loneGo}>START</Text>
        </Pressable>

        <Text style={st.sectTtl}>TEAM · {GUARD_TEAM.length + 1} ON SHIFT</Text>
        <View style={st.roster}>
          <View style={st.tmem}>
            <View style={[st.av, { backgroundColor: ops.info }]}><Text style={st.avTxt}>{badgeLabel(myBadge)}</Text></View>
            <Text style={st.tn}>You</Text>
            <Text style={st.tz}>{levelName(myFloor)}</Text>
            <View style={[st.statusDot, { backgroundColor: ops.info }]} />
          </View>
          {GUARD_TEAM.map((m) => {
            const f = friends[m.id];
            const fresh = f ? freshnessSec(f, now) : null;
            const stale = fresh == null || fresh > STALE_SEC;
            const color = m.status === 'caution' ? ops.caution : ops.ok;
            const floor = friendFloor(f ?? { id: m.id });
            return (
              <View key={m.id} style={st.tmem}>
                <View style={[st.av, { backgroundColor: color }]}><Text style={st.avTxt}>{badgeLabel(m.badge)}</Text></View>
                <Text style={st.tn}>{m.name}</Text>
                <Text style={st.tz}>{levelName(floor)} · {m.zone}</Text>
                <View style={[st.statusDot, { backgroundColor: color, opacity: stale ? 0.35 : 1 }]} />
              </View>
            );
          })}
        </View>

        <Text style={st.sectTtl}>TEAM COMMS</Text>
        <View style={st.comms}>
          {messages.length === 0 && <Text style={st.noMsg}>No messages yet. Say something to the team.</Text>}
          {messages.map((m) => (
            <View key={m.id} style={st.msg}>
              <Text style={st.msgTxt}>{m.text}</Text>
            </View>
          ))}
        </View>

        <Pressable style={st.end} onPress={endShift}>
          <LogOut size={16} color={ops.muted} strokeWidth={2} />
          <Text style={st.endTxt}>End shift</Text>
        </Pressable>
      </ScrollView>

      <View style={[st.inputBar, { paddingBottom: insets.bottom + 78 }]}>
        <TextInput
          style={st.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message the team…"
          placeholderTextColor={ops.faint}
          maxLength={MAX_MESSAGE_BYTES}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Pressable style={st.sendBtn} onPress={send}>
          <Send size={18} color="#06120c" strokeWidth={2.4} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: ops.bg },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  onDuty: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    backgroundColor: tint(ops.ok, 0.1), borderWidth: 1, borderColor: tint(ops.ok, 0.25),
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  onDutyLabel: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1.5, color: ops.ok },
  onDutyTime: { fontFamily: fonts.mono, fontSize: 16, color: ops.ink },
  lone: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12,
    backgroundColor: tint(ops.caution, 0.1), borderWidth: 1, borderColor: tint(ops.caution, 0.3),
    borderRadius: 14, padding: 13,
  },
  loneTtl: { color: ops.ink, fontFamily: fonts.bodySemi, fontSize: 14 },
  loneSub: { color: ops.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  loneGo: { color: ops.caution, fontFamily: fonts.monoBold, fontSize: 11 },
  sectTtl: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1.5, color: ops.faint, marginTop: 20, marginBottom: 9 },
  roster: { gap: 6 },
  tmem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 11,
    backgroundColor: ops.panel2, borderWidth: 1, borderColor: ops.line,
  },
  av: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#06070d', fontFamily: fonts.displaySemi, fontSize: 11 },
  tn: { flex: 1, color: ops.ink, fontSize: 13, fontFamily: fonts.bodySemi },
  tz: { fontFamily: fonts.mono, fontSize: 10, color: ops.muted, marginRight: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  comms: { gap: 6 },
  noMsg: { color: ops.faint, fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic' },
  msg: { backgroundColor: ops.panel2, borderWidth: 1, borderColor: ops.line, borderRadius: 10, padding: 9 },
  msgTxt: { color: ops.ink, fontSize: 13, fontFamily: fonts.body },
  end: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22, paddingVertical: 12 },
  endTxt: { color: ops.muted, fontFamily: fonts.bodySemi, fontSize: 13 },
  inputBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingTop: 8, backgroundColor: 'rgba(6,7,13,0.9)',
    borderTopWidth: 1, borderTopColor: ops.line,
  },
  input: {
    flex: 1, backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, color: ops.ink, fontFamily: fonts.body, fontSize: 14,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: ops.ok, alignItems: 'center', justifyContent: 'center' },
});
