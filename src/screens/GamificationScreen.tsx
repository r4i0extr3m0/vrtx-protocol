import { useMemo, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeInDown,
  ZoomIn
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { SectionCard } from "@/src/components/SectionCard";
import { useTheme } from "@/src/hooks";
import { useGamificationStore } from "@/src/store/gamificationStore";
import { radius, spacing, typography, shadows } from "@/src/theme";
import * as Haptics from "expo-haptics";

const BADGES_INFO: Record<string, { title: string; description: string; icon: string }> = {
  xp_100: { title: "Iniciante", description: "Alcançou 100 XP", icon: "🌱" },
  xp_1000: { title: "Atleta", description: "Alcançou 1000 XP", icon: "🔥" },
  streak_7: { title: "Consistente", description: "7 dias de streak", icon: "⚡" },
  streak_30: { title: "Inabalável", description: "30 dias de streak", icon: "🏆" },
};

export function GamificationScreen() {
  const { colors } = useTheme();
  const { streak, totalXP, level, badges } = useGamificationStore();

  const nextLevelXP = Math.pow(level, 2) * 100;
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const progress = Math.min((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP), 1);

  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withSpring(progress, { damping: 15, stiffness: 100 });
  }, [progress, progressValue]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const handleBadgePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Evolução</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Sua jornada para a melhor versão.</Text>
        </View>

        <View style={styles.statsRow}>
          <Animated.View 
            entering={ZoomIn.delay(100)}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
          >
            <View style={[styles.emojiBg, { backgroundColor: colors.warning + "15" }]}>
              <Text style={styles.statEmoji}>🔥</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Streak</Text>
          </Animated.View>
          
          <Animated.View 
            entering={ZoomIn.delay(200)}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
          >
            <View style={[styles.emojiBg, { backgroundColor: colors.primary + "15" }]}>
              <Text style={styles.statEmoji}>⭐</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalXP}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total XP</Text>
          </Animated.View>
        </View>

        <SectionCard 
          title={`Nível ${level}`} 
          subtitle={`${totalXP} / ${nextLevelXP} XP para o próximo nível`}
          delay={300}
        >
          <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
            <Animated.View style={[styles.progressBarFill, animatedProgressStyle]}>
              <LinearGradient
                colors={colors.brandGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </SectionCard>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conquistas</Text>
        
        <View style={styles.badgesGrid}>
          {Object.entries(BADGES_INFO).map(([id, info], index) => {
            const isUnlocked = badges.includes(id);
            return (
              <Animated.View
                key={id}
                entering={FadeInDown.delay(400 + index * 100)}
                style={{ width: "47%" }}
              >
                <Pressable
                  onPress={handleBadgePress}
                  style={[
                    styles.badgeCard,
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: isUnlocked ? colors.primary : colors.border,
                      opacity: isUnlocked ? 1 : 0.6 
                    },
                    shadows.card
                  ]}
                >
                  <View style={[styles.badgeIconWrapper, { backgroundColor: isUnlocked ? colors.primary + "10" : "rgba(255,255,255,0.05)" }]}>
                    <Text style={[styles.badgeIcon, { opacity: isUnlocked ? 1 : 0.4 }]}>{info.icon}</Text>
                  </View>
                  <Text style={[styles.badgeTitle, { color: colors.foreground }]}>{info.title}</Text>
                  <Text style={[styles.badgeDesc, { color: colors.muted }]}>{info.description}</Text>
                  {!isUnlocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={{ fontSize: 10 }}>🔒</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  emojiBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  statEmoji: {
    fontSize: 32,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: spacing.sm,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  badgeCard: {
    padding: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 1,
    alignItems: "center",
    gap: spacing.xs,
    position: "relative",
    width: '100%',
  },
  badgeIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  badgeIcon: {
    fontSize: 40,
  },
  badgeTitle: {
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  badgeDesc: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 16,
  },
  lockOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
