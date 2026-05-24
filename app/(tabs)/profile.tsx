import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { screen } from "../../constants/constants";
import { COLORS, RADIUS } from "../../constants/colors";
import { useAuthStore } from "../../store/stores";

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  return (
    <SafeAreaView style={screen.container} edges={["top"]}>
      <Text style={screen.title}>Profile</Text>
      <Text style={s.name}>{profile?.display_name}</Text>
      <Text style={s.username}>@{profile?.username}</Text>
      <TouchableOpacity style={s.signOut} onPress={signOut}>
        <Text style={s.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  name: { fontSize: 18, fontWeight: "500", color: COLORS.text, marginBottom: 4 },
  username: { fontSize: 14, color: COLORS.textMuted, marginBottom: 32 },
  signOut: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
    alignItems: "center",
  },
  signOutText: { fontSize: 14, color: COLORS.textSecondary },
});
