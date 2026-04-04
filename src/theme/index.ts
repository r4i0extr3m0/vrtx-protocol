export * from "./colors";
export * from "./spacing";
export * from "./typography";
export * from "./radius";
export * from "./shadows";
export * from "./animations";

import { colors } from "./colors";
import { typography, textStyles } from "./typography";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { animations } from "./animations";

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  radius,
  shadows,
  animations,
};

export type AppTheme = typeof theme;
