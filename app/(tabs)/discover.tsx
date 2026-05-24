import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { screen } from "../../constants/constants";

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={screen.container} edges={["top"]}>
      <Text style={screen.title}>Discover</Text>
      <Text style={screen.muted}>Coming soon</Text>
    </SafeAreaView>
  );
}
