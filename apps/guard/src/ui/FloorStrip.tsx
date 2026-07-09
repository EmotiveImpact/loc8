// apps/guard/src/ui/FloorStrip.tsx — the building, on its side.
//
// A vertical cross-section of the venue: one joined cell per level (roof at the
// top, basement at the bottom) showing who's on it and whether something is
// WRONG there — a red dot for an incident/SOS, amber for a caution/lone-worker.
// You see trouble above or below you at a glance, without tabbing through
// floors. Your level carries a blue edge bar; tap any cell to view that floor.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ops, fonts, tint } from './opsTheme';

export interface FloorRow {
  floor: number;
  short: string;
  /** People on this level (teammates + you). */
  count: number;
  /** Active incident / SOS on this level. */
  hasIncident: boolean;
  /** A caution-status guard (e.g. lone-worker) is on this level. */
  hasCaution: boolean;
}

interface Props {
  rows: FloorRow[]; // descending: roof → basement
  viewFloor: number;
  myFloor: number;
  onSelect: (floor: number) => void;
}

export function FloorStrip({ rows, viewFloor, myFloor, onSelect }: Props) {
  return (
    <View style={st.building}>
      {rows.map((r, i) => {
        const active = r.floor === viewFloor;
        const mine = r.floor === myFloor;
        return (
          <Pressable
            key={r.floor}
            onPress={() => onSelect(r.floor)}
            style={[
              st.cell,
              i > 0 && st.cellBorder,
              active && st.cellActive,
            ]}
          >
            {/* blue edge = you are here */}
            {mine && <View style={st.youBar} />}
            <Text style={[st.short, active && { color: '#06070d' }]}>{r.short}</Text>
            <Text style={[st.count, active && { color: 'rgba(6,7,13,0.65)' }]}>
              {r.count > 0 ? r.count : '·'}
            </Text>
            {(r.hasIncident || r.hasCaution) && (
              <View style={st.dots}>
                {r.hasIncident && <View style={[st.dot, { backgroundColor: ops.alert }]} />}
                {r.hasCaution && <View style={[st.dot, { backgroundColor: ops.caution }]} />}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  building: {
    borderRadius: 13, overflow: 'hidden',
    borderWidth: 1, borderColor: ops.line,
    backgroundColor: 'rgba(10,13,21,0.92)',
  },
  cell: {
    width: 46, minHeight: 46, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6,
  },
  cellBorder: { borderTopWidth: 1, borderTopColor: ops.line },
  cellActive: { backgroundColor: tint(ops.info, 0.92) },
  youBar: { position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, backgroundColor: ops.info },
  short: { fontFamily: fonts.monoBold, fontSize: 12, color: ops.ink },
  count: { fontFamily: fonts.mono, fontSize: 9, color: ops.muted, marginTop: 1 },
  dots: { flexDirection: 'row', gap: 3, marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
