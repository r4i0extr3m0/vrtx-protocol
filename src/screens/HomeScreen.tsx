import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SyncStatusPill } from "@/src/components/SyncStatusPill";
import { AppIcon } from "@/src/components/AppIcon";
import { useTabBarInset, useWorkout, useTheme } from "@/src/hooks";
import { summarizeWorkout } from "@/src/domain/workout";
import { spacing, typography, radius, shadows } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import { LinearGradient } from "expo-linear-gradient";
import { usePremiumStore } from "@/src/store/premiumStore";
import { useGamificationStore } from "@/src/store/gamificationStore";
import { useDietStore } from "@/src/store/dietStore";

function getCurrentWeekStartMs(): number {
  const date = new Date();
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function getLastWorkoutLabel(workoutDate: string | null): string {
  if (!workoutDate) {
    return "Nenhum treino concluido ainda";
  }

  const today = new Date();
  const target = new Date(`${workoutDate}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));

  if (diffDays === 0) {
    return "Ultimo treino: hoje";
  }

  if (diffDays === 1) {
    return "Ultimo treino: ontem";
  }

  return `Ultimo treino: ha ${diffDays} dias`;
}

export function HomeScreen() {
  const { colors } = useTheme();
  const { workouts, activeWorkoutId, createWorkout } = useWorkout();
  const { meals } = useDietStore();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();
  const streak = useGamificationStore((state) => state.streak);
  const totalXP = useGamificationStore((state) => state.totalXP);
  const isPremium = usePremiumStore((state) => state.isPremium);

  const today = new Date().toISOString().slice(0, 10);
  const activeWorkout = workouts.find((workout) => workout.id === activeWorkoutId) ?? null;
  const completedWorkouts = useMemo(
    () =>
      workouts
        .filter((workout) => Boolean(workout.completedAt))
        .sort((left, right) => {
          const leftTimestamp = Date.parse(left.completedAt ?? left.startedAt ?? left.date);
          const rightTimestamp = Date.parse(right.completedAt ?? right.startedAt ?? right.date);
          return rightTimestamp - leftTimestamp;
        }),
    [workouts],
  );
  const latestCompletedWorkout = completedWorkouts[0] ?? null;
  const todayCompletedWorkout = completedWorkouts.find((workout) => workout.date === today) ?? null;
  const todayMealsCount = useMemo(
    () => meals.filter((meal) => meal.date === today && meal.mealType !== "water").length,
    [meals, today],
  );
  const last7WorkoutCount = useMemo(() => {
    const windowStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return completedWorkouts.filter((workout) => {
      const timestamp = Date.parse(workout.completedAt ?? workout.startedAt ?? workout.date);
      return Number.isFinite(timestamp) && timestamp >= windowStart;
    }).length;
  }, [completedWorkouts]);
  const currentWeekVolume = useMemo(() => {
    const currentWeekStartMs = getCurrentWeekStartMs();
    return completedWorkouts.reduce((acc, workout) => {
      const completedAtMs = Date.parse(workout.completedAt ?? workout.startedAt ?? workout.date);
      if (!Number.isFinite(completedAtMs) || completedAtMs < currentWeekStartMs) {
        return acc;
      }

      return acc + summarizeWorkout(workout).totalVolume;
    }, 0);
  }, [completedWorkouts]);

  const handleNewWorkout = () => {
    const draft = createWorkout("Treino rápido");
    router.push({ pathname: "/workout/[id]", params: { id: draft.id } } as never);
  };

  const handlePrimaryAction = () => {
    if (activeWorkout) {
      router.push({ pathname: "/workout/[id]", params: { id: activeWorkout.id } } as never);
      return;
    }

    if (todayCompletedWorkout) {
      router.push("/statistics?source=home&tab=performance" as never);
      return;
    }

    handleNewWorkout();
  };

  const todayTitle = activeWorkout
    ? "Retomar treino"
    : todayCompletedWorkout
      ? todayMealsCount
        ? "Loop fechado"
        : "Treino concluido"
      : "Comecar treino";
  const todaySubtitle = activeWorkout
    ? `${activeWorkout.name} em andamento. Continue de onde voce parou.`
    : todayCompletedWorkout
      ? todayMealsCount
        ? "Treino e refeicao registrados. Abra o Status para revisar o dia com clareza."
        : "Seu treino de hoje ja contou. Registre uma refeicao para fechar o loop."
      : "Abra, registre o treino e feche o dia em poucos toques.";
  const latestWorkoutLabel = getLastWorkoutLabel(latestCompletedWorkout?.date ?? null);
  const showRecoveryAction = isPremium && todayCompletedWorkout;
  const nextActionTitle = !todayMealsCount
    ? "Registrar refeicao"
    : showRecoveryAction
      ? "Ver recuperacao"
      : "Ver historico";
  const nextActionDescription = !todayMealsCount
    ? "Registre uma refeicao simples para fechar o loop do dia sem abrir varios caminhos."
    : showRecoveryAction
      ? "Abra a leitura de hoje e confira o que seu log sugere para carga e descanso."
      : "Revise sua ultima sessao sem tirar o foco do treino de hoje.";
  const nextActionButtonLabel = !todayMealsCount
    ? "Registrar refeicao"
    : showRecoveryAction
      ? "Ver recuperacao"
      : "Ver historico";
  const handleNextAction = () => {
    if (!todayMealsCount) {
      router.push("/diet/add-meal" as never);
      return;
    }

    if (showRecoveryAction) {
      router.push("/statistics?tab=recovery&source=home" as never);
      return;
    }

    router.push("/history" as never);
  };
  const premiumInsight = latestCompletedWorkout
    ? streak >= 3
      ? `${streak} dias seguidos. Sua consistencia esta construindo tracao.`
      : "Seu ultimo treino ja esta alimentando a leitura de performance."
    : "Complete o primeiro treino para transformar o Status em leitura util.";

  return (
    <ScreenContainer className="px-5">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.foregroundMuted }]}>Painel de hoje</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>VRTX Protocol</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Abra, treine e acompanhe o que importa hoje.
            </Text>
          </View>
          <SyncStatusPill />
        </Animated.View>

        <View style={styles.stack}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <Pressable onPress={handlePrimaryAction}>
              <LinearGradient
                colors={colors.brandGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.mainActionCard, shadows.card]}
              >
                <View style={styles.mainActionContent}>
                  <Text style={styles.mainActionEyebrow}>Hoje</Text>
                  <Text style={styles.mainActionTitle}>{todayTitle}</Text>
                  <Text style={styles.mainActionSubtitle}>{todaySubtitle}</Text>
                  <Text style={styles.mainActionMeta}>{latestWorkoutLabel}</Text>
                </View>
                <View style={styles.mainActionIcon}>
                  <AppIcon name="Zap" size={24} color="#000" strokeWidth={2.5} />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(280)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: colors.primary + "15" }]}>
                <AppIcon name="BarChart" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardEyebrow, { color: colors.foregroundMuted }]}>Status</Text>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Preview do seu status</Text>
              </View>
            </View>
            <View style={styles.statusGrid}>
              <View style={[styles.statusItem, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.statusValue, { color: colors.foreground }]}>{streak}</Text>
                <Text style={[styles.statusLabel, { color: colors.muted }]}>dias de streak</Text>
              </View>
              <View style={[styles.statusItem, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.statusValue, { color: colors.foreground }]}>{totalXP}</Text>
                <Text style={[styles.statusLabel, { color: colors.muted }]}>XP total</Text>
              </View>
              <View style={[styles.statusItem, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.statusValue, { color: colors.foreground }]}>{last7WorkoutCount}</Text>
                <Text style={[styles.statusLabel, { color: colors.muted }]}>treinos em 7 dias</Text>
              </View>
              <View style={[styles.statusItem, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.statusValue, { color: colors.foreground }]}>
                  {formatVolume(currentWeekVolume)}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.muted }]}>volume semana</Text>
              </View>
            </View>
            {isPremium ? (
              <Text style={[styles.insightText, { color: colors.foreground }]}>{premiumInsight}</Text>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <AppIcon name="Sparkles" size={14} color={colors.warning} />
                <Text style={[styles.statusBadgeText, { color: colors.foreground }]}>Recuperacao no Pro</Text>
              </View>
            )}
            <AppButton
              label="Ver Status"
              onPress={() => router.push("/statistics?source=home&tab=performance" as never)}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(360)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: colors.warning + "15" }]}>
                <AppIcon name="Zap" size={20} color={colors.warning} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardEyebrow, { color: colors.foregroundMuted }]}>Proxima acao</Text>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{nextActionTitle}</Text>
              </View>
            </View>
            <Text style={[styles.cardBody, { color: colors.foreground }]}>{nextActionDescription}</Text>
            <AppButton
              label={nextActionButtonLabel}
              onPress={handleNextAction}
              variant="brand"
            />
          </Animated.View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: typography.family.heading,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.5,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: typography.family.body,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  stack: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  cardEyebrow: {
    fontFamily: typography.family.body,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontFamily: typography.family.heading,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  cardBody: {
    fontFamily: typography.family.body,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  mainActionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.xxl,
    minHeight: 132,
    gap: spacing.md,
  },
  mainActionContent: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  mainActionEyebrow: {
    color: 'rgba(0,0,0,0.62)',
    fontFamily: typography.family.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mainActionTitle: {
    color: '#000',
    fontFamily: typography.family.heading,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mainActionSubtitle: {
    color: 'rgba(0,0,0,0.72)',
    fontFamily: typography.family.body,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  mainActionMeta: {
    color: 'rgba(0,0,0,0.58)',
    fontFamily: typography.family.body,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: spacing.sm,
  },
  mainActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statusItem: {
    width: "47.5%",
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 4,
  },
  statusValue: {
    fontFamily: typography.family.heading,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statusLabel: {
    fontFamily: typography.family.body,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusBadgeText: {
    fontFamily: typography.family.body,
    fontSize: 12,
    fontWeight: "700",
  },
  insightText: {
    fontFamily: typography.family.body,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
