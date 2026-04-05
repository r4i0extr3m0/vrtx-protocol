import { Pressable, StyleSheet, Text, Platform, View, useWindowDimensions, ActivityIndicator } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/hooks";
import { radius, spacing, typography, shadows } from "@/src/theme";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AppButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "ghost" | "success" | "brand" | "default";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: AppButtonProps) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled || loading ? 0.4 : 1,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    if (variant === "brand" || variant === "success") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  const getColors = () => {
    switch (variant) {
      case "brand": return { bg: undefined, grad: colors.brandGradient, text: "#000", border: "transparent" };
      case "success": return { bg: undefined, grad: colors.successGradient, text: "#fff", border: "transparent" };
      case "secondary": return { bg: "rgba(255,255,255,0.05)", grad: undefined, text: colors.foreground, border: colors.border };
      case "ghost": return { bg: "transparent", grad: undefined, text: colors.muted, border: "transparent" };
      case "default": return { bg: colors.surface, grad: undefined, text: colors.foreground, border: colors.border };
      default: return { bg: colors.surface, grad: undefined, text: colors.foreground, border: colors.border };
    }
  };

  const config = getColors();
  const dynamicMinHeight = Math.max(52, 52 * fontScale);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled || loading}
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
            <View style={styles.inlineContent}>
              {loading ? <ActivityIndicator color={config.text} size="small" /> : null}
              <Text 
                allowFontScaling={true}
                style={[styles.label, { color: config.text, fontSize: 13 * fontScale }]}
              >
                {label.toUpperCase()}
              </Text>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.inlineContent}>
          {loading ? <ActivityIndicator color={config.text} size="small" /> : null}
          <Text 
            allowFontScaling={true}
            style={[styles.label, { color: config.text, fontSize: 13 * fontScale }]}
          >
            {label.toUpperCase()}
          </Text>
        </View>
      )}
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
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  label: {
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
