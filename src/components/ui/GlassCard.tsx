import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { radius, shadows, spacing } from '@/src/theme';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  delay?: number;
  style?: any;
  noBorder?: boolean;
}

/**
 * GlassCard - The core building block for the "Industrial Premium" UI.
 * Features: Heavy Blur, Metallic Gradient, Border Glow, Shadow.
 */
export function GlassCard({ 
  children, 
  intensity = 30, 
  tint = 'dark', 
  delay = 0,
  style,
  noBorder = false
}: GlassCardProps) {
  const { colors } = useTheme();

  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(600).springify().damping(15)}
      style={[
        styles.container, 
        shadows.card,
        style
      ]}
    >
      {/* 1. Blur Layer */}
      <BlurView 
        intensity={intensity} 
        tint={tint} 
        style={[styles.blur, { borderRadius: radius.xl }]}
      >
        {/* 2. Glass Gradient Overlay */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
        />

        {/* 3. Metallic Border Glow */}
        {!noBorder && (
          <View style={[
            StyleSheet.absoluteFill, 
            { 
              borderRadius: radius.xl, 
              borderWidth: 1, 
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderTopColor: 'rgba(255, 255, 255, 0.2)',
              borderLeftColor: 'rgba(255, 255, 255, 0.15)',
            }
          ]} />
        )}

        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  blur: {
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
  },
});
