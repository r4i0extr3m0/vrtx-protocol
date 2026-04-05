import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { radius, spacing } from '@/src/theme';

interface GlassCardLiquidProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  delay?: number;
  style?: any;
  noBorder?: boolean;
}

/**
 * GlassCardLiquid - "Liquid Glass 2.0" aesthetic for 2026.
 * Features: High-depth blur, subtle refraction gradient, and ultra-thin metallic border.
 */
export function GlassCardLiquid({ 
  children, 
  intensity = 40, 
  tint = 'dark', 
  delay = 0,
  style,
  noBorder = false
}: GlassCardLiquidProps) {
  const { colors } = useTheme();

  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(800).springify().damping(18)}
      style={[
        styles.container, 
        { 
          backgroundColor: 'rgba(20, 20, 23, 0.4)', // Translucent base
          borderRadius: radius.xxl || 32,
        },
        style
      ]}
    >
      {Platform.OS !== 'web' && (
        <BlurView 
          intensity={intensity} 
          tint={tint} 
          style={[StyleSheet.absoluteFill, { borderRadius: radius.xxl || 32 }]} 
        />
      )}
      
      {/* Refraction Gradient Layer */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)', 'rgba(255, 255, 255, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.xxl || 32 }]}
      />

      {/* Ultra-thin Metallic Border */}
      {!noBorder && (
        <View style={[
          StyleSheet.absoluteFill, 
          { 
            borderRadius: radius.xxl || 32, 
            borderWidth: 1, 
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderTopColor: 'rgba(255, 255, 255, 0.12)',
            borderLeftColor: 'rgba(255, 255, 255, 0.1)',
          }
        ]} />
      )}

      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginBottom: spacing.md,
    // Spatial shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  content: {
    padding: spacing.xl || 24,
  },
});
