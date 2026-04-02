import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/src/hooks";
import { spacing } from "@/src/theme";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius: br = 8,
  style,
}: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: br,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  gap?: number;
}

export function SkeletonList({
  count = 5,
  itemHeight = 60,
  gap = spacing.md,
}: SkeletonListProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ gap: spacing.sm }}>
          <SkeletonLoader height={itemHeight} />
          <SkeletonLoader height={12} width="80%" />
        </View>
      ))}
    </View>
  );
}
