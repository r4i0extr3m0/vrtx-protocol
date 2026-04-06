import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { MetricCard } from "@/src/components/MetricCard";
import { SectionCard } from "@/src/components/SectionCard";
import { SyncStatusPill } from "@/src/components/SyncStatusPill";
import { AppIcon, IconName } from "@/src/components/AppIcon";
import { useWorkout, useTheme } from "@/src/hooks";
import { summarizeWorkout } from "@/src/domain/workout";
import { spacing, typography, radius, shadows } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboardStore, WidgetConfig } from "@/src/store/dashboardStore";
import { HapticFeedback } from "@/src/services/haptics";
import { useDietStore } from "@/src/store/dietStore";
import { fetchAIRecommendations, sendAIFeedback, translateAIError, AIApiError } from "@/src/services/AIInsights";
import type { AIAnalyzeResponse, FitnessObjective, TrainingLevel } from "@/src/types/ai";
import { useAuthStore } from "@/src/store/authStore";
import { usePremiumStore } from "@/src/store/premiumStore";

export function HomeScreen() {
  const { colors } = useTheme();
  const { workouts, createWorkout } = useWorkout();
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
  const [aiFeedback, setAiFeedback] = useState<-1 | 0 | 1>(0);

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
      // só tenta buscar quando há pelo menos algum dado
      if (workouts.length === 0 && meals.length === 0) return;
      if (!isAuthenticated || !userId) return;

      // Atualiza uso (server-side) e faz gate antes de chamar /analyze
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
  }, [level, meals.length, objective, workouts.length, last7Summary, isAuthenticated, refreshAIUsage, userId]);

  const handleNewWorkout = () => {
    const draft = createWorkout("Treino rápido");
    trackEvent(ANALYTICS_EVENTS.WORKOUT_STARTED, { workout_id: draft.id });
    router.push({ pathname: "/workout/[id]", params: { id: draft.id } } as never);
  };

  const renderWidget = (widget: WidgetConfig, index: number) => {
    if (!widget.visible) return null;

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
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.foregroundMuted }]}>Painel de hoje</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>VRTX Protocol</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Acompanhe seu ritmo, retome seu treino e veja o que merece atencao agora.
            </Text>
          </View>
          <SyncStatusPill />
        </Animated.View>

        {/* Bento Grid Layout com Widgets Dinâmicos */}
        <View style={styles.bentoGrid}>
          {/* Main Action Card */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.span2}>
            <Pressable onPress={handleNewWorkout}>
              <LinearGradient
                colors={colors.brandGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.mainActionCard, shadows.card]}
              >
                <View style={styles.mainActionContent}>
                  <Text style={styles.mainActionEyebrow}>Treino do dia</Text>
                  <Text style={styles.mainActionTitle}>Comecar treino</Text>
                  <Text style={styles.mainActionSubtitle}>
                    {latestWorkout ? `Ultimo treino: ${latestWorkout.name}` : "Toque para iniciar uma nova sessao"}
                  </Text>
                </View>
                <View style={styles.mainActionIcon}>
                  <AppIcon name="Zap" size={24} color="#000" strokeWidth={2.5} />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Renderização Dinâmica de Widgets com Animação de Layout */}
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

          {/* Quick Library Scroll */}
          <View style={styles.span2}>
             <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Atalhos</Text>
                <Pressable onPress={() => {
                  HapticFeedback.selection();
                  // Abriria modal de customização do dashboard
                }}>
                  <AppIcon name="Settings" size={20} color={colors.muted} />
                </Pressable>
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.libraryScroll}>
                {[
                  { label: "Exercícios", icon: "Dumbbell" as IconName, path: "/exercises" },
                  { label: "Templates", icon: "ClipboardList" as IconName, path: "/templates" },
                  { label: "Dieta", icon: "Apple" as IconName, path: "/diet" },
                  { label: "Progresso", icon: "TrendingUp" as IconName, path: "/gamification" },
                  { label: "Coach IA", icon: "psychology" as IconName, path: "/ai-coach" },
                  { label: "Perfil", icon: "User" as IconName, path: "/profile" },
                ].map((item, i) => (
                  <Animated.View key={item.label} entering={FadeInDown.delay(700 + i * 100)}>
                    <Pressable 
                      onPress={() => router.push(item.path as never)}
                      style={[styles.libraryItem, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
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

          {/* Recent Activity / Insights */}
          <View style={styles.span2}>
            <SectionCard title="Sugestoes da IA" subtitle="Leitura dos seus ultimos 7 dias para destacar prioridades.">
              {aiLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <ActivityIndicator />
                  <Text style={[styles.insightText, { color: colors.muted }]}>Preparando sugestoes personalizadas...</Text>
                </View>
              ) : aiError ? (
                <View style={{ gap: spacing.sm }}>
                  <Text style={[styles.insightText, { color: colors.muted }]}>{aiError}</Text>
                  {aiError.includes("Assine") ? (
                    <AppButton label="Ver Premium" onPress={() => router.push("/premium" as never)} />
                  ) : null}
                </View>
              ) : aiData ? (
                <View style={{ gap: spacing.sm }}>
                  <Text style={[styles.insightText, { color: colors.foreground }]}>{aiData.summary}</Text>
                  {aiData.nextBestActions?.slice(0, 2).map((a) => (
                    <View key={a} style={styles.insightRow}>
                      <View style={[styles.insightIcon, { backgroundColor: colors.primary + "15" }]}>
                        <AppIcon name="psychology" size={20} color={colors.primary} />
                      </View>
                      <Text style={[styles.insightText, { color: colors.foreground }]}>{a}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                    <Pressable
                      onPress={() => {
                        HapticFeedback.selection();
                        setAiFeedback(1);
                        void sendAIFeedback({
                          kind: "analyze",
                          rating: 1,
                          userId: userId ?? undefined,
                          cacheKey: aiData.meta?.cacheKey,
                        }).catch(() => undefined);
                      }}
                      style={[
                        styles.feedbackBtn,
                        {
                          backgroundColor: aiFeedback === 1 ? colors.success + "20" : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <AppIcon name="thumb-up" size={18} color={aiFeedback === 1 ? colors.success : colors.muted} />
                      <Text style={[styles.feedbackText, { color: aiFeedback === 1 ? colors.success : colors.foregroundMuted }]}>Util</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        HapticFeedback.selection();
                        setAiFeedback(-1);
                        void sendAIFeedback({
                          kind: "analyze",
                          rating: -1,
                          userId: userId ?? undefined,
                          cacheKey: aiData.meta?.cacheKey,
                        }).catch(() => undefined);
                      }}
                      style={[
                        styles.feedbackBtn,
                        {
                          backgroundColor: aiFeedback === -1 ? colors.error + "18" : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <AppIcon name="thumb-down" size={18} color={aiFeedback === -1 ? colors.error : colors.muted} />
                      <Text style={[styles.feedbackText, { color: aiFeedback === -1 ? colors.error : colors.foregroundMuted }]}>Nao curti</Text>
                    </Pressable>
                  </View>
                  <AppButton label="Abrir AI Coach" onPress={() => router.push("/ai-coach" as never)} />
                </View>
              ) : (
                <Text style={[styles.insightText, { color: colors.muted }]}>
                  Registre treinos e refeicoes para receber sugestoes mais uteis por aqui.
                </Text>
              )}
            </SectionCard>
          </View>
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
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  widgetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    width: '100%',
  },
  widgetHalf: {
    width: '47.5%', // Aproximadamente metade com gap
  },
  span2: {
    width: '100%',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.family.heading,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  libraryScroll: {
    gap: spacing.md,
    paddingRight: spacing.xl,
    paddingBottom: spacing.sm,
  },
  libraryItem: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 118,
    gap: spacing.sm,
  },
  libraryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryLabel: {
    fontFamily: typography.family.body,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 16,
    textAlign: 'center',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    fontFamily: typography.family.body,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  feedbackText: {
    fontFamily: typography.family.body,
    fontSize: 13,
    fontWeight: "800",
  },
});
