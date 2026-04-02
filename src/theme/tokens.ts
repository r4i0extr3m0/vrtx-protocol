export const ironPalette = {
  background: "#0B0D10",
  surface: "#151A20",
  surfaceAlt: "#1B2129",
  textPrimary: "#F4F7FB",
  textSecondary: "#97A6B5",
  border: "#28313B",
  accent: "#7CC6FF",
  accentStrong: "#4AA8F0",
  success: "#39D98A",
  warning: "#F5B942",
  error: "#FF6B6B",
} as const;

export const lightPalette = {
  background: "#F3F6F9",
  surface: "#FFFFFF",
  surfaceAlt: "#E8EEF4",
  textPrimary: "#0F1720",
  textSecondary: "#5E6C79",
  border: "#D5DEE8",
  accent: "#2376B7",
  accentStrong: "#145A91",
  success: "#1FA764",
  warning: "#BA7A12",
  error: "#CF4B4B",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  hero: 30,
  title: 24,
  section: 18,
  body: 15,
  caption: 12,
  metric: 28,
} as const;

export type IronPalette = typeof ironPalette;
