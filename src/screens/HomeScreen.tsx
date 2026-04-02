import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
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

export function HomeScreen() {
  const { colors } = useTheme();
  const { workouts, createWorkout } = useWorkout();
  const { widgets, reorderWidgets } = useDashboardStore();
  
  const latestWorkout = workouts[0] ?? null;
  const summary = latestWorkout ? summarizeWorkout(latestWorkout) : null;

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
            <Text style={[styles.title, { color: colors.foreground }]}>CoreIronTrack</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Seu diário de treino definitivo.</Text>
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
                <View>
                  <Text style={styles.mainActionTitle}>Novo Treino</Text>
                  <Text style={styles.mainActionSubtitle}>
                    {latestWorkout ? `Último: ${latestWorkout.name}` : "Comece uma nova sessão"}
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
                layout={Layout.springify()}
                style={widget.type === 'volume' || widget.type === 'streak' || widget.type === 'pr' || widget.type === 'sessions' ? styles.widgetHalf : styles.span2}
              >
                {renderWidget(widget, index)}
              </Animated.View>
            ))}
          </View>

          {/* Quick Library Scroll */}
          <View style={styles.span2}>
             <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Biblioteca</Text>
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
            <SectionCard title="Insights da Semana" subtitle="Análise automática do seu desempenho.">
              <View style={styles.insightRow}>
                <View style={[styles.insightIcon, { backgroundColor: colors.success + '15' }]}>
                  <AppIcon name="TrendingUp" size={20} color={colors.success} />
                </View>
                <Text style={[styles.insightText, { color: colors.foreground }]}>
                  Seu volume de treino aumentou <Text style={{ color: colors.success, fontWeight: '800' }}>15%</Text> em relação à semana passada!
                </Text>
              </View>
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
    gap: 2,
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
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
    minHeight: 120,
  },
  mainActionTitle: {
    color: '#000',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mainActionSubtitle: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
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
    minWidth: 110,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
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
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
