// app/settings.tsx — real Settings screen (Stack card, not a tab).
import { View, Text, Pressable, StyleSheet, ScrollView, Switch } from 'react-native';
import Constants from 'expo-constants';
import { BlurView } from 'expo-blur';
import { useCrewStore, type Units } from '../src/state/crewStore';
import { AuroraBackground } from '../src/ui/AuroraBackground';
import { haptics } from '../src/services/haptics';
import { colors, fonts } from '../src/ui/theme';

const UNIT_OPTS: Array<{ value: Units; label: string }> = [
  { value: 'm', label: 'Metres' },
  { value: 'ft', label: 'Feet' },
];

const isBle = process.env.EXPO_PUBLIC_TRANSPORT === 'ble';
const APP_VERSION =
  (Constants.expoConfig?.version as string | undefined) ?? '1.0.0';

export default function SettingsScreen() {
  const notificationsEnabled = useCrewStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useCrewStore((s) => s.setNotificationsEnabled);
  const hapticsEnabled = useCrewStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useCrewStore((s) => s.setHapticsEnabled);
  const units = useCrewStore((s) => s.units);
  const setUnits = useCrewStore((s) => s.setUnits);

  const onToggleHaptics = (v: boolean) => {
    setHapticsEnabled(v);
    // Fire a confirming tick right after enabling so the user feels it turn on.
    if (v) haptics.select();
  };

  return (
    <View style={st.root}>
      <AuroraBackground />
      <ScrollView style={st.wrap} contentContainerStyle={st.content}>
        {/* Notifications */}
        <View style={st.card}>
          <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
          <Text style={st.cardH}>NOTIFICATIONS</Text>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.rowTitle}>Pings &amp; rallies</Text>
              <Text style={st.rowSub}>Get notified when your crew pings you or drops a rally pin.</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.coral, false: colors.line }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Haptics */}
        <View style={st.card}>
          <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
          <Text style={st.cardH}>HAPTICS</Text>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.rowTitle}>Vibration feedback</Text>
              <Text style={st.rowSub}>Feel taps, pings, rallies and the proximity heartbeat as you close in.</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={onToggleHaptics}
              trackColor={{ true: colors.coral, false: colors.line }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Distance units */}
        <View style={st.card}>
          <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
          <Text style={st.cardH}>DISTANCE UNITS</Text>
          <View style={st.segment}>
            {UNIT_OPTS.map((u) => {
              const on = units === u.value;
              return (
                <Pressable
                  key={u.value}
                  style={[st.segItem, on && st.segItemOn]}
                  onPress={() => setUnits(u.value)}
                >
                  <Text style={[st.segText, on && st.segTextOn]}>{u.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Mesh & network */}
        <View style={st.card}>
          <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
          <Text style={st.cardH}>MESH &amp; NETWORK</Text>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.rowTitle}>Transport</Text>
              <Text style={st.rowSub}>
                {isBle
                  ? 'Bluetooth mesh — phone-to-phone, no internet needed.'
                  : 'Simulator (demo) — synthetic crew for design & testing.'}
              </Text>
            </View>
            <Text style={[st.badge, isBle ? st.badgeOn : st.badgeDim]}>
              {isBle ? 'Bluetooth mesh' : 'Simulator'}
            </Text>
          </View>
        </View>

        {/* About */}
        <View style={st.card}>
          <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
          <Text style={st.cardH}>ABOUT</Text>
          <View style={st.row}>
            <Text style={st.rowTitle}>Loc8</Text>
            <Text style={st.rowMeta}>v{APP_VERSION}</Text>
          </View>
          <Text style={st.rowSub}>Find your people when the signal dies.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  wrap: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingTop: 20, paddingBottom: 60, gap: 16 },
  card: {
    backgroundColor: colors.glass, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
  },
  cardH: { color: colors.textDim, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bodySemi },
  rowSub: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 2, fontFamily: fonts.body },
  rowMeta: { color: colors.textDim, fontSize: 13, fontFamily: fonts.bodyMed },
  segment: { flexDirection: 'row', backgroundColor: colors.glass, borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segItemOn: { backgroundColor: colors.coral },
  segText: { color: colors.textDim, fontSize: 13, fontFamily: fonts.bodySemi },
  segTextOn: { color: '#fff' },
  badge: {
    fontSize: 12, fontFamily: fonts.bodySemi, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, overflow: 'hidden',
  },
  badgeOn: { color: colors.bg, backgroundColor: colors.signal },
  badgeDim: { color: colors.textDim, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line },
});
