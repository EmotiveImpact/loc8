// app/(tabs)/me.tsx — profile + privacy.
import { View, Text, Pressable, StyleSheet, ScrollView, Image, TextInput, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useCrewStore, type PrivacyMode } from '../../src/state/crewStore';
import { haptics } from '../../src/services/haptics';
import { AuroraBackground } from '../../src/ui/AuroraBackground';
import { colors, gradients, fonts } from '../../src/ui/theme';
import { MoonStar, Settings, Shield, ChevronRight, Pencil, Camera, X, type LucideIcon } from 'lucide-react-native';

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

/** Accent palette shown as selectable swatches in edit mode. */
const ACCENTS = [colors.rose, colors.coral, colors.signal, colors.signal2, colors.gold];

/** Map an accent colour to a 2-stop gradient for the initial avatar. */
function accentGradient(c: string): [string, string] {
  switch (c) {
    case colors.rose: return [colors.rose, colors.coral];
    case colors.coral: return [colors.coral, colors.amber];
    case colors.signal: return [colors.signal, '#39c9a5'];
    case colors.signal2: return [colors.signal2, '#5a78e0'];
    case colors.gold: return [colors.gold, '#ff9a3c'];
    default: return [gradients.sunset[0], gradients.sunset[2]];
  }
}

export default function MeScreen() {
  const router = useRouter();
  const profile = useCrewStore((s) => s.profile);
  const privacyMode = useCrewStore((s) => s.privacyMode);
  const setPrivacy = useCrewStore((s) => s.setPrivacy);
  const updateProfile = useCrewStore((s) => s.updateProfile);

  const name = profile?.name ?? 'You';
  const initial = name.trim()[0]?.toUpperCase() ?? 'Y';
  const handle = `@${name.toLowerCase().replace(/\s+/g, '')}`;
  const accent = profile?.color ?? gradients.sunset[0];

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftColor, setDraftColor] = useState(accent);
  const [draftAvatar, setDraftAvatar] = useState<string | undefined>(profile?.avatarUri);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const openEdit = () => {
    setDraftName(profile?.name ?? 'You');
    setDraftColor(profile?.color ?? gradients.sunset[0]);
    setDraftAvatar(profile?.avatarUri);
    setEditing(true);
  };

  const saveEdit = () => {
    updateProfile({ name: draftName.trim() || 'You', color: draftColor, avatarUri: draftAvatar });
    haptics.success();
    setEditing(false);
  };

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photos needed', 'Allow photo access to set a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        haptics.tap();
        setDraftAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Could not open photos', 'Something went wrong opening your photo library.');
    }
  };

  const previewInitial = draftName.trim()[0]?.toUpperCase() ?? initial;

  return (
    <View style={st.root}>
      <AuroraBackground />
      <ScrollView style={st.wrap} contentContainerStyle={st.content}>
      <Text style={st.h1}>Me</Text>

      <Pressable style={st.profile} onPress={openEdit}>
        {profile?.avatarUri ? (
          <Image source={{ uri: profile.avatarUri }} style={st.avatar} />
        ) : (
          <LinearGradient colors={accentGradient(accent)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.avatar}>
            <Text style={st.avatarText}>{initial}</Text>
          </LinearGradient>
        )}
        <View style={{ flex: 1 }}>
          <Text style={st.name}>{name}</Text>
          <Text style={st.handle}>{handle}</Text>
        </View>
        <View style={st.editBadge}>
          <Pencil size={16} color={colors.text} strokeWidth={2} />
        </View>
      </Pressable>

      <View style={st.card}>
        <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
        <Text style={st.cardH}>WHO CAN SEE YOU</Text>
        <View style={st.segment}>
          {MODES.map((m) => {
            const on = privacyMode === m.mode;
            return (
              <Pressable
                key={m.mode}
                style={[st.segItem, on && st.segItemOn]}
                onPress={() => { haptics.select(); setPrivacy(m.mode); }}
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
        onPress={() => { haptics.warning(); setPrivacy('invisible'); }}
      >
        <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
        <MoonStar size={18} color={privacyMode === 'invisible' ? colors.gold : colors.text} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={st.quickTitle}>Go dark</Text>
          <Text style={st.quickSub}>
            {privacyMode === 'invisible' ? "You're invisible right now." : 'Disappear in one tap.'}
          </Text>
        </View>
      </Pressable>

      <View style={st.card}>
        <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
        {([
          { Icon: Settings, label: 'Settings', onPress: () => router.push('/settings') },
          { Icon: Shield, label: 'Privacy', onPress: () => setPrivacyOpen(true) },
        ] as Array<{ Icon: LucideIcon; label: string; onPress: () => void }>).map((r) => (
          <Pressable key={r.label} style={st.linkRow} onPress={r.onPress}>
            <r.Icon size={18} color={colors.textDim} strokeWidth={2} />
            <Text style={st.linkText}>{r.label}</Text>
            <ChevronRight size={16} color={colors.faint} strokeWidth={2} />
          </Pressable>
        ))}
      </View>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal visible={editing} animationType="slide" transparent onRequestClose={() => setEditing(false)}>
        <View style={st.modalRoot}>
          <View style={st.sheet}>
            <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />
            <View style={st.sheetHead}>
              <Text style={st.sheetTitle}>Edit profile</Text>
              <Pressable onPress={() => setEditing(false)} hitSlop={10}>
                <X size={22} color={colors.textDim} strokeWidth={2} />
              </Pressable>
            </View>

            <Pressable style={st.avatarEditWrap} onPress={pickPhoto}>
              {draftAvatar ? (
                <Image source={{ uri: draftAvatar }} style={st.avatarLg} />
              ) : (
                <LinearGradient colors={accentGradient(draftColor)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.avatarLg}>
                  <Text style={st.avatarTextLg}>{previewInitial}</Text>
                </LinearGradient>
              )}
              <View style={st.cameraBadge}>
                <Camera size={16} color="#fff" strokeWidth={2.5} />
              </View>
            </Pressable>
            <Pressable onPress={pickPhoto}>
              <Text style={st.changePhoto}>Change photo</Text>
            </Pressable>

            <Text style={st.fieldLabel}>DISPLAY NAME</Text>
            <TextInput
              style={st.input}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Your name"
              placeholderTextColor={colors.textDim}
              maxLength={24}
              autoCorrect={false}
            />

            <Text style={st.fieldLabel}>ACCENT</Text>
            <View style={st.swatchRow}>
              {ACCENTS.map((c) => (
                <Pressable
                  key={c}
                  style={[st.swatch, { backgroundColor: c }, draftColor === c && st.swatchSel]}
                  onPress={() => { haptics.select(); setDraftColor(c); }}
                />
              ))}
            </View>

            <Pressable style={st.saveWrap} onPress={saveEdit}>
              <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.saveBtn}>
                <Text style={st.saveText}>Save</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={st.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={st.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Privacy explainer modal */}
      <Modal visible={privacyOpen} animationType="slide" transparent onRequestClose={() => setPrivacyOpen(false)}>
        <View style={st.modalRoot}>
          <View style={st.sheet}>
            <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />
            <View style={st.sheetHead}>
              <Text style={st.sheetTitle}>How your location is shared</Text>
              <Pressable onPress={() => setPrivacyOpen(false)} hitSlop={10}>
                <X size={22} color={colors.textDim} strokeWidth={2} />
              </Pressable>
            </View>
            {[
              'Mutual consent only. You can locate someone only if you’re both in the same crew.',
              'Crew-only. Your location goes to your crew and no one else — never to strangers.',
              'Peer-to-peer, no server. Locations live on phones, passed directly device-to-device. There is no master map.',
              'Go dark anytime. One tap makes you invisible — always.',
            ].map((line) => (
              <View key={line} style={st.bulletRow}>
                <View style={st.bulletDot} />
                <Text style={st.bulletText}>{line}</Text>
              </View>
            ))}
            <Pressable style={st.saveWrap} onPress={() => setPrivacyOpen(false)}>
              <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.saveBtn}>
                <Text style={st.saveText}>Got it</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 130, gap: 16 },
  h1: { color: colors.text, fontSize: 24, fontFamily: fonts.display },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontFamily: fonts.display },
  name: { color: colors.text, fontSize: 20, fontFamily: fonts.displaySemi },
  handle: { color: colors.textDim, fontSize: 14, marginTop: 2, fontFamily: fonts.body },
  editBadge: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line,
  },
  card: { backgroundColor: colors.glass, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cardH: { color: colors.textDim, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  segment: { flexDirection: 'row', backgroundColor: colors.glass, borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segItemOn: { backgroundColor: colors.coral },
  segText: { color: colors.textDim, fontSize: 13, fontFamily: fonts.bodySemi },
  segTextOn: { color: '#fff' },
  p: { color: colors.textDim, fontSize: 13, lineHeight: 19, fontFamily: fonts.body },
  quickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.glass, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
  },
  quickRowOn: { borderColor: colors.gold },
  quickTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bodySemi },
  quickSub: { color: colors.textDim, fontSize: 12, marginTop: 2, fontFamily: fonts.body },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  linkText: { color: colors.text, fontSize: 15, flex: 1, fontFamily: fonts.bodyMed },

  // modal / edit sheet
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40, gap: 12, borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.displaySemi },
  avatarEditWrap: { alignSelf: 'center', marginTop: 6 },
  avatarLg: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  avatarTextLg: { color: '#fff', fontSize: 40, fontFamily: fonts.display },
  cameraBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.card,
  },
  changePhoto: { color: colors.coral, fontSize: 13, fontFamily: fonts.bodySemi, textAlign: 'center', marginBottom: 4 },
  fieldLabel: { color: colors.textDim, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1, marginTop: 4 },
  input: {
    borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass,
    paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 16, fontFamily: fonts.bodyMed,
  },
  swatchRow: { flexDirection: 'row', gap: 12, paddingVertical: 2 },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  swatchSel: { borderColor: '#fff' },
  saveWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  saveBtn: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontFamily: fonts.bodyBold },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: colors.textDim, fontSize: 14, fontFamily: fonts.bodySemi },

  // privacy explainer
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingRight: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.coral, marginTop: 7 },
  bulletText: { color: colors.textDim, fontSize: 14, lineHeight: 21, flex: 1, fontFamily: fonts.body },
});
