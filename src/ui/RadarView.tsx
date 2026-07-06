// src/ui/RadarView.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useCrewStore, freshnessSec, STALE_SEC, GHOST_SEC } from '../state/crewStore';
import { calculateRadarPoint, LINEAR_MAX_M, OUTER_MAX_M } from '../core/geoMath';
import { useNowSec } from '../hooks/useNowSec';
import { Blip } from './Blip';
import { colors } from './theme';

export function RadarView() {
  const [size, setSize] = useState(0);
  const friends = useCrewStore((s) => s.friends);
  const myLocation = useCrewStore((s) => s.myLocation);
  const rallyPin = useCrewStore((s) => s.rallyPin);
  const now = useNowSec();
  const router = useRouter();
  const radius = size / 2 - 24;

  return (
    <View style={st.wrap} onLayout={(e) => setSize(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}>
      {size > 0 && (
        <>
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            {/* rings: 75m (35%), 150m (70% — end of linear zone), outer log ring */}
            <Circle cx={size / 2} cy={size / 2} r={radius * 0.35} stroke={colors.cardBorder} strokeWidth={1} fill="none" />
            <Circle cx={size / 2} cy={size / 2} r={radius * 0.7} stroke={colors.cardBorder} strokeWidth={1} fill="none" />
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.cardBorder} strokeWidth={1} fill="none" />
          </Svg>
          <Text style={[st.ringLabel, { top: size / 2 - radius * 0.35 - 14 }]}>{Math.round(LINEAR_MAX_M / 2)}m</Text>
          <Text style={[st.ringLabel, { top: size / 2 - radius * 0.7 - 14 }]}>{LINEAR_MAX_M}m</Text>
          <Text style={[st.ringLabel, { top: size / 2 - radius - 14 }]}>{OUTER_MAX_M / 1000}km+</Text>

          {/* me */}
          <View style={st.me} />

          {/* rally pin */}
          {rallyPin && myLocation && (() => {
            const pt = calculateRadarPoint(myLocation, rallyPin, radius);
            const dropper = friends[rallyPin.droppedById]?.name ?? 'You';
            return (
              <View style={[st.pin, { transform: [{ translateX: pt.x }, { translateY: pt.y }] }]}>
                <Text style={{ fontSize: 22 }}>🚩</Text>
                <Text style={st.pinLabel}>{dropper} · {Math.round(pt.distanceMeters)}m</Text>
              </View>
            );
          })()}

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
                onPress={() => router.push(`/compass/${f.id}`)}
              />
            );
          })}
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', alignSelf: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  me: {
    position: 'absolute', left: '50%', top: '50%', marginLeft: -9, marginTop: -9,
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
    shadowColor: '#fff', shadowOpacity: 0.8, shadowRadius: 8, elevation: 8,
  },
  pin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -12, marginTop: -30, alignItems: 'center' },
  pinLabel: {
    color: colors.yellow, fontSize: 9, fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
  },
});
