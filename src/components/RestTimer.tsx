import { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  Easing,
  FadeIn
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/hooks";
import { useSettingsStore } from "@/src/store/settingsStore";
import { radius, spacing, shadows } from "@/src/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const supportsHaptics = Platform.OS === "ios" || Platform.OS === "android";

interface RestTimerProps {
  onFinish?: () => void;
}

export function RestTimer({ onFinish }: RestTimerProps) {
  const { colors } = useTheme();
  const { restTimerDefault, hapticFeedbackEnabled } = useSettingsStore();
  const [timeLeft, setTimeLeft] = useState(restTimerDefault);
  const [isActive, setIsActive] = useState(true);

  const progress = useSharedValue(1);
  const size = 110;
  const strokeWidth = 6;
  const radius_circle = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius_circle;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const resetTimer = useCallback(() => {
    setTimeLeft(restTimerDefault);
    setIsActive(false);
    progress.value = withTiming(1, { duration: 300 });
  }, [restTimerDefault, progress]);

  const toggleTimer = () => {
    if (hapticFeedbackEnabled && supportsHaptics) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsActive(!isActive);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          progress.value = withTiming(next / restTimerDefault, { 
            duration: 1000,
            easing: Easing.linear 
          });
          return next;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (hapticFeedbackEnabled && supportsHaptics) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (onFinish) onFinish();
      resetTimer();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onFinish, resetTimer, restTimerDefault, progress, hapticFeedbackEnabled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
    >
      <View style={styles.timerWrapper}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius_circle}
            stroke={colors.surfaceAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius_circle}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.timeDisplay}>
            <Text style={[styles.timer, { color: colors.foreground }]}>{formatTime(timeLeft)}</Text>
            <Text style={[styles.label, { color: colors.muted }]}>Descanso</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.controls}>
        <Pressable
          onPress={toggleTimer}
          style={[styles.button, { backgroundColor: isActive ? colors.surfaceAlt : colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: isActive ? colors.foreground : "#fff" }]}>
            {isActive ? "Pausar" : "Retomar"}
          </Text>
        </Pressable>
        
        <Pressable
          onPress={resetTimer}
          style={[styles.button, { backgroundColor: colors.surfaceAlt }]}
        >
          <Text style={[styles.buttonText, { color: colors.foreground }]}>Pular</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 1,
    marginVertical: spacing.md,
  },
  timerWrapper: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  timeDisplay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  timer: {
    fontSize: 26,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1.5,
  },
  controls: {
    flex: 1,
    marginLeft: spacing.xl,
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});
