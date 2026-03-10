/**
 * Design system tokens for programmatic use (tab bar styling, status bar, etc.)
 * These values mirror the Tailwind theme in tailwind.config.js.
 * For component styling, prefer NativeWind className props.
 */

export const colors = {
  golden: {
    DEFAULT: "#C8A951",
    light: "#D4B86A",
    dark: "#D4A843",
    50: "#FDF8EC",
    100: "#F9EDCC",
    500: "#C8A951",
    600: "#D4A843",
    700: "#B8952E",
  },
  navy: {
    DEFAULT: "#1B2B4B",
    light: "#2A3F6B",
    dark: "#111D35",
    50: "#E8ECF3",
    500: "#1B2B4B",
    700: "#111D35",
    900: "#0A1122",
  },
  cream: {
    DEFAULT: "#FFF9F0",
    50: "#FFFDFB",
    100: "#FFF9F0",
    200: "#FFF3E0",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;
