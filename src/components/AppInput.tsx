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
  interpolateColor
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks';
import { radius, spacing, typography, shadows } from '@/src/theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityHint?: string;
}

export function AppInput({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  onFocus, 
  onBlur, 
  style,
  accessibilityHint,
  ...props 
}: AppInputProps) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnim.value = withSpring(1);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = withSpring(0);
    onBlur?.(e);
  };

  const containerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? colors.error : colors.border, colors.primary]
    );

    return {
      borderColor,
      backgroundColor: isFocused ? colors.surfaceAlt : colors.surface,
      borderWidth: isFocused || error ? 2 : 1,
    };
  });

  const dynamicHeight = Math.max(56, 56 * fontScale);

  return (
    <View style={styles.container}>
      {label && (
        <Text 
          allowFontScaling={true}
          style={[
            styles.label, 
            { 
              color: error ? colors.error : colors.muted,
              fontSize: 12 * fontScale
            }
          ]}
          accessibilityRole="header"
        >
          {label}
        </Text>
      )}
      
      <Animated.View 
        style={[
          styles.inputWrapper, 
          containerStyle,
          { height: dynamicHeight },
          !isFocused && shadows.card,
          style
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input, 
            { 
              color: colors.foreground,
              fontSize: 16 * fontScale
            },
            Platform.OS === 'web' && { outlineStyle: 'none' } as any
          ]}
          placeholderTextColor={colors.muted}
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
          allowFontScaling={true}
          style={[
            styles.errorText, 
            { 
              color: colors.error,
              fontSize: 12 * fontScale
            }
          ]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
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
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
});
