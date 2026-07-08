// app/rally.tsx — the Rally meet-up screen (presented as a modal).
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useCrewStore, freshnessSec, GHOST_SEC } from '@loc8/engine';
import { getMeshService } from '@loc8/engine';
import { haptics } from '@loc8/engine';
import { getHaversineDistance } from '@loc8/engine';
import { encodePlusCode } from '@loc8/engine';
import { useNowSec } from '../src/hooks/useNowSec';
import { AuroraBackground } from '../src/ui/AuroraBackground';
import { colors, gradients, fonts } from '@loc8/engine';
import { Flag, Navigation, Copy, Check, X, Trash2 } from 'lucide-react-native';

const ARRIVED_M = 15;

export default function RallyScreen() {
  const router = useRouter();
  const now = useNowSec();
  const rallyPin = useCrewStore((s) => s.rallyPin);
  const myLocation = useCrewStore((s) => s.myLocation);
  const friends = useCrewStore((s) => s.friends);
  const clearRally = useCrewStore((s) => s.clearRally);
  const [copied, setCopied] = useState(false);

  const pinCoord = rallyPin ? { latitude: rallyPin.latitude, longitude: rallyPin.longitude } : null;
  const myDist = pinCoord && myLocation ? getHaversineDistance(myLocation, pinCoord) : null;
  const code = pinCoord ? encodePlusCode(pinCoord.latitude, pinCoord.longitude) : '—';

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const arrivals = Object.values(friends)
    .filter((f) => f.lastPacket && (freshnessSec(f, now) ?? Infinity) <= GHOST_SEC)
    .map((f) => {
      const d = pinCoord && f.lastPacket
        ? getHaversineDistance({ latitude: f.lastPacket.latitude, longitude: f.lastPacket.longitude }, pinCoord)
        : null;
      return { id: f.id, name: f.name, color: f.color, dist: d };
    });

  return (
    <View style={st.wrap}>
      <AuroraBackground />
      <Pressable style={st.close} onPress={() => router.back()}>
        <X size={18} color={colors.text} strokeWidth={2} />
      </Pressable>

      <ScrollView contentContainerStyle={st.content}>
        <LinearGradient colors={gradients.rally} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
          <Flag size={30} color="#1a0a10" strokeWidth={2.4} />
        </LinearGradient>

        {!rallyPin ? (
          <>
            <Text style={st.h1}>Set a meet-up point</Text>
            <Text style={st.p}>
              Drop a rally pin where you're standing. Your crew sees it on their radar and can navigate straight to it — no signal needed.
            </Text>
            <Pressable style={st.goldBtn} onPress={() => { haptics.rallyDrop(); getMeshService().dropRally(); }}>
              <Flag size={18} color="#1a0a10" strokeWidth={2.4} />
              <Text style={st.goldBtnText}>Drop rally here</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={st.h1}>Everyone meet here</Text>
            <Text style={st.dist}>{myDist !== null ? `${Math.round(myDist)}m away` : 'Location unknown'}</Text>

            <Pressable style={st.goldBtn} onPress={() => { /* navigate affordance — radar shows the pin */ router.back(); }}>
              <Navigation size={18} color="#1a0a10" strokeWidth={2.4} fill="#1a0a10" />
              <Text style={st.goldBtnText}>Navigate on radar</Text>
            </Pressable>

            <View style={st.card}>
              <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
              <Text style={st.cardH}>CREW · {arrivals.length}</Text>
              {arrivals.length === 0 ? (
                <Text style={st.p}>No crew in range yet.</Text>
              ) : (
                arrivals.map((a) => {
                  const arrived = a.dist !== null && a.dist < ARRIVED_M;
                  return (
                    <View key={a.id} style={st.crewRow}>
                      <View style={[st.av, { backgroundColor: a.color }]}>
                        <Text style={st.avText}>{a.name[0]}</Text>
                      </View>
                      <Text style={st.crewName}>{a.name}</Text>
                      <Text style={[st.crewStatus, { color: arrived ? colors.teal : colors.textDim }]}>
                        {a.dist === null ? '—' : arrived ? 'arrived' : `walking · ${Math.round(a.dist)}m`}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>

            <View style={st.card}>
              <BlurView tint="dark" intensity={24} style={StyleSheet.absoluteFill} />
              <Text style={st.cardH}>PLUS CODE</Text>
              <Text style={st.code}>{code}</Text>
              <View style={st.row}>
                <Pressable style={st.ghostBtn} onPress={copy}>
                  {copied ? <Check size={16} color={colors.text} strokeWidth={2.5} /> : <Copy size={16} color={colors.text} strokeWidth={2} />}
                  <Text style={st.ghostText}>{copied ? 'Copied' : 'Copy'}</Text>
                </Pressable>
                <Pressable
                  style={st.ghostBtn}
                  onPress={() => Share.share({ message: `Rally point: ${code} — shared from Loc8` })}
                >
                  <Text style={st.ghostText}>Share…</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={st.clearBtn} onPress={() => { clearRally(); router.back(); }}>
              <Trash2 size={16} color={colors.danger} strokeWidth={2} />
              <Text style={st.clearText}>Clear rally</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  close: { position: 'absolute', top: 16, right: 18, zIndex: 5, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingTop: 40, gap: 14, alignItems: 'center' },
  hero: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.gold, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  h1: { color: colors.text, fontSize: 24, fontFamily: fonts.display, textAlign: 'center' },
  dist: { color: colors.gold, fontSize: 30, fontFamily: fonts.display, textAlign: 'center' },
  p: { color: colors.textDim, fontSize: 14, lineHeight: 21, textAlign: 'center', fontFamily: fonts.body },
  goldBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 22, alignSelf: 'stretch' },
  goldBtnText: { color: '#1a0a10', fontFamily: fonts.bodyBold, fontSize: 15 },
  card: { alignSelf: 'stretch', backgroundColor: colors.glass, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cardH: { color: colors.textDim, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  crewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  av: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avText: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 13 },
  crewName: { color: colors.text, fontSize: 14, fontFamily: fonts.bodySemi, flex: 1 },
  crewStatus: { fontSize: 12, fontFamily: fonts.bodySemi },
  code: {
    color: colors.gold, fontSize: 26, fontFamily: fonts.monoBold, textAlign: 'center', letterSpacing: 1,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16,
  },
  row: { flexDirection: 'row', gap: 10 },
  ghostBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.cardBorder },
  ghostText: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  clearText: { color: colors.danger, fontFamily: fonts.bodySemi, fontSize: 14 },
});
