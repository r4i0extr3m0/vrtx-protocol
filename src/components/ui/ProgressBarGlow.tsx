import React, { useEffect } from 'react';
import { StyleSheet, View, Animated as RNAnimated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { radius, shadows, spacing } from '@/src/theme';

interface ProgressBarGlowProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  glow?: boolean;
  style?: any;
}

/**
 * ProgressBarGlow - High-end progress bar with neon glow and pulse.
 * Features: Animated width, Glow pulse, Gradient fill.
 */
export function ProgressBarGlow({ 
  progress, 
  height = 8, 
  color = "#0096FF", 
  glow = true,
  style 
}: ProgressBarGlowProps) {
  const { colors } = useTheme();
  const width = useSharedValue(0);
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    width.value = withSpring(progress, { damping: 15, stiffness: 100 });
    
    // Continuous Pulse for Glow
    pulse.value = withTiming(1, { 
      duration: 1000, 
      easing: Easing.inOut(Easing.ease) 
    }, () => {
      pulse.value = withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) });
    });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    shadowOpacity: pulse.value * 0.8,
  }));

  return (
    <View style={[styles.container, { height, backgroundColor: 'rgba(255, 255, 255, 0.05)' }, style]}>
      <Animated.View style={[styles.progress, progressStyle]}>
        <LinearGradient
          colors={[color, colors.primaryGlow || '#00C2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
        />
        
        {/* Glow Layer */}
        {glow && (
          <Animated.View style={[
            StyleSheet.absoluteFill, 
            styles.glow, 
            { shadowColor: color },
            glowStyle
          ]} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progress: {
    height: '100%',
    borderRadius: radius.pill,
    position: 'relative',
  },
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
    borderRadius: radius.pill,
  },
});
