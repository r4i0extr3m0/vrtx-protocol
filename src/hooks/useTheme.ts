import { useMemo } from "react";
import { useThemeContext } from "@/lib/theme-provider";
import { colors, type ThemeColors } from "@/src/theme/colors";
import { useSettingsStore } from "@/src/store/settingsStore";

export interface IronTheme {
  scheme: "light" | "dark";
  colors: ThemeColors;
}

export function useTheme(): IronTheme {
  const { colorScheme } = useThemeContext();
  const { accentColor } = useSettingsStore();

  return useMemo(() => {
    const baseColors = colors[colorScheme];
    const accentHex = baseColors.accents[accentColor] || baseColors.primary;

    return {
      scheme: colorScheme,
      colors: {
        ...baseColors,
        primary: accentHex,
        brandGradient: [accentHex, baseColors.primaryStrong] as [string, string],
      },
    };
  }, [colorScheme, accentColor]);
}
