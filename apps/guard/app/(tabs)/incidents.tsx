// apps/guard/app/(tabs)/incidents.tsx — Incident log / report (gallery screen 5).
// Quick-tag a type, location auto-fills from your position, one tap logs it and
// alerts the team over the mesh (engine free-text), then a live recent feed.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { useCrewStore, getMeshService, haptics, opsMsg } from '@loc8/engine';
import { ops, fonts, tint } from '../../src/ui/opsTheme';
import { OpsBackground } from '../../src/ui/OpsBackground';
import { GuardHeader } from '../../src/ui/GuardHeader';
import { useGuardStore, badgeLabel, INCIDENT_TYPES, type IncidentType } from '../../src/state/guardStore';
import { levelName } from '../../src/state/guardTeam';
import { useNowSec } from '../../src/hooks/useNowSec';

function fmtClock(sec: number): string {
  const d = new Date(sec * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const COLOR: Record<IncidentType, string> = {
  Fight: ops.alert,
  Medical: ops.alert,
  Ejection: ops.info,
  Suspicious: ops.caution,
  'Lost person': ops.ok,
};

export default function Incidents() {
  const insets = useSafeAreaInsets();
  const now = useNowSec();
  const me = useCrewStore((s) => s.myLocation);
  const myFloor = useCrewStore((s) => s.myFloor);
  const shift = useGuardStore((s) => s.shift);
  const badge = useGuardStore((s) => s.badge);
  const incidents = useGuardStore((s) => s.incidents);
  const logIncident = useGuardStore((s) => s.logIncident);

  const [type, setType] = useState<IncidentType>('Fight');

  const locLabel = shift.zone;
  const coords = me ? `${me.latitude.toFixed(4)}, ${me.longitude.toFixed(4)}` : 'locating…';

  const log = () => {
    haptics.warning();
    logIncident(type, locLabel, `Guard ${badgeLabel(badge)}`, myFloor, now);
    getMeshService().sendCrewMessage(opsMsg.incident(type, levelName(myFloor), locLabel));
  };

  return (
    <View style={st.wrap}>
      <OpsBackground />
      <View style={{ paddingTop: insets.top + 8 }}>
        <GuardHeader title="Log incident" />
      </View>
      <ScrollView contentContainerStyle={[st.content, { paddingBottom: insets.bottom + 96 }]}>
        <Text style={st.ttl}>TYPE</Text>
        <View style={st.chips}>
          {INCIDENT_TYPES.map((t) => {
            const on = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => { haptics.select(); setType(t); }}
                style={[st.chip, on && { backgroundColor: tint(ops.alert, 0.14), borderColor: tint(ops.alert, 0.5) }]}
              >
                <Text style={[st.chipTxt, on && { color: ops.ink }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={st.ttl}>LOCATION</Text>
        <View style={st.locField}>
          <MapPin size={18} color={ops.info} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={st.locName}>{levelName(myFloor)} · {locLabel} · your position</Text>
            <Text style={st.locCoords}>auto-filled · {coords}</Text>
          </View>
        </View>

        <Pressable style={st.logBtn} onPress={log}>
          <Text style={st.logBtnTxt}>Log &amp; alert team</Text>
        </Pressable>

        <Text style={st.ttl}>RECENT</Text>
        <View style={st.recent}>
          {incidents.length === 0 && <Text style={st.noneTxt}>No incidents logged this shift.</Text>}
          {incidents.map((i) => (
            <View key={i.id} style={st.ritem}>
              <View style={[st.fdot, { backgroundColor: COLOR[i.type] }]} />
              <View style={{ flex: 1 }}>
                <Text style={st.ritemTxt}>{i.type} — {levelName(i.floor)} · {i.location}</Text>
                <Text style={st.ritemSub}>{fmtClock(i.atSec)} · {i.byLabel}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: ops.bg },
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 4 },
  ttl: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1.5, color: ops.faint, marginTop: 16, marginBottom: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line },
  chipTxt: { color: ops.muted, fontFamily: fonts.bodySemi, fontSize: 12 },
  locField: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: ops.panel, borderWidth: 1, borderColor: ops.line, borderRadius: 12, padding: 12,
  },
  locName: { color: ops.ink, fontFamily: fonts.bodySemi, fontSize: 13 },
  locCoords: { color: ops.muted, fontFamily: fonts.mono, fontSize: 10, marginTop: 2 },
  logBtn: { marginTop: 16, backgroundColor: ops.alert, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  logBtnTxt: { color: '#fff', fontFamily: fonts.display, fontSize: 14 },
  recent: { gap: 7 },
  noneTxt: { color: ops.faint, fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic' },
  ritem: {
    flexDirection: 'row', gap: 9, alignItems: 'center',
    backgroundColor: ops.panel2, borderWidth: 1, borderColor: ops.line, borderRadius: 10, padding: 9,
  },
  fdot: { width: 8, height: 8, borderRadius: 4 },
  ritemTxt: { color: ops.ink, fontSize: 12, fontFamily: fonts.bodySemi },
  ritemSub: { color: ops.faint, fontFamily: fonts.mono, fontSize: 9, marginTop: 2 },
});
