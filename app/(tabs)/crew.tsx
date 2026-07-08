// app/(tabs)/crew.tsx
import { View, Text, Pressable, StyleSheet, Modal, Alert, ScrollView, TextInput, Share } from 'react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useCrewStore } from '../../src/state/crewStore';
import { useNowSec } from '../../src/hooks/useNowSec';
import { colors, fonts, gradients } from '../../src/ui/theme';
import { AuroraBackground } from '../../src/ui/AuroraBackground';
import { Copy, Share2, ScanLine, Plus, LogOut, X } from 'lucide-react-native';

/** Extract a crew code from a scanned QR value (`loc8://crew/<CODE>` or a bare code). */
function parseCrewCode(raw: string): string {
  const m = raw.match(/loc8:\/\/crew\/(.+)/i);
  return (m ? m[1] : raw).trim();
}

export default function CrewScreen() {
  const now = useNowSec();
  const sessionEndsAtSec = useCrewStore((s) => s.sessionEndsAtSec);
  const startSession = useCrewStore((s) => s.startSession);
  const extendSession = useCrewStore((s) => s.extendSession);
  const endSession = useCrewStore((s) => s.endSession);

  const crew = useCrewStore((s) => s.crew);
  const createCrew = useCrewStore((s) => s.createCrew);
  const joinCrew = useCrewStore((s) => s.joinCrew);
  const leaveCrew = useCrewStore((s) => s.leaveCrew);

  const [joinInput, setJoinInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const remaining = sessionEndsAtSec ? Math.max(0, sessionEndsAtSec - now) : 0;
  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);

  const inviteUrl = crew ? `loc8://crew/${crew.code}` : '';

  const onCopy = async () => {
    if (!crew) return;
    await Clipboard.setStringAsync(crew.code);
    Alert.alert('Copied', `Crew code ${crew.code} copied to clipboard.`);
  };

  const onShare = async () => {
    if (!crew) return;
    try {
      await Share.share({ message: `Join my Loc8 crew — code ${crew.code} · ${inviteUrl}` });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const onCreate = () => {
    const code = createCrew();
    Alert.alert('Crew created', `Your crew code is ${code}. Share it so your friends can join.`);
  };

  const onJoin = () => {
    const code = joinInput.trim();
    if (!code) return;
    joinCrew(code);
    setJoinInput('');
  };

  const openScanner = async () => {
    let granted = permission?.granted ?? false;
    if (!granted) {
      const res = await requestPermission();
      granted = res.granted;
    }
    if (!granted) {
      Alert.alert('Camera needed', 'Allow camera access to scan a crew QR code.');
      return;
    }
    setScanning(true);
  };

  const onScanned = ({ data }: { data: string }) => {
    if (!scanning) return;
    const code = parseCrewCode(data);
    setScanning(false);
    if (code) {
      joinCrew(code);
      Alert.alert('Joined crew', `You joined crew ${code.toUpperCase()}.`);
    }
  };

  return (
    <View style={st.wrap}>
      <AuroraBackground />
      <ScrollView style={st.scroll} contentContainerStyle={st.content}>
        <Text style={st.h1}>Crew &amp; session</Text>

        <BlurView tint="dark" intensity={24} style={st.card}>
          <Text style={st.cardH}>SESSION</Text>
          {sessionEndsAtSec ? (
            <>
              <Text style={st.big}>{hh}h {mm}m left</Text>
              <Text style={st.p}>Auto-expires — you'll stop broadcasting automatically.</Text>
              <View style={st.row}>
                <Pressable style={st.btnGhost} onPress={() => extendSession(2)}>
                  <Text style={st.btnGhostText}>+2h</Text>
                </Pressable>
                <Pressable style={[st.btnGhost, { borderColor: colors.danger }]} onPress={endSession}>
                  <Text style={[st.btnGhostText, { color: colors.danger }]}>End now</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={st.p}>Not broadcasting. Start a session to become findable.</Text>
              <View style={st.row}>
                {[4, 6, 12].map((h) => (
                  <Pressable key={h} style={st.btnWrap} onPress={() => startSession(h)}>
                    <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btn}>
                      <Text style={st.btnText}>{h}h</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </BlurView>

        {crew ? (
          <BlurView tint="dark" intensity={24} style={st.card}>
            <Text style={st.cardH}>YOUR CREW</Text>
            <Text style={st.code}>{crew.code}</Text>
            <Text style={st.p}>Anyone who enters this code — and only them — appears on your radar. Private, no server.</Text>
            <View style={st.qr}>
              <QRCode value={inviteUrl} size={150} backgroundColor="#fff" color="#12141f" />
            </View>
            <View style={st.row}>
              <Pressable style={[st.btnGhost, { flex: 1 }]} onPress={onCopy}>
                <Copy size={16} color={colors.text} strokeWidth={2} />
                <Text style={st.btnGhostText}>Copy code</Text>
              </Pressable>
              <Pressable style={[st.btnWrap, { flex: 1 }]} onPress={onShare}>
                <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btn}>
                  <Share2 size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={st.btnText}>Share invite</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <Pressable style={st.btnGhost} onPress={leaveCrew}>
              <LogOut size={16} color={colors.textDim} strokeWidth={2} />
              <Text style={[st.btnGhostText, { color: colors.textDim }]}>Leave crew</Text>
            </Pressable>
          </BlurView>
        ) : (
          <BlurView tint="dark" intensity={24} style={st.card}>
            <Text style={st.cardH}>YOUR CREW</Text>
            <Text style={st.p}>Start a crew and share the code, or join one your friends already made.</Text>
            <Pressable style={st.btnWrap} onPress={onCreate}>
              <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btn}>
                <Plus size={16} color="#fff" strokeWidth={2.5} />
                <Text style={st.btnText}>Create a crew</Text>
              </LinearGradient>
            </Pressable>

            <View style={st.divider} />

            <Text style={st.cardH}>JOIN A CREW</Text>
            <View style={st.joinRow}>
              <TextInput
                style={st.input}
                placeholder="Enter code"
                placeholderTextColor={colors.textDim}
                value={joinInput}
                onChangeText={setJoinInput}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
              />
              <Pressable
                style={[st.btnWrap, !joinInput.trim() && { opacity: 0.4 }]}
                disabled={!joinInput.trim()}
                onPress={onJoin}
              >
                <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btn}>
                  <Text style={st.btnText}>Join</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <Pressable style={st.btnGhost} onPress={openScanner}>
              <ScanLine size={16} color={colors.text} strokeWidth={2} />
              <Text style={st.btnGhostText}>Scan QR</Text>
            </Pressable>
          </BlurView>
        )}

        <Modal visible={scanning} animationType="slide" onRequestClose={() => setScanning(false)}>
          <View style={st.scanWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={onScanned}
            />
            <View style={st.scanOverlay}>
              <View style={st.scanFrame} />
              <Text style={st.scanText}>Point at a crew QR code</Text>
            </View>
            <Pressable style={st.scanClose} onPress={() => setScanning(false)}>
              <X size={22} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 130, gap: 14 },
  h1: { color: colors.text, fontSize: 24, fontFamily: fonts.display },
  card: {
    borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.glass, overflow: 'hidden',
  },
  cardH: { color: colors.textDim, fontSize: 11, fontFamily: fonts.bodySemi, letterSpacing: 1 },
  big: { color: colors.text, fontSize: 28, fontFamily: fonts.display },
  code: { color: colors.text, fontSize: 34, fontFamily: fonts.display, letterSpacing: 2 },
  p: { color: colors.textDim, fontSize: 13, lineHeight: 19, fontFamily: fonts.body },
  row: { flexDirection: 'row', gap: 10 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
  btnWrap: { borderRadius: 12, overflow: 'hidden' },
  btn: { flexDirection: 'row', gap: 8, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 },
  btnGhost: { flexDirection: 'row', gap: 8, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  btnGhostText: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14 },
  qr: {
    alignSelf: 'center', width: 178, height: 178, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginVertical: 4,
  },
  joinRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  input: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.glass,
    paddingHorizontal: 14, color: colors.text, fontSize: 15, fontFamily: fonts.bodyMed,
  },
  scanWrap: { flex: 1, backgroundColor: '#000' },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 20 },
  scanFrame: { width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: '#fff' },
  scanText: { color: '#fff', fontSize: 15, fontFamily: fonts.bodySemi },
  scanClose: {
    position: 'absolute', top: 60, right: 24, width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
});
