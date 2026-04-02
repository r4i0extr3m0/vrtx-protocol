import { Pressable, StyleSheet, Text, Platform, View, useWindowDimensions } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/hooks";
import { radius, spacing, typography, shadows } from "@/src/theme";
import { HapticFeedback } from "@/src/services/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "success" | "brand";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: AppButtonProps) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (disabled) return;
    
    if (variant === "brand" || variant === "success") {
      HapticFeedback.medium();
    } else if (variant === "ghost") {
      HapticFeedback.selection();
    } else {
      HapticFeedback.light();
    }
    
    onPress();
  };

  const getColors = () => {
    switch (variant) {
      case "brand": return { bg: undefined, grad: colors.brandGradient, text: "#000" };
      case "success": return { bg: undefined, grad: colors.successGradient, text: "#fff" };
      case "secondary": return { bg: colors.surfaceAlt, grad: undefined, text: colors.foreground };
      case "ghost": return { bg: "transparent", grad: undefined, text: colors.muted };
      default: return { bg: colors.surface, grad: undefined, text: colors.foreground };
    }
  };

  const config = getColors();
  const dynamicMinHeight = Math.max(56, 56 * fontScale);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        {
          backgroundColor: config.bg,
          borderColor: variant === "ghost" ? "transparent" : colors.border,
          minHeight: dynamicMinHeight,
        },
        variant !== "ghost" && shadows.card,
        animatedStyle,
        style,
      ]}
    >
      {config.grad ? (
        <LinearGradient
          colors={config.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.contentWrapper}>
            <Text 
              allowFontScaling={true}
              style={[styles.label, { color: config.text, fontSize: 15 * fontScale }]}
            >
              {label}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <Text 
          allowFontScaling={true}
          style={[styles.label, { color: config.text, fontSize: 15 * fontScale }]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: 'center',
  },
});
