import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/hooks";
import { radius } from "@/src/theme";

interface GlassCardLiquidProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function GlassCardLiquid({ children, style }: GlassCardLiquidProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: "rgba(255,255,255,0.045)",
          borderColor: "rgba(255,255,255,0.08)",
          shadowColor: colors.cardShadow,
        },
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.01)", "rgba(59,130,246,0.04)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.topSheen}>
        <LinearGradient
          colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.02)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topSheenGradient}
        />
      </View>
      <View pointerEvents="none" style={styles.refractiveDots}>
        <View style={styles.dotRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotMuted]} />
          <View style={styles.dot} />
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
  },
  content: {
    flex: 1,
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    opacity: 0.8,
  },
  topSheenGradient: {
    flex: 1,
  },
  refractiveDots: {
    position: "absolute",
    right: 18,
    top: 18,
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dotMuted: {
    backgroundColor: "rgba(59,130,246,0.55)",
  },
});
