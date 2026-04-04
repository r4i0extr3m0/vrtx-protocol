import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp, Layout, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { MetricCard } from "@/src/components/MetricCard";
import { SectionCard } from "@/src/components/SectionCard";
import { SyncStatusPill } from "@/src/components/SyncStatusPill";
import { AppIcon, IconName } from "@/src/components/AppIcon";
import { SkeletonLoader } from "@/src/components/SkeletonLoader";
import { useWorkout, useTheme } from "@/src/hooks";
import { summarizeWorkout } from "@/src/domain/workout";
import { spacing, typography, radius, shadows } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore, WidgetConfig } from "@/src/store/dashboardStore";
import { HapticFeedback } from "@/src/services/haptics";
import { useDietStore } from "@/src/store/dietStore";
import { fetchAIRecommendations, translateAIError, AIApiError } from "@/src/services/AIInsights";
import type { AIAnalyzeResponse, FitnessObjective, TrainingLevel } from "@/src/types/ai";
import { useAuthStore } from "@/src/store/authStore";
import { usePremiumStore } from "@/src/store/premiumStore";
import { ScreenBackdrop } from "../components/ScreenBackdrop";

const { width } = Dimensions.get("window");

export function HomeScreen() {
  const { colors } = useTheme();
  const { workouts, createWorkout, isLoading: workoutsLoading } = useWorkout();
  const { widgets } = useDashboardStore();
  const meals = useDietStore((s) => s.meals);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const refreshAIUsage = usePremiumStore((s) => s.refreshAIUsage);
  
  const latestWorkout = workouts[0] ?? null;
  const summary = latestWorkout ? summarizeWorkout(latestWorkout) : null;

  const [objective] = useState<FitnessObjective>("hypertrophy");
  const [level] = useState<TrainingLevel>("intermediate");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AIAnalyzeResponse | null>(null);

  const last7Summary = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const lastWorkouts = workouts.filter((w) => {
      const ts = Date.parse(w.startedAt || w.date);
      return Number.isFinite(ts) && ts >= sevenDaysAgo;
    });

    const totalVolumeKg = lastWorkouts.reduce((acc, w) => {
      const workoutVolume = w.exercises.reduce((wAcc, ex) => {
        const exVol = ex.sets.reduce((sAcc, set) => sAcc + set.reps * set.weightKg, 0);
        return wAcc + exVol;
      }, 0);
      return acc + workoutVolume;
    }, 0);

    const lastMeals = meals.filter((m) => Date.parse(m.createdAt) >= sevenDaysAgo);
    const caloriesAvg = Math.round(lastMeals.reduce((acc, m) => acc + m.totalCalories, 0) / 7);
    const proteinGAvg = Math.round(lastMeals.reduce((acc, m) => acc + m.totalProtein, 0) / 7);

    return {
      workoutCount: lastWorkouts.length,
      totalVolumeKg,
      caloriesAvg: Number.isFinite(caloriesAvg) ? caloriesAvg : undefined,
      proteinGAvg: Number.isFinite(proteinGAvg) ? proteinGAvg : undefined,
    };
  }, [meals, workouts]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (workouts.length === 0 && meals.length === 0) return;
      if (!isAuthenticated || !userId) return;

      await refreshAIUsage(userId);
      const latestUsage = usePremiumStore.getState().aiUsage;
      const remaining = latestUsage?.analyze?.remaining ?? null;
      const isPremium = latestUsage?.is_premium ?? false;
      if (!isPremium && remaining !== null && remaining <= 0) {
        setAiError("Limite diário de IA atingido. Assine o Premium para continuar.");
        return;
      }

      setAiLoading(true);
      setAiError(null);
      try {
        const res = await fetchAIRecommendations({
          userId,
          objective,
          level,
          last7Days: last7Summary,
        });
        if (!cancelled) setAiData(res);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof AIApiError && e.status === 403 && e.code === "daily_limit") {
          setAiError("Limite diário de IA atingido. Assine o Premium para continuar.");
          return;
        }
        setAiError(translateAIError(e).message);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [level, meals.length, objective, workouts.length, last7Summary, isAuthenticated, userId]);

  const handleNewWorkout = () => {
    HapticFeedback.impactMedium();
    const draft = createWorkout("Protocolo de Execução");
    trackEvent(ANALYTICS_EVENTS.WORKOUT_STARTED, { workout_id: draft.id });
    router.push({ pathname: "/workout/[id]", params: { id: draft.id } } as never);
  };

  const renderWidget = (widget: WidgetConfig, index: number) => {
    if (!widget.visible) return null;

    if (workoutsLoading) {
      return (
        <View style={[styles.widgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={{ gap: 8, marginTop: 12 }}>
            <SkeletonLoader width={80} height={12} borderRadius={4} />
            <SkeletonLoader width={120} height={24} borderRadius={4} />
          </View>
        </View>
      );
    }

    switch (widget.type) {
      case 'volume':
        return (
          <MetricCard 
            key={widget.id}
            label="Volume Total" 
            value={summary ? formatVolume(summary.totalVolume) : "0 kg"} 
            icon="Dumbbell"
            trend="+12%" 
            delay={300 + index * 100} 
          />
        );
      case 'streak':
        return (
          <MetricCard 
            key={widget.id}
            label="Streak" 
            value="7" 
            icon="Flame"
            hint="dias seguidos" 
            color={colors.warning}
            delay={300 + index * 100} 
          />
        );
      case 'pr':
        return (
          <MetricCard 
            key={widget.id}
            label="1RM Máximo" 
            value={summary ? `${summary.bestOneRM.toFixed(1)} kg` : "0 kg"} 
            icon="Trophy"
            hint="Supino Reto" 
            delay={300 + index * 100} 
          />
        );
      case 'sessions':
        return (
          <MetricCard 
            key={widget.id}
            label="Sessões" 
            value={String(workouts.length)} 
            icon="Calendar"
            hint="Total histórico" 
            delay={300 + index * 100} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer>
      <ScreenBackdrop />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.foreground }]}>VRTX_COMMAND_CENTER</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>STATUS: OPERACIONAL // USER_ID: {userId?.slice(0, 8)}</Text>
          </View>
          <SyncStatusPill />
        </Animated.View>

        <View style={styles.bentoGrid}>
          {/* Hero Card: Protocolo de Execução */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.span2}>
            <Pressable onPress={handleNewWorkout}>
              <LinearGradient
                colors={["#1A1A1A", "#121212"]}
                style={[styles.mainActionCard, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <View style={styles.heroContent}>
                  <Text style={[styles.kicker, { color: colors.primary }]}>PRÓXIMA_MISSÃO</Text>
                  <Text style={styles.mainActionTitle}>PROTOCOLO_DE_EXECUÇÃO</Text>
                  <Text style={[styles.mainActionSubtitle, { color: colors.muted }]}>
                    {latestWorkout ? `ÚLTIMO_LOG: ${latestWorkout.name.toUpperCase()}` : "INICIAR_NOVO_LOG_DE_TREINO"}
                  </Text>
                </View>
                <View style={[styles.mainActionIcon, { backgroundColor: colors.primary }]}>
                  <AppIcon name="Zap" size={24} color="#000" strokeWidth={2.5} />
                </View>
                
                {/* Border Glow Effect */}
                <View style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, borderWidth: 0.5, borderColor: "rgba(124, 198, 255, 0.2)" }]} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Widgets Grid */}
          <View style={styles.widgetsContainer}>
            {widgets.map((widget, index) => (
              <Animated.View 
                key={widget.id} 
                layout={Layout.duration(220)}
                style={widget.type === 'volume' || widget.type === 'streak' || widget.type === 'pr' || widget.type === 'sessions' ? styles.widgetHalf : styles.span2}
              >
                {renderWidget(widget, index)}
              </Animated.View>
            ))}
          </View>

          {/* AI Insights Bento Card */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.span2}>
            <SectionCard 
              title="ANÁLISE_PREDITIVA_IA" 
              icon="Zap"
              loading={aiLoading}
              error={aiError}
            >
              {aiData ? (
                <View style={styles.aiContent}>
                  <Text style={[styles.aiText, { color: colors.foregroundMuted }]}>{aiData.summary}</Text>
                  <View style={styles.aiMetrics}>
                    <View style={[styles.aiMetricPill, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.aiMetricLabel, { color: colors.muted }]}>FOCO</Text>
                      <Text style={[styles.aiMetricValue, { color: colors.primary }]}>{aiData.recommendations[0]?.slice(0, 20)}...</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={[styles.aiPlaceholder, { color: colors.muted }]}>Aguardando telemetria de dados para análise...</Text>
              )}
            </SectionCard>
          </Animated.View>

          {/* Library Section */}
          <View style={styles.span2}>
             <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>LOGS_DE_DESEMPENHO</Text>
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.libraryScroll}>
                {[
                  { label: "EXERCÍCIOS", icon: "Dumbbell" as IconName, path: "/exercises" },
                  { label: "TEMPLATES", icon: "ClipboardList" as IconName, path: "/templates" },
                  { label: "DIETA", icon: "Apple" as IconName, path: "/diet" },
                  { label: "PROGRESSO", icon: "TrendingUp" as IconName, path: "/gamification" },
                ].map((item, i) => (
                  <Animated.View key={item.label} entering={FadeInDown.delay(800 + i * 100)}>
                    <Pressable 
                      onPress={() => {
                        HapticFeedback.selection();
                        router.push(item.path as never);
                      }}
                      style={[styles.libraryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={[styles.libraryIconWrapper, { backgroundColor: colors.surfaceAlt }]}>
                        <AppIcon name={item.icon} size={20} color={colors.primary} />
                      </View>
                      <Text style={[styles.libraryLabel, { color: colors.foreground }]}>{item.label}</Text>
                    </Pressable>
                  </Animated.View>
                ))}
             </ScrollView>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: "monospace",
  },
  bentoGrid: {
    gap: spacing.lg,
  },
  span2: {
    width: '100%',
  },
  mainActionCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 120,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: "monospace",
  },
  mainActionTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mainActionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: "monospace",
  },
  mainActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  widgetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  widgetHalf: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
  },
  widgetCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 140,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: "monospace",
  },
  libraryScroll: {
    gap: spacing.md,
  },
  libraryItem: {
    width: 110,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  libraryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: "monospace",
  },
  aiContent: {
    gap: spacing.md,
  },
  aiText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "monospace",
  },
  aiMetrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  aiMetricPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiMetricLabel: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: "monospace",
  },
  aiMetricValue: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: "monospace",
  },
  aiPlaceholder: {
    fontSize: 12,
    fontFamily: "monospace",
    fontStyle: 'italic',
  }
});
