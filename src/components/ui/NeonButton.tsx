import React from 'react';
import { 
  Pressable, 
  StyleSheet, 
  Text, 
  View, 
  Platform, 
  useWindowDimensions 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/hooks';
import { radius, spacing, typography, shadows, animations } from '@/src/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'glass' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: any;
  icon?: React.ReactNode;
}

/**
 * NeonButton - Metallic & Neon button for elite UI.
 * Features: Heavy spring scale, Haptics, Neon Glow, Monospace label.
 */
export function NeonButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  icon,
}: NeonButtonProps) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.4 : 1,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, animations.spring.pop);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.spring.pop);
  };

  const handlePress = () => {
    if (disabled) return;
    
    if (variant === 'primary') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  const getColors = () => {
    switch (variant) {
      case 'primary': return { 
        bg: undefined, 
        grad: colors.brandGradient, 
        text: "#000", 
        border: 'transparent',
        glow: true 
      };
      case 'glass': return { 
        bg: 'rgba(255, 255, 255, 0.08)', 
        grad: undefined, 
        text: colors.foreground, 
        border: 'rgba(255, 255, 255, 0.15)',
        glow: false 
      };
      case 'secondary': return { 
        bg: '#1A1A1A', 
        grad: undefined, 
        text: colors.muted, 
        border: colors.border,
        glow: false 
      };
      case 'ghost': return { 
        bg: 'transparent', 
        grad: undefined, 
        text: colors.muted, 
        border: 'transparent',
        glow: false 
      };
      default: return { 
        bg: colors.surface, 
        grad: undefined, 
        text: colors.foreground, 
        border: colors.border,
        glow: false 
      };
    }
  };

  const config = getColors();
  const dynamicMinHeight = Math.max(52, 52 * fontScale);

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          minHeight: dynamicMinHeight,
        },
        config.glow && shadows.primaryGlow,
        animatedStyle,
        style,
      ]}
    >
      {config.grad && (
        <LinearGradient
          colors={config.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={styles.contentWrapper}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <Text 
          style={[
            styles.label, 
            { 
              color: config.text, 
              fontSize: 13 * fontScale,
              fontFamily: typography.family.mono,
            }
          ]}
        >
          {label.toUpperCase()}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    overflow: "hidden",
    marginVertical: spacing.xs,
  },
  contentWrapper: {
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
  label: {
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
