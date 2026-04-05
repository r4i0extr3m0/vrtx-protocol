import React from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';

interface TiltCard3DProps {
  children: React.ReactNode;
  scrollX: Animated.SharedValue<number>;
  index: number;
  width: number;
  style?: ViewStyle;
}

/**
 * TiltCard3D - Spatial 3D effect for cards/slides in 2026 design.
 * Uses perspective + rotateY based on scroll position.
 */
export function TiltCard3D({ 
  children, 
  scrollX, 
  index, 
  width, 
  style 
}: TiltCard3DProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // 3D Rotation (Spatial Tilt)
    const rotateY = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [45, 0, -45], // Degrees
      Extrapolation.CLAMP
    );

    // Depth Scaling
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.85, 1, 0.85],
      Extrapolation.CLAMP
    );

    // Depth TranslateZ (Simulated with Scale + Opacity)
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale },
      ],
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
    // Extra shadow for depth when tilted
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
    }),
  },
});
