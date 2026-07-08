// app/(tabs)/me.tsx — profile + privacy.
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCrewStore, type PrivacyMode } from '../../src/state/crewStore';
import { colors, gradients, fonts } from '../../src/ui/theme';
import { MoonStar, Settings, Shield, ChevronRight, type LucideIcon } from 'lucide-react-native';

const MODES: Array<{ mode: PrivacyMode; label: string }> = [
  { mode: 'live', label: 'Live' },
  { mode: 'open', label: 'Only open' },
  { mode: 'invisible', label: 'Invisible' },
];

const MODE_DESC: Record<PrivacyMode, string> = {
  live: 'Broadcast even in your pocket. Radar stays true. Best experience.',
  open: 'Battery-saver. Visible only with Loc8 on screen.',
  invisible: 'You disappear. Show up only when you share or answer a ping.',
};

export default function MeScreen() {
  const profile = useCrewStore((s) => s.profile);
  const privacyMode = useCrewStore((s) => s.privacyMode);
  const setPrivacy = useCrewStore((s) => s.setPrivacy);

  const name = profile?.name ?? 'You';
  const initial = name.trim()[0]?.toUpperCase() ?? 'Y';
  const handle = `@${name.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <ScrollView style={st.wrap} contentContainerStyle={st.content}>
      <Text style={st.h1}>Me</Text>

      <View style={st.profile}>
        <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.avatar}>
          <Text style={st.avatarText}>{initial}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={st.name}>{name}</Text>
          <Text style={st.handle}>{handle}</Text>
        </View>
      </View>

      <View style={st.card}>
        <Text style={st.cardH}>WHO CAN SEE YOU</Text>
        <View style={st.segment}>
          {MODES.map((m) => {
            const on = privacyMode === m.mode;
            return (
              <Pressable
                key={m.mode}
                style={[st.segItem, on && st.segItemOn]}
                onPress={() => setPrivacy(m.mode)}
              >
                <Text style={[st.segText, on && st.segTextOn]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={st.p}>{MODE_DESC[privacyMode]}</Text>
      </View>

      <Pressable
        style={[st.quickRow, privacyMode === 'invisible' && st.quickRowOn]}
        onPress={() => setPrivacy('invisible')}
      >
        <MoonStar size={18} color={privacyMode === 'invisible' ? colors.gold : colors.text} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={st.quickTitle}>Go dark</Text>
          <Text style={st.quickSub}>
            {privacyMode === 'invisible' ? "You're invisible right now." : 'Disappear in one tap.'}
          </Text>
        </View>
      </Pressable>

      <View style={st.card}>
        {([
          { Icon: Settings, label: 'Settings' },
          { Icon: Shield, label: 'Privacy' },
        ] as Array<{ Icon: LucideIcon; label: string }>).map((r) => (
          <Pressable key={r.label} style={st.linkRow}>
            <r.Icon size={18} color={colors.textDim} strokeWidth={2} />
            <Text style={st.linkText}>{r.label}</Text>
            <ChevronRight size={16} color={colors.faint} strokeWidth={2} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 60, paddingBottom: 130, gap: 16 },
  h1: { color: colors.text, fontSize: 24, fontFamily: fonts.display },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontFamily: fonts.display },
  name: { color: colors.text, fontSize: 20, fontFamily: fonts.displaySemi },
  handle: { color: colors.textDim, fontSize: 14, marginTop: 2, fontFamily: fonts.body },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.cardBorder },
  cardH: { color: colors.textDim, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  segment: { flexDirection: 'row', backgroundColor: colors.glass, borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segItemOn: { backgroundColor: colors.coral },
  segText: { color: colors.textDim, fontSize: 13, fontFamily: fonts.bodySemi },
  segTextOn: { color: '#fff' },
  p: { color: colors.textDim, fontSize: 13, lineHeight: 19, fontFamily: fonts.body },
  quickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  quickRowOn: { borderColor: colors.gold },
  quickTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bodySemi },
  quickSub: { color: colors.textDim, fontSize: 12, marginTop: 2, fontFamily: fonts.body },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  linkText: { color: colors.text, fontSize: 15, flex: 1, fontFamily: fonts.bodyMed },
});
