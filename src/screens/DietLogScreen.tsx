import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon, IconName } from "@/src/components/AppIcon";
import { useTabBarInset, useTheme } from "@/src/hooks";
import { useDietStore } from "@/src/store/dietStore";
import { radius, spacing, shadows } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { toIsoDate } from "@/src/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";

const MEAL_ICONS: Record<string, IconName> = {
  breakfast: "Coffee",
  lunch: "Utensils",
  dinner: "Moon",
  snack: "Apple",
};

const MEAL_SECTIONS = [
  { key: "breakfast", label: "Cafe da manha", ratio: 0.25 },
  { key: "lunch", label: "Almoco", ratio: 0.35 },
  { key: "dinner", label: "Jantar", ratio: 0.25 },
  { key: "snack", label: "Lanches", ratio: 0.15 },
] as const;

function formatLiters(amountMl: number): string {
  return `${(amountMl / 1000).toFixed(1).replace(".", ",")} L`;
}

export function DietLogScreen() {
  const { colors } = useTheme();
  const {
    meals,
    dailyGoals,
    waterIntake,
    addWater,
    goalsConfigured,
    goalsSetupPromptDismissed,
    dismissGoalsSetupPrompt,
  } = useDietStore();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();
  const today = toIsoDate(new Date());
  const [setupPromptVisible, setSetupPromptVisible] = useState(false);

  const todayMeals = useMemo(() => meals.filter((m) => m.date === today), [meals, today]);

  useEffect(() => {
    if (!goalsConfigured && !goalsSetupPromptDismissed) {
      setSetupPromptVisible(true);
    }
  }, [goalsConfigured, goalsSetupPromptDismissed]);

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
  const remainingCalories = Math.max((dailyGoals.calories ?? 0) - totals.calories, 0);
  const mealSummary = useMemo(() => {
    return MEAL_SECTIONS.map((section) => {
      const sectionMeals = todayMeals.filter((meal) => meal.mealType === section.key);
      const calories = sectionMeals.reduce((acc, meal) => acc + meal.totalCalories, 0);
      const itemCount = sectionMeals.reduce((acc, meal) => acc + meal.items.length, 0);
      const targetCalories = goalsConfigured ? Math.round(dailyGoals.calories * section.ratio) : 0;

      return {
        ...section,
        calories,
        itemCount,
        targetCalories,
        progress: goalsConfigured ? Math.min(calories / Math.max(targetCalories, 1), 1) : 0,
      };
    });
  }, [dailyGoals.calories, goalsConfigured, todayMeals]);
  const macroSummary = [
    { key: "carbs", label: "Carboidratos", value: totals.carbs, target: dailyGoals.carbs, color: colors.warning },
    { key: "protein", label: "Proteina", value: totals.protein, target: dailyGoals.protein, color: colors.primary },
    { key: "fat", label: "Gorduras", value: totals.fat, target: dailyGoals.fat, color: colors.error },
  ];

  const handleAddWater = (amount: number) => {
    addWater(amount);
    Haptics.impactAsync(amount >= 500 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    trackEvent(ANALYTICS_EVENTS.DIET_MEAL_ADDED, { entry_type: "water", amount });
  };

  const handleDismissSetupPrompt = () => {
    dismissGoalsSetupPrompt();
    setSetupPromptVisible(false);
  };

  return (
    <ScreenContainer className="px-5">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]}>Dieta</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Controle de energia. Execucao limpa.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            {goalsConfigured ? (
              <>
                <View style={styles.summaryActionsRow}>
                  <View>
                    <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Resumo do dia</Text>
                    <Text style={[styles.protocolHint, { color: colors.muted }]}>
                      Proteina alta sustenta performance e recuperacao.
                    </Text>
                  </View>
                  <View style={styles.summaryActions}>
                    <Pressable onPress={() => router.push("/diet/goals" as never)} style={styles.summaryLink}>
                      <Text style={[styles.summaryLinkText, { color: colors.primary }]}>Detalhes</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: "/diet/goals", params: { mode: "edit" } } as never)}
                      style={[styles.editIconButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                    >
                      <AppIcon name="Edit" size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.summaryTopRow}>
                  <View style={[styles.summaryRing, { borderColor: colors.primary + "35", backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[styles.summaryRingValue, { color: colors.foreground }]}>{remainingCalories}</Text>
                    <Text style={[styles.summaryRingLabel, { color: colors.muted }]}>kcal</Text>
                  </View>
                  <View style={styles.summaryMeta}>
                    <Text style={[styles.summaryKicker, { color: colors.muted }]}>Restantes</Text>
                    <Text style={[styles.summaryMetaText, { color: colors.muted }]}>Consumidas: {totals.calories} kcal</Text>
                    <Text style={[styles.summaryMetaText, { color: colors.muted }]}>Meta: {dailyGoals.calories} kcal</Text>
                  </View>
                </View>

                <View style={styles.macroStack}>
                  {macroSummary.map((macro) => (
                    <View key={macro.key} style={styles.macroBarRow}>
                      <View style={styles.macroBarHeader}>
                        <Text style={[styles.macroBarLabel, { color: colors.foreground }]}>{macro.label}</Text>
                        <Text style={[styles.macroBarValue, { color: colors.muted }]}>
                          {macro.value} / {macro.target} g
                        </Text>
                      </View>
                      <View style={[styles.macroBarTrack, { backgroundColor: colors.surfaceAlt }]}>
                        <View
                          style={[
                            styles.macroBarFill,
                            { backgroundColor: macro.color, width: `${Math.min(macro.value / Math.max(macro.target, 1), 1) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.unconfiguredState}>
                <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Metas nao configuradas</Text>
                <Text style={[styles.summaryMetaText, { color: colors.muted }]}>
                  Defina calorias e macros para ver o painel completo.
                </Text>
                <Pressable
                  onPress={() => router.push({ pathname: "/diet/goals", params: { mode: "setup" } } as never)}
                  style={[styles.configureButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.configureButtonText}>Definir metas</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320)} style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Alimentacao</Text>
            <Pressable
              onPress={() => router.push("/diet/add-meal" as never)}
              style={styles.summaryLink}
            >
              <Text style={[styles.summaryLinkText, { color: colors.primary }]}>Ver tudo</Text>
            </Pressable>
          </View>

          {!todayMeals.length ? (
            <View style={[styles.emptyStateCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[styles.emptyStateTitle, { color: colors.foreground }]}>Nenhuma refeicao registrada hoje.</Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.muted }]}>
                Comece pelo basico. O resto ajusta com o tempo.
              </Text>
            </View>
          ) : null}

          <View style={styles.mealsList}>
            {mealSummary.map((section, index) => (
              <Animated.View
                key={section.key}
                entering={FadeInDown.delay(360 + index * 70)}
                style={[styles.mealRowCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
              >
                <View style={[styles.mealRowIcon, { backgroundColor: colors.surfaceAlt }]}>
                  <AppIcon name={MEAL_ICONS[section.key]} size={18} color={colors.primary} />
                </View>
                <View style={styles.mealRowContent}>
                  <View style={styles.mealRowHeader}>
                    <Text style={[styles.mealRowTitle, { color: colors.foreground }]}>{section.label}</Text>
                    <Text style={[styles.mealRowTarget, { color: colors.muted }]}>
                      {goalsConfigured ? `meta ${section.targetCalories} kcal` : "meta --"}
                    </Text>
                  </View>
                  <Text style={[styles.mealRowMeta, { color: colors.muted }]}>
                    {section.calories} / {goalsConfigured ? section.targetCalories : "--"} kcal
                    {section.itemCount ? ` · ${section.itemCount} item${section.itemCount !== 1 ? "s" : ""}` : ""}
                  </Text>
                  <View style={[styles.mealProgressTrack, { backgroundColor: colors.surfaceAlt }]}>
                    <View
                      style={[
                        styles.mealProgressFill,
                        { backgroundColor: colors.primary, width: `${section.progress * 100}%` },
                      ]}
                    />
                  </View>
                </View>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/diet/add-meal", params: { mealType: section.key } } as never)
                  }
                  style={[styles.mealPlusButton, { backgroundColor: colors.primary }]}
                >
                  <AppIcon name="Plus" size={18} color="#fff" />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(620)} style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monitor de agua</Text>
          <View style={[styles.waterCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            <View style={styles.waterContent}>
              <View style={styles.waterMain}>
                <View style={[styles.waterIconWrapper, { backgroundColor: colors.info + '15' }]}>
                  <AppIcon name="Droplets" size={24} color={colors.info} />
                </View>
                <View>
                  <Text style={[styles.waterValueText, { color: colors.foreground }]}>{formatLiters(waterIntake)}</Text>
                  <Text style={[styles.waterHint, { color: colors.muted }]}>Meta do dia: {dailyGoals.waterMl ?? 2500} ml</Text>
                </View>
              </View>
            </View>
            <View style={styles.waterActions}>
              <Pressable onPress={() => handleAddWater(200)} style={[styles.waterBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.waterBtnText, { color: colors.primary }]}>+200 ml</Text>
              </Pressable>
              <Pressable onPress={() => handleAddWater(500)} style={[styles.waterBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.waterBtnText, { color: colors.primary }]}>+500 ml</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => router.push({ pathname: "/diet/goals", params: { mode: "edit" } } as never)} style={styles.summaryLink}>
              <Text style={[styles.summaryLinkText, { color: colors.primary }]}>Ajustar meta de agua</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal animationType="slide" onRequestClose={handleDismissSetupPrompt} transparent visible={setupPromptVisible}>
        <Pressable onPress={handleDismissSetupPrompt} style={styles.modalOverlay} />
        <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Definir metas do dia</Text>
          <Text style={[styles.modalDescription, { color: colors.muted }]}>
            Configure calorias e macros em menos de 60 segundos. Voce pode ajustar tudo depois.
          </Text>
          <View style={styles.actionsColumn}>
            <AppButton
              label="Definir agora"
              onPress={() => {
                setSetupPromptVisible(false);
                router.push({ pathname: "/diet/goals", params: { mode: "setup" } } as never);
              }}
            />
            <AppButton
              label="Pular por enquanto"
              onPress={handleDismissSetupPrompt}
              variant="secondary"
            />
          </View>
          <Text style={[styles.modalFooter, { color: colors.muted }]}>Modo offline. Seus dados ficam no dispositivo.</Text>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
  },
  headerText: {
    gap: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  summaryActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  summaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryTopRow: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center",
  },
  summaryRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRingValue: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -1,
  },
  summaryRingLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  summaryMeta: {
    flex: 1,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  summaryKicker: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryMetaText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  protocolHint: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  summaryLink: {
    alignSelf: "flex-start",
  },
  summaryLinkText: {
    fontSize: 13,
    fontWeight: "800",
  },
  editIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  unconfiguredState: {
    gap: spacing.md,
  },
  configureButton: {
    alignSelf: "flex-start",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  configureButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  macroStack: {
    gap: spacing.md,
  },
  macroBarRow: {
    gap: spacing.xs,
  },
  macroBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  macroBarLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  macroBarValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  macroBarTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  mealsList: {
    gap: spacing.md,
  },
  mealRowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  mealRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  mealRowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  mealRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  mealRowTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  mealRowTarget: {
    fontSize: 12,
    fontWeight: "700",
  },
  mealRowMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  mealProgressTrack: {
    height: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  mealProgressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  mealPlusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  waterCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
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
  waterHint: {
    fontSize: 13,
    fontWeight: "600",
  },
  waterActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  waterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  waterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionsColumn: {
    gap: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  modalDescription: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
  },
  modalFooter: {
    fontSize: 12,
    fontWeight: "500",
  },
});
