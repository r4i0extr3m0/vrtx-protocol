export const typography = {
  // Headings
  hero: 32,      // ExtraBold
  title1: 32,    // ExtraBold
  title2: 24,    // Bold
  title3: 20,    // Bold
  
  // Body & UI
  section: 16,   // SemiBold
  body: 15,      // Regular
  subhead: 14,   // Medium
  caption: 12,   // Regular/Light
  
  // Metrics & Accents
  number: 48,    // ExtraBold (Bento metrics)
  metric: 28,    // Bold
  
  // Weights (Semantic)
  weights: {
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
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -1.5,
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.5,
  }
} as const;

export type Typography = typeof typography;
