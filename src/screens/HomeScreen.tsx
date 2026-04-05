import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Dimensions } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { 
  ScreenWrapper, 
  GlassCard, 
  NeonButton, 
  BadgeMetal, 
  ProgressBarGlow 
} from "../components/ui";
import { AppIcon } from "@/src/components/AppIcon";
import { useWorkout, useTheme } from "@/src/hooks";
import { summarizeWorkout } from "@/src/domain/workout";
import { typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";
import { fetchAIRecommendations } from "@/src/services/AIInsights";
import { useAuthStore } from "@/src/store/authStore";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

export function HomeScreen() {
  const { colors } = useTheme();
  const { workouts, createWorkout } = useWorkout();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const latestWorkout = workouts[0] ?? null;
  const summary = latestWorkout ? summarizeWorkout(latestWorkout) : null;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);

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
    return { workoutCount: lastWorkouts.length, totalVolumeKg };
  }, [workouts]);

  useEffect(() => {
    const run = async () => {
      if (!latestWorkout || !isAuthenticated || !userId) return;
      setAiLoading(true);
      try {
        const res = await fetchAIRecommendations({
          userId,
          objective: "hypertrophy",
          level: "intermediate",
          last7Days: last7Summary,
        });
        setAiData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setAiLoading(false);
      }
    };
    void run();
  }, [isAuthenticated, last7Summary, latestWorkout, userId]);

  const handleNewWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const draft = createWorkout("Protocolo de Execução");
    trackEvent(ANALYTICS_EVENTS.WORKOUT_STARTED, { workout_id: draft.id });
    router.push({ pathname: "/workout/[id]", params: { id: draft.id } } as never);
  };

  return (
    <ScreenWrapper withSafeArea={false}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: typography.family.heading }]}>
              VRTX_COMMAND_CENTER
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.family.mono }]}>
              STATUS: OPERACIONAL // OPERADOR: {userId?.slice(0, 8).toUpperCase()}
            </Text>
          </View>
          <BadgeMetal label="REDUNDANCY_ON" variant="metal" />
        </Animated.View>

        {/* Hero Card: PRÓXIMA MISSÃO */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.heroSection}>
          <Pressable onPress={handleNewWorkout}>
            <GlassCard style={styles.heroCard} intensity={40}>
              <View style={styles.heroHeader}>
                <BadgeMetal label="PRÓXIMA_MISSÃO" variant="primary" />
                <View style={styles.pulseContainer}>
                  <View style={[styles.pulse, { backgroundColor: colors.primary }]} />
                </View>
              </View>
              <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                PROTOCOLO_DE_EXECUÇÃO
              </Text>
              <Text style={[styles.heroDesc, { color: colors.muted, fontFamily: typography.family.mono }]}>
                {latestWorkout ? `ÚLTIMO_LOG: ${latestWorkout.name.toUpperCase()}` : "INICIAR_NOVO_LOG_DE_TREINO"}
              </Text>
              <NeonButton 
                label="INICIAR_SESSÃO" 
                onPress={handleNewWorkout} 
                variant="primary" 
                style={styles.heroButton}
                icon={<AppIcon name="Zap" size={16} color="#000" />}
              />
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoRow}>
            <GlassCard style={styles.bentoHalf} intensity={15}>
              <View style={styles.bentoHeader}>
                <AppIcon name="Dumbbell" size={14} color={colors.primary} />
                <Text style={[styles.bentoLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>VOLUME</Text>
              </View>
              <Text style={[styles.bentoValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>
                {summary ? formatVolume(summary.totalVolume) : "0KG"}
              </Text>
              <BadgeMetal label="+12%" variant="success" style={styles.bentoTrend} />
            </GlassCard>

            <GlassCard style={styles.bentoHalf} intensity={15}>
              <View style={styles.bentoHeader}>
                <AppIcon name="Flame" size={14} color="#F59E0B" />
                <Text style={[styles.bentoLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>STREAK</Text>
              </View>
              <Text style={[styles.bentoValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>7</Text>
              <Text style={[styles.bentoSub, { color: colors.muted, fontFamily: typography.family.mono }]}>DIAS_ATIVOS</Text>
            </GlassCard>
          </View>

          <View style={styles.bentoRow}>
            <GlassCard style={styles.bentoHalf} intensity={15}>
              <View style={styles.bentoHeader}>
                <AppIcon name="Trophy" size={14} color={colors.primaryGlow} />
                <Text style={[styles.bentoLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>1RM_MAX</Text>
              </View>
              <Text style={[styles.bentoValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>
                {summary ? `${summary.bestOneRM.toFixed(0)}KG` : "0KG"}
              </Text>
              <Text style={[styles.bentoSub, { color: colors.muted, fontFamily: typography.family.mono }]}>SUPINO_RETO</Text>
            </GlassCard>

            <GlassCard style={styles.bentoHalf} intensity={15}>
              <View style={styles.bentoHeader}>
                <AppIcon name="Calendar" size={14} color={colors.secondary} />
                <Text style={[styles.bentoLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>SESSÕES</Text>
              </View>
              <Text style={[styles.bentoValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>
                {workouts.length}
              </Text>
              <Text style={[styles.bentoSub, { color: colors.muted, fontFamily: typography.family.mono }]}>LOGS_TOTAIS</Text>
            </GlassCard>
          </View>
        </View>

        {/* AI Predictive Analysis Section */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.aiSection}>
          <GlassCard style={styles.aiCard} intensity={25}>
            <View style={styles.aiHeader}>
              <AppIcon name="Cpu" size={18} color={colors.primary} />
              <Text style={[styles.aiTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                ANÁLISE_PREDITIVA_IA
              </Text>
            </View>
            <View style={styles.aiDivider} />
            {aiLoading ? (
              <View style={styles.aiLoading}>
                <ProgressBarGlow progress={0.6} color={colors.primary} glow />
                <Text style={[styles.aiLoadingText, { color: colors.muted, fontFamily: typography.family.mono }]}>
                  PROCESSANDO_DADOS_TELEMETRIA...
                </Text>
              </View>
            ) : (
              <View>
                <Text style={[styles.aiSummary, { color: colors.foregroundMuted }]}>
                  {aiData?.summary || "Sincronize mais treinos para gerar insights preditivos de performance."}
                </Text>
                <View style={styles.aiTags}>
                  <BadgeMetal label="HIPERTROFIA_OTIMIZADA" variant="metal" />
                  <BadgeMetal label="RECUPERAÇÃO_72H" variant="metal" />
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Small Navigation Cards */}
        <View style={styles.navGrid}>
          {[
            { label: 'Exercícios', icon: 'Dumbbell', path: '/exercises' },
            { label: 'Templates', icon: 'Copy', path: '/templates' },
            { label: 'Dieta', icon: 'Apple', path: '/diet' },
            { label: 'Progresso', icon: 'TrendingUp', path: '/evolution' },
          ].map((item, i) => (
            <Pressable 
              key={item.label} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.path as any);
              }}
              style={styles.navItem}
            >
              <GlassCard style={styles.navCard} intensity={10}>
                <AppIcon name={item.icon as any} size={20} color={colors.muted} />
                <Text style={[styles.navLabel, { color: colors.foreground, fontFamily: typography.family.mono }]}>
                  {item.label.toUpperCase()}
                </Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.6,
  },
  heroSection: {
    marginBottom: 20,
  },
  heroCard: {
    padding: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 24,
    opacity: 0.7,
  },
  heroButton: {
    marginTop: 8,
  },
  pulseContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    // Note: Animation would be added here for real pulse
  },
  bentoGrid: {
    gap: 12,
    marginBottom: 20,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoHalf: {
    flex: 1,
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bentoLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bentoValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  bentoSub: {
    fontSize: 8,
    letterSpacing: 1,
    opacity: 0.5,
  },
  bentoTrend: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  aiSection: {
    marginBottom: 20,
  },
  aiCard: {
    padding: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  aiLoading: {
    gap: 12,
    paddingVertical: 10,
  },
  aiLoadingText: {
    fontSize: 9,
    textAlign: 'center',
    opacity: 0.5,
  },
  aiSummary: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  aiTags: {
    flexDirection: 'row',
    gap: 8,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  navItem: {
    width: (width - 52) / 2,
  },
  navCard: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
