import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { typography } from '@/src/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  color?: string;
}

/**
 * CircularProgress - Minimalist circular indicator.
 * No neon glow. Focus on clean stroke and tabular numbers.
 */
export function CircularTimer({ 
  progress, 
  size = 180, 
  strokeWidth = 8, 
  label, 
  subLabel, 
  color 
}: CircularProgressProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const barColor = color || colors.primary;
  
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { 
      duration: 1000, 
      easing: Easing.bezier(0.4, 0, 0.2, 1) 
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={barColor} />
            <Stop offset="100%" stopColor={barColor} />
          </LinearGradient>
        </Defs>
        
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={barColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="transparent"
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.labelContainer}>
        {label && (
          <Text style={[
            styles.label, 
            { color: colors.foreground, fontSize: size * 0.22, fontFamily: typography.family.mono }
          ]}>
            {label}
          </Text>
        )}
        {subLabel && (
          <Text style={[
            styles.subLabel, 
            { color: colors.muted, fontSize: size * 0.06, fontFamily: typography.family.mono }
          ]}>
            {subLabel.toUpperCase()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  subLabel: {
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
});
