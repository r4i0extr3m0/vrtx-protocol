import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';

interface ParallaxLayerProps {
  children: React.ReactNode;
  scrollX: Animated.SharedValue<number>;
  index: number;
  width: number;
  speed?: number; // Parallax speed multiplier (default: 0.5)
  style?: ViewStyle;
}

/**
 * ParallaxLayer - Multi-layer depth component for 2026 spatial design.
 * Moves content at different speeds relative to scroll position.
 */
export function ParallaxLayer({ 
  children, 
  scrollX, 
  index, 
  width, 
  speed = 0.5, 
  style 
}: ParallaxLayerProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [width * speed, 0, -width * speed],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
