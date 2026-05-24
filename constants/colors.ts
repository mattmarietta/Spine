export const COLORS = {
  // Backgrounds
  background: "#F7F2E8", // warm parchment
  surface: "#EDE8DF", // slightly darker surface
  surfaceRaised: "#E5DFD4", // cards, modals
  overlay: "rgba(28, 22, 18, 0.5)",

  // Brand
  primary: "#2D5A41", // forest green — main action color
  primaryLight: "#3D7A58",
  primaryMuted: "rgba(45, 90, 65, 0.12)",
  accent: "#C9892B", // warm gold — ratings, XP, streaks

  // Text
  text: "#1C1612", // near-black, warm
  textSecondary: "#6B5D4F", // medium warm brown
  textMuted: "#9B8B7A", // muted text, placeholders

  // Borders & dividers
  border: "#D4C5B2",
  borderLight: "#E0D8CE",

  // Semantic
  success: "#2D7A4F",
  warning: "#C9892B",
  error: "#B03A2E",
  info: "#2C5F7A",

  // Always white/black regardless of theme
  white: "#FFFFFF",
  black: "#000000",
};

export const FONTS = {
  sans: "System", // swap for a custom font later
  serif: "Georgia", // book titles, headers
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  page: 18, // standard horizontal page padding
};

export const SHADOW = {
  sm: {
    shadowColor: "#1C1612",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#1C1612",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
};
