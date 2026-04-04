import { useMemo, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from "react-native";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeInDown
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
  const {
    streak,
    totalXP,
    level,
    badges,
    dailyMissions,
    league,
    weekId,
    recordActivity,
    claimMission,
  } = useGamificationStore();

  const [tab, setTab] = useState<"missions" | "league" | "badges">("missions");

  useEffect(() => {
    // Check-in 1x por dia (conta para missão e streak)
    recordActivity("checkin", 1);
  }, []);

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
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Missões diárias, liga semanal e conquistas.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Animated.View 
            entering={FadeInDown.delay(120).duration(450)}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
          >
            <View style={[styles.emojiBg, { backgroundColor: colors.warning + "15" }]}>
              <Text style={styles.statEmoji}>🔥</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Streak</Text>
          </Animated.View>
          
          <Animated.View 
            entering={FadeInDown.delay(220).duration(450)}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
          >
            <View style={[styles.emojiBg, { backgroundColor: colors.primary + "15" }]}>
              <Text style={styles.statEmoji}>⭐</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalXP}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total XP</Text>
          </Animated.View>
        </View>

        <View style={[styles.tabs, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setTab("missions")}
            style={[styles.tabBtn, tab === "missions" && { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.tabText, { color: tab === "missions" ? colors.foreground : colors.muted }]}>Missões</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("league")}
            style={[styles.tabBtn, tab === "league" && { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.tabText, { color: tab === "league" ? colors.foreground : colors.muted }]}>Liga</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("badges")}
            style={[styles.tabBtn, tab === "badges" && { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.tabText, { color: tab === "badges" ? colors.foreground : colors.muted }]}>Conquistas</Text>
          </Pressable>
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

        {tab === "missions" ? (
          <SectionCard title="Missões de hoje" subtitle="Complete, colete e suba na liga." delay={380}>
            <View style={{ gap: spacing.md }}>
              {dailyMissions.map((m) => {
                const done = m.progress >= m.target;
                const claimed = Boolean(m.claimedAt);
                const pct = Math.min(1, m.progress / m.target);
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.missionRow,
                      { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "900" }}>{m.title}</Text>
                      <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 12 }}>{m.description}</Text>
                      <View style={[styles.missionBarBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.missionBarFill, { width: `${pct * 100}%`, backgroundColor: done ? colors.success : colors.primary }]} />
                      </View>
                      <Text style={{ color: colors.muted, fontWeight: "800", fontSize: 11 }}>
                        {m.progress}/{m.target} • +{m.rewardXp} XP
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const res = claimMission(m.id);
                        if (!res.ok) Alert.alert("Missões", res.message ?? "Não foi possível coletar.");
                      }}
                      disabled={!done || claimed}
                      style={[
                        styles.claimBtn,
                        {
                          backgroundColor: done ? (claimed ? colors.surface : colors.primary) : colors.surface,
                          borderColor: done ? (claimed ? colors.border : colors.primary) : colors.border,
                          opacity: done ? 1 : 0.6,
                        },
                      ]}
                    >
                      <Text style={{ color: done ? (claimed ? colors.muted : "#000") : colors.muted, fontWeight: "900" }}>
                        {claimed ? "Coletado" : done ? "Coletar" : "Fazer"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </SectionCard>
        ) : null}

        {tab === "league" ? (
          <SectionCard
            title={`Liga ${league.tier}`}
            subtitle={`Semana ${weekId ?? ""} • rank #${league.rank}`}
            delay={380}
          >
            <View style={{ gap: spacing.md }}>
              <View style={[styles.leagueRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontWeight: "800", fontSize: 12 }}>XP nesta semana</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 28, letterSpacing: -1.2 }}>
                    {league.xpThisWeek}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.muted, fontWeight: "800", fontSize: 12 }}>Zona</Text>
                  <Text style={{ color: league.rank <= league.promotionCutoff ? colors.success : league.rank >= league.demotionCutoff ? colors.error : colors.foreground, fontWeight: "900" }}>
                    {league.rank <= league.promotionCutoff
                      ? "Promoção"
                      : league.rank >= league.demotionCutoff
                        ? "Rebaixamento"
                        : "Segura"}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.muted, fontWeight: "800", fontSize: 12 }}>
                  Meta rápida (hoje): complete 1 missão + finalize 1 treino.
                </Text>
                <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 12 }}>
                  Top {league.promotionCutoff} sobe • #{league.demotionCutoff}+ cai
                </Text>
              </View>
            </View>
          </SectionCard>
        ) : null}

        {tab === "badges" ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conquistas</Text>
            <View style={styles.badgesGrid}>
              {Object.entries(BADGES_INFO).map(([id, info], index) => {
                const isUnlocked = badges.includes(id);
                return (
                  <Animated.View
                    key={id}
                    entering={FadeInDown.delay(240 + index * 90)}
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
          </>
        ) : null}
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
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.2,
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
  missionRow: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  missionBarBg: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 6,
  },
  missionBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  claimBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  leagueRow: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
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
