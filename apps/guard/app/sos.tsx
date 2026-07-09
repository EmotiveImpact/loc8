// SOS — armed (hold to send) and active (broadcasting) states (gallery-guard §2).
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { useCrewStore } from '@loc8/engine';
import { sendSos } from '../src/services/ops';
import { useGuardStore } from '../src/store/guardStore';
import { GradientBtn } from '../src/ui/kit';
import { fonts, g } from '../src/theme';

export default function Sos() {
  const activeSince = useGuardStore((s) => s.sosActiveSince);
  const cancelSos = useGuardStore((s) => s.cancelSos);
  const friends = useCrewStore((s) => s.friends);
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activeSince) return;
    const loop = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [activeSince, ring]);

  const responders = Object.values(friends).slice(0, 2);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <View style={styles.ringWrap}>
          {activeSince && (
            <Animated.View
              style={[
                styles.ring,
                {
                  opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                  transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
                },
              ]}
            />
          )}
          <View style={styles.disc}>
            <AlertCircle size={34} color="#fff" strokeWidth={2.4} />
          </View>
        </View>

        <Text style={styles.h}>{activeSince ? 'SOS ACTIVE' : 'SEND SOS?'}</Text>
        <Text style={styles.p}>
          {activeSince
            ? 'Your location is broadcasting to the team — even with no signal.'
            : 'Hold the button to broadcast your position to every teammate and the control room.'}
        </Text>

        {activeSince ? (
          <View style={styles.responders}>
            {responders.map((r) => (
              <View key={r.id} style={styles.resp}>
                <View style={[styles.ra, { backgroundColor: g.ok }]}>
                  <Text style={styles.raText}>{r.name.charAt(0)}</Text>
                </View>
                <Text style={styles.rn}>{r.name}</Text>
                <Text style={styles.rd}>en route</Text>
              </View>
            ))}
            <View style={styles.resp}>
              <View style={[styles.ra, { backgroundColor: g.info }]}>
                <Text style={styles.raText}>C</Text>
              </View>
              <Text style={styles.rn}>Control room</Text>
              <Text style={styles.rd}>notified</Text>
            </View>
          </View>
        ) : (
          <GradientBtn
            kind="danger"
            title="HOLD TO SEND SOS"
            onLongPress={() => sendSos()}
            style={{ alignSelf: 'stretch', marginTop: 22 }}
          />
        )}

        <Pressable
          onLongPress={() => {
            cancelSos();
            router.back();
          }}
          onPress={() => {
            if (!activeSince) router.back();
          }}
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>
            {activeSince ? "Hold to cancel — I'm OK" : 'Back'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0710' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 70, paddingBottom: 24 },
  ringWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: 'rgba(255,64,83,0.55)',
  },
  disc: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: g.alert,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: g.alert,
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 12,
  },
  h: { fontFamily: fonts.disp, fontSize: 24, color: g.ink, letterSpacing: 0.5, marginTop: 18 },
  p: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 10 },
  responders: { alignSelf: 'stretch', gap: 8, marginTop: 22 },
  resp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: g.panel,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 13,
    padding: 11,
  },
  ra: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  raText: { fontFamily: fonts.disp, fontSize: 12, color: '#06070d' },
  rn: { fontFamily: fonts.bodySemi, fontSize: 13, color: g.ink },
  rd: { fontFamily: fonts.mono, fontSize: 11, color: g.ok, marginLeft: 'auto' },
  cancel: {
    marginTop: 'auto',
    alignSelf: 'stretch',
    backgroundColor: g.panel,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: { fontFamily: fonts.bodySemi, fontSize: 13, color: g.muted },
});
