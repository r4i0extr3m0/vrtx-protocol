import { useMemo, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeInDown,
  FadeInUp
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { AppIcon, IconName } from "@/src/components/AppIcon";
import { AppCard } from "@/src/components/AppCard";
import { useTheme } from "@/src/hooks";
import { useDietStore } from "@/src/store/dietStore";
import { radius, spacing, typography, shadows } from "@/src/theme";
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

  const progressValue = useSharedValue(0);
  const progress = Math.min(totals.calories / dailyGoals.calories, 1);

  useEffect(() => {
    progressValue.value = withSpring(progress, { damping: 15, stiffness: 100 });
  }, [progress, progressValue]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const handleAddWater = (amount: number) => {
    addWater(amount);
    Haptics.impactAsync(amount >= 500 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    trackEvent(ANALYTICS_EVENTS.MEAL_ADDED, { type: 'water', amount });
  };

  return (
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]}>Nutrição</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Mantenha o equilíbrio nutricional.</Text>
          </View>
        </Animated.View>

        {/* AI Scanner Banner */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Pressable onPress={() => {
            trackEvent(ANALYTICS_EVENTS.PURCHASE_STARTED, { feature: 'ai_camera' });
            router.push("/camera" as never);
          }}>
            <LinearGradient
              colors={colors.brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.aiBanner, shadows.card]}
            >
              <View style={styles.aiInfo}>
                <Text style={styles.aiTitle}>Reconhecimento IA</Text>
                <Text style={styles.aiDesc}>Analise seu prato por foto em segundos.</Text>
              </View>
              <View style={styles.aiIconWrapper}>
                <AppIcon name="Camera" size={24} color="#000" strokeWidth={2.5} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Main Stats Card */}
        <AppCard 
          title="Resumo Calórico" 
          subtitle={`${totals.calories} / ${dailyGoals.calories} kcal`}
          delay={300}
        >
          <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
            <Animated.View style={[styles.progressBarFill, animatedProgressStyle]}>
              <LinearGradient
                colors={colors.brandGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          
          <View style={styles.macroRow}>
            {[
              { label: "Prot", value: totals.protein, target: dailyGoals.protein, color: colors.primary, icon: "Beef" as IconName },
              { label: "Carb", value: totals.carbs, target: dailyGoals.carbs, color: colors.warning, icon: "Wheat" as IconName },
              { label: "Gord", value: totals.fat, target: dailyGoals.fat, color: colors.error, icon: "Droplets" as IconName },
            ].map((macro) => (
              <View key={macro.label} style={styles.macroItem}>
                <View style={[styles.macroIconWrapper, { backgroundColor: macro.color + '10' }]}>
                   <AppIcon name={macro.icon} size={14} color={macro.color} />
                </View>
                <Text style={[styles.macroValue, { color: colors.foreground }]}>{macro.value}g</Text>
                <Text style={[styles.macroLabel, { color: colors.muted }]}>{macro.label}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        {/* Water Intake Section */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <AppCard title="Hidratação" subtitle="Meta diária: 2500ml">
            <View style={styles.waterContent}>
              <View style={styles.waterMain}>
                <View style={[styles.waterIconWrapper, { backgroundColor: colors.info + '15' }]}>
                  <AppIcon name="Droplets" size={24} color={colors.info} />
                </View>
                <Text style={[styles.waterValueText, { color: colors.foreground }]}>{waterIntake}ml</Text>
              </View>
              <View style={styles.waterActions}>
                <Pressable onPress={() => handleAddWater(200)} style={[styles.waterBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={[styles.waterBtnText, { color: colors.primary }]}>+200</Text>
                </Pressable>
                <Pressable onPress={() => handleAddWater(500)} style={[styles.waterBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={[styles.waterBtnText, { color: colors.primary }]}>+500</Text>
                </Pressable>
              </View>
            </View>
          </AppCard>
        </Animated.View>

        {/* Meals List */}
        <View style={styles.mealsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Refeições</Text>
          <AppButton 
            label="+ Adicionar" 
            onPress={() => router.push("/diet/add-meal" as never)} 
            variant="secondary" 
            style={styles.addBtn} 
          />
        </View>

        {todayMeals.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: colors.surfaceAlt }]}>
              <AppIcon name="Utensils" size={32} color={colors.muted} />
            </View>
            <Text style={[styles.empty, { color: colors.muted }]}>Nenhuma refeição registrada hoje.</Text>
          </Animated.View>
        ) : (
          todayMeals.map((meal, index) => (
            <Animated.View key={meal.id} entering={FadeInDown.delay(500 + index * 100)}>
              <Pressable 
                style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              >
                <View style={[styles.mealIconWrapper, { backgroundColor: colors.surfaceAlt }]}>
                  <AppIcon name={MEAL_ICONS[meal.mealType] || "Utensils"} size={22} color={colors.primary} />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={[styles.mealType, { color: colors.foreground }]}>
                    {meal.mealType === "breakfast" ? "Café da Manhã" : 
                     meal.mealType === "lunch" ? "Almoço" : 
                     meal.mealType === "dinner" ? "Jantar" : "Lanche"}
                  </Text>
                  <Text style={[styles.mealMeta, { color: colors.muted }]}>{meal.items.length} itens registrados</Text>
                </View>
                <View style={styles.mealCaloriesWrapper}>
                  <Text style={[styles.mealCalories, { color: colors.primary }]}>{meal.totalCalories}</Text>
                  <Text style={[styles.mealUnit, { color: colors.muted }]}>kcal</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}

        <AppButton 
          label="Configurar Metas de Macros" 
          onPress={() => router.push("/diet/goals" as never)} 
          variant="ghost" 
          style={{ marginTop: spacing.md }}
        />
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
    marginBottom: spacing.xs,
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
  aiBanner: {
    flexDirection: "row",
    padding: spacing.xl,
    borderRadius: radius.xxl,
    alignItems: "center",
    gap: spacing.md,
  },
  aiInfo: {
    flex: 1,
    gap: 4,
  },
  aiTitle: {
    color: "#000",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  aiDesc: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  aiIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginVertical: spacing.sm,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  macroItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  macroIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  waterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  waterIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterValueText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  waterActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  waterBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  mealsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  addBtn: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
    gap: spacing.md,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  mealIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  mealInfo: {
    flex: 1,
    gap: 2,
  },
  mealType: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  mealMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  mealCaloriesWrapper: {
    alignItems: "flex-end",
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: "900",
  },
  mealUnit: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
