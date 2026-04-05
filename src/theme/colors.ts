/**
 * VRTX Protocol - Dark Minimalist Sci-Fi Palette
 * Aesthetic: Steel, Graphite, and Subdued Tech Blue.
 * No neon accents.
 */

export const colors = {
  dark: {
    // Base - Deep Space/Graphite
    background: "#0A0A0B",
    foreground: "#F8FAFC",
    foregroundMuted: "#CBD5E1",
    surface: "#141417",
    surfaceAlt: "#1C1C21",
    surfaceElevated: "#24242B",
    
    // Brand - Steel Blue / Cobalt (Subdued)
    primary: "#3B82F6", // Steel Blue
    primaryStrong: "#2563EB",
    primaryGlow: "rgba(59, 130, 246, 0.15)", // Very subtle
    secondary: "#475569", // Slate
    
    // Semantic - Muted variants
    success: "#10B981",
    successGlow: "rgba(16, 185, 129, 0.1)",
    error: "#EF4444",
    errorGlow: "rgba(239, 68, 68, 0.1)",
    warning: "#F59E0B",
    info: "#3B82F6",
    
    // Neutral & Borders
    muted: "#64748B",
    border: "rgba(255, 255, 255, 0.06)",
    borderStrong: "rgba(255, 255, 255, 0.12)",
    borderGlow: "rgba(59, 130, 246, 0.1)",
    
    // Gradients - Linear and subtle
    primaryGradient: ["#141417", "#0A0A0B"],
    bgGradient: ["#0A0A0B", "#050505"],
    brandGradient: ["#3B82F6", "#2563EB"] as [string, string],
    darkGradient: ["#1C1C21", "#141417"] as [string, string],
    glassGradient: ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.01)"] as [string, string],
    metalGradient: ["#24242B", "#1C1C21", "#141417"] as [string, string, string],
    successGradient: ["#10B981", "#059669"],

    // Shadows & Blurs
    cardShadow: "rgba(0, 0, 0, 0.4)",
    glow: "rgba(59, 130, 246, 0.05)",

    accents: {
      blue: "#3B82F6",
      purple: "#8B5CF6",
      orange: "#F97316",
      green: "#10B981",
      pink: "#EC4899",
    }
  },
  light: {
    // Standard light mode
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceAlt: "#F1F5F9",
    surfaceElevated: "#FFFFFF",
    foreground: "#0F172A",
    foregroundMuted: "#334155",
    muted: "#64748B",
    border: "rgba(0, 0, 0, 0.06)",
    borderStrong: "rgba(0, 0, 0, 0.12)",
    borderGlow: "rgba(37, 99, 235, 0.08)",
    primary: "#2563EB",
    primaryStrong: "#1D4ED8",
    primaryGlow: "rgba(37, 99, 235, 0.12)",
    secondary: "#475569",
    primaryGradient: ["#FFFFFF", "#F8FAFC"],
    brandGradient: ["#2563EB", "#3B82F6"],
    bgGradient: ["#FFFFFF", "#F8FAFC"],
    darkGradient: ["#F8FAFC", "#F1F5F9"] as [string, string],
    glassGradient: ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"] as [string, string],
    metalGradient: ["#FFFFFF", "#F8FAFC", "#F1F5F9"] as [string, string, string],
    success: "#10B981",
    successGlow: "rgba(16, 185, 129, 0.08)",
    successGradient: ["#10B981", "#059669"],
    warning: "#D97706",
    error: "#DC2626",
    info: "#2563EB",
    cardShadow: "rgba(0, 0, 0, 0.03)",
    glow: "rgba(37, 99, 235, 0.02)",
    accents: {
      blue: "#2563EB",
      purple: "#8B5CF6",
      orange: "#F97316",
      green: "#10B981",
      pink: "#EC4899",
    }
  },
} as const;

export type ThemeScheme = keyof typeof colors;
export type ThemeColors = (typeof colors)[ThemeScheme];
