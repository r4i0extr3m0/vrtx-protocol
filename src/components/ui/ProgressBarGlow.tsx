import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { radius } from '@/src/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  glow?: boolean;
  style?: any;
}

/**
 * ProgressBar - Minimalist tech progress bar.
 * No neon pulse. Clean solid or subtle gradient.
 */
export function ProgressBarGlow({ 
  progress, 
  height = 4, 
  color, 
  glow: _glow,
  style 
}: ProgressBarProps) {
  const { colors } = useTheme();
  const width = useSharedValue(0);
  const barColor = color || colors.primary;

  useEffect(() => {
    width.value = withSpring(progress, { damping: 20, stiffness: 120 });
  }, [progress, width]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { height, backgroundColor: 'rgba(255, 255, 255, 0.04)' }, style]}>
      <Animated.View style={[styles.progress, progressStyle, { backgroundColor: barColor }]}>
        <LinearGradient
          colors={[barColor, barColor]} // Solid but keep gradient structure for future flexibility
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 0,
  },
  progress: {
    height: '100%',
    borderRadius: radius.pill,
    position: 'relative',
  },
});
