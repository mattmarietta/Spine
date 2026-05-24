import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/colors";

export default function NotFoundScreen() {
  return (
    <View style={s.container}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} style={s.icon} />
      <Text style={s.title}>Page not found</Text>
      <TouchableOpacity onPress={() => router.replace("/(tabs)/")}>
        <Text style={s.link}>Go home</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { marginBottom: 16 },
  title: { fontSize: 20, color: COLORS.text, marginBottom: 16 },
  link: { fontSize: 15, color: COLORS.primary },
});
