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
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/hooks';
import { radius, spacing, typography, animations } from '@/src/theme';

interface InputGlassProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * MinimalInput - Clean tech input.
 * No neon. Focus on clean borders and subtle surface change.
 */
export function InputGlass({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  onFocus, 
  onBlur, 
  style,
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
      [error ? colors.error : colors.border, colors.primary]
    );

    return {
      borderColor,
      borderWidth: 1,
      backgroundColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        [colors.surface, colors.surfaceAlt]
      ),
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.muted, colors.primary]
    );

    return { color };
  });

  const dynamicHeight = Math.max(48, 48 * fontScale);

  return (
    <View style={styles.container}>
      {label && (
        <Animated.Text 
          style={[
            styles.label, 
            { 
              fontFamily: typography.family.mono,
              fontSize: 10 * fontScale
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
        {Platform.OS !== 'web' && (
          <BlurView 
            intensity={10} 
            tint="dark" 
            style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]} 
          />
        )}
        
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
              fontSize: 9 * fontScale,
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
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontWeight: '500',
    height: '100%',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  errorText: {
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 2,
  },
});
