export const colors = {
  dark: {
    // Ultra-dark grayscale (Linear/Family style)
    background: "#0D0D0D",
    surface: "#121212",
    surfaceAlt: "#1A1A1A",
    surfaceElevated: "#242424",
    
    foreground: "#F4F7FB",
    foregroundMuted: "#E0E6ED",
    muted: "#8A949E",
    
    border: "#333333",
    borderStrong: "#444444",
    borderThin: "rgba(51, 51, 51, 0.5)", // 0.5px equivalent opacity if needed
    
    // Brand & Semantic
    primary: "#7CC6FF",
    primaryStrong: "#4AA8F0",
    primaryGradient: ["#1A1A1A", "#121212"], // Industrial card gradient
    bgGradient: ["#121212", "#080808"], // Radial/Linear bg gradient
    brandGradient: ["#7CC6FF", "#4AA8F0"],
    
    success: "#39D98A",
    successGradient: ["#39D98A", "#2EAF6F"],
    warning: "#F5B942",
    error: "#FF6B6B",
    info: "#7CC6FF",
    
    // Shadows & Blurs
    cardShadow: "rgba(0, 0, 0, 0.6)",
    glow: "rgba(124, 198, 255, 0.15)",

    // Accents for custom themes
    accents: {
      blue: "#7CC6FF",
      purple: "#BF7CFF",
      orange: "#FF9F7C",
      green: "#39D98A",
      pink: "#FF7CBF",
    }
  },
  light: {
    background: "#F3F6F9",
    surface: "#FFFFFF",
    surfaceAlt: "#E8EEF4",
    surfaceElevated: "#F8FAFC",
    
    foreground: "#0F1720",
    foregroundMuted: "#1A2633",
    muted: "#5E6C79",
    
    border: "rgba(0, 0, 0, 0.06)",
    borderStrong: "rgba(0, 0, 0, 0.12)",
    
    primary: "#2376B7",
    primaryStrong: "#145A91",
    primaryGradient: ["#FFFFFF", "#F3F6F9"],
    brandGradient: ["#2376B7", "#145A91"],
    
    success: "#1FA764",
    successGradient: ["#1FA764", "#16804D"],
    warning: "#BA7A12",
    error: "#CF4B4B",
    info: "#2376B7",
    
    cardShadow: "rgba(0, 0, 0, 0.05)",
    glow: "rgba(35, 118, 183, 0.05)",

    accents: {
      blue: "#2376B7",
      purple: "#8B5CF6",
      orange: "#F97316",
      green: "#10B981",
      pink: "#EC4899",
    }
  },
} as const;

export type ThemeScheme = keyof typeof colors;
export type ThemeColors = (typeof colors)[ThemeScheme];
