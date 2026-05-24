import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";

export default function BookScreen() {
  const { id } = useLocalSearchParams();
  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <TouchableOpacity onPress={() => router.back()} style={s.back}>
        <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={s.title}>Book Detail</Text>
      <Text style={s.sub}>Coming soon</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 18 },
  back: { marginBottom: 16, marginTop: 8 },
  title: {
    fontSize: 26,
    fontFamily: "Georgia",
    color: COLORS.text,
    fontWeight: "500",
    marginBottom: 8,
  },
  sub: { fontSize: 13, color: COLORS.textMuted },
});
