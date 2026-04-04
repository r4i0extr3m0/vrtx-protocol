import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { 
  ScreenWrapper, 
  GlassCard, 
  NeonButton, 
  ProgressBarGlow, 
  CircularTimer, 
  BadgeMetal 
} from "../components/ui";
import { AppIcon, IconName } from "@/src/components/AppIcon";
import { useTheme } from "@/src/hooks";
import { useDietStore } from "@/src/store/dietStore";
import { spacing, typography, radius } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { toIsoDate } from "@/src/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";

const MEAL_ICONS: Record<string, IconName> = {
  breakfast: "Coffee",
  lunch: "Utensils",
  dinner: "Moon",
  snack: "Apple",
};

export function DietLogScreen() {
  const { colors } = useTheme();
  const { meals, dailyGoals, waterIntake, addWater } = useDietStore();
  const today = toIsoDate(new Date());

  const todayMeals = useMemo(() => meals.filter((m) => m.date === today), [meals, today]);

  const totals = useMemo(() => {
    return todayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.totalProtein,
        carbs: acc.carbs + meal.totalCarbs,
        fat: acc.fat + meal.totalFat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [todayMeals]);

  const calProgress = Math.min(totals.calories / dailyGoals.calories, 1);
  const waterProgress = Math.min(waterIntake / 2500, 1);

  const handleAddWater = (amount: number) => {
    addWater(amount);
    Haptics.impactAsync(amount >= 500 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    trackEvent(ANALYTICS_EVENTS.MEAL_ADDED, { type: 'water', amount });
  };

  return (
    <ScreenWrapper withSafeArea={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: typography.family.heading }]}>
              NUTRIÇÃO_CORE
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.family.mono }]}>
              STATUS: BALANÇO_CALÓRICO_ATIVO
            </Text>
          </View>
          <BadgeMetal label="BIO_SYNC" variant="metal" />
        </Animated.View>

        {/* AI Scanner Banner */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.aiBannerSection}>
          <Pressable onPress={() => {
            trackEvent(ANALYTICS_EVENTS.PURCHASE_STARTED, { feature: 'ai_camera' });
            router.push("/camera" as never);
          }}>
            <GlassCard style={styles.aiCard} intensity={40}>
              <View style={styles.aiInfo}>
                <BadgeMetal label="IA_RECOGNITION" variant="primary" style={styles.aiBadge} />
                <Text style={[styles.aiTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                  RECONHECIMENTO_VISUAL
                </Text>
                <Text style={[styles.aiDesc, { color: colors.muted, fontFamily: typography.family.mono }]}>
                  ANALISE_MACROS_VIA_HARDWARE_ÓPTICO
                </Text>
              </View>
              <View style={[styles.aiIconWrapper, { backgroundColor: colors.primary }]}>
                <AppIcon name="Camera" size={24} color="#000" strokeWidth={2.5} />
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Main Stats Card */}
        <GlassCard style={styles.mainStatsCard} intensity={20}>
          <View style={styles.statsHeader}>
            <Text style={[styles.statsTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>
              RESUMO_CALÓRICO
            </Text>
            <Text style={[styles.statsValue, { color: colors.primary, fontFamily: typography.family.mono }]}>
              {totals.calories} / {dailyGoals.calories} KCAL
            </Text>
          </View>
          
          <ProgressBarGlow progress={calProgress} height={10} color={colors.primary} glow style={styles.mainProgress} />
          
          <View style={styles.macroRow}>
            {[
              { label: "PROT", value: totals.protein, target: dailyGoals.protein, color: colors.primary, icon: "Beef" as IconName },
              { label: "CARB", value: totals.carbs, target: dailyGoals.carbs, color: "#F59E0B", icon: "Wheat" as IconName },
              { label: "GORD", value: totals.fat, target: dailyGoals.fat, color: "#EF4444", icon: "Droplets" as IconName },
            ].map((macro) => (
              <View key={macro.label} style={styles.macroItem}>
                <View style={[styles.macroIconWrapper, { backgroundColor: macro.color + '15' }]}>
                   <AppIcon name={macro.icon} size={14} color={macro.color} />
                </View>
                <Text style={[styles.macroValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>{macro.value}G</Text>
                <Text style={[styles.macroLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>{macro.label}</Text>
                <ProgressBarGlow progress={Math.min(macro.value / macro.target, 1)} height={4} color={macro.color} glow={false} />
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Water Intake Section */}
        <View style={styles.waterSection}>
          <GlassCard style={styles.waterCard} intensity={15}>
            <View style={styles.waterHeader}>
              <View>
                <Text style={[styles.waterTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>HIDRATAÇÃO</Text>
                <Text style={[styles.waterMeta, { color: colors.muted, fontFamily: typography.family.mono }]}>META: 2500ML</Text>
              </View>
              <AppIcon name="Droplets" size={24} color={colors.primary} />
            </View>
            
            <View style={styles.waterContent}>
              <CircularTimer 
                progress={waterProgress} 
                label={`${waterIntake}`} 
                subLabel="ML" 
                size={120} 
                strokeWidth={8} 
                color={colors.primary}
              />
              <View style={styles.waterActions}>
                <NeonButton label="+200" onPress={() => handleAddWater(200)} variant="glass" style={styles.waterBtn} />
                <NeonButton label="+500" onPress={() => handleAddWater(500)} variant="glass" style={styles.waterBtn} />
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Meals List */}
        <View style={styles.mealsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: typography.family.mono }]}>
            LOGS_DE_REFEIÇÃO
          </Text>
          <NeonButton 
            label="+ ADICIONAR" 
            onPress={() => router.push("/diet/add-meal" as never)} 
            variant="glass" 
            style={styles.addBtn} 
          />
        </View>

        {todayMeals.length === 0 ? (
          <GlassCard style={styles.emptyCard} intensity={10}>
            <AppIcon name="Utensils" size={32} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted, fontFamily: typography.family.mono }]}>
              NENHUM_REGISTRO_DETECTADO_HOJE
            </Text>
          </GlassCard>
        ) : (
          todayMeals.map((meal, index) => (
            <Animated.View key={meal.id} entering={FadeInDown.delay(500 + index * 100)}>
              <GlassCard style={styles.mealCard} intensity={15}>
                <View style={[styles.mealIconWrapper, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <AppIcon name={MEAL_ICONS[meal.mealType] || "Utensils"} size={20} color={colors.primary} />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={[styles.mealType, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                    {meal.mealType.toUpperCase()}
                  </Text>
                  <Text style={[styles.mealMeta, { color: colors.muted, fontFamily: typography.family.mono }]}>
                    {meal.items.length} ITENS_REGISTRADOS
                  </Text>
                </View>
                <View style={styles.mealCaloriesWrapper}>
                  <Text style={[styles.mealCalories, { color: colors.primary, fontFamily: typography.family.mono }]}>
                    {meal.totalCalories}
                  </Text>
                  <Text style={[styles.mealUnit, { color: colors.muted, fontFamily: typography.family.mono }]}>KCAL</Text>
                </View>
              </GlassCard>
            </Animated.View>
          ))
        )}

        <NeonButton 
          label="CONFIGURAR_METAS_MACROS" 
          onPress={() => router.push("/diet/goals" as never)} 
          variant="ghost" 
          style={styles.goalsBtn}
        />
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
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.6,
  },
  aiBannerSection: {
    marginBottom: 10,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  aiInfo: {
    flex: 1,
  },
  aiBadge: {
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  aiDesc: {
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.6,
  },
  aiIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  mainStatsCard: {
    padding: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  mainProgress: {
    marginBottom: 24,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  macroItem: {
    flex: 1,
    gap: 6,
  },
  macroIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "900",
  },
  macroLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  waterSection: {
    marginBottom: 10,
  },
  waterCard: {
    padding: 20,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  waterTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  waterMeta: {
    fontSize: 9,
    opacity: 0.5,
  },
  waterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  waterActions: {
    gap: 12,
  },
  waterBtn: {
    minWidth: 80,
    minHeight: 40,
  },
  mealsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.5,
  },
  addBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.5,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  mealIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '900',
  },
  mealMeta: {
    fontSize: 9,
    opacity: 0.5,
  },
  mealCaloriesWrapper: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: '900',
  },
  mealUnit: {
    fontSize: 8,
    opacity: 0.5,
  },
  goalsBtn: {
    marginTop: 10,
  },
});
