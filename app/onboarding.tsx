// app/onboarding.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useCrewStore } from '../src/state/crewStore';
import { colors, fonts, gradients, FRIEND_COLORS } from '../src/ui/theme';
import { AuroraBackground } from '../src/ui/AuroraBackground';
import { MapPin, Plus } from 'lucide-react-native';

// Unique per-install uint32 id (avoid 0) so phones never collide on the mesh.
const newId = () => (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;

export default function Onboarding() {
  const [step, setStep] = useState<'profile' | 'location' | 'denied' | 'crew'>('profile');
  const [name, setName] = useState('');
  const [color, setColor] = useState(FRIEND_COLORS[0]);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [joinInput, setJoinInput] = useState('');
  const setProfile = useCrewStore((s) => s.setProfile);
  const crew = useCrewStore((s) => s.crew);
  const createCrew = useCrewStore((s) => s.createCrew);
  const joinCrew = useCrewStore((s) => s.joinCrew);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setPendingId(newId());
      setStep('crew'); // optional crew step before we commit the profile
    } else {
      setStep('denied');
    }
  };

  // Committing the profile is the gate that exits onboarding (root redirect → home).
  const finish = () => {
    setProfile({ id: pendingId ?? newId(), name: name.trim() || 'You', color });
  };

  if (step === 'profile') {
    return (
      <View style={st.wrap}>
        <AuroraBackground />
        <Text style={st.logo}>Loc<Text style={{ color: colors.pink }}>8</Text></Text>
        <Text style={st.tagline}>Find your crew when the signal's gone.</Text>
        <BlurView tint="dark" intensity={24} style={st.inputWrap}>
          <TextInput
            style={st.input} placeholder="Your name" placeholderTextColor={colors.textDim}
            value={name} onChangeText={setName} maxLength={12}
          />
        </BlurView>
        <View style={st.colorRow}>
          {FRIEND_COLORS.map((c) => (
            <Pressable
              key={c} onPress={() => setColor(c)}
              style={[st.swatch, { backgroundColor: c }, color === c && st.swatchSel]}
            />
          ))}
        </View>
        <Pressable
          style={[st.btn, !name.trim() && { opacity: 0.4 }]}
          disabled={!name.trim()}
          onPress={() => setStep('location')}
        >
          <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btnInner}>
            <Text style={st.btnText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  if (step === 'denied') {
    return (
      <View style={st.wrap}>
        <AuroraBackground />
        <Text style={st.h}>Loc8 can't work without location</Text>
        <Text style={st.p}>
          Your GPS position is how your crew finds you. It's end-to-end encrypted — it never
          leaves your crew. Enable location in Settings to continue.
        </Text>
        <Pressable style={st.btn} onPress={() => Linking.openSettings()}>
          <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btnInner}>
            <Text style={st.btnText}>Open Settings</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={requestLocation}>
          <Text style={st.btnGhostText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'crew') {
    return (
      <View style={st.wrap}>
        <AuroraBackground />
        <Text style={st.h}>Create or join your crew</Text>
        <Text style={st.p}>
          A crew is a private code. Everyone who enters the same code — and only them — sees
          each other on the radar. You can do this later in Crew.
        </Text>

        {crew ? (
          <>
            <BlurView tint="dark" intensity={24} style={st.inputWrap}>
              <Text style={st.crewCode}>{crew.code}</Text>
            </BlurView>
            <Text style={st.p}>Share this code with your crew so they can join.</Text>
            <Pressable style={st.btn} onPress={finish}>
              <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btnInner}>
                <Text style={st.btnText}>Continue</Text>
              </LinearGradient>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={st.btn} onPress={() => createCrew()}>
              <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btnInner}>
                <Plus size={16} color="#fff" strokeWidth={2.5} />
                <Text style={st.btnText}>Create a crew</Text>
              </LinearGradient>
            </Pressable>
            <BlurView tint="dark" intensity={24} style={st.inputWrap}>
              <TextInput
                style={st.input} placeholder="Or enter a crew code" placeholderTextColor={colors.textDim}
                value={joinInput} onChangeText={setJoinInput}
                autoCapitalize="characters" autoCorrect={false} maxLength={12}
              />
            </BlurView>
            <Pressable
              style={[st.btnGhostFull, !joinInput.trim() && { opacity: 0.4 }]}
              disabled={!joinInput.trim()}
              onPress={() => { joinCrew(joinInput); finish(); }}
            >
              <Text style={st.btnGhostText}>Join crew</Text>
            </Pressable>
            <Pressable style={st.btnGhost} onPress={finish}>
              <Text style={st.btnGhostText}>Skip for now</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={st.wrap}>
      <AuroraBackground />
      <MapPin size={56} color={colors.pink} strokeWidth={2} />
      <Text style={st.h}>Your location, your crew only</Text>
      <Text style={st.p}>
        Loc8 uses your GPS to show your crew where you are — even with zero signal. Your
        location is end-to-end encrypted and never touches a server.
      </Text>
      <Pressable style={st.btn} onPress={requestLocation}>
        <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btnInner}>
          <Text style={st.btnText}>Enable location</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  logo: { color: colors.text, fontSize: 42, fontFamily: fonts.display },
  tagline: { color: colors.textDim, fontSize: 15, marginBottom: 12, fontFamily: fonts.bodyMed, textAlign: 'center' },
  h: { color: colors.text, fontSize: 22, fontFamily: fonts.display, textAlign: 'center' },
  p: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21, fontFamily: fonts.body },
  inputWrap: {
    width: '100%', borderRadius: 14, overflow: 'hidden',
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line,
  },
  input: { padding: 16, color: colors.text, fontSize: 16, fontFamily: fonts.body },
  crewCode: { padding: 16, color: colors.text, fontSize: 28, fontFamily: fonts.display, letterSpacing: 2, textAlign: 'center' },
  btnGhostFull: { width: '100%', padding: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.line },
  colorRow: { flexDirection: 'row', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSel: { borderWidth: 3, borderColor: '#fff' },
  btn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnInner: { padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 16 },
  btnGhost: { padding: 12 },
  btnGhostText: { color: colors.textDim, fontSize: 14, fontFamily: fonts.bodySemi },
});
