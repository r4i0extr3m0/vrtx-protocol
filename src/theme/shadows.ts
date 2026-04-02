import { Platform } from "react-native";

export const shadows = {
  // Soft shadows for Bento Cards
  card: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
    },
  }),
  
  // Elevated floating elements (Modals, Popups)
  elevated: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
    },
    android: {
      elevation: 12,
    },
    web: {
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
    },
  }),
  
  // Subtle internal border effect (Inner shadow simulation)
  inner: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  
  // Primary color glow
  primaryGlow: Platform.select({
    ios: {
      shadowColor: "#7CC6FF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: "0 0 10px rgba(124, 198, 255, 0.3)",
    },
  }),
} as const;
