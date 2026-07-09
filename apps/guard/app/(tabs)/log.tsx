// Incident log — quick-tag type, auto-filled location, log & alert the team
// over the mesh (gallery-guard §5). The broadcast IS the engine's crew-message
// path: the same fragmented free-text Guard/Command/consumer all reassemble.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { getMeshService, useCrewStore, encodePlusCode } from '@loc8/engine';
import { INCIDENT_TYPES, useGuardStore, type IncidentType } from '../../src/store/guardStore';
import { GradientBtn, MeshBadge } from '../../src/ui/kit';
import { fonts, g } from '../../src/theme';

const nowSec = () => Math.floor(Date.now() / 1000);

const TONE: Record<IncidentType, 'alert' | 'caution' | 'ok' | 'info'> = {
  Fight: 'alert',
  Medical: 'alert',
  Ejection: 'info',
  Suspicious: 'caution',
  'Lost person': 'ok',
};
const TONE_COLOR = { alert: g.alert, caution: g.caution, ok: g.ok, info: g.info } as const;

export default function IncidentLog() {
  const [selected, setSelected] = useState<IncidentType>('Fight');
  const log = useGuardStore((s) => s.log);
  const logIncident = useGuardStore((s) => s.logIncident);
  const myLocation = useCrewStore((s) => s.myLocation);
  const place = 'Bar · your position';
  const coords = myLocation
    ? `${myLocation.latitude.toFixed(4)}, ${myLocation.longitude.toFixed(4)}`
    : 'acquiring…';

  const send = () => {
    const at = nowSec();
    logIncident({ type: selected, place: 'Bar', atSec: at, byLabel: 'Guard 07', tone: TONE[selected] });
    // Broadcast over the mesh as team comms — plus code keeps it short + precise.
    const pin = myLocation ? ` @ ${encodePlusCode(myLocation.latitude, myLocation.longitude)}` : '';
    getMeshService().sendCrewMessage(`INCIDENT ${selected.toUpperCase()} — Bar${pin}`);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.hdr}>
        <View>
          <Text style={styles.title}>Log incident</Text>
          <Text style={styles.sub}>YOU · Guard 07</Text>
        </View>
        <MeshBadge />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>TYPE</Text>
        <View style={styles.chips}>
          {INCIDENT_TYPES.map((t) => {
            const on = t === selected;
            return (
              <Pressable
                key={t}
                onPress={() => setSelected(t)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>LOCATION</Text>
        <View style={styles.locfield}>
          <MapPin size={18} color={g.info} strokeWidth={2} />
          <View>
            <Text style={styles.locB}>{place}</Text>
            <Text style={styles.locSub}>auto-filled · {coords}</Text>
          </View>
        </View>

        <GradientBtn kind="danger" title="Log & alert team" onPress={send} style={{ marginTop: 14 }} />

        <Text style={styles.section}>RECENT</Text>
        <View style={{ gap: 7 }}>
          {log.length === 0 && <Text style={styles.empty}>Nothing logged this shift.</Text>}
          {log.map((e) => (
            <View key={e.id} style={styles.ritem}>
              <View style={[styles.fdot, { backgroundColor: TONE_COLOR[e.tone] }]} />
              <View>
                <Text style={styles.rtext}>
                  {e.type} — {e.place}
                </Text>
                <Text style={styles.rsub}>
                  {new Date(e.atSec * 1000).toTimeString().slice(0, 5)} · {e.byLabel}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  section: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: g.faint,
    marginTop: 16,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: g.panel,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: g.alertBg, borderColor: g.alertBorder },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: g.muted },
  chipTextOn: { color: g.ink },
  locfield: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: g.panel,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  locB: { fontFamily: fonts.bodySemi, fontSize: 13, color: g.ink },
  locSub: { fontFamily: fonts.mono, fontSize: 10, color: g.muted, marginTop: 2 },
  ritem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: g.panel2,
    borderColor: g.line,
    borderWidth: 1,
    borderRadius: 10,
    padding: 11,
  },
  fdot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  rtext: { fontFamily: fonts.body, fontSize: 12, color: g.ink },
  rsub: { fontFamily: fonts.mono, fontSize: 9, color: g.faint, marginTop: 3 },
  empty: { fontFamily: fonts.mono, fontSize: 11, color: g.faint },
});
