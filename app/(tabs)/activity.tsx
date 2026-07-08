// app/(tabs)/activity.tsx — the Activity feed (5th tab).
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, type Href } from 'expo-router';
import { useCrewStore, type ActivityKind } from '../../src/state/crewStore';
import { useNowSec } from '../../src/hooks/useNowSec';
import { AuroraBackground } from '../../src/ui/AuroraBackground';
import { colors, fonts } from '../../src/ui/theme';
import { Bell, MessageCircle, Flag, PartyPopper, Moon, Clock, ChevronRight, type LucideIcon } from 'lucide-react-native';

const KIND: Record<ActivityKind, { Icon: LucideIcon; color: string }> = {
  ping: { Icon: Bell, color: colors.coral },
  reply: { Icon: MessageCircle, color: colors.teal },
  rally: { Icon: Flag, color: colors.gold },
  found: { Icon: PartyPopper, color: colors.teal },
  dark: { Icon: Moon, color: colors.faint },
  session: { Icon: Clock, color: colors.blue },
};

function relTime(atSec: number, now: number): string {
  const d = Math.max(0, now - atSec);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function ActivityScreen() {
  const router = useRouter();
  const log = useCrewStore((s) => s.activityLog);
  const now = useNowSec();

  return (
    <View style={st.wrap}>
      <AuroraBackground />
      <Text style={st.h1}>Activity</Text>
      {log.length === 0 ? (
        <View style={st.empty}>
          <Bell size={34} color={colors.faint} strokeWidth={1.6} />
          <Text style={st.emptyText}>
            No activity yet — pings, rally alerts and found moments will show here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={st.list}>
          {log.map((e) => {
            const meta = KIND[e.kind];
            const tappable = (e.kind === 'ping' || e.kind === 'reply') && e.friendId != null;
            return (
              <Pressable
                key={e.id}
                style={st.row}
                disabled={!tappable}
                onPress={() => tappable && router.push(`/compass/${e.friendId}` as Href)}
              >
                <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
                <View style={[st.iconWrap, { backgroundColor: meta.color + '22' }]}>
                  <meta.Icon size={18} color={meta.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.rowText}>{e.text}</Text>
                  <Text style={st.rowTime}>{relTime(e.atSec, now)}</Text>
                </View>
                {tappable && <ChevronRight size={16} color={colors.faint} strokeWidth={2} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 60, paddingHorizontal: 20 },
  h1: { color: colors.text, fontSize: 24, fontFamily: fonts.display, marginBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 120, paddingHorizontal: 20 },
  emptyText: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21, fontFamily: fonts.body },
  list: { gap: 10, paddingBottom: 130 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.glass, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
  },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { color: colors.text, fontSize: 14, fontFamily: fonts.bodySemi },
  rowTime: { color: colors.textDim, fontSize: 11, marginTop: 2, fontFamily: fonts.body },
});
