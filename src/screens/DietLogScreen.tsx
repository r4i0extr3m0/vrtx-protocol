import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon, IconName } from "@/src/components/AppIcon";
import {
  getMyNutritionPlan,
  listMyNutritionCheckins,
  listMyPrescriptions,
  recordNutritionCheckin,
} from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useI18n } from "@/src/i18n";
import {
  calculateNutritionAdherence,
  collectMealReminders,
  estimateWorkoutBurn,
  findTodayPrescription,
  nutritionMealToDietItems,
  selectNutritionTargets,
  sortNutritionMeals,
  sumNutritionMeal,
} from "@/src/domain/nutrition";
import { cancelMealReminders, getMealRemindersEnabled, scheduleMealReminders } from "@/src/services/notifications";
import { useTabBarInset, useTheme } from "@/src/hooks";
import { useDietStore } from "@/src/store/dietStore";
import { radius, spacing, shadows } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { toIsoDate } from "@/src/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";
import type {
  CoachNutritionPlan,
  CoachPrescription,
  DailyGoals,
  NutritionCheckin,
  NutritionMeal,
  NutritionMealType,
} from "@/src/types";

const MEAL_ICONS: Record<string, IconName> = {
  breakfast: "Coffee",
  lunch: "Utensils",
  dinner: "Moon",
  snack: "Apple",
};

const PLAN_MEAL_ICONS: Record<NutritionMealType, IconName> = {
  breakfast: "Coffee",
  morningSnack: "Coffee",
  lunch: "Utensils",
  afternoonSnack: "Apple",
  dinner: "Moon",
  supper: "Moon",
};

const PLAN_TO_LOG_TYPE: Record<NutritionMealType, "breakfast" | "lunch" | "dinner" | "snack"> = {
  breakfast: "breakfast",
  morningSnack: "snack",
  lunch: "lunch",
  afternoonSnack: "snack",
  dinner: "dinner",
  supper: "snack",
};

function fmtNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

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
  const { t } = useI18n();
  const {
    meals,
    dailyGoals,
    waterIntake,
    addMeal,
    addWater,
    goalsConfigured,
    goalsSetupPromptDismissed,
    dismissGoalsSetupPrompt,
    coachPlanEnabled,
    setCoachPlanEnabled,
  } = useDietStore();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();
  const today = toIsoDate(new Date());
  const online = hasSupabaseEnv();
  const [setupPromptVisible, setSetupPromptVisible] = useState(false);
  const [coachPlan, setCoachPlan] = useState<CoachNutritionPlan | null>(null);
  const [prescriptions, setPrescriptions] = useState<CoachPrescription[]>([]);
  const [checkins, setCheckins] = useState<NutritionCheckin[]>([]);
  const [loggingMealId, setLoggingMealId] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(getMealRemindersEnabled);
  const [remindersBusy, setRemindersBusy] = useState(false);

  const todayMeals = useMemo(() => meals.filter((m) => m.date === today), [meals, today]);

  useEffect(() => {
    if (!online) return;
    let active = true;
    Promise.all([getMyNutritionPlan(), listMyPrescriptions(), listMyNutritionCheckins()]).then(
      ([planResult, prescriptionResult, checkinResult]) => {
        if (!active) return;
        setCoachPlan(planResult.data ?? null);
        setPrescriptions(prescriptionResult.data ?? []);
        setCheckins(checkinResult.data ?? []);
      },
    );
    return () => {
      active = false;
    };
  }, [online]);

  const todayPrescription = useMemo(
    () => findTodayPrescription(prescriptions, today),
    [prescriptions, today],
  );
  const isTrainingDay = Boolean(todayPrescription);
  const todayTargets = coachPlan ? selectNutritionTargets(coachPlan, isTrainingDay) : null;
  const coachGoals: DailyGoals | null =
    coachPlan && todayTargets ? { ...todayTargets, waterMl: coachPlan.waterMl } : null;
  const usingCoachPlan = Boolean(coachGoals) && coachPlanEnabled;
  const activeGoals: DailyGoals = usingCoachPlan && coachGoals ? coachGoals : dailyGoals;
  const goalsActive = usingCoachPlan || goalsConfigured;
  const estimatedBurn = todayPrescription ? estimateWorkoutBurn(todayPrescription.exercises) : 0;

  useEffect(() => {
    if (!goalsActive && !goalsSetupPromptDismissed) {
      setSetupPromptVisible(true);
    }
  }, [goalsActive, goalsSetupPromptDismissed]);

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
  const remainingCalories = Math.max((activeGoals.calories ?? 0) - totals.calories, 0);
  const mealSummary = useMemo(() => {
    return MEAL_SECTIONS.map((section) => {
      const sectionMeals = todayMeals.filter((meal) => meal.mealType === section.key);
      const calories = sectionMeals.reduce((acc, meal) => acc + meal.totalCalories, 0);
      const itemCount = sectionMeals.reduce((acc, meal) => acc + meal.items.length, 0);
      const targetCalories = goalsActive ? Math.round(activeGoals.calories * section.ratio) : 0;

      return {
        ...section,
        calories,
        itemCount,
        targetCalories,
        progress: goalsActive ? Math.min(calories / Math.max(targetCalories, 1), 1) : 0,
      };
    });
  }, [activeGoals.calories, goalsActive, todayMeals]);
  const macroSummary = [
    { key: "carbs", label: "Carboidratos", value: totals.carbs, target: activeGoals.carbs, color: colors.warning },
    { key: "protein", label: "Proteina", value: totals.protein, target: activeGoals.protein, color: colors.primary },
    { key: "fat", label: "Gorduras", value: totals.fat, target: activeGoals.fat, color: colors.error },
  ];
  const targetColumns = coachPlan
    ? [
        { key: "training", label: t("nutrition.trainingDay"), targets: coachPlan.trainingDay, active: isTrainingDay },
        { key: "rest", label: t("nutrition.restDay"), targets: coachPlan.restDay, active: !isTrainingDay },
      ]
    : [];
  const netCalories = totals.calories - estimatedBurn;

  const plannedMeals = useMemo(
    () => sortNutritionMeals((coachPlan?.meals ?? []).filter((meal) => meal.items.length > 0)),
    [coachPlan],
  );
  const todayCheckins = useMemo(
    () => checkins.filter((checkin) => checkin.happenedOn === today),
    [checkins, today],
  );
  const mealReminders = useMemo(() => {
    if (plannedMeals.length === 0) return [];
    return collectMealReminders(plannedMeals, t("nutrition.plannedMeals"));
  }, [plannedMeals, t]);
  const nutritionAdherence = useMemo(() => {
    if (plannedMeals.length === 0) return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffIso = toIsoDate(cutoff);
    const recent = checkins.filter((checkin) => checkin.happenedOn >= cutoffIso);
    return calculateNutritionAdherence(plannedMeals.length, recent, 7);
  }, [checkins, plannedMeals.length]);

  const handleConsumeMeal = async (meal: NutritionMeal) => {
    const targets = sumNutritionMeal(meal);
    addMeal({
      date: today,
      mealType: PLAN_TO_LOG_TYPE[meal.type],
      items: nutritionMealToDietItems(meal),
      totalCalories: targets.calories,
      totalProtein: targets.protein,
      totalCarbs: targets.carbs,
      totalFat: targets.fat,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackEvent(ANALYTICS_EVENTS.DIET_MEAL_ADDED, {
      entry_type: "planned_meal",
      meal_type: PLAN_TO_LOG_TYPE[meal.type],
      calories: targets.calories,
    });

    if (!online) return;
    setLoggingMealId(meal.id);
    const result = await recordNutritionCheckin({
      mealId: meal.id,
      mealType: meal.type,
      happenedOn: today,
      followed: true,
      calories: targets.calories,
    });
    setLoggingMealId(null);
    if (!result.error) {
      setCheckins((current) => [
        ...current.filter((item) => !(item.mealId === meal.id && item.happenedOn === today)),
        {
          id: `local-${meal.id}-${today}`,
          coachId: coachPlan?.coachId ?? "",
          clientId: coachPlan?.clientId ?? "",
          mealId: meal.id,
          mealType: meal.type,
          happenedOn: today,
          followed: true,
          calories: targets.calories,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleAdjustMeal = async (meal: NutritionMeal) => {
    if (online) {
      const result = await recordNutritionCheckin({
        mealId: meal.id,
        mealType: meal.type,
        happenedOn: today,
        followed: false,
        calories: 0,
      });
      if (!result.error) {
        setCheckins((current) => [
          ...current.filter((item) => !(item.mealId === meal.id && item.happenedOn === today)),
          {
            id: `local-${meal.id}-${today}`,
            coachId: coachPlan?.coachId ?? "",
            clientId: coachPlan?.clientId ?? "",
            mealId: meal.id,
            mealType: meal.type,
            happenedOn: today,
            followed: false,
            calories: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    }
    router.push({ pathname: "/diet/add-meal", params: { mealType: PLAN_TO_LOG_TYPE[meal.type] } } as never);
  };

  const handleToggleReminders = async () => {
    if (remindersBusy) return;
    setRemindersBusy(true);
    try {
      if (remindersEnabled) {
        await cancelMealReminders();
        setRemindersEnabled(false);
      } else {
        const scheduled = await scheduleMealReminders(mealReminders);
        setRemindersEnabled(scheduled > 0);
      }
    } finally {
      setRemindersBusy(false);
    }
  };

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

        {coachPlan ? (
          <Animated.View entering={FadeInUp.delay(160)}>
            <View style={[styles.coachCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
              <View style={styles.coachHeader}>
                <View style={[styles.coachIcon, { backgroundColor: colors.primary + "15" }]}>
                  <AppIcon name="Utensils" size={20} color={colors.primary} />
                </View>
                <View style={styles.coachHeaderText}>
                  <Text style={[styles.coachTitle, { color: colors.foreground }]}>
                    {t("nutrition.coachPlanTitle")}
                  </Text>
                  <Text style={[styles.coachHint, { color: colors.muted }]}>
                    {t("nutrition.todayLabel", {
                      type: isTrainingDay ? t("nutrition.trainingDay") : t("nutrition.restDay"),
                    })}
                  </Text>
                </View>
                <Switch
                  value={coachPlanEnabled}
                  onValueChange={setCoachPlanEnabled}
                  trackColor={{ false: colors.surfaceAlt, true: colors.primary + "66" }}
                  thumbColor={coachPlanEnabled ? colors.primary : colors.muted}
                />
              </View>
              <View style={styles.coachColumns}>
                {targetColumns.map((column) => (
                  <View
                    key={column.key}
                    style={[
                      styles.targetColumn,
                      {
                        backgroundColor: column.active ? colors.primary + "12" : colors.surfaceAlt,
                        borderColor: column.active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.targetLabel,
                        { color: column.active ? colors.primary : colors.muted },
                      ]}
                    >
                      {column.label}
                    </Text>
                    <Text style={[styles.targetCalories, { color: colors.foreground }]}>
                      {column.targets.calories} kcal
                    </Text>
                    <Text style={[styles.targetMacros, { color: colors.muted }]}>
                      P {column.targets.protein} · C {column.targets.carbs} · G {column.targets.fat}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        ) : null}

        {plannedMeals.length ? (
          <Animated.View entering={FadeInUp.delay(190)} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t("nutrition.plannedMeals")}
              </Text>
              {mealReminders.length ? (
                <Pressable
                  onPress={handleToggleReminders}
                  disabled={remindersBusy}
                  style={styles.summaryLink}
                >
                  <Text
                    style={[
                      styles.summaryLinkText,
                      { color: remindersEnabled ? colors.success : colors.primary },
                    ]}
                  >
                    {remindersEnabled ? t("nutrition.remindersEnabled") : t("nutrition.remindersTitle")}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {plannedMeals.map((meal, index) => {
              const mealTargets = sumNutritionMeal(meal);
              const checkin = todayCheckins.find((item) => item.mealId === meal.id);
              const busy = loggingMealId === meal.id;

              return (
                <Animated.View
                  key={meal.id}
                  entering={FadeInDown.delay(220 + index * 60)}
                  style={[styles.plannedMealCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
                >
                  <View style={styles.plannedMealHeader}>
                    <View style={[styles.mealRowIcon, { backgroundColor: colors.primary + "15" }]}>
                      <AppIcon name={PLAN_MEAL_ICONS[meal.type]} size={18} color={colors.primary} />
                    </View>
                    <View style={styles.plannedMealInfo}>
                      <Text style={[styles.plannedMealTitle, { color: colors.foreground }]}>
                        {meal.title?.trim() || t(`nutrition.mealTypes.${meal.type}`)}
                      </Text>
                      <Text style={[styles.plannedMealMeta, { color: colors.muted }]}>
                        {meal.time ? `${meal.time} · ` : ""}
                        {mealTargets.calories} kcal · P {fmtNumber(mealTargets.protein)} · C{" "}
                        {fmtNumber(mealTargets.carbs)} · G {fmtNumber(mealTargets.fat)}
                      </Text>
                    </View>
                    {checkin ? (
                      <View
                        style={[
                          styles.checkinBadge,
                          { backgroundColor: (checkin.followed ? colors.success : colors.warning) + "22" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.checkinBadgeText,
                            { color: checkin.followed ? colors.success : colors.warning },
                          ]}
                        >
                          {t("nutrition.consumedBadge")}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.plannedItems}>
                    {meal.items.map((item) => (
                      <View key={item.id}>
                        <Text style={[styles.plannedItemText, { color: colors.foreground }]}>
                          {fmtNumber(item.quantity)} {item.unit} · {item.name}
                        </Text>
                        {item.options?.length ? (
                          <Text style={[styles.plannedItemOptions, { color: colors.muted }]}>
                            {t("nutrition.substitutions")}: {item.options.map((option) => option.name).join(" / ")}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>

                  {meal.notes?.trim() ? (
                    <Text style={[styles.plannedNotes, { color: colors.muted }]}>{meal.notes}</Text>
                  ) : null}

                  {!checkin ? (
                    <View style={styles.plannedActions}>
                      <Pressable
                        onPress={() => handleConsumeMeal(meal)}
                        disabled={busy}
                        style={[styles.consumeBtn, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
                      >
                        <AppIcon name="Check" size={15} color="#04101f" />
                        <Text style={styles.consumeBtnText}>{t("nutrition.consumeMeal")}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleAdjustMeal(meal)}
                        style={[styles.adjustBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                      >
                        <Text style={[styles.adjustBtnText, { color: colors.muted }]}>
                          {t("nutrition.adjustMeal")}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </Animated.View>
              );
            })}
          </Animated.View>
        ) : null}

        {nutritionAdherence ? (
          <Animated.View entering={FadeInDown.delay(240)}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
              <View style={styles.summaryActionsRow}>
                <View style={styles.adherenceHeaderText}>
                  <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                    {t("nutrition.adherenceTitle")}
                  </Text>
                  <Text style={[styles.protocolHint, { color: colors.muted }]}>
                    {t("nutrition.adherenceMeals", {
                      followed: nutritionAdherence.followedMeals,
                      planned: nutritionAdherence.plannedMeals,
                    })}
                  </Text>
                </View>
                <Text style={[styles.adherenceRate, { color: colors.primary }]}>
                  {Math.round(nutritionAdherence.rate * 100)}%
                </Text>
              </View>
              <View style={[styles.macroBarTrack, styles.adherenceTrack, { backgroundColor: colors.surfaceAlt }]}>
                <View
                  style={[styles.macroBarFill, { backgroundColor: colors.primary, width: `${nutritionAdherence.rate * 100}%` }]}
                />
              </View>
              <Text style={[styles.burnHint, { color: colors.muted }]}>
                {t("nutrition.adherenceAvg", { value: nutritionAdherence.avgCalories })}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {todayPrescription ? (
          <Animated.View entering={FadeInDown.delay(180)}>
            <View style={[styles.workoutCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
              <View style={styles.coachHeader}>
                <View style={[styles.coachIcon, { backgroundColor: colors.success + "15" }]}>
                  <AppIcon name="Dumbbell" size={20} color={colors.success} />
                </View>
                <View style={styles.coachHeaderText}>
                  <Text style={[styles.coachTitle, { color: colors.foreground }]}>
                    {t("nutrition.workoutTodayTitle")}
                  </Text>
                  <Text style={[styles.coachHint, { color: colors.muted }]}>
                    {t("nutrition.workoutTodayHint", {
                      name: todayPrescription.name,
                      count: todayPrescription.exercises.length,
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.burnRow}>
                <View style={styles.burnItem}>
                  <Text style={[styles.burnLabel, { color: colors.muted }]}>
                    {t("nutrition.estimatedBurn")}
                  </Text>
                  <Text style={[styles.burnValue, { color: colors.foreground }]}>
                    {t("nutrition.burnValue", { value: estimatedBurn })}
                  </Text>
                </View>
                <View style={styles.burnItem}>
                  <Text style={[styles.burnLabel, { color: colors.muted }]}>
                    {t("nutrition.netTitle")}
                  </Text>
                  <Text style={[styles.burnValue, { color: netCalories >= 0 ? colors.foreground : colors.success }]}>
                    {netCalories} kcal
                  </Text>
                </View>
              </View>
              <Text style={[styles.burnHint, { color: colors.muted }]}>
                {t("nutrition.netHint", { consumed: totals.calories, burned: estimatedBurn })}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(200)}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            {goalsActive ? (
              <>
                <View style={styles.summaryActionsRow}>
                  <View>
                    <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Resumo do dia</Text>
                    <Text style={[styles.protocolHint, { color: colors.muted }]}>
                      {usingCoachPlan
                        ? t("nutrition.usingPlan")
                        : "Proteina alta sustenta performance e recuperacao."}
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
                    <Text style={[styles.summaryMetaText, { color: colors.muted }]}>Meta: {activeGoals.calories} kcal</Text>
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
                  <Text style={[styles.waterHint, { color: colors.muted }]}>Meta do dia: {activeGoals.waterMl ?? 2500} ml</Text>
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
  plannedMealCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  plannedMealHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  plannedMealInfo: {
    flex: 1,
    gap: 2,
  },
  plannedMealTitle: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  plannedMealMeta: {
    fontSize: 11,
    fontWeight: "700",
  },
  checkinBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  checkinBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  plannedItems: {
    gap: 4,
    paddingLeft: 2,
  },
  plannedItemText: {
    fontSize: 13,
    fontWeight: "700",
  },
  plannedItemOptions: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  plannedNotes: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
  },
  plannedActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 2,
  },
  consumeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  consumeBtnText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "#04101f",
  },
  adjustBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  adjustBtnText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  adherenceHeaderText: {
    flex: 1,
  },
  adherenceRate: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1,
  },
  adherenceTrack: {
    marginTop: spacing.sm,
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
  coachCard: {
    borderWidth: 1,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  workoutCard: {
    borderWidth: 1,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  coachIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  coachHeaderText: {
    flex: 1,
    gap: 2,
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  coachHint: {
    fontSize: 13,
    fontWeight: "600",
  },
  coachColumns: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  targetColumn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  targetLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  targetCalories: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  targetMacros: {
    fontSize: 12,
    fontWeight: "600",
  },
  burnRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  burnItem: {
    flex: 1,
    gap: 2,
  },
  burnLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  burnValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  burnHint: {
    fontSize: 12,
    fontWeight: "600",
  },
});
