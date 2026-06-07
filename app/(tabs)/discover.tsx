import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { screen } from '../../constants/constants';

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={screen.container} edges={['top']}>
      <Text style={screen.title}>Discover</Text>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontFamily: 'Georgia', color: COLORS.text, marginBottom: 8 }}>
          Coming soon
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center' }}>
          Book recommendations based on your shelf and what your friends are reading.
        </Text>
      </View>
    </SafeAreaView>
  );
}
