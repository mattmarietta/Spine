import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

export default function SearchScreen() {
  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Search Books</Text>
      </View>
      <Text style={s.placeholder}>Coming soon</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24, marginTop: 8 },
  back: { padding: 2 },
  title: { fontSize: 20, fontFamily: "Georgia", color: COLORS.text, fontWeight: "500" },
  placeholder: { fontSize: 14, color: COLORS.textMuted },
});
