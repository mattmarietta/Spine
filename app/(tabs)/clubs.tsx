import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { screen } from "../../constants/constants";

export default function ClubsScreen() {
  return (
    <SafeAreaView style={screen.container} edges={["top"]}>
      <Text style={screen.title}>Clubs</Text>
      <Text style={screen.muted}>Coming soon</Text>
    </SafeAreaView>
  );
}
