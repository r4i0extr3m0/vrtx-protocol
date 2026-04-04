import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { radius, spacing } from '@/src/theme';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  delay?: number;
  style?: any;
  noBorder?: boolean;
}

/**
 * GlassCard - Minimalist Sci-Fi surface.
 * Focus on clean dark background and subtle borders.
 */
export function GlassCard({ 
  children, 
  intensity = 20, 
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
        { 
          backgroundColor: colors.surface,
          borderColor: noBorder ? 'transparent' : colors.border,
          borderWidth: noBorder ? 0 : 1,
          borderRadius: radius.lg,
        },
        style
      ]}
    >
      {Platform.OS !== 'web' && (
        <BlurView 
          intensity={intensity} 
          tint={tint} 
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]} 
        />
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
  },
  content: {
    padding: spacing.lg,
  },
});
