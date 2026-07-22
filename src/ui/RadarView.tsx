// src/ui/RadarView.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Path, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import {
  GHOST_SEC,
  LINEAR_MAX_M,
  OUTER_MAX_M,
  STALE_SEC,
  calculateRadarPoint,
  colors,
  fonts,
  freshnessSec,
  gradients,
  useCrewStore,
} from '@loc8/engine';
import { useNowSec } from '../hooks/useNowSec';
import { Blip } from './Blip';
import { ShareSheet } from './ShareSheet';
import { Flag } from 'lucide-react-native';

export function RadarView() {
  const [size, setSize] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const friends = useCrewStore((s) => s.friends);
  const myLocation = useCrewStore((s) => s.myLocation);
  const rallyPin = useCrewStore((s) => s.rallyPin);
  const now = useNowSec();
  const router = useRouter();
  const radius = size / 2 - 24;

  // rotating radar sweep
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.linear }), -1, false);
  }, [spin]);
  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const sweepA1 = -Math.PI / 2;
  const sweepA2 = sweepA1 + (75 * Math.PI) / 180;
  const sp1 = { x: radius + radius * Math.cos(sweepA1), y: radius + radius * Math.sin(sweepA1) };
  const sp2 = { x: radius + radius * Math.cos(sweepA2), y: radius + radius * Math.sin(sweepA2) };
  const sweepPath = `M${radius},${radius} L${sp1.x},${sp1.y} A${radius},${radius} 0 0 1 ${sp2.x},${sp2.y} Z`;

  // pulsing halo around the "you" beacon
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.ease) }), -1, false);
  }, [pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 6 }],
    opacity: 0.7 * (1 - pulse.value),
  }));

  return (
    <View style={st.wrap} onLayout={(e) => setSize(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}>
      {size > 0 && (
        // Single centred square: rings, sweep, beacon and blips all share one
        // origin (the square's centre). Positioning everything off the taller
        // outer container is what made the beacon drift below the rings.
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor="#5ef2c8" stopOpacity="0.10" />
                <Stop offset="1" stopColor="#5ef2c8" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={size / 2} cy={size / 2} r={radius} fill="url(#glow)" />
            {/* rings: 75m (35%), 150m (70% — end of linear zone), outer log ring */}
            <Circle cx={size / 2} cy={size / 2} r={radius * 0.35} stroke={colors.line} strokeWidth={1} fill="none" />
            <Circle cx={size / 2} cy={size / 2} r={radius * 0.7} stroke={colors.line} strokeWidth={1} fill="none" />
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.line} strokeWidth={1} fill="none" />
          </Svg>
          <Animated.View
            pointerEvents="none"
            style={[st.sweepBox, { width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }, sweepStyle]}
          >
            <Svg width={radius * 2} height={radius * 2}>
              <Defs>
                <SvgLinearGradient id="sweep" x1={sp1.x} y1={sp1.y} x2={sp2.x} y2={sp2.y} gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor="#5ef2c8" stopOpacity="0.30" />
                  <Stop offset="1" stopColor="#5ef2c8" stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>
              <Path d={sweepPath} fill="url(#sweep)" />
            </Svg>
          </Animated.View>
          <Text style={[st.ringLabel, { top: size / 2 - radius * 0.35 - 14 }]}>{Math.round(LINEAR_MAX_M / 2)}m</Text>
          <Text style={[st.ringLabel, { top: size / 2 - radius * 0.7 - 14 }]}>{LINEAR_MAX_M}m</Text>
          <Text style={[st.ringLabel, { top: size / 2 - radius - 14 }]}>{OUTER_MAX_M / 1000}km+</Text>

          {/* me — sunset beacon with pulsing halo */}
          <Animated.View style={[st.meHalo, haloStyle]} />
          <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.meCore} />

          {/* rally pin */}
          {rallyPin && myLocation && (() => {
            const pt = calculateRadarPoint(myLocation, rallyPin, radius);
            const dropper = friends[rallyPin.droppedById]?.name ?? 'You';
            return (
              <Pressable
                onPress={() => setShareOpen(true)}
                style={[st.pin, { transform: [{ translateX: pt.x }, { translateY: pt.y }] }]}
              >
                <Flag size={22} color={colors.gold} strokeWidth={2} fill={colors.gold} />
                <Text style={st.pinLabel}>{dropper} · {Math.round(pt.distanceMeters)}m</Text>
              </Pressable>
            );
          })()}

          {rallyPin && myLocation && (
            <ShareSheet
              visible={shareOpen}
              title="Rally point"
              location={rallyPin}
              onClose={() => setShareOpen(false)}
            />
          )}

          {/* friends */}
          {myLocation && Object.values(friends).map((f) => {
            if (!f.lastPacket) return null;
            const fresh = freshnessSec(f, now);
            const pt = calculateRadarPoint(
              myLocation,
              { latitude: f.lastPacket.latitude, longitude: f.lastPacket.longitude },
              radius,
            );
            return (
              <Blip
                key={f.id}
                x={pt.x} y={pt.y}
                name={f.name} color={f.color}
                distanceM={pt.distanceMeters}
                freshness={fresh}
                relayVia={f.relayVia}
                stale={fresh !== null && fresh > STALE_SEC}
                ghost={fresh !== null && fresh > GHOST_SEC}
                onPress={() => router.push(`/compass/${f.id}` as Href)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sweepBox: { position: 'absolute', left: '50%', top: '50%' },
  ringLabel: { position: 'absolute', alignSelf: 'center', color: colors.faint, fontFamily: fonts.body, fontSize: 9 },
  meHalo: {
    position: 'absolute', left: '50%', top: '50%', marginLeft: -10, marginTop: -10,
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.rose,
  },
  meCore: {
    position: 'absolute', left: '50%', top: '50%', marginLeft: -11, marginTop: -11,
    width: 22, height: 22, borderRadius: 11,
    shadowColor: colors.rose, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  pin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -12, marginTop: -30, alignItems: 'center' },
  pinLabel: {
    color: colors.gold, fontFamily: fonts.bodySemi, fontSize: 9,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
  },
});
