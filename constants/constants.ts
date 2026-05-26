// Shared screen-level style primitives.
// Per-screen styles still live in each file's StyleSheet.create — these are
// the cross-cutting bits (container chrome, screen title typography, etc.)
// that every tab/screen reuses.

import { StyleSheet } from "react-native";
import { COLORS, SPACING } from "./colors";

export const screen = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.page,
  },
  title: {
    fontSize: 26,
    fontFamily: "Georgia",
    fontWeight: "500",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  muted: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
