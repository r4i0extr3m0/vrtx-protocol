import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from '@/src/hooks';
import { radius, spacing, typography, shadows } from '@/src/theme';
import { AppIcon, IconName } from './AppIcon';

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: IconName;
  trend?: string;
  delay?: number;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export function MetricCard({ 
  label, 
  value, 
  hint, 
  icon, 
  trend, 
  delay = 0,
  fullWidth = false,
  style,
  color
}: MetricCardProps) {
  const { colors } = useTheme();
  const accentColor = color || colors.primary;

  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(600).springify().damping(15)}
      style={[
        styles.card, 
        { 
          borderColor: colors.border,
          flex: fullWidth ? 0 : 1,
          width: fullWidth ? '100%' : undefined,
          backgroundColor: colors.surface,
        },
        style
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

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon && (
              <View style={[styles.iconWrapper, { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 0.5 }]}>
                <AppIcon name={icon} size={14} color={accentColor} strokeWidth={2.5} />
              </View>
            )}
            <Text style={[styles.label, { color: colors.muted }]}>{label.toUpperCase()}</Text>
          </View>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: "rgba(255,255,255,0.03)", borderColor: trend.startsWith('+') ? colors.success + '40' : colors.error + '40', borderWidth: 0.5 }]}>
              <Text style={[styles.trendText, { color: trend.startsWith('+') ? colors.success : colors.error }]}>{trend}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.body}>
          <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
          {hint && (
            <Text style={[styles.hint, { color: colors.muted }]} numberOfLines={1}>
              {hint.toUpperCase()}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    minHeight: 120,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    fontSize: 9,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  body: {
    gap: 0,
  },
  value: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  hint: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
