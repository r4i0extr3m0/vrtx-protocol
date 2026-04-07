import { useEffect, useState, useMemo } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useTheme } from "@/src/hooks";
import { useDietStore } from "@/src/store/dietStore";
import { useGamificationStore } from "@/src/store/gamificationStore";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";
import { radius, spacing, typography } from "@/src/theme";
import { createId, toIsoDate } from "@/src/utils";
import type { MealItem, Food } from "@/src/types";

const INITIAL_FOODS: Food[] = [
  { id: "f1", name: "Arroz Branco", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "f2", name: "Feijão Carioca", caloriesPer100g: 76, proteinPer100g: 4.8, carbsPer100g: 14, fatPer100g: 0.5, calories: 76, protein: 4.8, carbs: 14, fat: 0.5, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "f3", name: "Frango Grelhado", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "f4", name: "Ovo Cozido", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "f5", name: "Banana Prata", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
];

export function AddMealScreen() {
  const params = useLocalSearchParams<{ mealType?: "breakfast" | "lunch" | "dinner" | "snack" }>();
  const { colors } = useTheme();
  const { addMeal, foods: customFoods } = useDietStore();
  const { recordActivity } = useGamificationStore();

  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [items, setItems] = useState<MealItem[]>([]);
  const [foodPickerVisible, setFoodPickerVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("100");

  const allFoods = useMemo(() => [...INITIAL_FOODS, ...customFoods], [customFoods]);

  useEffect(() => {
    if (params.mealType && ["breakfast", "lunch", "dinner", "snack"].includes(params.mealType)) {
      setMealType(params.mealType);
    }
  }, [params.mealType]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [items]);

  const handleAddItem = () => {
    if (!selectedFood) return;
    const q = parseFloat(quantity) || 0;
    if (q <= 0) {
      Alert.alert("Quantidade invalida", "Digite uma quantidade maior que zero para continuar.");
      return;
    }

    const newItem: MealItem = {
      id: createId("item"),
      foodName: selectedFood.name,
      quantity: q,
      calories: Math.round((selectedFood.caloriesPer100g * q) / 100),
      protein: Math.round((selectedFood.proteinPer100g * q) / 100),
      carbs: Math.round((selectedFood.carbsPer100g * q) / 100),
      fat: Math.round((selectedFood.fatPer100g * q) / 100),
    };

    setItems([...items, newItem]);
    setFoodPickerVisible(false);
    setSelectedFood(null);
    setQuantity("100");
  };

  const handleSaveMeal = () => {
    if (items.length === 0) {
      Alert.alert("Falta um alimento", "Adicione pelo menos um item antes de salvar a refeicao.");
      return;
    }

    addMeal({
      date: toIsoDate(new Date()),
      mealType,
      items,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
    });

    recordActivity("diet", 1);
    trackEvent(ANALYTICS_EVENTS.DIET_MEAL_ADDED, {
      meal_type: mealType,
      item_count: items.length,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    });
    router.back();
  };

  return (
    <ScreenContainer className="px-5 py-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={24}
        style={styles.keyboardWrapper}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Nova refeicao</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Monte sua refeicao com calma e acompanhe os macros sem complicacao.
          </Text>
        </View>

        <SectionCard title="Tipo de refeicao" subtitle="Escolha em que momento do dia voce fez essa refeicao.">
          <View style={styles.typeRow}>
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setMealType(type)}
                style={[
                  styles.typeBtn,
                  { backgroundColor: mealType === type ? colors.primary : colors.surfaceAlt },
                ]}
              >
                <Text style={[styles.typeBtnText, { color: mealType === type ? "#fff" : colors.foreground }]}>
                  {type === "breakfast" ? "Cafe da manha" : type === "lunch" ? "Almoco" : type === "dinner" ? "Jantar" : "Lanche"}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Alimentos" subtitle="Adicione os itens que fizeram parte da sua refeicao.">
          {items.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Nenhum alimento adicionado ainda.
            </Text>
          ) : null}
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.foreground }]}>{item.foodName}</Text>
                <Text style={[styles.itemMeta, { color: colors.muted }]}>{item.quantity} g · {item.calories} kcal</Text>
              </View>
              <AppButton label="×" onPress={() => setItems(items.filter((i) => i.id !== item.id))} variant="ghost" style={styles.removeBtn} />
            </View>
          ))}
          <AppButton label="Adicionar alimento" onPress={() => setFoodPickerVisible(true)} variant="secondary" />
        </SectionCard>

        <SectionCard title="Resumo nutricional" subtitle="Os totais sao atualizados automaticamente conforme voce adiciona os itens.">
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totals.calories}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>kcal</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totals.protein}g</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Proteina</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totals.carbs}g</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Carbo</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totals.fat}g</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Gordura</Text>
            </View>
          </View>
        </SectionCard>

        <AppButton label="Salvar refeicao" onPress={handleSaveMeal} />
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal animationType="slide" onRequestClose={() => setFoodPickerVisible(false)} transparent visible={foodPickerVisible}>
        <Pressable onPress={() => setFoodPickerVisible(false)} style={styles.overlay} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={24}
          style={styles.keyboardWrapper}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Escolha um alimento</Text>
            
            {!selectedFood ? (
              <ScrollView keyboardShouldPersistTaps="handled" style={styles.foodList}>
                {allFoods.map((food) => (
                  <Pressable
                    key={food.id}
                    onPress={() => setSelectedFood(food)}
                    style={[styles.foodItem, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[styles.foodName, { color: colors.foreground }]}>{food.name}</Text>
                    <Text style={[styles.foodMeta, { color: colors.muted }]}>{food.caloriesPer100g} kcal / 100g</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.quantityForm}>
                <Text style={[styles.selectedFoodName, { color: colors.foreground }]}>{selectedFood.name}</Text>
                <Text style={[styles.label, { color: colors.muted }]}>Quantidade em gramas</Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={setQuantity}
                  style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground }]}
                  value={quantity}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <AppButton label="Voltar" onPress={() => setSelectedFood(null)} variant="secondary" style={{ flex: 1 }} />
                  <AppButton label="Adicionar" onPress={handleAddItem} style={{ flex: 1 }} />
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  keyboardWrapper: {
    flex: 1,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    fontWeight: "500",
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  typeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 80,
    alignItems: "center",
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  removeBtn: {
    minHeight: 32,
    paddingHorizontal: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: typography.section,
    fontWeight: "900",
    marginBottom: spacing.lg,
  },
  foodList: {
    maxHeight: 400,
  },
  foodItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
  },
  foodMeta: {
    fontSize: 13,
  },
  quantityForm: {
    gap: spacing.md,
  },
  selectedFoodName: {
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: "700",
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
