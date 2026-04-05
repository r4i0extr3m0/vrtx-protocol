import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedStyle } from "react-native-reanimated";

interface ParallaxLayerProps extends PropsWithChildren {
  index: number;
  progress: SharedValue<number>;
  intensity?: number;
  verticalIntensity?: number;
  style?: StyleProp<ViewStyle>;
}

export function ParallaxLayer({
  children,
  index,
  progress,
  intensity = 28,
  verticalIntensity = 10,
  style,
}: ParallaxLayerProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const delta = index - progress.value;

    return {
      transform: [
        {
          translateX: interpolate(delta, [-1, 0, 1], [-intensity, 0, intensity], Extrapolation.CLAMP),
        },
        {
          translateY: interpolate(Math.abs(delta), [0, 1], [0, verticalIntensity], Extrapolation.CLAMP),
        },
      ],
      opacity: interpolate(Math.abs(delta), [0, 1], [1, 0.72], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
