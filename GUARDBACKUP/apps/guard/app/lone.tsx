// apps/guard/app/lone.tsx — Lone-worker check-in (gallery screen 4).
// A timed prompt while patrolling alone. "I'M OK" resets the clock; silence
// auto-escalates to control with your last known position (an SOS over the mesh).
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, TriangleAlert } from 'lucide-react-native';
import { haptics } from '@loc8/engine';
import { ops, fonts, tint } from '../src/ui/opsTheme';
import { useGuardStore, LONE_CHECKIN_SEC } from '../src/state/guardStore';
import { raiseSosNow } from '../src/state/sos';

export default function LoneCheckIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const shift = useGuardStore((s) => s.shift);
  const startLoneCheckIn = useGuardStore((s) => s.startLoneCheckIn);
  const resolveLoneCheckIn = useGuardStore((s) => s.resolveLoneCheckIn);

  const [remaining, setRemaining] = useState(LONE_CHECKIN_SEC);
  const [escalated, setEscalated] = useState(false);
  const escalatedRef = useRef(false);

  useEffect(() => {
    startLoneCheckIn();
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1 && !escalatedRef.current) {
          escalatedRef.current = true;
          setEscalated(true);
          raiseSosNow(); // silence → auto-escalate to control with last position
          return 0;
        }
        return Math.max(0, r - 1);
      });
    }, 1000);
    return () => { clearInterval(t); resolveLoneCheckIn(); };
  }, []);

  const imOk = () => {
    haptics.success();
    resolveLoneCheckIn();
    router.back();
  };

  const frac = remaining / LONE_CHECKIN_SEC;

  return (
    <View style={[st.wrap, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 20 }]}>
      <Text style={st.tag}>◈ LONE-WORKER CHECK-IN</Text>
      <Text style={st.title}>{escalated ? 'Escalated' : 'Still OK?'}</Text>
      <View style={st.loc}>
        <MapPin size={13} color={ops.caution} strokeWidth={2} />
        <Text style={st.locTxt}>Patrolling · {shift.zone}</Text>
      </View>

      <View style={st.ring}>
        <View style={st.ringTrack} />
        <View style={[st.ringFill, { height: `${frac * 100}%` }]} />
        <View style={st.ringInner}>
          <Text style={st.num}>0:{String(remaining).padStart(2, '0')}</Text>
          <Text style={st.sub}>auto check-in</Text>
        </View>
      </View>

      {!escalated ? (
        <Pressable style={st.ok} onPress={imOk}>
          <Text style={st.okTxt}>I'M OK</Text>
        </Pressable>
      ) : (
        <Pressable style={[st.ok, { backgroundColor: ops.alert }]} onPress={() => router.replace('/sos' as never)}>
          <Text style={[st.okTxt, { color: '#fff' }]}>OPEN SOS</Text>
        </Pressable>
      )}

      <View style={st.note}>
        <TriangleAlert size={16} color={ops.caution} strokeWidth={2} />
        <Text style={st.noteTxt}>
          No response in {LONE_CHECKIN_SEC}s automatically alerts the control room with your last known position.
        </Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingHorizontal: 22, backgroundColor: '#0b0a08' },
  tag: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 2, color: ops.caution },
  title: { fontFamily: fonts.display, fontSize: 22, color: ops.ink, marginTop: 8 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  locTxt: { fontFamily: fonts.mono, fontSize: 11, color: ops.muted },
  ring: {
    width: 170, height: 170, borderRadius: 85, marginTop: 26, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 8, borderColor: 'rgba(255,255,255,0.08)',
  },
  ringTrack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ringFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: tint(ops.caution, 0.28) },
  ringInner: { alignItems: 'center' },
  num: { fontFamily: fonts.mono, fontSize: 38, color: ops.caution },
  sub: { fontFamily: fonts.body, fontSize: 10, color: ops.muted, marginTop: 2 },
  ok: {
    marginTop: 30, width: '100%', paddingVertical: 20, borderRadius: 20, alignItems: 'center',
    backgroundColor: ops.caution,
  },
  okTxt: { color: '#1a1100', fontFamily: fonts.display, fontSize: 18, letterSpacing: 0.5 },
  note: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 'auto',
    backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line, borderRadius: 12, padding: 11,
  },
  noteTxt: { flex: 1, color: ops.muted, fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
});
