import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { searchTacoFoods } from "@/src/data/tacoFoods";
import { NUTRITION_MEAL_ORDER, createItemFromTaco, sumNutritionMeal } from "@/src/domain/nutrition";
import { useI18n } from "@/src/i18n";
import { useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import type {
  NutritionFoodItem,
  NutritionItemOption,
  NutritionMeal,
  NutritionMealType,
  TacoFood,
} from "@/src/types";
import { createId } from "@/src/utils";

import { AppIcon } from "./AppIcon";

interface NutritionMealPlannerProps {
  meals: NutritionMeal[];
  onChange: (meals: NutritionMeal[]) => void;
}

type PickerTarget =
  | { kind: "item"; mealId: string }
  | { kind: "option"; mealId: string; itemId: string };

interface Draft {
  foodId: string | null;
  name: string;
  quantity: string;
  unit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const EMPTY_DRAFT: Draft = {
  foodId: null,
  name: "",
  quantity: "100",
  unit: "g",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};

const MEAL_ICONS: Record<NutritionMealType, "Coffee" | "Utensils" | "Moon"> = {
  breakfast: "Coffee",
  morningSnack: "Coffee",
  lunch: "Utensils",
  afternoonSnack: "Coffee",
  dinner: "Utensils",
  supper: "Moon",
};

function toNumber(value: string): number {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

function macrosLabel(item: { calories: number; protein: number; carbs: number; fat: number }): string {
  return `${fmt(item.calories)} kcal · P ${fmt(item.protein)} · C ${fmt(item.carbs)} · G ${fmt(item.fat)}`;
}

export function NutritionMealPlanner({ meals, onChange }: NutritionMealPlannerProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const results = useMemo(() => searchTacoFoods(search, 20), [search]);

  const mealTypeLabel = (type: NutritionMealType): string => t(`nutrition.mealTypes.${type}`);

  const updateMeal = (mealId: string, patch: Partial<NutritionMeal>) => {
    onChange(meals.map((meal) => (meal.id === mealId ? { ...meal, ...patch } : meal)));
  };

  const addMeal = () => {
    const used = new Set(meals.map((meal) => meal.type));
    const nextType = NUTRITION_MEAL_ORDER.find((value) => !used.has(value)) ?? "lunch";
    const next: NutritionMeal = {
      id: createId("meal"),
      type: nextType,
      title: null,
      time: null,
      notes: null,
      items: [],
    };
    onChange([...meals, next]);
  };

  const removeMeal = (mealId: string) => {
    onChange(meals.filter((meal) => meal.id !== mealId));
  };

  const removeItem = (mealId: string, itemId: string) => {
    onChange(
      meals.map((meal) =>
        meal.id === mealId
          ? { ...meal, items: meal.items.filter((item) => item.id !== itemId) }
          : meal,
      ),
    );
  };

  const removeOption = (mealId: string, itemId: string, optionId: string) => {
    onChange(
      meals.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              items: meal.items.map((item) =>
                item.id === itemId
                  ? { ...item, options: (item.options ?? []).filter((option) => option.id !== optionId) }
                  : item,
              ),
            }
          : meal,
      ),
    );
  };

  const openPicker = (target: PickerTarget) => {
    setDraft(EMPTY_DRAFT);
    setSearch("");
    setPicker(target);
  };

  const closePicker = () => {
    setPicker(null);
    setDraft(EMPTY_DRAFT);
    setSearch("");
  };

  const applyFood = (food: TacoFood) => {
    const quantity = toNumber(draft.quantity) || 100;
    const scaled = createItemFromTaco(food, quantity);
    setDraft({
      foodId: food.id,
      name: food.name,
      quantity: String(quantity),
      unit: food.defaultUnit ?? "g",
      calories: fmt(scaled.calories),
      protein: fmt(scaled.protein),
      carbs: fmt(scaled.carbs),
      fat: fmt(scaled.fat),
    });
  };

  const changeQuantity = (value: string) => {
    const next = { ...draft, quantity: value };
    if (draft.foodId) {
      const food = searchTacoFoods(draft.name, 1).find((item) => item.id === draft.foodId);
      if (food) {
        const scaled = createItemFromTaco(food, toNumber(value));
        next.calories = fmt(scaled.calories);
        next.protein = fmt(scaled.protein);
        next.carbs = fmt(scaled.carbs);
        next.fat = fmt(scaled.fat);
      }
    }
    setDraft(next);
  };

  const changeMacro = (field: "calories" | "protein" | "carbs" | "fat", value: string) => {
    setDraft({ ...draft, foodId: null, [field]: value });
  };

  const commitDraft = () => {
    if (!picker) return;
    const name = draft.name.trim();
    if (!name) return;

    const item: NutritionFoodItem = {
      id: createId("nitem"),
      foodId: draft.foodId,
      name,
      quantity: toNumber(draft.quantity),
      unit: draft.unit.trim() || "g",
      calories: Math.round(toNumber(draft.calories)),
      protein: toNumber(draft.protein),
      carbs: toNumber(draft.carbs),
      fat: toNumber(draft.fat),
    };

    onChange(
      meals.map((meal) => {
        if (meal.id !== picker.mealId) return meal;

        if (picker.kind === "option") {
          const option: NutritionItemOption = {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          };
          return {
            ...meal,
            items: meal.items.map((current) =>
              current.id === picker.itemId
                ? { ...current, options: [...(current.options ?? []), option] }
                : current,
            ),
          };
        }

        return { ...meal, items: [...meal.items, item] };
      }),
    );

    closePicker();
  };

  const renderItem = (meal: NutritionMeal, item: NutritionFoodItem) => (
    <View key={item.id} style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.itemActions}>
          <Pressable onPress={() => openPicker({ kind: "option", mealId: meal.id, itemId: item.id })} hitSlop={8}>
            <AppIcon name="Plus" size={16} color={colors.muted} />
          </Pressable>
          <Pressable onPress={() => removeItem(meal.id, item.id)} hitSlop={8}>
            <AppIcon name="Trash2" size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.itemMeta, { color: colors.muted }]}>
        {fmt(item.quantity)} {item.unit} · {macrosLabel(item)}
      </Text>
      {item.note ? (
        <Text style={[styles.itemNote, { color: colors.muted }]}>{item.note}</Text>
      ) : null}
      {(item.options ?? []).map((option) => (
        <View key={option.id} style={styles.optionRow}>
          <Text style={[styles.optionText, { color: colors.primary }]} numberOfLines={2}>
            {"↔ "}
            {option.name} · {fmt(option.quantity)} {option.unit}
          </Text>
          <Pressable onPress={() => removeOption(meal.id, item.id, option.id)} hitSlop={8}>
            <AppIcon name="X" size={14} color={colors.muted} />
          </Pressable>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {meals.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{t("nutrition.mealItemsEmpty")}</Text>
      ) : null}

      {meals.map((meal) => {
        const totals = sumNutritionMeal(meal);
        return (
          <View key={meal.id} style={[styles.mealCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.mealHeader}>
              <AppIcon name={MEAL_ICONS[meal.type]} size={16} color={colors.primary} />
              <Text style={[styles.mealTitle, { color: colors.foreground }]}>{mealTypeLabel(meal.type)}</Text>
              <Text style={[styles.mealTotal, { color: colors.muted }]}>{fmt(totals.calories)} kcal</Text>
              <Pressable onPress={() => removeMeal(meal.id)} hitSlop={8}>
                <AppIcon name="Trash2" size={16} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {NUTRITION_MEAL_ORDER.map((type) => {
                const active = meal.type === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => updateMeal(meal.id, { type })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary + "22" : colors.surfaceAlt,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? colors.primary : colors.muted }]}>
                      {mealTypeLabel(type)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.fieldRow}>
              <View style={[styles.field, styles.timeField]}>
                <Text style={[styles.label, { color: colors.muted }]}>{t("nutrition.mealTime")}</Text>
                <TextInput
                  value={meal.time ?? ""}
                  onChangeText={(value) => updateMeal(meal.id, { time: value })}
                  placeholder="08:00"
                  placeholderTextColor={colors.muted}
                  keyboardType="numbers-and-punctuation"
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.muted }]}>{t("nutrition.plannedMeals")}</Text>
                <TextInput
                  value={meal.title ?? ""}
                  onChangeText={(value) => updateMeal(meal.id, { title: value })}
                  placeholder={t("nutrition.mealTitlePlaceholder")}
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                />
              </View>
            </View>

            <View style={styles.itemsWrap}>
              {meal.items.length === 0 ? (
                <Text style={[styles.emptyItem, { color: colors.muted }]}>{t("nutrition.mealItemsEmpty")}</Text>
              ) : (
                meal.items.map((item) => renderItem(meal, item))
              )}
            </View>

            <Pressable
              onPress={() => openPicker({ kind: "item", mealId: meal.id })}
              style={[styles.addItemBtn, { borderColor: colors.primary }]}
            >
              <AppIcon name="Plus" size={14} color={colors.primary} />
              <Text style={[styles.addItemText, { color: colors.primary }]}>{t("nutrition.addFood")}</Text>
            </Pressable>

            <TextInput
              value={meal.notes ?? ""}
              onChangeText={(value) => updateMeal(meal.id, { notes: value })}
              placeholder={t("nutrition.mealNotesPlaceholder")}
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />
          </View>
        );
      })}

      <Pressable onPress={addMeal} style={[styles.addMealBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
        <AppIcon name="Plus" size={16} color={colors.primary} />
        <Text style={[styles.addMealText, { color: colors.primary }]}>{t("nutrition.addMeal")}</Text>
      </Pressable>

      <Modal visible={picker !== null} animationType="slide" transparent onRequestClose={closePicker}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {picker?.kind === "option" ? t("nutrition.addSubstitution") : t("nutrition.addFood")}
              </Text>
              <Pressable onPress={closePicker} hitSlop={10}>
                <AppIcon name="X" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("nutrition.searchPlaceholder")}
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            />

            <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {results.length === 0 ? (
                <Text style={[styles.emptyItem, { color: colors.muted }]}>{t("nutrition.noFoodResults")}</Text>
              ) : (
                results.map((food) => (
                  <Pressable
                    key={food.id}
                    onPress={() => applyFood(food)}
                    style={[
                      styles.resultRow,
                      {
                        borderColor: draft.foodId === food.id ? colors.primary : colors.border,
                        backgroundColor: draft.foodId === food.id ? colors.primary + "14" : colors.surfaceAlt,
                      },
                    ]}
                  >
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
                        {food.name}
                      </Text>
                      <Text style={[styles.resultMeta, { color: colors.muted }]}>
                        {fmt(food.caloriesPer100g)} kcal · P {fmt(food.proteinPer100g)} · C {fmt(food.carbsPer100g)} · G {fmt(food.fatPer100g)} / 100g
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>

            <View style={[styles.draftBox, { borderColor: colors.border }]}>
              <TextInput
                value={draft.name}
                onChangeText={(value) => setDraft({ ...draft, foodId: null, name: value })}
                placeholder={t("nutrition.freeTextFood")}
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />
              <View style={styles.fieldRow}>
                <View style={[styles.field, styles.timeField]}>
                  <Text style={[styles.label, { color: colors.muted }]}>{t("nutrition.quantity")}</Text>
                  <TextInput
                    value={draft.quantity}
                    onChangeText={changeQuantity}
                    keyboardType="decimal-pad"
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.muted }]}>{t("nutrition.unit")}</Text>
                  <TextInput
                    value={draft.unit}
                    onChangeText={(value) => setDraft({ ...draft, unit: value })}
                    placeholder="g"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  />
                </View>
              </View>
              <View style={styles.fieldRow}>
                {(
                  [
                    ["calories", t("nutrition.calories")],
                    ["protein", t("nutrition.protein")],
                    ["carbs", t("nutrition.carbs")],
                    ["fat", t("nutrition.fat")],
                  ] as const
                ).map(([field, label]) => (
                  <View key={field} style={styles.field}>
                    <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
                    <TextInput
                      value={draft[field]}
                      onChangeText={(value) => changeMacro(field, value)}
                      keyboardType="decimal-pad"
                      style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                    />
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              onPress={commitDraft}
              disabled={!draft.name.trim()}
              style={[
                styles.confirmBtn,
                { backgroundColor: draft.name.trim() ? colors.primary : colors.surfaceAlt },
              ]}
            >
              <Text style={[styles.confirmText, { color: draft.name.trim() ? "#04101f" : colors.muted }]}>
                {t("nutrition.addFood")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  empty: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
  },
  mealCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  mealTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  mealTotal: {
    fontSize: typography.caption,
    fontWeight: "800",
    marginRight: spacing.xs,
  },
  chips: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "800",
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  field: {
    flex: 1,
    gap: 2,
  },
  timeField: {
    maxWidth: 96,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
    fontWeight: "700",
  },
  notesInput: {
    marginTop: 2,
  },
  itemsWrap: {
    gap: spacing.xs,
  },
  emptyItem: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: spacing.xs,
  },
  item: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  itemMeta: {
    fontSize: 11,
    fontWeight: "700",
  },
  itemNote: {
    fontSize: 11,
    fontWeight: "600",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
  optionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  addItemText: {
    fontSize: 13,
    fontWeight: "800",
  },
  addMealBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  addMealText: {
    fontSize: 14,
    fontWeight: "900",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  results: {
    maxHeight: 200,
  },
  resultRow: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  resultInfo: {
    gap: 2,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "800",
  },
  resultMeta: {
    fontSize: 11,
    fontWeight: "700",
  },
  draftBox: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  confirmBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
