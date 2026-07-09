// apps/guard/src/ui/TeamMap.tsx — top-down tactical team map.
//
// Positions are REAL: each guard's blip is projected from the engine's
// crewStore.friends[].lastPacket using getHaversineDistance + getAbsoluteBearing
// relative to your location. You sit at centre. The incident marker is the
// engine rally pin (an SOS / dispatched incident). No map tiles — a grid + zone
// boxes, per the gallery.
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, type LayoutChangeEvent } from 'react-native';
import { useCrewStore, getHaversineDistance, getAbsoluteBearing, freshnessSec, STALE_SEC, venueLevelName, venueLevelShort } from '@loc8/engine';
import type { Coordinate } from '@loc8/engine';
import { useGuardStore, badgeLabel } from '../state/guardStore';
import { guardFor, friendFloor, VENUE_LEVELS } from '../state/guardTeam';
import { useNowSec } from '../hooks/useNowSec';
import { ops, fonts } from './opsTheme';
import { FloorStrip, type FloorRow } from './FloorStrip';

const RANGE_M = 350; // metres mapped to the map radius before clamping

interface Zone { label: string; left: number; top: number; w: number; h: number; }
// Fractional zone boxes (of the map rect), echoing the gallery layout.
const ZONES: Zone[] = [
  { label: 'MAIN ROOM', left: 0.06, top: 0.05, w: 0.38, h: 0.24 },
  { label: 'BAR', left: 0.6, top: 0.05, w: 0.34, h: 0.32 },
  { label: 'SMOKING', left: 0.08, top: 0.6, w: 0.3, h: 0.22 },
];

function project(me: Coordinate, at: Coordinate, cx: number, cy: number, maxR: number) {
  const dist = getHaversineDistance(me, at);
  const bearing = getAbsoluteBearing(me, at);
  const r = Math.min(maxR, (dist / RANGE_M) * maxR);
  const rad = (bearing * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad), dist };
}

export function TeamMap({ onPressIncident }: { onPressIncident?: () => void }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const friends = useCrewStore((s) => s.friends);
  const me = useCrewStore((s) => s.myLocation);
  const rallyPin = useCrewStore((s) => s.rallyPin);
  const myFloor = useCrewStore((s) => s.myFloor);
  const dispatchLabel = useGuardStore((s) => s.dispatchLabel);
  const myBadge = useGuardStore((s) => s.badge);
  const viewFloorRaw = useGuardStore((s) => s.viewFloor);
  const setViewFloor = useGuardStore((s) => s.setViewFloor);
  const now = useNowSec();

  const viewFloor = viewFloorRaw ?? myFloor;

  // Build the cross-section: venue levels ∪ any occupied/incident floor,
  // roof→basement, each with population + trouble markers.
  const countByFloor: Record<number, number> = {};
  const cautionByFloor: Record<number, boolean> = {};
  for (const f of Object.values(friends)) {
    if (!f.lastPacket) continue;
    const fl = friendFloor(f);
    countByFloor[fl] = (countByFloor[fl] ?? 0) + 1;
    if (guardFor(f.id)?.status === 'caution') cautionByFloor[fl] = true;
  }
  countByFloor[myFloor] = (countByFloor[myFloor] ?? 0) + 1; // you
  const incidentFloor = rallyPin ? (rallyPin.floor ?? 0) : null;
  const allFloors = new Set<number>([
    ...VENUE_LEVELS.map((l) => l.floor),
    ...Object.keys(countByFloor).map(Number),
    ...(incidentFloor != null ? [incidentFloor] : []),
  ]);
  const rows: FloorRow[] = Array.from(allFloors)
    .sort((a, b) => b - a)
    .map((fl) => ({
      floor: fl,
      short: venueLevelShort(VENUE_LEVELS, fl),
      count: countByFloor[fl] ?? 0,
      hasIncident: incidentFloor === fl,
      hasCaution: cautionByFloor[fl] ?? false,
    }));
  const peeking = viewFloor !== myFloor;
  // You're always on your own floor, so "empty" can only happen while peeking.
  const viewedIsEmpty =
    peeking && (countByFloor[viewFloor] ?? 0) === 0 && incidentFloor !== viewFloor;

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const cx = size.w / 2;
  const cy = size.h / 2;
  const maxR = Math.max(0, Math.min(size.w, size.h) / 2 - 26);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 3] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <View style={st.map} onLayout={onLayout}>
      {/* grid */}
      {size.w > 0 &&
        Array.from({ length: Math.ceil(size.w / 26) }).map((_, i) => (
          <View key={`v${i}`} style={[st.grid, { left: i * 26, top: 0, bottom: 0, width: 1 }]} />
        ))}
      {size.h > 0 &&
        Array.from({ length: Math.ceil(size.h / 26) }).map((_, i) => (
          <View key={`h${i}`} style={[st.grid, { top: i * 26, left: 0, right: 0, height: 1 }]} />
        ))}

      {/* zones */}
      {size.w > 0 &&
        ZONES.map((z) => (
          <View key={z.label}>
            <View
              style={[st.zone, {
                left: z.left * size.w, top: z.top * size.h,
                width: z.w * size.w, height: z.h * size.h,
              }]}
            />
            <Text style={[st.zlab, { left: z.left * size.w + 6, top: z.top * size.h + 5 }]}>{z.label}</Text>
          </View>
        ))}

      {/* incident marker (engine rally pin) — only on its floor */}
      {me && rallyPin && (rallyPin.floor ?? 0) === viewFloor && maxR > 0 && (() => {
        const p = project(me, rallyPin, cx, cy, maxR);
        return (
          <Pressable
            onPress={onPressIncident}
            style={[st.incident, { left: p.x, top: p.y }]}
          >
            <Animated.View style={[st.incidentRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
            <View style={st.incidentCore}>
              <Text style={st.incidentGlyph}>!</Text>
            </View>
            <Text style={st.incidentLabel}>{dispatchLabel ?? 'Incident'}</Text>
          </Pressable>
        );
      })()}

      {/* guard blips — only those on the viewed floor */}
      {me && maxR > 0 &&
        Object.values(friends).map((f) => {
          if (!f.lastPacket) return null;
          if (friendFloor(f) !== viewFloor) return null;
          const at = { latitude: f.lastPacket.latitude, longitude: f.lastPacket.longitude };
          const p = project(me, at, cx, cy, maxR);
          const meta = guardFor(f.id);
          const status = meta?.status ?? 'ok';
          const color = status === 'caution' ? ops.caution : ops.ok;
          const fresh = freshnessSec(f, now);
          const stale = fresh != null && fresh > STALE_SEC;
          const label = meta ? badgeLabel(meta.badge) : badgeLabel(f.id);
          return (
            <View key={f.id} style={[st.dot, { left: p.x, top: p.y, backgroundColor: color, opacity: stale ? 0.4 : 1 }]}>
              <Text style={st.dotText}>{label}</Text>
            </View>
          );
        })}

      {/* you — only when viewing your own floor */}
      {maxR > 0 && myFloor === viewFloor && (
        <View style={[st.you, { left: cx, top: cy }]}>
          <Text style={st.dotText}>{badgeLabel(myBadge)}</Text>
        </View>
      )}

      {/* building cross-section (right edge) */}
      <View style={st.switcher}>
        <FloorStrip
          rows={rows}
          viewFloor={viewFloor}
          myFloor={myFloor}
          onSelect={(f) => setViewFloor(f === myFloor ? null : f)}
        />
      </View>

      {/* peeking-another-floor banner + empty state */}
      {peeking && (
        <View style={st.peekBanner}>
          <Text style={st.peekTxt}>
            Viewing {venueLevelName(VENUE_LEVELS, viewFloor)} · you're on {venueLevelName(VENUE_LEVELS, myFloor)}
          </Text>
        </View>
      )}
      {viewedIsEmpty && maxR > 0 && (
        <View style={[st.emptyWrap, { left: cx, top: cy }]} pointerEvents="none">
          <Text style={st.emptyTxt}>No one on {venueLevelName(VENUE_LEVELS, viewFloor)}</Text>
        </View>
      )}
    </View>
  );
}

