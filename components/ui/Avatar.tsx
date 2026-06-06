import { Image, StyleSheet, Text, View } from "react-native";

interface Props {
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
}

// Deterministic colors so the same person always gets the same color.
// Pulled from the app's brand palette so they feel intentional, not random.
const PALETTE = ["#2D5A41", "#C9892B", "#2C5F7A", "#7A3D6B", "#6B5A2D"];

function pickColor(name: string): string {
  const sum = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function Avatar({ displayName, avatarUrl, size = 40 }: Props) {
  const radius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      style={[
        s.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: pickColor(displayName),
        },
      ]}
    >
      <Text style={[s.initials, { fontSize: size * 0.38 }]}>
        {getInitials(displayName)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
