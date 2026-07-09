// Team map — live tactical positions of the shift, plotted with the SAME
// engine radar math as the consumer app (calculateRadarPoint: north-up,
// log-compressed distance). One engine, different door.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import {
  useCrewStore,
  calculateRadarPoint,
  freshnessSec,
  STALE_SEC,
  type FriendState,
} from '@loc8/engine';
import { useGuardStore } from '../../src/store/guardStore';
import { MeshBadge } from '../../src/ui/kit';
import { fonts, g } from '../../src/theme';

const nowSec = () => Math.floor(Date.now() / 1000);

export default function TeamMap() {
  const friends = useCrewStore((s) => s.friends);
  const myLocation = useCrewStore((s) => s.myLocation);
  const meshNearby = useCrewStore((s) => s.meshNearby);
  const zoneLabel = useGuardStore((s) => s.zoneLabel);
  const { width } = useWindowDimensions();
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 2000); // freshness repaint
    return () => clearInterval(id);
  }, []);

  const size = width - 28;
  const radius = size / 2 - 24;
  const team = Object.values(friends);
  const inRange = team.filter((f) => {
    const fresh = freshnessSec(f, nowSec());
    return fresh !== null && fresh < STALE_SEC;
  }).length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.hdr}>
        <View>
          <Text style={styles.title}>Night Shift · Team B</Text>
          <Text style={styles.sub}>YOU · Guard 07 · {zoneLabel}</Text>
        </View>
        <MeshBadge />
      </View>

      <View style={[styles.map, { width: size, height: size }]}>
        <GridLines size={size} />
        {/* you at centre */}
        <View style={[styles.dot, styles.you, { left: size / 2 - 13, top: size / 2 - 13 }]}>
          <Text style={styles.dotText}>07</Text>
        </View>
        {team.map((f) => (
          <TeamDot key={f.id} friend={f} me={myLocation} size={size} radius={radius} />
        ))}
      </View>

      <View style={styles.bottom}>
        <View style={styles.statuspill}>
          <Check size={14} color={g.ok} strokeWidth={2.4} />
          <Text style={styles.statusText}>
            On duty · {inRange} in range{meshNearby > 0 ? ` · mesh ${meshNearby}` : ''}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TeamDot({
  friend,
  me,
  size,
  radius,
}: {
  friend: FriendState;
  me: { latitude: number; longitude: number } | null;
  size: number;
  radius: number;
}) {
  if (!me || !friend.lastPacket) return null;
  const pt = calculateRadarPoint(
    me,
    { latitude: friend.lastPacket.latitude, longitude: friend.lastPacket.longitude },
    radius,
  );
  const fresh = freshnessSec(friend, nowSec());
  const stale = fresh === null || fresh > STALE_SEC;
  const caution = friend.color === g.caution;
  const label = friend.name.match(/Guard (\d+)/)?.[1] ?? String(friend.id % 100);
  return (
    <View
      style={[
        styles.dot,
        { left: size / 2 + pt.x - 13, top: size / 2 + pt.y - 13 },
        caution ? styles.caution : styles.ok,
        stale && styles.stale,
      ]}
      accessibilityLabel={`${friend.name} · ${Math.round(pt.distanceMeters)} metres`}
    >
      <Text style={styles.dotText}>{label.padStart(2, '0')}</Text>
    </View>
  );
}

function GridLines({ size }: { size: number }) {
  const step = 26;
  const lines = [];
  for (let p = step; p < size; p += step) {
    lines.push(<View key={`h${p}`} style={[styles.grid, { top: p, width: size, height: 1 }]} />);
    lines.push(<View key={`v${p}`} style={[styles.grid, { left: p, height: size, width: 1 }]} />);
  }
  return <>{lines}</>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: g.bg },
  hdr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  title: { fontFamily: fonts.bodyBold, fontSize: 13, color: g.ink },
  sub: { fontFamily: fonts.mono, fontSize: 9, color: g.muted, marginTop: 2 },
  map: {
    alignSelf: 'center',
    backgroundColor: '#0a0d15',
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  grid: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.028)' },
  dot: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0a0d15',
  },
  you: { backgroundColor: g.info, shadowColor: g.info, shadowOpacity: 0.8, shadowRadius: 10, elevation: 8 },
  ok: { backgroundColor: g.ok },
  caution: { backgroundColor: g.caution, borderRadius: 8 },
  stale: { opacity: 0.45 },
  dotText: { fontFamily: fonts.disp, fontSize: 10, color: '#06070d' },
  bottom: { marginTop: 'auto', padding: 14, gap: 10 },
  statuspill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: g.okBg,
    borderColor: g.okBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 11,
  },
  statusText: { fontFamily: fonts.bodySemi, fontSize: 12, color: g.ok },
});
