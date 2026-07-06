// app/onboarding.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useCrewStore } from '../src/state/crewStore';
import { colors, FRIEND_COLORS } from '../src/ui/theme';

export default function Onboarding() {
  const [step, setStep] = useState<'profile' | 'location' | 'denied'>('profile');
  const [name, setName] = useState('');
  const [color, setColor] = useState(FRIEND_COLORS[0]);
  const setProfile = useCrewStore((s) => s.setProfile);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setProfile({ id: 1, name: name.trim() || 'You', color }); // triggers root redirect → home
    } else {
      setStep('denied');
    }
  };

  if (step === 'profile') {
    return (
      <View style={st.wrap}>
        <Text style={st.logo}>Loc<Text style={{ color: colors.pink }}>8</Text></Text>
        <Text style={st.tagline}>Find your crew when the signal's gone.</Text>
        <TextInput
          style={st.input} placeholder="Your name" placeholderTextColor={colors.textDim}
          value={name} onChangeText={setName} maxLength={12}
        />
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
          <Text style={st.btnText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'denied') {
    return (
      <View style={st.wrap}>
        <Text style={st.h}>Loc8 can't work without location</Text>
        <Text style={st.p}>
          Your GPS position is how your crew finds you. It's end-to-end encrypted — it never
          leaves your crew. Enable location in Settings to continue.
        </Text>
        <Pressable style={st.btn} onPress={() => Linking.openSettings()}>
          <Text style={st.btnText}>Open Settings</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={requestLocation}>
          <Text style={st.btnGhostText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={st.wrap}>
      <Text style={{ fontSize: 56 }}>📍</Text>
      <Text style={st.h}>Your location, your crew only</Text>
      <Text style={st.p}>
        Loc8 uses your GPS to show your crew where you are — even with zero signal. Your
        location is end-to-end encrypted and never touches a server.
      </Text>
      <Pressable style={st.btn} onPress={requestLocation}>
        <Text style={st.btnText}>Enable location</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  logo: { color: colors.text, fontSize: 42, fontWeight: '800' },
  tagline: { color: colors.textDim, fontSize: 15, marginBottom: 12 },
  h: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  p: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  input: {
    width: '100%', backgroundColor: colors.card, borderRadius: 14, padding: 16,
    color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.cardBorder,
  },
  colorRow: { flexDirection: 'row', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSel: { borderWidth: 3, borderColor: '#fff' },
  btn: {
    width: '100%', backgroundColor: colors.pink, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnGhost: { padding: 12 },
  btnGhostText: { color: colors.textDim, fontSize: 14 },
});
