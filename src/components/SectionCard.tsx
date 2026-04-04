import { StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import Animated, { 
  FadeInDown, 
  Layout 
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/hooks";
import { radius, spacing, typography, shadows } from "@/src/theme";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
  fullWidth?: boolean;
}

export function SectionCard({ title, subtitle, children, delay = 0, fullWidth = true }: SectionCardProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      // "Cinema": sem bounce/spring, entra com opacidade + deslocamento suave
      entering={FadeInDown.delay(delay).duration(450)}
      // Evita warnings de transform/layout e jitter em alguns dispositivos
      layout={Layout.duration(220)}
      style={[
        styles.container,
        {
          borderColor: colors.border,
          width: fullWidth ? '100%' : 'auto',
        },
        shadows.card
      ]}
    >
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
      />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    gap: 2,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    gap: spacing.md,
  },
});
