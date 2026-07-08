// apps/guard/src/ui/HoldButton.tsx
//
// The shared hold-to-confirm control for rectangular ops buttons. Any serious /
// irreversible action (declare muster, stand down an SOS) uses this so the whole
// app speaks ONE hold language: press and hold while a fill sweeps left→right
// across the button; it only fires when the fill completes. Release early and it
// drains back — a stray tap never triggers.
//
// (The raised SOS uses HoldSosButton, the circular-ring sibling of this — same
// idea, round shape.)
import { useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '@loc8/engine';
import { ops, fonts } from './opsTheme';

interface Props {
  label: string;
  sublabel?: string;
  onComplete: () => void;
  holdMs?: number;
  /** Solid background (ignored if `gradient` is set). */
  bg?: string;
  /** Optional gradient background stops. */
  gradient?: readonly [string, string, ...string[]];
  borderColor?: string;
  textColor?: string;
  /** The progress-fill overlay colour that sweeps across as you hold. */
  fillColor?: string;
  icon?: ReactNode;
  height?: number;
}

export function HoldButton({
  label,
  sublabel,
  onComplete,
  holdMs = 1500,
  bg = ops.panel,
  gradient,
  borderColor,
  textColor = ops.ink,
  fillColor = 'rgba(255,255,255,0.22)',
  icon,
  height = 60,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const fired = useRef(false);

  const start = () => {
    fired.current = false;
    haptics.tap(); // acknowledge press-in
    progress.setValue(0);
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: holdMs,
      easing: Easing.linear,
      useNativeDriver: false, // width % isn't native-animatable
    });
    anim.current.start(({ finished }) => {
      if (finished && !fired.current) {
        fired.current = true;
        haptics.success();
        onComplete();
        progress.setValue(0);
      }
    });
  };

  const cancel = () => {
    anim.current?.stop();
    if (fired.current) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable onPressIn={start} onPressOut={cancel} delayLongPress={holdMs}>
      <View style={[st.wrap, { height, borderColor: borderColor ?? 'transparent', borderWidth: borderColor ? 1 : 0 }]}>
        {gradient ? (
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />
        )}
        {/* progress fill sweeping left→right */}
        <Animated.View style={[st.fill, { width: fillWidth, backgroundColor: fillColor }]} />
        {/* leading edge highlight */}
        <Animated.View style={[st.edge, { left: fillWidth }]} />
        <View style={st.content}>
          {icon ? <View style={st.icon}>{icon}</View> : null}
          <View>
            <Text style={[st.label, { color: textColor }]}>{label}</Text>
            {sublabel ? <Text style={[st.sublabel, { color: textColor }]}>{sublabel}</Text> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  edge: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.6)' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  icon: {},
  label: { fontFamily: fonts.display, fontSize: 16, letterSpacing: 0.5, textAlign: 'center' },
  sublabel: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5, opacity: 0.8, marginTop: 2, textAlign: 'center' },
});
