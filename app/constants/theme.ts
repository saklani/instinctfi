import { Platform } from "react-native"

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#687076",
    background: "#FFFFFF",
    surface: "#F8F9FA",
    surfaceElevated: "#FFFFFF",
    tint: "#0066FF",
    positive: "#00C853",
    negative: "#FF3B30",
    border: "#E8EAED",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: "#0066FF",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: "#0D0D0D",
    surface: "#1A1A1A",
    surfaceElevated: "#242424",
    tint: "#4DA3FF",
    positive: "#4ADE80",
    negative: "#F87171",
    border: "#2A2A2A",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#4DA3FF",
  },
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
}

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
})
