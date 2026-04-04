import { Platform } from "react-native";

/**
 * VRTX Protocol Shadows & Glows
 * Metallic elevation and neon accents.
 */

export const shadows = {
  // Deep Metallic Shadow for Cards
  card: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
    },
    android: {
      elevation: 10,
    },
    web: {
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.6)",
    },
  }),
  
  // High Elevation for Modals
  elevated: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.8,
      shadowRadius: 24,
    },
    android: {
      elevation: 20,
    },
    web: {
      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.8)",
    },
  }),
  
  // Neon Primary Glow
  primaryGlow: Platform.select({
    ios: {
      shadowColor: "#0096FF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: "0 0 12px rgba(0, 150, 255, 0.8)",
    },
  }),

  // Subtle Border Highlight (Top-down lighting)
  inner: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },

  // Success Neon Glow
  successGlow: Platform.select({
    ios: {
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
    },
  }),
} as const;
