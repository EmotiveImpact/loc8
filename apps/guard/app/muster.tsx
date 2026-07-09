// Muster / evacuation — full-screen takeover (gallery-guard §6). "I'M SAFE"
// reports over the mesh; Command's muster board counts it.
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Users } from 'lucide-react-native';
import { ops } from '../src/services/ops';
import { useGuardStore } from '../src/store/guardStore';
import { GradientBtn, Tag } from '../src/ui/kit';
import { fonts, g } from '../src/theme';

export default function Muster() {
  const selfSafe = useGuardStore((s) => s.musterSelfSafe);
  const markSelfSafe = useGuardStore((s) => s.markSelfSafe);

  const imSafe = () => {
    markSelfSafe();
    ops().sendCrewMessage('MUSTER SAFE — Guard 07 at Assembly Point A');
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Tag color={g.alert}>EVACUATION</Tag>
        <Text style={styles.h}>MUSTER{'\n'}CALLED</Text>
        <View style={styles.icon}>
          <Users size={44} color={g.alert} strokeWidth={2} />
        </View>
        <Text style={styles.p}>Tap when you're at the assembly point.</Text>

        {selfSafe ? (
          <View style={styles.safeDone}>
            <Text style={styles.safeDoneText}>ACCOUNTED FOR — control room notified</Text>
          </View>
        ) : (
          <GradientBtn kind="safe" title="I'M SAFE" sub="ACCOUNTED FOR" onPress={imSafe} style={{ alignSelf: 'stretch' }} />
        )}

        <Text onPress={() => router.back()} style={styles.back}>
          Back to map
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0710' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 66, paddingBottom: 24, gap: 14 },
  h: { fontFamily: fonts.disp, fontSize: 28, color: g.ink, textAlign: 'center', lineHeight: 34 },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: g.alertBg,
    borderColor: g.alertBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  p: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  safeDone: {
    alignSelf: 'stretch',
    backgroundColor: g.okBg,
    borderColor: g.okBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  safeDoneText: { fontFamily: fonts.monoBold, fontSize: 11, color: g.ok, letterSpacing: 1 },
  back: { marginTop: 'auto', fontFamily: fonts.bodySemi, fontSize: 12, color: g.muted, padding: 10 },
});
