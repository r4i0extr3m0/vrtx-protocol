import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedStyle } from "react-native-reanimated";

interface TiltCard3DProps extends PropsWithChildren {
  index: number;
  progress: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
}

export function TiltCard3D({ children, index, progress, style }: TiltCard3DProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const delta = index - progress.value;

    return {
      transform: [
        { perspective: 1100 },
        {
          rotateY: `${interpolate(delta, [-1, 0, 1], [12, 0, -12], Extrapolation.CLAMP)}deg`,
        },
        {
          rotateX: `${interpolate(Math.abs(delta), [0, 1], [0, 4], Extrapolation.CLAMP)}deg`,
        },
        {
          translateY: interpolate(Math.abs(delta), [0, 1], [0, 18], Extrapolation.CLAMP),
        },
        {
          scale: interpolate(Math.abs(delta), [0, 1], [1, 0.94], Extrapolation.CLAMP),
        },
      ],
      opacity: interpolate(Math.abs(delta), [0, 1], [1, 0.68], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
