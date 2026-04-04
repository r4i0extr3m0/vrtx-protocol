import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
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
      entering={FadeInDown.delay(delay).duration(450)}
      style={[
        styles.card, 
        { 
          borderColor: colors.border,
          flex: fullWidth ? 0 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        shadows.card,
        style
      ]}
    >
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon && (
              <View style={[styles.iconWrapper, { backgroundColor: accentColor + '15' }]}>
                <AppIcon name={icon} size={16} color={accentColor} strokeWidth={2.5} />
              </View>
            )}
            <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
          </View>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trend.startsWith('+') ? colors.success + '15' : colors.error + '15' }]}>
              <Text style={[styles.trendText, { color: trend.startsWith('+') ? colors.success : colors.error }]}>{trend}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.body}>
          <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
          {hint && (
            <Text style={[styles.hint, { color: colors.muted }]} numberOfLines={1}>
              {hint}
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
    width: 28,
    height: 28,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "800",
  },
  body: {
    gap: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  hint: {
    fontSize: 12,
    fontWeight: "600",
  },
});
