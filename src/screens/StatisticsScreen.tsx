import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon } from "@/src/components/AppIcon";
import { MetricCard } from "@/src/components/MetricCard";
import { SectionCard } from "@/src/components/SectionCard";
import { summarizeWorkout } from "@/src/domain/workout";
import { useTabBarInset, useTheme, useWorkout } from "@/src/hooks";
import { useGamificationStore } from "@/src/store/gamificationStore";
import { usePremiumStore } from "@/src/store/premiumStore";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";
import { radius, spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";

type StatusTab = "performance" | "recovery";

type WeeklyBucket = {
  startMs: number;
  totalVolume: number;
  sessionCount: number;
};

const DAY_MS = 86400000;

function getWorkoutTimestamp(input?: string): number {
  const timestamp = Date.parse(input ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getDaysBetween(startMs: number, endMs: number): number {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endMs - startMs) / DAY_MS));
}

function getWeekStartMs(input: number | string | Date): number {
  const date = new Date(input);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function formatDayLabel(days: number): string {
  if (days === 0) return "hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function formatPercent(value: number): string {
  return `${Math.round(Math.abs(value))}%`;
}

function countConsecutiveTrainingDays(dayKeys: string[]): number {
  if (dayKeys.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < dayKeys.length; index += 1) {
    const previous = Date.parse(dayKeys[index - 1]);
    const current = Date.parse(dayKeys[index]);
    if (!Number.isFinite(previous) || !Number.isFinite(current)) {
      break;
    }

    if (getDaysBetween(current, previous) !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function StatisticsScreen() {
  const params = useLocalSearchParams<{ source?: string; tab?: StatusTab }>();
  const { colors } = useTheme();
  const { workouts } = useWorkout();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();
  const streak = useGamificationStore((state) => state.streak);
  const totalXP = useGamificationStore((state) => state.totalXP);
  const isPremium = usePremiumStore((state) => state.isPremium);
  const [activeTab, setActiveTab] = useState<StatusTab>("performance");
  const completedWorkoutCount = workouts.filter((workout) => Boolean(workout.completedAt)).length;

  useEffect(() => {
    if (params.tab === "performance" || params.tab === "recovery") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.STATUS_VIEWED, {
      source: params.source ?? "tab",
      premium: isPremium,
      completed_workouts: completedWorkoutCount,
    });
  }, [completedWorkoutCount, isPremium, params.source]);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.STATUS_TAB_VIEWED, {
      tab: activeTab,
      source: params.source ?? "tab",
    });
  }, [activeTab, params.source]);

  const completedWorkouts = useMemo(
    () =>
      workouts
        .filter((workout) => Boolean(workout.completedAt))
        .sort((left, right) => {
          const leftTimestamp = getWorkoutTimestamp(left.completedAt ?? left.startedAt ?? left.date);
          const rightTimestamp = getWorkoutTimestamp(right.completedAt ?? right.startedAt ?? right.date);
          return rightTimestamp - leftTimestamp;
        }),
    [workouts],
  );

  const workoutSnapshots = useMemo(
    () =>
      completedWorkouts.map((workout) => ({
        workout,
        completedAtMs: getWorkoutTimestamp(workout.completedAt ?? workout.startedAt ?? workout.date),
        dayKey: (workout.completedAt ?? workout.startedAt ?? workout.date).slice(0, 10),
        summary: summarizeWorkout(workout),
      })),
    [completedWorkouts],
  );

  const totalSessions = workoutSnapshots.length;
  const bestOneRM = workoutSnapshots.reduce((acc, item) => Math.max(acc, item.summary.bestOneRM), 0);
  const latestSnapshot = workoutSnapshots[0] ?? null;
  const previousSnapshot = workoutSnapshots[1] ?? null;
  const latestVolumeDelta =
    latestSnapshot && previousSnapshot
      ? latestSnapshot.summary.totalVolume - previousSnapshot.summary.totalVolume
      : null;

  const currentWeekStartMs = useMemo(() => getWeekStartMs(Date.now()), []);
  const weeklyBuckets = useMemo(() => {
    const bucketMap = new Map<number, WeeklyBucket>();

    workoutSnapshots.forEach((item) => {
      const weekStartMs = getWeekStartMs(item.completedAtMs);
      const currentBucket = bucketMap.get(weekStartMs) ?? {
        startMs: weekStartMs,
        totalVolume: 0,
        sessionCount: 0,
      };

      currentBucket.totalVolume += item.summary.totalVolume;
      currentBucket.sessionCount += 1;
      bucketMap.set(weekStartMs, currentBucket);
    });

    bucketMap.set(
      currentWeekStartMs,
      bucketMap.get(currentWeekStartMs) ?? {
        startMs: currentWeekStartMs,
        totalVolume: 0,
        sessionCount: 0,
      },
    );

    return [...bucketMap.values()].sort((left, right) => right.startMs - left.startMs);
  }, [currentWeekStartMs, workoutSnapshots]);

  const currentWeekBucket =
    weeklyBuckets.find((bucket) => bucket.startMs === currentWeekStartMs) ?? {
      startMs: currentWeekStartMs,
      totalVolume: 0,
      sessionCount: 0,
    };
  const baselineBuckets = weeklyBuckets.filter((bucket) => bucket.startMs < currentWeekStartMs).slice(0, 4);
  const baselineReady = baselineBuckets.length >= 2;
  const baselineAverageVolume = baselineReady
    ? baselineBuckets.reduce((acc, bucket) => acc + bucket.totalVolume, 0) / baselineBuckets.length
    : 0;
  const baselineAverageSessions = baselineReady
    ? baselineBuckets.reduce((acc, bucket) => acc + bucket.sessionCount, 0) / baselineBuckets.length
    : 0;
  const volumeVsBaselinePct =
    baselineReady && baselineAverageVolume > 0
      ? ((currentWeekBucket.totalVolume - baselineAverageVolume) / baselineAverageVolume) * 100
      : null;

  const distinctTrainingDays = useMemo(
    () => [...new Set(workoutSnapshots.map((item) => item.dayKey))],
    [workoutSnapshots],
  );

  const last7WorkoutCount = useMemo(() => {
    const cutoff = Date.now() - 7 * DAY_MS;
    return workoutSnapshots.filter((item) => item.completedAtMs >= cutoff).length;
  }, [workoutSnapshots]);

  const recoveryMetrics = useMemo(() => {
    const latestCompletedAtMs = latestSnapshot?.completedAtMs ?? null;
    const daysSinceLastWorkout =
      latestCompletedAtMs === null ? null : getDaysBetween(latestCompletedAtMs, Date.now());
    const consecutiveTrainingDays = countConsecutiveTrainingDays(distinctTrainingDays);
    const acwr =
      baselineReady && baselineAverageVolume > 0
        ? currentWeekBucket.totalVolume / baselineAverageVolume
        : null;

    let recoveryState = "Baseline em formacao";
    let recoverySummary = "Complete 2 semanas para liberar uma leitura mais estavel.";
    let nextAction = "Proxima acao: mantenha o habito e forme o baseline.";

    if (totalSessions === 0) {
      recoveryState = "Sem dados";
      recoverySummary = "Conclua treinos para abrir esta leitura.";
      nextAction = "Proxima acao: registre sua primeira sessao.";
    } else if (baselineReady) {
      recoveryState = "Ritmo estavel";
      recoverySummary = "Carga semanal e frequencia estao dentro de um ritmo conservador.";
      nextAction = "Proxima acao: mantenha a carga e a execucao limpa.";

      if ((acwr ?? 0) >= 1.25 || consecutiveTrainingDays >= 3) {
        recoveryState = "Carga puxada";
        recoverySummary = "Sua carga recente subiu e a frequencia apertou.";
        nextAction = "Proxima acao: reduza 10% da carga ou tire 1 serie.";
      } else if ((acwr ?? 0) <= 0.8 && (daysSinceLastWorkout ?? 0) >= 2) {
        recoveryState = "Janela boa";
        recoverySummary = "Voce abriu espaco suficiente para voltar ao plano.";
        nextAction = "Proxima acao: entre no treino de hoje e retome a sequencia.";
      } else if ((daysSinceLastWorkout ?? 0) === 0) {
        recoveryState = "Dia contado";
        recoverySummary = "Seu treino de hoje ja entrou no volume da semana.";
        nextAction = "Proxima acao: preserve a carga no proximo treino.";
      }
    }

    return {
      acwr,
      consecutiveTrainingDays,
      daysSinceLastWorkout,
      recoveryState,
      recoverySummary,
      nextAction,
    };
  }, [
    baselineAverageVolume,
    baselineReady,
    currentWeekBucket.totalVolume,
    distinctTrainingDays,
    latestSnapshot,
    totalSessions,
  ]);

  const postWorkoutHeadline =
    params.source === "workout_complete"
      ? baselineReady && volumeVsBaselinePct !== null
        ? `Treino salvo. Sua semana ficou ${formatPercent(volumeVsBaselinePct)} ${volumeVsBaselinePct >= 0 ? "acima" : "abaixo"} do baseline.`
        : "Treino salvo. Seu baseline ainda esta em formacao."
      : null;

  const performanceSummary =
    totalSessions === 0
      ? "Conclua seu primeiro treino para abrir volume semanal, consistencia e melhor 1RM."
      : baselineReady && volumeVsBaselinePct !== null
        ? `Sua semana esta ${formatPercent(volumeVsBaselinePct)} ${volumeVsBaselinePct >= 0 ? "acima" : "abaixo"} do baseline de 4 semanas, com ${currentWeekBucket.sessionCount} treino${currentWeekBucket.sessionCount !== 1 ? "s" : ""} nesta semana.`
        : `Baseline em formacao. Voce tem ${currentWeekBucket.sessionCount} treino${currentWeekBucket.sessionCount !== 1 ? "s" : ""} nesta semana e ${last7WorkoutCount} nos ultimos 7 dias.`;

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Status</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Veja o que conta hoje e qual e a proxima acao.
          </Text>
        </View>

        {params.source === "home" ? (
          <SectionCard title="Voltando da Home" subtitle="Leitura curta para fechar o loop.">
            <Text style={[styles.body, { color: colors.foreground }]}>
              {activeTab === "recovery"
                ? "Voce veio pela proxima acao. Leia a recuperacao e ajuste a carga do proximo treino sem abrir mais caminhos."
                : "Voce veio pelo bloco Status. Veja a leitura principal e decida o proximo passo com menos ruido."}
            </Text>
          </SectionCard>
        ) : null}

        {postWorkoutHeadline ? (
          <SectionCard title="Treino registrado" subtitle="Fechou o loop diario.">
            <View style={styles.completedBanner}>
              <View style={[styles.completedIcon, { backgroundColor: colors.success + "18" }]}>
                <AppIcon name="Check" size={18} color={colors.success} />
              </View>
              <View style={styles.completedCopy}>
                <Text style={[styles.body, { color: colors.foreground }]}>{postWorkoutHeadline}</Text>
                <Text style={[styles.support, { color: colors.muted }]}>{recoveryMetrics.nextAction}</Text>
              </View>
            </View>
          </SectionCard>
        ) : null}

        <View style={styles.tabRow}>
          {[
            { key: "performance" as const, label: "Performance" },
            { key: "recovery" as const, label: "Recuperacao" },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceAlt,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.tabLabel, { color: active ? colors.background : colors.foreground }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "performance" ? (
          <>
            <View style={styles.metricRow}>
              <MetricCard label="Volume semana" value={formatVolume(currentWeekBucket.totalVolume)} hint="Carga aguda" />
              <MetricCard
                label="Baseline 4s"
                value={baselineReady ? formatVolume(baselineAverageVolume) : "Em formacao"}
                hint="Media de 4 semanas"
              />
            </View>
            <View style={styles.metricRow}>
              <MetricCard label="Treinos semana" value={String(currentWeekBucket.sessionCount)} hint="Consistencia" />
              <MetricCard label="Melhor 1RM" value={`${bestOneRM.toFixed(1)} kg`} hint="Forca estimada" />
            </View>
            <View style={styles.metricRow}>
              <MetricCard label="Streak" value={String(streak)} hint="Dias seguidos" />
              <MetricCard label="XP total" value={String(totalXP)} hint="Progresso" />
            </View>

            <SectionCard title="Resumo de performance" subtitle="Leitura curta e objetiva.">
              <Text style={[styles.body, { color: colors.foreground }]}>{performanceSummary}</Text>
              {params.source === "home" ? (
                <AppButton
                  label="Ver historico"
                  onPress={() => router.push("/history" as never)}
                  variant="secondary"
                />
              ) : null}
            </SectionCard>

            <SectionCard title="Ultima sessao" subtitle="Seu ponto mais recente de prova.">
              <Text style={[styles.body, { color: colors.foreground }]}>
                {latestSnapshot
                  ? `${latestSnapshot.workout.name} gerou ${formatVolume(latestSnapshot.summary.totalVolume)}, ${latestSnapshot.summary.setCount} series e 1RM estimado de ${latestSnapshot.summary.bestOneRM.toFixed(1)} kg.`
                  : "Conclua seu primeiro treino para abrir o resumo da ultima sessao."}
              </Text>
              {latestVolumeDelta !== null ? (
                <Text style={[styles.support, { color: latestVolumeDelta >= 0 ? colors.success : colors.warning }]}>
                  {latestVolumeDelta >= 0 ? "Volume acima" : "Volume abaixo"} do treino anterior em {formatVolume(Math.abs(latestVolumeDelta))}.
                </Text>
              ) : null}
              {latestSnapshot ? (
                <AppButton
                  label="Abrir detalhes"
                  onPress={() => router.push({ pathname: "/history/[id]", params: { id: latestSnapshot.workout.id } } as never)}
                  variant="secondary"
                />
              ) : null}
            </SectionCard>

            <SectionCard title="Baseline" subtitle="Modelo conservador do MVP.">
              <Text style={[styles.body, { color: colors.foreground }]}>
                {baselineReady
                  ? `O baseline usa 4 semanas fixas. Sua media recente esta em ${formatVolume(baselineAverageVolume)} e ${baselineAverageSessions.toFixed(1)} treino${baselineAverageSessions >= 1.5 ? "s" : ""} por semana.`
                  : "Baseline em formacao. Complete pelo menos 2 semanas de dados para comparacoes mais confiaveis."}
              </Text>
            </SectionCard>
          </>
        ) : isPremium ? (
          <>
            <View style={styles.metricRow}>
              <MetricCard
                label="Carga aguda"
                value={formatVolume(currentWeekBucket.totalVolume)}
                hint="Volume da semana"
              />
              <MetricCard
                label="ACWR"
                value={recoveryMetrics.acwr === null ? "Em formacao" : recoveryMetrics.acwr.toFixed(2)}
                hint="Carga aguda vs cronica"
              />
            </View>
            <View style={styles.metricRow}>
              <MetricCard
                label="Dias seguidos"
                value={String(recoveryMetrics.consecutiveTrainingDays)}
                hint="Frequencia recente"
              />
              <MetricCard
                label="Ultimo treino"
                value={
                  recoveryMetrics.daysSinceLastWorkout === null
                    ? "-"
                    : formatDayLabel(recoveryMetrics.daysSinceLastWorkout)
                }
                hint="Tempo desde a ultima sessao"
              />
            </View>

            <SectionCard title="Recuperacao" subtitle="Leitura conservadora baseada no seu log.">
              <Text style={[styles.body, { color: colors.foreground }]}>{recoveryMetrics.recoverySummary}</Text>
            </SectionCard>

            <SectionCard title="Proxima acao" subtitle="Nada de linguagem medica ou alarmista.">
              <Text style={[styles.body, { color: colors.foreground }]}>{recoveryMetrics.nextAction}</Text>
              {params.source === "home" ? (
                <AppButton
                  label="Voltar ao treino"
                  onPress={() => router.push("/workout" as never)}
                  variant="secondary"
                />
              ) : null}
            </SectionCard>
          </>
        ) : (
          <SectionCard title="Recuperacao" subtitle="Previa do Status avancado.">
            <View style={styles.lockedBlock}>
              <View style={styles.metricRow}>
                <MetricCard
                  label="Previa"
                  value={recoveryMetrics.recoveryState}
                  hint={baselineReady ? "Carga semanal + frequencia" : "Baseline em formacao"}
                />
              </View>
              <Text style={[styles.body, { color: colors.foreground }]}>
                Recuperacao estima risco por carga semanal e frequencia. Desbloqueie no Pro.
              </Text>
              <AppButton label="Desbloquear Recuperacao (Pro)" onPress={() => router.push("/premium" as never)} />
            </View>
          </SectionCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.sm },
  title: { fontSize: typography.title, fontWeight: "900", letterSpacing: -1 },
  subtitle: { fontSize: typography.body, lineHeight: 24, fontWeight: "500" },
  metricRow: { flexDirection: "row", gap: spacing.md },
  body: { fontSize: typography.body, lineHeight: 24 },
  support: { fontSize: typography.caption, fontWeight: "700", lineHeight: 18 },
  tabRow: { flexDirection: "row", gap: spacing.sm },
  tabButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    fontSize: typography.caption,
    fontWeight: "800",
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  completedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  completedCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  lockedBlock: {
    gap: spacing.md,
  },
});
