import { colors } from "./colors";
import { animations } from "./animations";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { typography, textStyles } from "./typography";

export * from "./colors";
export * from "./spacing";
export * from "./typography";
export * from "./radius";
export * from "./shadows";
export * from "./animations";

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
