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
import { radius, spacing } from '@/src/theme';

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
  style: inputStyle,
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
      backgroundColor: isFocused ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
      borderWidth: isFocused || error ? 1.5 : 1,
    };
  });

  const dynamicHeight = Math.max(52, 52 * fontScale);

  return (
    <View style={styles.container}>
      {label && (
        <Text 
          allowFontScaling={true}
          style={[
            styles.label, 
            { 
              color: error ? colors.error : colors.muted,
              fontSize: 10 * fontScale
            }
          ]}
          accessibilityRole="header"
        >
          {label.toUpperCase()}
        </Text>
      )}
      
      <Animated.View 
        style={[
          styles.inputWrapper, 
          containerStyle,
          { height: dynamicHeight },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input, 
            { 
              color: colors.foreground,
              fontSize: 14 * fontScale,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            },
            inputStyle as any
          ]}
          placeholderTextColor="rgba(255,255,255,0.2)"
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
              fontSize: 10 * fontScale
            }
          ]}
          accessibilityLiveRegion="polite"
        >
          {error.toUpperCase()}
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
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    marginLeft: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
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
    fontWeight: '800',
    marginTop: 4,
    marginLeft: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
