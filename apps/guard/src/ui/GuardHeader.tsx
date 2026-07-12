// apps/guard/src/ui/GuardHeader.tsx — the top bar: who you are + mesh status.
import { View, Text, StyleSheet } from 'react-native';
import { useCrewStore } from '@loc8/engine';
import { useGuardStore, badgeLabel } from '../state/guardStore';
import { ops, fonts } from './opsTheme';
import { MeshBadge } from './MeshBadge';

interface Props {
  title?: string;
}

export function GuardHeader({ title }: Props) {
  const name = useCrewStore((s) => s.profile?.name) ?? 'Guard';
  const badge = useGuardStore((s) => s.badge);
  const shift = useGuardStore((s) => s.shift);

  return (
    <View style={st.row}>
      <View>
        <Text style={st.who}>{title ?? `${shift.venue} · ${shift.zone}`}</Text>
        <Text style={st.sub}>
          YOU · {name} · Guard {badgeLabel(badge)}
        </Text>
      </View>
      <MeshBadge />
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  who: { color: ops.ink, fontSize: 13, fontFamily: fonts.bodyBold },
  sub: { color: ops.muted, fontSize: 9, fontFamily: fonts.mono, marginTop: 2 },
});
