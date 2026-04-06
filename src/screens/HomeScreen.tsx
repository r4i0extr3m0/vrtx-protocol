import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SyncStatusPill } from "@/src/components/SyncStatusPill";
import { AppIcon } from "@/src/components/AppIcon";
import { useWorkout, useTheme } from "@/src/hooks";
import { summarizeWorkout } from "@/src/domain/workout";
import { spacing, typography, radius, shadows } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import { LinearGradient } from "expo-linear-gradient";
import { usePremiumStore } from "@/src/store/premiumStore";
import { useGamificationStore } from "@/src/store/gamificationStore";

function getCurrentWeekStartMs(): number {
  const date = new Date();
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export function HomeScreen() {
  const { colors } = useTheme();
  const { workouts, activeWorkoutId, createWorkout } = useWorkout();
  const streak = useGamificationStore((state) => state.streak);
  const totalXP = useGamificationStore((state) => state.totalXP);
  const isPremium = usePremiumStore((state) => state.isPremium);

  const today = new Date().toISOString().slice(0, 10);
  const activeWorkout = workouts.find((workout) => workout.id === activeWorkoutId) ?? null;
  const completedWorkouts = useMemo(
    () => workouts.filter((workout) => Boolean(workout.completedAt)),
    [workouts],
  );
  const todayCompletedWorkout = completedWorkouts.find((workout) => workout.date === today) ?? null;
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
      router.push("/statistics" as never);
      return;
    }

    handleNewWorkout();
  };

  const todayTitle = activeWorkout
    ? "Retomar treino"
    : todayCompletedWorkout
      ? "Treino concluido"
      : "Comecar treino";
  const todaySubtitle = activeWorkout
    ? `${activeWorkout.name} em andamento. Continue de onde voce parou.`
    : todayCompletedWorkout
      ? "Seu treino de hoje ja contou para o streak. Abra o Status para ver o resumo."
      : "Entre, registre e feche o loop diario em poucos toques.";
  const nextActionTitle = activeWorkout
    ? "Finalize a sessao atual"
    : todayCompletedWorkout
      ? isPremium
        ? "Abrir recuperacao de hoje"
        : "Desbloquear recuperacao Pro"
      : "Registrar o treino do dia";
  const nextActionDescription = activeWorkout
    ? "Volte para o treino e conclua as series pendentes."
    : todayCompletedWorkout
      ? isPremium
        ? "Veja sinais simples de carga e descanso usando seu proprio log."
        : "Tracking continua livre. O plano Pro libera a leitura de recuperacao e insights."
      : "Seu loop ideal e: Hoje, treino concluido, Status atualizado e streak mantido.";
  const nextActionButtonLabel = activeWorkout
    ? "Retomar agora"
    : todayCompletedWorkout
      ? isPremium
        ? "Abrir Status"
        : "Ver Premium"
      : "Comecar treino";
  const handleNextAction = () => {
    if (activeWorkout) {
      router.push({ pathname: "/workout/[id]", params: { id: activeWorkout.id } } as never);
      return;
    }

    if (todayCompletedWorkout) {
      router.push((isPremium ? "/statistics" : "/premium") as never);
      return;
    }

    handleNewWorkout();
  };

  return (
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.foregroundMuted }]}>Painel de hoje</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>VRTX Protocol</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Command Center do MVP: abrir, treinar, fechar o dia e acompanhar progresso real.
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
                  <Text style={styles.mainActionSubtitle}>
                    {todaySubtitle}
                  </Text>
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
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Performance e consistencia</Text>
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
                <Text style={[styles.statusValue, { color: colors.foreground }]}>{completedWorkouts.length}</Text>
                <Text style={[styles.statusLabel, { color: colors.muted }]}>treinos concluidos</Text>
              </View>
              <View style={[styles.statusItem, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.statusValue, { color: colors.foreground }]}>
                  {formatVolume(currentWeekVolume)}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.muted }]}>volume semana</Text>
              </View>
            </View>
            <Text style={[styles.cardBody, { color: colors.muted }]}>
              {isPremium
                ? "Abra o Status para acompanhar performance e recuperacao usando apenas o seu log."
                : "Free mostra progresso basico. O Pro libera a aba de recuperacao e leituras mais profundas."}
            </Text>
            <AppButton
              label={isPremium ? "Abrir Status" : "Abrir Status basico"}
              onPress={() => router.push("/statistics" as never)}
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
            <Text style={[styles.cardBody, { color: colors.foreground }]}>
              {nextActionDescription}
            </Text>
            <View style={styles.actionHighlights}>
              <View style={styles.actionHighlight}>
                <AppIcon name="Check" size={16} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.muted }]}>
                  {todayCompletedWorkout ? "Dia contado no streak" : "Loop diario em 30-90 segundos"}
                </Text>
              </View>
              <View style={styles.actionHighlight}>
                <AppIcon name="Calendar" size={16} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.muted }]}>
                  {last7WorkoutCount} treino{last7WorkoutCount !== 1 ? "s" : ""} nos ultimos 7 dias
                </Text>
              </View>
            </View>
            <AppButton
              label={nextActionButtonLabel}
              onPress={handleNextAction}
              variant={todayCompletedWorkout && !isPremium ? "secondary" : "brand"}
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
  actionHighlights: {
    gap: spacing.sm,
  },
  actionHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionText: {
    fontFamily: typography.family.body,
    fontSize: 13,
    fontWeight: "700",
  },
});
