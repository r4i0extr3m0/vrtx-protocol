import { Platform } from "react-native";

/**
 * VRTX Protocol Typography
 * Heavy titles, monospace labels, and tabular numbers for performance data.
 */

export const typography = {
  // Font Families
  family: {
    // Inter Black or System Bold for heavy impact
    heading: Platform.OS === "ios" ? "Inter-Black" : "sans-serif-condensed",
    body: Platform.OS === "ios" ? "Inter-Medium" : "sans-serif",
    // Monospace for "Command Center" look
    mono: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  
  // Sizes
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    huge: 48,
  },
  
  // Weights
  weight: {
    thin: "100",
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    black: "900",
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -1,
    tight: -0.5,
    normal: 0,
    wide: 1,
    wider: 2,
    widest: 4,
  },

  // Legacy compatibility mapping
  hero: 32,
  title: 24,
  title1: 32,
  title2: 24,
  title3: 20,
  section: 16,
  body: 15,
  bodySm: 14,
  subhead: 14,
  caption: 12,
  number: 48,
  metric: 28,
  weights: {
    thin: "100",
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    black: "900",
  },
} as const;

// Common Text Styles
export const textStyles = {
  h1: {
    fontSize: typography.size["3xl"],
    fontWeight: typography.weight.black,
    letterSpacing: typography.letterSpacing.tight,
    textTransform: "uppercase" as const,
  },
  h2: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.black,
    letterSpacing: typography.letterSpacing.tight,
    textTransform: "uppercase" as const,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    fontFamily: typography.family.mono,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: "uppercase" as const,
    opacity: 0.7,
  },
  metric: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.black,
    fontFamily: typography.family.mono,
    letterSpacing: typography.letterSpacing.tight,
  },
};
