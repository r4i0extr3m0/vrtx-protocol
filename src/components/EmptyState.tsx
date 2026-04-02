import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { useTheme } from "@/src/hooks";
import { AppButton } from "./AppButton";
import { radius, spacing, typography } from "@/src/theme";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <Animated.View 
           entering={FadeIn.duration(600)}
      style={[styles.container, { backgroundColor: colors.surfaceAlt + "40", borderColor: colors.border }]}>
      <Text style={styles.emoji}>{emoji || "📭"}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      
      {actionLabel && onAction && (
        <AppButton 
          label={actionLabel} 
          onPress={onAction} 
          variant="secondary" 
          style={styles.button}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  button: {
    marginTop: spacing.xl,
    minWidth: 180,
  },
});
