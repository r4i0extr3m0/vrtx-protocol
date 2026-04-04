import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  Easing,
  useAnimatedStyle,
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { typography, colors } from '@/src/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  color?: string;
  glow?: boolean;
}

/**
 * CircularTimer - High-end circular timer for rest and protocols.
 * Features: Stroke animation, Neon pulse glow, Tabular numbers.
 */
export function CircularTimer({ 
  progress, 
  size = 180, 
  strokeWidth = 12, 
  label, 
  subLabel, 
  color = "#0096FF",
  glow = true
}: CircularTimerProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const animatedProgress = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { 
      duration: 1000, 
      easing: Easing.bezier(0.4, 0, 0.2, 1) 
    });
    
    if (glow) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [progress, glow]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.1], [0.3, 0.6]),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow Pulse Layer */}
      {glow && (
        <Animated.View style={[
          styles.glow, 
          { 
            width: size - strokeWidth, 
            height: size - strokeWidth, 
            borderRadius: (size - strokeWidth) / 2,
            backgroundColor: color,
          },
          glowStyle
        ]} />
      )}

      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={colors.primaryGlow || "#00C2FF"} />
          </LinearGradient>
        </Defs>
        
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
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

function interpolate(value: number, input: number[], output: number[]) {
  "worklet";
  const [minIn, maxIn] = input;
  const [minOut, maxOut] = output;
  return minOut + (maxOut - minOut) * (value - minIn) / (maxIn - minIn);
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
  glow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
    opacity: 0.3,
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
