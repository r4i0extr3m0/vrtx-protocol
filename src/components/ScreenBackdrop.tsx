import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Path } from "react-native-svg";

import { useTheme } from "@/src/hooks";

/**
 * Backdrop sutil “premium” (dark minimal + detalhe sci‑fi SEM neon).
 * Usado como camada decorativa por trás das telas.
 */
export function ScreenBackdrop() {
  const { colors } = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Glow muito sutil */}
      <LinearGradient
        colors={[`${colors.primary}14`, "transparent", `${colors.info}0A`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Linhas/mesh (bem leve) */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="mesh" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.border} stopOpacity="0.12" />
            <Stop offset="0.5" stopColor={colors.border} stopOpacity="0.06" />
            <Stop offset="1" stopColor={colors.border} stopOpacity="0.10" />
          </SvgLinearGradient>
        </Defs>

        {/* Curvas diagonais tipo “protocol schematic” */}
        <Path d="M-40 120 C 120 40, 220 220, 420 120 S 760 40, 980 160" stroke="url(#mesh)" strokeWidth="1" fill="none" />
        <Path d="M-60 260 C 120 180, 240 360, 420 260 S 760 180, 1040 320" stroke="url(#mesh)" strokeWidth="1" fill="none" />
        <Path d="M-80 420 C 120 340, 240 520, 420 420 S 760 340, 1100 520" stroke="url(#mesh)" strokeWidth="1" fill="none" />
      </Svg>
    </View>
  );
}

