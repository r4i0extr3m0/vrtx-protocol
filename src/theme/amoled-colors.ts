export const amoledColors = {
  dark: {
    background: "#000000", // Pure black for AMOLED
    surface: "#0A0A0A",
    surfaceAlt: "#121212",
    foreground: "#FFFFFF",
    muted: "#A0A0A0",
    border: "#1A1A1A",
    primary: "#7CC6FF",
    primaryStrong: "#4AA8F0",
    primaryGradient: ["#7CC6FF", "#4AA8F0"],
    success: "#39D98A",
    successGradient: ["#39D98A", "#2EAF6F"],
    warning: "#F5B942",
    error: "#FF6B6B",
    info: "#7CC6FF",
    cardShadow: "rgba(0, 0, 0, 0.8)",
  },
  light: {
    background: "#F3F6F9",
    surface: "#FFFFFF",
    surfaceAlt: "#E8EEF4",
    foreground: "#0F1720",
    muted: "#5E6C79",
    border: "#D5DEE8",
    primary: "#2376B7",
    primaryStrong: "#145A91",
    primaryGradient: ["#2376B7", "#145A91"],
    success: "#1FA764",
    successGradient: ["#1FA764", "#16804D"],
    warning: "#BA7A12",
    error: "#CF4B4B",
    info: "#2376B7",
    cardShadow: "rgba(0, 0, 0, 0.05)",
  },
} as const;

export type AMOLEDThemeScheme = keyof typeof amoledColors;
export type AMOLEDThemeColors = (typeof amoledColors)[AMOLEDThemeScheme];
