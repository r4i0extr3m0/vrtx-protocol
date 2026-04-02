import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/hooks";
import { spacing, typography } from "@/src/theme";

interface PRCelebrationProps {
  isVisible: boolean;
  exerciseName: string;
  weight: number;
  unit: string;
  onComplete?: () => void;
}

export function PRCelebration({
  isVisible,
  exerciseName,
  weight,
  unit,
  onComplete,
}: PRCelebrationProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (isVisible) {
      // Trigger haptic feedback
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate in
      scale.value = withSpring(1, {
        damping: 8,
        mass: 1,
        overshootClamping: false,
      });
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });

      // Animate out after 3 seconds
      const timer = setTimeout(() => {
        scale.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) });
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(50, { duration: 300 });

        if (onComplete) {
          setTimeout(() => runOnJS(onComplete)(), 300);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, scale, opacity, translateY, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: "50%",
          left: "50%",
          marginLeft: -100,
          width: 200,
          alignItems: "center",
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: colors.success,
          borderRadius: 16,
          padding: spacing.lg,
          alignItems: "center",
          gap: spacing.md,
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <Text style={{ fontSize: 48 }}>🎉</Text>
        <Text
          style={{
            fontSize: typography.section,
            fontWeight: "800",
            color: "#0B0D10",
            textAlign: "center",
          }}
        >
          Novo PR!
        </Text>
        <Text
          style={{
            fontSize: typography.body,
            fontWeight: "600",
            color: "#0B0D10",
            textAlign: "center",
          }}
        >
          {exerciseName}
        </Text>
        <Text
          style={{
            fontSize: typography.caption,
            color: "#0B0D10",
            textAlign: "center",
          }}
        >
          {weight} {unit}
        </Text>
      </View>
    </Animated.View>
  );
}
