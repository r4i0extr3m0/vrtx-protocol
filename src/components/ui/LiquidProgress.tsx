import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolateColor 
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { radius } from '@/src/theme';

interface LiquidProgressProps {
  progress: number; // 0 to 1
  count: number;
  height?: number;
  width?: number;
  style?: ViewStyle;
}

/**
 * LiquidProgress - Refractive liquid indicator for 2026 onboarding.
 * Features: Soft glow, liquid fill animation, and refractive dots.
 */
export function LiquidProgress({ 
  progress, 
  count, 
  height = 4, 
  width = 120, 
  style 
}: LiquidProgressProps) {
  const { colors } = useTheme();
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withSpring(progress, { damping: 20, stiffness: 100 });
  }, [progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
    backgroundColor: interpolateColor(
      fillWidth.value,
      [0, 1],
      [colors.primary, colors.primaryStrong || colors.primary]
    ),
  }));

  return (
    <View style={[styles.container, { width, height, backgroundColor: 'rgba(255, 255, 255, 0.05)' }, style]}>
      {/* Liquid Fill */}
      <Animated.View style={[styles.fill, fillStyle]}>
        {/* Subtle Glow at the edge */}
        <View style={[styles.glow, { backgroundColor: colors.primary }]} />
      </Animated.View>

      {/* Refractive Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: count }).map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              { 
                backgroundColor: i / (count - 1) <= progress ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' 
              }
            ]} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.pill || 100,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill || 100,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    right: -2,
    top: 0,
    bottom: 0,
    width: 10,
    opacity: 0.4,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  dotsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
});
