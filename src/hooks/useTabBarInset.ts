import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getTabBarHeight, getTabContentBottomPadding } from "@/src/navigation/tabBar";

export function useTabBarInset(extraSpacing = 16) {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      tabBarHeight: getTabBarHeight(insets),
      contentPaddingBottom: getTabContentBottomPadding(insets, extraSpacing),
      scrollIndicatorBottom: getTabBarHeight(insets),
    }),
    [extraSpacing, insets],
  );
}
