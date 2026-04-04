import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { RadialGradient } from "react-native-image-filter-kit"; // Note: expo-linear-gradient doesn't support radial well, using linear as fallback or svg
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, Pattern, Circle, Path, Rect } from "react-native-svg";

import { useTheme } from "@/src/hooks";

const { width, height } = Dimensions.get("window");

/**
 * THE BLUEPRINT LOOK: Fundo global com grade de pontos e gradiente radial.
 * Estética "Engineering Command Center".
 */
export function ScreenBackdrop() {
  const { colors } = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Background Gradient - Simulating Radial with Linear as fallback for stability */}
      <LinearGradient
        colors={colors.bgGradient as any || ["#121212", "#080808"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Blueprint Grid System */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <Circle cx="1" cy="1" r="0.5" fill={colors.foreground} opacity="0.05" />
          </Pattern>
        </Defs>
        
        {/* Fill the screen with the dot pattern */}
        <Rect width="100%" height="100%" fill="url(#grid)" />

        {/* Subtle Coordinate Lines (Blueprint style) */}
        <Path 
          d={`M 0 ${height * 0.2} L ${width} ${height * 0.2}`} 
          stroke={colors.foreground} 
          strokeWidth="0.5" 
          opacity="0.03" 
        />
        <Path 
          d={`M ${width * 0.2} 0 L ${width * 0.2} ${height}`} 
          stroke={colors.foreground} 
          strokeWidth="0.5" 
          opacity="0.03" 
        />
        
        {/* Schematic Path - Refined for "Industrial Premium" */}
        <Path 
          d="M-40 120 C 120 40, 220 220, 420 120 S 760 40, 980 160" 
          stroke={colors.primary} 
          strokeWidth="0.5" 
          fill="none" 
          opacity="0.08" 
        />
      </Svg>
    </View>
  );
}
