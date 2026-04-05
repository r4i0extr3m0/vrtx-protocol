import { useState, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Modal } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useTheme } from "@/src/hooks";
import { useDietStore } from "@/src/store/dietStore";
import { useGamificationStore } from "@/src/store/gamificationStore";
import { radius, spacing, typography } from "@/src/theme";
import { createId, toIsoDate, toIsoTimestamp } from "@/src/utils";
import type { MealItem, Food } from "@/src/types";

const INITIAL_FOODS: Food[] = [
  { id: "f1", name: "Arroz Branco", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "f2", name: "Feijão Carioca", caloriesPer100g: 76, proteinPer100g: 4.8, carbsPer100g: 14, fatPer100g: 0.5, calories: 76, protein: 4.8, carbs: 14, fat: 0.5, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "f3", name: "Frango Grelhado", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "f4", name: "Ovo Cozido", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "f5", name: "Banana Prata", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
];

export function AddMealScreen() {
  const { colors } = useTheme();
  const { addMeal, foods: customFoods } = useDietStore();
  const { recordActivity } = useGamificationStore();

  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [items, setItems] = useState<MealItem[]>([]);
  const [foodPickerVisible, setFoodPickerVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("100");

  const allFoods = useMemo(() => [...INITIAL_FOODS, ...customFoods], [customFoods]);

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
    if (q <= 0) { Alert.alert("Quantidade inválida"); return; }

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
    if (items.length === 0) { Alert.alert("Adicione pelo menos um alimento"); return; }

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
    router.back();
  };

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Nova Refeição</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Registre o que você comeu para manter o controle.</Text>
        </View>

        <SectionCard title="Tipo de Refeição" subtitle="Selecione o momento do dia.">
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
                  {type === "breakfast" ? "Café" : type === "lunch" ? "Almoço" : type === "dinner" ? "Jantar" : "Lanche"}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Alimentos" subtitle="Lista de itens consumidos.">
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.foreground }]}>{item.foodName}</Text>
                <Text style={[styles.itemMeta, { color: colors.muted }]}>{item.quantity}g • {item.calories} kcal</Text>
              </View>
              <AppButton label="×" onPress={() => setItems(items.filter((i) => i.id !== item.id))} variant="ghost" style={styles.removeBtn} />
            </View>
          ))}
          <AppButton label="+ Adicionar Alimento" onPress={() => setFoodPickerVisible(true)} variant="secondary" />
        </SectionCard>

        <SectionCard title="Resumo Nutricional" subtitle="Totais calculados automaticamente.">
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totals.calories}</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>kcal</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totals.protein}g</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Prot</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totals.carbs}g</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Carb</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totals.fat}g</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Gord</Text>
            </View>
          </View>
        </SectionCard>

        <AppButton label="Salvar Refeição" onPress={handleSaveMeal} />
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setFoodPickerVisible(false)} transparent visible={foodPickerVisible}>
        <Pressable onPress={() => setFoodPickerVisible(false)} style={styles.overlay} />
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Selecionar Alimento</Text>
          
          {!selectedFood ? (
            <ScrollView style={styles.foodList}>
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
              <Text style={[styles.label, { color: colors.muted }]}>Quantidade (gramas)</Text>
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
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 12,
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
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
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
    fontWeight: "600",
  },
  foodMeta: {
    fontSize: 12,
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
    textTransform: "uppercase",
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
