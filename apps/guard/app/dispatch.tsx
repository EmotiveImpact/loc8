// Dispatch → navigate (gallery-guard §3): an order arrived over the mesh;
// acknowledge with the shared status vocabulary (EN ROUTE = code 1).
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Navigation } from 'lucide-react-native';
import { sendStatus } from '../src/services/ops';
import { useGuardStore } from '../src/store/guardStore';
import { GradientBtn, Tag } from '../src/ui/kit';
import { fonts, g } from '../src/theme';

export default function Dispatch() {
  const dispatch = useGuardStore((s) => s.dispatch);
  const acknowledgeDispatch = useGuardStore((s) => s.acknowledgeDispatch);

  if (!dispatch) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.body}>
          <Tag color={g.info}>DISPATCH</Tag>
          <Text style={styles.p}>No active dispatch.</Text>
          <Text onPress={() => router.back()} style={styles.backLink}>
            Back
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Tag color={g.alert}>DISPATCHED TO</Tag>
        <Text style={styles.h}>{dispatch.label}</Text>

        <View style={styles.arrowWrap}>
          <Navigation size={110} color={g.alert} strokeWidth={2.2} style={{ transform: [{ rotate: '38deg' }] }} />
        </View>

        <Text style={styles.order}>{dispatch.text}</Text>

        {dispatch.acknowledged ? (
          <View style={styles.acked}>
            <Text style={styles.ackedText}>EN ROUTE — status sent over mesh</Text>
          </View>
        ) : (
          <GradientBtn
            kind="danger"
            title="EN ROUTE"
            onPress={() => {
              sendStatus(1); // shared GUARD_STATUS code 1
              acknowledgeDispatch();
            }}
            style={{ alignSelf: 'stretch' }}
          />
        )}

        <Text onPress={() => router.back()} style={styles.backLink}>
          Back to map
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080a11' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 70, paddingBottom: 24, gap: 12 },
  h: { fontFamily: fonts.dispSemi, fontSize: 20, color: g.ink, textAlign: 'center' },
  arrowWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  order: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: g.muted,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  p: { fontFamily: fonts.body, fontSize: 13, color: g.muted, marginTop: 20 },
  acked: {
    alignSelf: 'stretch',
    backgroundColor: g.okBg,
    borderColor: g.okBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ackedText: { fontFamily: fonts.monoBold, fontSize: 11, color: g.ok, letterSpacing: 1 },
  backLink: { marginTop: 12, fontFamily: fonts.bodySemi, fontSize: 12, color: g.muted, padding: 8 },
});
