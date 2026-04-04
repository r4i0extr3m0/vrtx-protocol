import { StyleSheet, Text, View, ActivityIndicator, Platform } from "react-native";
import type { ReactNode } from "react";
import Animated, { 
  FadeInDown, 
  Layout 
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/hooks";
import { radius, spacing, typography, shadows } from "@/src/theme";
import { AppIcon, IconName } from "./AppIcon";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  children: ReactNode;
  delay?: number;
  fullWidth?: boolean;
  loading?: boolean;
  error?: string | null;
}

export function SectionCard({ 
  title, 
  subtitle, 
  icon,
  children, 
  delay = 0, 
  fullWidth = true,
  loading = false,
  error = null
}: SectionCardProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(600).springify().damping(15)}
      layout={Layout.duration(220)}
      style={[
        styles.container,
        {
          borderColor: colors.border,
          width: fullWidth ? '100%' : 'auto',
          backgroundColor: colors.surface,
        }
      ]}
    >
      <LinearGradient
        colors={["#1A1A1A", "#121212"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
      />
      
      {/* Subtle Inner Border / Glow */}
      <View style={[StyleSheet.absoluteFill, { 
        borderRadius: radius.xl, 
        borderWidth: 0.5, 
        borderColor: "rgba(255,255,255,0.05)" 
      }]} />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon && (
            <View style={[styles.iconWrapper, { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 0.5 }]}>
              <AppIcon name={icon} size={12} color={colors.primary} strokeWidth={2.5} />
            </View>
          )}
          <Text style={[styles.title, { color: colors.foreground }]}>{title.toUpperCase()}</Text>
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle.toUpperCase()}</Text>
        ) : null}
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.loadingText, { color: colors.muted }]}>PROCESSANDO_DADOS...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <AppIcon name="AlertTriangle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error.toUpperCase()}</Text>
          </View>
        ) : (
          children
        )}
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
    gap: 4,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  content: {
    minHeight: 40,
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 8,
  },
  loadingText: {
    fontSize: 9,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorText: {
    fontSize: 10,
    fontWeight: "800",
    textAlign: 'center',
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
