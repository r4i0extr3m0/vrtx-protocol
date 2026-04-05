import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/hooks";
import { radius } from "@/src/theme";

interface LiquidProgressProps {
  current: number;
  total: number;
}

export function LiquidProgress({ current, total }: LiquidProgressProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(total <= 1 ? 1 : current / (total - 1));

  useEffect(() => {
    const next = total <= 1 ? 1 : current / (total - 1);
    progress.value = withTiming(next, { duration: 420 });
  }, [current, progress, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0.08, progress.value) * 100}%`,
  }));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.track, { backgroundColor: "rgba(255,255,255,0.08)", borderColor: colors.border }]}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <LinearGradient
            colors={["rgba(59,130,246,0.72)", "rgba(255,255,255,0.26)", "rgba(59,130,246,0.88)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fillGradient}
          />
          <View style={styles.bubbleRow}>
            <View style={styles.bubble} />
            <View style={[styles.bubble, styles.bubbleSoft]} />
            <View style={styles.bubble} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  track: {
    height: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    overflow: "hidden",
    justifyContent: "center",
  },
  fillGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bubbleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 5,
    paddingRight: 10,
  },
  bubble: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.68)",
  },
  bubbleSoft: {
    backgroundColor: "rgba(255,255,255,0.34)",
  },
});
