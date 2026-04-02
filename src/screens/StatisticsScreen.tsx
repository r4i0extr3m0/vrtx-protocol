import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BarChart } from "@/src/components/Charts/BarChart";
import { LineChart } from "@/src/components/Charts/LineChart";
import { MetricCard } from "@/src/components/MetricCard";
import { SectionCard } from "@/src/components/SectionCard";
import { calculateWorkoutVolume, findBestEstimatedOneRM } from "@/src/domain/strength";
import { summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return `${String(start.getMonth() + 1).padStart(2, "0")}/${String(start.getDate()).padStart(2, "0")}`;
}

export function StatisticsScreen() {
  const { colors } = useTheme();
  const { workouts } = useWorkout();
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  // Completed workouts only
  const completedWorkouts = useMemo(
    () => workouts.filter((w) => Boolean(w.completedAt)),
    [workouts],
  );

  const summaries = useMemo(
    () => completedWorkouts.map((w) => summarizeWorkout(w)),
    [completedWorkouts],
  );

  const totalVolume = summaries.reduce((acc, s) => acc + s.totalVolume, 0);
  const bestOneRM = summaries.reduce((acc, s) => Math.max(acc, s.bestOneRM), 0);
  const totalSessions = completedWorkouts.length;
  const avgVolume = totalSessions > 0 ? totalVolume / totalSessions : 0;

  // All unique exercise names across completed workouts
  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    completedWorkouts.forEach((w) => w.exercises.forEach((e) => names.add(e.name)));
    return [...names].sort();
  }, [completedWorkouts]);

  const currentExercise = selectedExercise || exerciseNames[0] || "";

  // 1RM evolution for selected exercise
  const oneRMData = useMemo(() => {
    return completedWorkouts
      .filter((w) => w.exercises.some((e) => e.name === currentExercise))
      .map((w) => {
        const ex = w.exercises.find((e) => e.name === currentExercise);
        const oneRM = ex ? findBestEstimatedOneRM(ex.sets) : 0;
        return { label: w.date.slice(5), value: oneRM };
      })
      .slice(-10);
  }, [completedWorkouts, currentExercise]);

  // Weekly volume bar chart
  const weeklyVolumeData = useMemo(() => {
    const weekMap = new Map<string, number>();
    completedWorkouts.forEach((w) => {
      const week = getWeekLabel(w.date);
      const vol = calculateWorkoutVolume(w.exercises.flatMap((e) => e.sets));
      weekMap.set(week, (weekMap.get(week) ?? 0) + vol);
    });
    return [...weekMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([label, value]) => ({ label, value }));
  }, [completedWorkouts]);

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Estatísticas</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Métricas de progressão, volume e força estimada baseadas em dados reais.
          </Text>
        </View>

        {/* Key metrics */}
        <View style={styles.metricRow}>
          <MetricCard label="Volume total" value={formatVolume(totalVolume)} hint="Todas as sessões" />
          <MetricCard label="1RM máximo" value={`${bestOneRM.toFixed(1)} kg`} hint="Estimativa Brzycki" />
        </View>
        <View style={styles.metricRow}>
          <MetricCard label="Sessões" value={String(totalSessions)} hint="Treinos concluídos" />
          <MetricCard label="Vol. médio" value={formatVolume(avgVolume)} hint="Por sessão" />
        </View>

        {/* Weekly volume chart */}
        {weeklyVolumeData.length > 0 && (
          <SectionCard title="Volume semanal" subtitle="Kg totais por semana de treino.">
            <BarChart data={weeklyVolumeData} unit=" kg" color={colors.primary} />
          </SectionCard>
        )}

        {/* 1RM evolution per exercise */}
        {exerciseNames.length > 0 && (
          <SectionCard title="Evolução do 1RM" subtitle="Selecione um exercício para ver a progressão.">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {exerciseNames.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => setSelectedExercise(name)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: currentExercise === name ? colors.primary : colors.surfaceAlt,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: currentExercise === name ? colors.background : colors.foreground },
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {currentExercise ? (
              <LineChart
                data={oneRMData}
                title={`1RM – ${currentExercise}`}
                unit=" kg"
                color={colors.primaryStrong}
              />
            ) : (
              <Text style={[styles.body, { color: colors.muted }]}>
                Nenhum exercício encontrado.
              </Text>
            )}
          </SectionCard>
        )}

        {/* Summary text */}
        <SectionCard title="Resumo" subtitle="Visão geral do seu histórico de treino.">
          <Text style={[styles.body, { color: colors.foreground }]}>
            {totalSessions === 0
              ? "Nenhuma sessão concluída ainda. Complete treinos para ver suas estatísticas."
              : `Você concluiu ${totalSessions} sessão${totalSessions !== 1 ? "ões" : ""}, acumulando ${formatVolume(totalVolume)} de volume total. Seu melhor 1RM estimado é de ${bestOneRM.toFixed(1)} kg.`}
          </Text>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.sm },
  title: { fontSize: typography.title, fontWeight: "900" },
  subtitle: { fontSize: typography.body, lineHeight: 22 },
  metricRow: { flexDirection: "row", gap: spacing.md },
  body: { fontSize: typography.body, lineHeight: 22 },
  chipRow: { flexGrow: 0, marginBottom: spacing.md },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  chipText: { fontSize: typography.caption, fontWeight: "700" },
});
