import React, { useState } from 'react';
import { 
  TextInput, 
  StyleSheet, 
  View, 
  Text, 
  TextInputProps, 
  Platform,
  useWindowDimensions
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolateColor,
  withTiming
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/hooks';
import { radius, spacing, typography, shadows, animations } from '@/src/theme';

interface InputGlassProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityHint?: string;
}

/**
 * InputGlass - High-end text input with glassmorphism and focus glow.
 * Features: Floating label, Focus border glow, Glass background.
 */
export function InputGlass({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  onFocus, 
  onBlur, 
  style,
  accessibilityHint,
  ...props 
}: InputGlassProps) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnim.value = withSpring(1, animations.spring.smooth);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = withSpring(0, animations.spring.smooth);
    onBlur?.(e);
  };

  const containerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? colors.error : 'rgba(255, 255, 255, 0.1)', colors.primary]
    );

    const shadowOpacity = withTiming(focusAnim.value * 0.4, { duration: 200 });

    return {
      borderColor,
      borderWidth: 1,
      shadowColor: colors.primary,
      shadowOpacity,
      shadowRadius: 10,
      elevation: isFocused ? 4 : 0,
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const translateY = withSpring(isFocused || props.value ? -24 : 0, animations.spring.smooth);
    const scale = withSpring(isFocused || props.value ? 0.85 : 1, animations.spring.smooth);
    const opacity = withSpring(isFocused || props.value ? 1 : 0.6, animations.spring.smooth);
    const color = interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.muted, colors.primary]
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
      color,
    };
  });

  const dynamicHeight = Math.max(52, 52 * fontScale);

  return (
    <View style={[styles.container, { marginTop: label ? 20 : 0 }]}>
      {label && (
        <Animated.Text 
          style={[
            styles.label, 
            { 
              fontFamily: typography.family.mono,
              fontSize: 12 * fontScale
            },
            labelStyle
          ]}
        >
          {label.toUpperCase()}
        </Animated.Text>
      )}
      
      <Animated.View 
        style={[
          styles.inputWrapper, 
          containerStyle,
          { height: dynamicHeight, borderRadius: radius.md },
          style
        ]}
      >
        <BlurView 
          intensity={15} 
          tint="dark" 
          style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]} 
        />
        
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input, 
            { 
              color: colors.foreground,
              fontSize: 14 * fontScale,
              fontFamily: typography.family.mono,
            },
            Platform.OS === 'web' && { outlineStyle: 'none' } as any
          ]}
          placeholderTextColor="rgba(255, 255, 255, 0.2)"
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label || props.placeholder}
          accessibilityHint={accessibilityHint || error}
          accessibilityState={{ disabled: props.editable === false }}
          allowFontScaling={true}
          {...props}
        />
        
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </Animated.View>
      
      {error && (
        <Text 
          style={[
            styles.errorText, 
            { 
              color: colors.error,
              fontSize: 10 * fontScale,
              fontFamily: typography.family.mono,
            }
          ]}
        >
          {error.toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    width: '100%',
    position: 'relative',
  },
  label: {
    fontWeight: '900',
    letterSpacing: 1.5,
    position: 'absolute',
    left: 4,
    top: 14,
    zIndex: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontWeight: '600',
    height: '100%',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  errorText: {
    fontWeight: '800',
    marginTop: 6,
    marginLeft: 4,
  },
});
