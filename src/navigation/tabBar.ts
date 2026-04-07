import type { EdgeInsets } from "react-native-safe-area-context";

export const TAB_BAR_BASE_HEIGHT = 64;
export const TAB_BAR_MIN_BOTTOM_PADDING = 8;
export const TAB_CONTENT_EXTRA_PADDING = 16;

type BottomInset = Pick<EdgeInsets, "bottom">;

export function getTabBarBottomPadding(insets: BottomInset): number {
  return Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING);
}

export function getTabBarHeight(insets: BottomInset): number {
  return TAB_BAR_BASE_HEIGHT + getTabBarBottomPadding(insets);
}

export function getTabContentBottomPadding(
  insets: BottomInset,
  extraSpacing = TAB_CONTENT_EXTRA_PADDING,
): number {
  return getTabBarHeight(insets) + extraSpacing;
}