const DOT = 26;
const st = StyleSheet.create({
  map: { flex: 1, backgroundColor: ops.bg2, overflow: 'hidden' },
  switcher: { position: 'absolute', right: 10, top: 12 },
  peekBanner: {
    position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(122,162,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(122,162,255,0.4)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  peekTxt: { color: ops.info, fontFamily: fonts.mono, fontSize: 10 },
  emptyWrap: { position: 'absolute', width: 220, marginLeft: -110, alignItems: 'center' },
  emptyTxt: { color: ops.faint, fontFamily: fonts.mono, fontSize: 11 },
  grid: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.028)' },
  zone: {
    position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.015)',
  },
  zlab: { position: 'absolute', fontFamily: fonts.mono, fontSize: 8, color: ops.faint },
  dot: {
    position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -DOT / 2, marginTop: -DOT / 2,
    borderWidth: 3, borderColor: ops.bg2,
  },
  dotText: { color: '#06070d', fontFamily: fonts.displaySemi, fontWeight: '700', fontSize: 11 },
  you: {
    position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -DOT / 2, marginTop: -DOT / 2,
    backgroundColor: ops.info, borderWidth: 3, borderColor: ops.bg2,
    shadowColor: ops.info, shadowOpacity: 0.9, shadowRadius: 10, elevation: 8,
  },
  incident: { position: 'absolute', width: 30, height: 30, marginLeft: -15, marginTop: -15, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  incidentRing: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: ops.alert },
  incidentCore: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: ops.alert,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: ops.alert, shadowOpacity: 0.8, shadowRadius: 12, elevation: 8,
  },
  incidentGlyph: { color: '#fff', fontFamily: fonts.displaySemi, fontWeight: '700', fontSize: 16 },
  incidentLabel: {
    position: 'absolute', top: 34, fontFamily: fonts.monoBold, fontSize: 8, color: ops.alert,
    backgroundColor: 'rgba(6,7,13,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    width: 90, textAlign: 'center', marginLeft: -30,
  },
});
