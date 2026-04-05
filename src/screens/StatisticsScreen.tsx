import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { 
  ScreenWrapper, 
  GlassCard, 
  BadgeMetal, 
  ProgressBarGlow 
} from "../components/ui";
import { BarChart } from "@/src/components/Charts/BarChart";
import { LineChart } from "@/src/components/Charts/LineChart";
import { calculateWorkoutVolume, findBestEstimatedOneRM } from "@/src/domain/strength";
import { summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import { AppIcon } from "@/src/components/AppIcon";

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

  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    completedWorkouts.forEach((w) => w.exercises.forEach((e) => names.add(e.name)));
    return [...names].sort();
  }, [completedWorkouts]);

  const currentExercise = selectedExercise || exerciseNames[0] || "";

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
    <ScreenWrapper withSafeArea={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: typography.family.heading }]}>
              ANALYTICS_CORE
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.family.mono }]}>
              STATUS: TELEMETRIA_DE_ALTA_PRECISÃO
            </Text>
          </View>
          <BadgeMetal label="DATA_MINING" variant="metal" />
        </Animated.View>

        {/* Key metrics grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <GlassCard style={styles.metricCard} intensity={15}>
              <Text style={[styles.metricLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>VOLUME_TOTAL</Text>
              <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>{formatVolume(totalVolume)}</Text>
              <ProgressBarGlow progress={0.8} height={2} color={colors.primary} glow={false} />
            </GlassCard>
            <GlassCard style={styles.metricCard} intensity={15}>
              <Text style={[styles.metricLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>1RM_MAX_EST</Text>
              <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>{bestOneRM.toFixed(1)}KG</Text>
              <ProgressBarGlow progress={0.6} height={2} color={colors.primaryGlow} glow={false} />
            </GlassCard>
          </View>
          <View style={styles.metricsRow}>
            <GlassCard style={styles.metricCard} intensity={15}>
              <Text style={[styles.metricLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>SESSÕES_LOG</Text>
              <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>{totalSessions}</Text>
            </GlassCard>
            <GlassCard style={styles.metricCard} intensity={15}>
              <Text style={[styles.metricLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>VOL_MÉDIO</Text>
              <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>{formatVolume(avgVolume)}</Text>
            </GlassCard>
          </View>
        </View>

        {/* Weekly volume chart */}
        {weeklyVolumeData.length > 0 && (
          <GlassCard style={styles.chartCard} intensity={20}>
            <View style={styles.chartHeader}>
              <AppIcon name="BarChart2" size={16} color={colors.primary} />
              <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>VOLUME_SEMANAL_KG</Text>
            </View>
            <View style={styles.chartWrapper}>
              <BarChart data={weeklyVolumeData} unit=" kg" color={colors.primary} />
            </View>
          </GlassCard>
        )}

        {/* 1RM evolution per exercise */}
        {exerciseNames.length > 0 && (
          <GlassCard style={styles.chartCard} intensity={20}>
            <View style={styles.chartHeader}>
              <AppIcon name="TrendingUp" size={16} color={colors.primaryGlow} />
              <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>EVOLUÇÃO_1RM_EST</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {exerciseNames.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => setSelectedExercise(name)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: currentExercise === name ? colors.primary : 'rgba(255,255,255,0.05)',
                      borderColor: currentExercise === name ? colors.primary : 'rgba(255,255,255,0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { 
                        color: currentExercise === name ? "#000" : colors.foreground,
                        fontFamily: typography.family.mono 
                      },
                    ]}
                  >
                    {name.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.chartWrapper}>
              {currentExercise ? (
                <LineChart
                  data={oneRMData}
                  title={`1RM – ${currentExercise}`}
                  unit=" kg"
                  color={colors.primaryGlow}
                />
              ) : (
                <Text style={[styles.emptyChart, { color: colors.muted, fontFamily: typography.family.mono }]}>
                  NENHUM_EXERCÍCIO_SELECIONADO
                </Text>
              )}
            </View>
          </GlassCard>
        )}

        {/* Summary text */}
        <GlassCard style={styles.summaryCard} intensity={10}>
          <View style={styles.summaryHeader}>
            <AppIcon name="FileText" size={16} color={colors.muted} />
            <Text style={[styles.summaryTitle, { color: colors.muted, fontFamily: typography.family.mono }]}>SUMÁRIO_EXECUTIVO</Text>
          </View>
          <Text style={[styles.summaryBody, { color: colors.foreground, fontFamily: typography.family.mono }]}>
            {totalSessions === 0
              ? "SISTEMA_AGUARDANDO_DADOS: Complete treinos para gerar telemetria."
              : `VOCÊ_CONCLUIU ${totalSessions} SESSÕES. VOLUME_TOTAL: ${formatVolume(totalVolume)}. MELHOR_1RM: ${bestOneRM.toFixed(1)}KG.`}
          </Text>
        </GlassCard>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.6,
  },
  metricsGrid: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  chartCard: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  chartWrapper: {
    minHeight: 200,
  },
  chipRow: {
    marginBottom: 20,
  },
  chip: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyChart: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 80,
    opacity: 0.5,
  },
  summaryCard: {
    padding: 20,
    gap: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryBody: {
    fontSize: 11,
    lineHeight: 18,
    opacity: 0.8,
  },
});
