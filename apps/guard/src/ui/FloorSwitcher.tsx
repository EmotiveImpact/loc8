// apps/guard/src/ui/FloorSwitcher.tsx — vertical floor selector for the team map.
// Lists the floors that have people (top floor first); tap one to view that
// level. The floor you're physically on is marked with a dot; each shows a count.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { floorShort } from '@loc8/engine';
import { ops, fonts, tint } from './opsTheme';

interface Props {
  floors: number[];      // descending (roof → basement)
  viewFloor: number;     // currently shown
  myFloor: number;       // where you are
  countByFloor: Record<number, number>;
  onSelect: (floor: number) => void;
}

export function FloorSwitcher({ floors, viewFloor, myFloor, countByFloor, onSelect }: Props) {
  return (
    <View style={st.wrap} pointerEvents="box-none">
      {floors.map((f) => {
        const active = f === viewFloor;
        const mine = f === myFloor;
        const count = countByFloor[f] ?? 0;
        return (
          <Pressable
            key={f}
            onPress={() => onSelect(f)}
            style={[
              st.cell,
              active && { backgroundColor: tint(ops.info, 0.9), borderColor: ops.info },
            ]}
          >
            <Text style={[st.floor, active && { color: '#06070d' }]}>{floorShort(f)}</Text>
            {count > 0 && (
              <Text style={[st.count, active && { color: 'rgba(6,7,13,0.7)' }]}>{count}</Text>
            )}
            {mine && <View style={[st.dot, active && { backgroundColor: '#06070d' }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 6, alignItems: 'center' },
  cell: {
    width: 40, minHeight: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,13,21,0.9)', borderWidth: 1, borderColor: ops.line, paddingVertical: 5,
  },
  floor: { fontFamily: fonts.monoBold, fontSize: 14, color: ops.ink },
  count: { fontFamily: fonts.mono, fontSize: 8, color: ops.muted, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: ops.info, marginTop: 2 },
});
