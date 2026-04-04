/**
 * VRTX Protocol - Industrial Premium Command Center Palette
 * Base: #0D0D0D (Deep Graphite)
 * Primary: #0096FF (Metallic Blue)
 * Accent: #00C2FF (Neon Glow)
 */

export const colors = {
  dark: {
    // Base
    background: "#0D0D0D",
    foreground: "#FFFFFF",
    foregroundMuted: "#E2E8F0",
    surface: "#1A1A1A",
    surfaceAlt: "#252525",
    surfaceElevated: "#2D2D2D",
    
    // Brand
    primary: "#0096FF",
    primaryStrong: "#007ACC",
    primaryGlow: "#00C2FF",
    secondary: "#64748B",
    
    // Semantic
    success: "#10B981",
    successGlow: "#34D399",
    error: "#EF4444",
    errorGlow: "#F87171",
    warning: "#F59E0B",
    info: "#0096FF",
    
    // Neutral
    muted: "#94A3B8",
    border: "rgba(255, 255, 255, 0.1)",
    borderStrong: "rgba(255, 255, 255, 0.2)",
    borderGlow: "rgba(0, 150, 255, 0.3)",
    
    // Gradients
    primaryGradient: ["#1A1A1A", "#121212"],
    bgGradient: ["#0D0D0D", "#050505"],
    brandGradient: ["#0096FF", "#00C2FF"] as [string, string],
    darkGradient: ["#1A1A1A", "#0D0D0D"] as [string, string],
    glassGradient: ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"] as [string, string],
    metalGradient: ["#2C2C2C", "#1A1A1A", "#0D0D0D"] as [string, string, string],
    successGradient: ["#10B981", "#059669"],

    // Shadows & Blurs
    cardShadow: "rgba(0, 0, 0, 0.8)",
    glow: "rgba(0, 150, 255, 0.2)",

    accents: {
      blue: "#0096FF",
      purple: "#8B5CF6",
      orange: "#F97316",
      green: "#10B981",
      pink: "#EC4899",
    }
  },
  light: {
    // Keep light mode for compatibility but focus on dark
    background: "#F3F6F9",
    surface: "#FFFFFF",
    surfaceAlt: "#E8EEF4",
    surfaceElevated: "#F8FAFC",
    foreground: "#0F1720",
    foregroundMuted: "#1A2633",
    muted: "#5E6C79",
    border: "rgba(0, 0, 0, 0.06)",
    borderStrong: "rgba(0, 0, 0, 0.12)",
    primary: "#007ACC",
    primaryStrong: "#005A9E",
    primaryGradient: ["#FFFFFF", "#F3F6F9"],
    brandGradient: ["#007ACC", "#0096FF"],
    success: "#1FA764",
    successGradient: ["#1FA764", "#16804D"],
    warning: "#BA7A12",
    error: "#CF4B4B",
    info: "#007ACC",
    cardShadow: "rgba(0, 0, 0, 0.05)",
    glow: "rgba(0, 122, 204, 0.05)",
    accents: {
      blue: "#007ACC",
      purple: "#8B5CF6",
      orange: "#F97316",
      green: "#10B981",
      pink: "#EC4899",
    }
  },
} as const;

export type ThemeScheme = keyof typeof colors;
export type ThemeColors = (typeof colors)[ThemeScheme];
