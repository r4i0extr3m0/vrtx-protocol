import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

import { Colors } from "@/constants/theme";

export function createTabScreenOptions(scheme: "light" | "dark"): BottomTabNavigationOptions {
  const colors = Colors[scheme];

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: 0.5,
      height: 72,
      paddingTop: 8,
      paddingBottom: 10,
    },
  };
}
