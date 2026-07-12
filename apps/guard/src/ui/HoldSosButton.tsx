// apps/guard/src/ui/HoldSosButton.tsx — the raised SOS control.
//
// SOS is destructive-if-accidental, so firing is HOLD-to-arm: press and hold
// for 1s while a red ring sweeps around the button's outline; only when the
// ring completes does the SOS fire (onArmed). A quick TAP (released before
// ~300ms) is safe and calls onPress instead — the nav uses it to open the SOS
// screen, where a second deliberate hold actually sends.
import { useRef } from 'react';
import { Animated, Easing, Pressable, Text, View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Siren } from 'lucide-react-native';
import { haptics } from '@loc8/engine';
import { ops, fonts, opsGradients } from './opsTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const SOS_HOLD_MS = 1000;
/** Released within this window = a tap (navigate), not an aborted hold. */
export const SOS_TAP_MS = 300;

const SIZE = 52;         // button diameter
const STROKE = 3;        // ring thickness (sits on the black outline)
const BOX = SIZE + STROKE * 2;
const R = (BOX - STROKE) / 2;
const C = 2 * Math.PI * R;

export function HoldSosButton({ onArmed, onPress }: { onArmed: () => void; onPress?: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const fired = useRef(false);
  const pressedAt = useRef(0);

  const start = () => {
    fired.current = false;
    pressedAt.current = Date.now();
    haptics.tap(); // acknowledge the press-in — "arming"
    progress.setValue(0);
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: SOS_HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false, // SVG stroke props aren't native-animatable
    });
    anim.current.start(({ finished }) => {
      if (finished && !fired.current) {
        fired.current = true;
        onArmed(); // raise the SOS + navigate
        progress.setValue(0);
      }
    });
  };

  const cancel = () => {
    anim.current?.stop();
    if (fired.current) return; // completed → let onArmed handle reset
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    // A quick release is a tap, not an aborted hold — open the SOS screen.
    if (Date.now() - pressedAt.current < SOS_TAP_MS) onPress?.();
  };

  const dashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });

  return (
    <Pressable style={st.slot} onPressIn={start} onPressOut={cancel} delayLongPress={SOS_HOLD_MS}>
      <View style={st.btnWrap}>
        {/* black outline base */}
        <LinearGradient colors={opsGradients.sos} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btn}>
          <Siren size={24} color="#fff" strokeWidth={2.4} />
        </LinearGradient>
        {/* red progress ring sweeping the outline */}
        <Svg width={BOX} height={BOX} style={st.ring} pointerEvents="none">
          <AnimatedCircle
            cx={BOX / 2}
            cy={BOX / 2}
            r={R}
            stroke={ops.alert}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dashoffset}
            // start the sweep at 12 o'clock
            transform={`rotate(-90 ${BOX / 2} ${BOX / 2})`}
          />
        </Svg>
      </View>
      <Text style={st.label}>SOS</Text>
      <Text style={st.hint}>HOLD</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  btnWrap: { width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center', marginTop: -26 },
  btn: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center',
    borderWidth: STROKE, borderColor: ops.bg,
    shadowColor: ops.alert, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  ring: { position: 'absolute', top: 0, left: 0 },
  label: { fontSize: 10, fontFamily: fonts.bodyBold, color: ops.alert, marginTop: 3 },
  hint: { fontSize: 7, fontFamily: fonts.mono, color: ops.faint, letterSpacing: 1, marginTop: -1 },
});
