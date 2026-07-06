// app/index.tsx — placeholder home until Task 12 builds the radar
import { View, Text } from 'react-native';
import { colors } from '../src/ui/theme';

export default function Home() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>
        Loc<Text style={{ color: colors.pink }}>8</Text>
      </Text>
    </View>
  );
}
