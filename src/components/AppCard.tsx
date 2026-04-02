import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  ViewStyle, 
  StyleProp,
  Platform,
  useWindowDimensions
} from 'react-native';
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { radius, spacing, typography, shadows } from '@/src/theme';
import * as Haptics from 'expo-haptics';

interface AppCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  variant?: 'default' | 'elevated' | 'ghost' | 'primary';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppCard({ 
  children, 
  title, 
  subtitle, 
  onPress, 
  style, 
  delay = 0,
  variant = 'default',
  accessibilityLabel,
  accessibilityHint
}: AppCardProps) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated': return colors.surfaceElevated;
      case 'ghost': return 'transparent';
      case 'primary': return colors.primary + '10';
      default: return colors.surface;
    }
  };

  const containerStyle = [
    styles.container,
    { 
      backgroundColor: getBackgroundColor(),
      borderColor: variant === 'ghost' ? 'transparent' : colors.border,
      borderWidth: variant === 'ghost' ? 0 : 1,
    },
    variant !== 'ghost' && shadows.card,
    style,
    animatedStyle
  ];

  const content = (
    <>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text 
              allowFontScaling={true}
              style={[
                styles.title, 
                { 
                  color: colors.foreground,
                  fontSize: 18 * fontScale
                }
              ]}
              accessibilityRole="header"
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text 
              allowFontScaling={true}
              style={[
                styles.subtitle, 
                { 
                  color: colors.muted,
                  fontSize: 13 * fontScale
                }
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </>
  );

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(delay).springify()}
      onPress={onPress ? handlePress : undefined}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      style={containerStyle}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint || subtitle}
      accessibilityState={{ disabled: false }}
      allowFontScaling={true}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
});
