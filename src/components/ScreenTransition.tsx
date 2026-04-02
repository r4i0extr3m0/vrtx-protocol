import React from "react";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";

interface ScreenTransitionProps {
  children: React.ReactNode;
  type?: "fade" | "slide";
}

export function ScreenTransition({
  children,
  type = "fade",
}: ScreenTransitionProps) {
  const entering = type === "fade" ? FadeIn.duration(300) : SlideInRight.duration(300);
  const exiting = type === "fade" ? FadeOut.duration(300) : SlideOutLeft.duration(300);

  return (
    <Animated.View
      style={{ flex: 1 }}
      entering={entering}
      exiting={exiting}
    >
      {children}
    </Animated.View>
  );
}
