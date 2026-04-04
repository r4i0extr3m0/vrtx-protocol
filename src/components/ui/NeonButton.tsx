import React from 'react';
import { 
  StyleSheet, 
  Text, 
  Pressable, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  Platform
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks';
import { radius, spacing, typography, animations } from '@/src/theme';

interface SciFiButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

/**
 * SciFiButton - Minimalist high-tech button.
 * No neon. Focus on clean borders and subtle gradients.
 */
export function NeonButton({ 
  label, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  icon,
  style,
  labelStyle
}: SciFiButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, animations.spring.tight);
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.spring.smooth);
    opacity.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: [colors.primary, colors.primaryStrong],
          text: "#FFFFFF",
          border: "transparent",
        };
      case 'secondary':
        return {
          bg: [colors.surfaceAlt, colors.surface],
          text: colors.foreground,
          border: colors.borderStrong,
        };
      case 'glass':
        return {
          bg: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
          text: colors.foreground,
          border: "rgba(255, 255, 255, 0.08)",
        };
      case 'ghost':
        return {
          bg: ['transparent', 'transparent'],
          text: colors.primary,
          border: "transparent",
        };
      default:
        return {
          bg: [colors.primary, colors.primaryStrong],
          text: "#FFFFFF",
          border: "transparent",
        };
    }
  };

  const config = getVariantStyles();

  return (
    <Pressable
      onPress={() => {
        if (!disabled && !loading) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        { 
          borderColor: config.border, 
          borderWidth: variant === 'ghost' ? 0 : 1,
          opacity: disabled ? 0.5 : 1,
          borderRadius: radius.md,
        },
        style
      ]}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        {variant !== 'ghost' && (
          <LinearGradient
            colors={config.bg as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
          />
        )}
        
        {loading ? (
          <ActivityIndicator color={config.text} size="small" />
        ) : (
          <>
            {icon && <View style={styles.iconWrapper}>{icon}</View>}
            <Text style={[
              styles.label, 
              { 
                color: config.text, 
                fontFamily: typography.family.mono,
                fontSize: 12,
              },
              labelStyle
            ]}>
              {label.toUpperCase()}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
    height: '100%',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
});
