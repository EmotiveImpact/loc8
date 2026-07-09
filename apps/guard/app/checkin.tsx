// Lone-worker check-in — the regulated duty-of-care prompt (gallery-guard §4).
// No response inside the grace window auto-alerts the control room with the
// last known position, over the mesh.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AlertTriangle, MapPin } from 'lucide-react-native';
import { getMeshService, useCrewStore, encodePlusCode } from '@loc8/engine';
import { CHECKIN_GRACE_SEC, promptSecondsLeft } from '../src/domain/loneWorker';
import { useGuardStore } from '../src/store/guardStore';
import { GradientBtn, Tag } from '../src/ui/kit';
import { fonts, g } from '../src/theme';

const nowSec = () => Math.floor(Date.now() / 1000);

export default function Checkin() {
  const checkin = useGuardStore((s) => s.checkin);
  const checkinOk = useGuardStore((s) => s.checkinOk);
  const [left, setLeft] = useState(() => promptSecondsLeft(checkin, nowSec()));

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = promptSecondsLeft(useGuardStore.getState().checkin, nowSec());
      setLeft(remaining);
      if (remaining <= 0) {
        // Overdue: auto-escalate with last known position, then stand the
        // prompt down (control room now owns it).
        const loc = useCrewStore.getState().myLocation;
        const pin = loc ? ` @ ${encodePlusCode(loc.latitude, loc.longitude)}` : '';
        getMeshService().sendCrewMessage(`LONE-WORKER OVERDUE — Guard 07${pin}`);
        useGuardStore.getState().checkinOk(nowSec());
        clearInterval(id);
        router.back();
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  const frac = left / CHECKIN_GRACE_SEC;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Tag color={g.caution}>LONE-WORKER CHECK-IN</Tag>
        <Text style={styles.h}>Still OK?</Text>
        <View style={styles.loc}>
          <MapPin size={14} color={g.caution} strokeWidth={2} />
          <Text style={styles.locText}>Patrolling · Car Park</Text>
        </View>

        <View style={styles.timer}>
          <View style={[styles.timerFill, { transform: [{ scale: Math.max(0.15, frac) }] }]} />
          <Text style={styles.num}>
            {mm}:{ss}
          </Text>
          <Text style={styles.timerSub}>auto check-in</Text>
        </View>

        <GradientBtn
          kind="amber"
          title="I'M OK"
          onPress={() => {
            checkinOk(nowSec());
            router.back();
          }}
          style={{ alignSelf: 'stretch' }}
        />

        <View style={styles.note}>
          <AlertTriangle size={16} color={g.caution} strokeWidth={2} />
          <Text style={styles.noteText}>
            No response in {CHECKIN_GRACE_SEC}s automatically alerts the control room with your last known
            position.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0a08' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 70, paddingBottom: 24, gap: 12 },
  h: { fontFamily: fonts.disp, fontSize: 22, color: g.ink },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locText: { fontFamily: fonts.mono, fontSize: 11, color: g.muted },
  timer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    overflow: 'hidden',
  },
  timerFill: {
    position: 'absolute',
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: 'rgba(255,180,58,0.12)',
  },
  num: { fontFamily: fonts.monoBold, fontSize: 38, color: g.caution },
  timerSub: { fontFamily: fonts.body, fontSize: 10, color: g.muted, marginTop: 4 },
  note: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: g.panel,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: g.muted, lineHeight: 17 },
});
