import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppIcon } from "@/src/components/AppIcon";
import { useDietStore } from "@/src/store/dietStore";
import { useTheme } from "@/src/hooks";
import type { Food, MealItem } from "@/src/types";
import { createId, toIsoDate } from "@/src/utils";
import { WebShell } from "./WebChrome";

const BASE_FOODS: Food[] = [
  { id: "seed-rice", name: "Arroz Branco", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "seed-beans", name: "Feijão Carioca", caloriesPer100g: 76, proteinPer100g: 4.8, carbsPer100g: 14, fatPer100g: 0.5, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "seed-chicken", name: "Frango Grelhado", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "seed-egg", name: "Ovo Cozido", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
  { id: "seed-banana", name: "Banana Prata", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, servingSize: 100, servingUnit: "g", syncStatus: "synced" },
];

const mealTypes = [
  ["breakfast", "Café da manhã"],
  ["lunch", "Almoço"],
  ["dinner", "Jantar"],
  ["snack", "Lanche"],
] as const;

type MealType = (typeof mealTypes)[number][0];

export function WebAddMealScreen() {
  const params = useLocalSearchParams<{ mealType?: string }>();
  const { colors } = useTheme();
  const { foods: customFoods, addMeal } = useDietStore();
  const [mealType, setMealType] = useState<MealType>(mealTypes.some(([value]) => value === params.mealType) ? params.mealType as MealType : "lunch");
  const [items, setItems] = useState<MealItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const allFoods = useMemo(() => [...BASE_FOODS, ...customFoods], [customFoods]);
  const filteredFoods = allFoods.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()));
  const totals = items.reduce((total, item) => ({ calories: total.calories + item.calories, protein: total.protein + item.protein, carbs: total.carbs + item.carbs, fat: total.fat + item.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const addSelectedFood = () => {
    if (!selectedFood) return;
    const amount = Number(quantity.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) { setFeedback("Informe uma quantidade maior que zero."); return; }
    setItems((current) => [...current, { id: createId("item"), foodId: selectedFood.id, foodName: selectedFood.name, quantity: amount, unit: "g", calories: Math.round(selectedFood.caloriesPer100g * amount / 100), protein: Math.round(selectedFood.proteinPer100g * amount / 100), carbs: Math.round(selectedFood.carbsPer100g * amount / 100), fat: Math.round(selectedFood.fatPer100g * amount / 100) }]);
    setSelectedFood(null); setQuantity("100"); setQuery(""); setFeedback(null);
  };

  const saveMeal = () => {
    if (!items.length) { setFeedback("Adicione pelo menos um alimento antes de salvar."); return; }
    addMeal({ date: toIsoDate(new Date()), mealType, items, totalCalories: totals.calories, totalProtein: totals.protein, totalCarbs: totals.carbs, totalFat: totals.fat, notes: notes.trim() || undefined });
    router.back();
  };

  return <WebShell backRoute="/diet" eyebrow="Nutrição" title="Monte uma refeição com clareza.">
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={[styles.hero, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "45" }]}><View style={styles.heroCopy}><Text style={[styles.kicker, { color: colors.primary }]}>REGISTRO NUTRICIONAL</Text><Text style={[styles.heroTitle, { color: colors.foreground }]}>Registre o que realmente entrou no seu dia.</Text><Text style={[styles.heroText, { color: colors.foregroundMuted }]}>Escolha o momento, adicione os alimentos e veja os macros se organizarem automaticamente.</Text></View><View style={[styles.heroStat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.heroStatValue, { color: colors.foreground }]}>{totals.calories}</Text><Text style={[styles.heroStatLabel, { color: colors.muted }]}>kcal na refeição</Text></View></View>
      {feedback ? <View style={[styles.notice, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "45" }]}><AppIcon name="AlertTriangle" size={16} color={colors.warning} /><Text style={[styles.noticeText, { color: colors.warning }]}>{feedback}</Text></View> : null}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.kicker, { color: colors.muted }]}>MOMENTO DO DIA</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Em qual refeição estamos?</Text><View style={styles.typeRow}>{mealTypes.map(([value, label]) => <Pressable key={value} onPress={() => setMealType(value)} style={[styles.typeButton, { backgroundColor: mealType === value ? colors.primary : colors.surfaceAlt, borderColor: mealType === value ? colors.primary : colors.border }]}><Text style={[styles.typeText, { color: mealType === value ? "#06111D" : colors.foreground }]}>{label}</Text></Pressable>)}</View></View>
      <View style={styles.contentGrid}>
        <View style={[styles.card, styles.foodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.cardHeading}><View><Text style={[styles.kicker, { color: colors.muted }]}>ALIMENTOS</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Construa o prato</Text></View><Text style={[styles.count, { color: colors.primary }]}>{items.length} itens</Text></View><TextInput value={query} onChangeText={setQuery} placeholder="Buscar alimento..." placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} />{selectedFood ? <View style={[styles.selected, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "45" }]}><View style={styles.selectedCopy}><Text style={[styles.selectedName, { color: colors.foreground }]}>{selectedFood.name}</Text><Text style={[styles.selectedMeta, { color: colors.muted }]}>{selectedFood.caloriesPer100g} kcal por 100 g</Text></View><TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={[styles.quantity, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /><Pressable onPress={addSelectedFood} style={[styles.smallButton, { backgroundColor: colors.primary }]}><Text style={styles.smallButtonText}>Adicionar</Text></Pressable></View> : <View style={styles.foodList}>{filteredFoods.map((food) => <Pressable key={food.id} onPress={() => setSelectedFood(food)} style={({ pressed }) => [styles.foodRow, { borderBottomColor: colors.border }, pressed && { opacity: .65 }]}><View style={[styles.foodIcon, { backgroundColor: colors.primary + "18" }]}><AppIcon name="Apple" size={16} color={colors.primary} /></View><View style={styles.foodCopy}><Text style={[styles.foodName, { color: colors.foreground }]}>{food.name}</Text><Text style={[styles.foodMeta, { color: colors.muted }]}>{food.caloriesPer100g} kcal · P {food.proteinPer100g} g · C {food.carbsPer100g} g</Text></View><AppIcon name="Plus" size={18} color={colors.primary} /></Pressable>)}</View>}</View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.cardHeading}><View><Text style={[styles.kicker, { color: colors.muted }]}>RESUMO</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>O que foi registrado</Text></View><AppIcon name="ClipboardList" size={19} color={colors.primary} /></View>{items.length ? items.map((item) => <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}><View style={styles.itemCopy}><Text style={[styles.itemName, { color: colors.foreground }]}>{item.foodName}</Text><Text style={[styles.itemMeta, { color: colors.muted }]}>{item.quantity} g · {item.calories} kcal</Text></View><Pressable onPress={() => setItems(items.filter((current) => current.id !== item.id))}><AppIcon name="X" size={17} color={colors.muted} /></Pressable></View>) : <Text style={[styles.empty, { color: colors.muted }]}>Selecione um alimento ao lado para começar.</Text>}<View style={styles.macroGrid}><Macro label="CALORIAS" value={`${totals.calories}`} unit="kcal" colors={colors} /><Macro label="PROTEÍNA" value={`${totals.protein}`} unit="g" colors={colors} /><Macro label="CARBO" value={`${totals.carbs}`} unit="g" colors={colors} /><Macro label="GORDURA" value={`${totals.fat}`} unit="g" colors={colors} /></View><Text style={[styles.kicker, { color: colors.muted }]}>NOTAS OPCIONAIS</Text><TextInput value={notes} onChangeText={setNotes} multiline placeholder="Ex.: refeição antes do treino..." placeholderTextColor={colors.muted} style={[styles.notes, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]} /></View>
      </View>
      <View style={[styles.saveBar, { backgroundColor: colors.surface, borderColor: colors.border }]}><View><Text style={[styles.saveTitle, { color: colors.foreground }]}>Tudo pronto?</Text><Text style={[styles.saveHint, { color: colors.muted }]}>O registro ficará disponível no histórico de nutrição.</Text></View><Pressable onPress={saveMeal} style={[styles.saveButton, { backgroundColor: colors.primary }]}><Text style={styles.saveText}>Salvar refeição</Text><AppIcon name="Check" size={16} color="#06111D" /></Pressable></View>
    </ScrollView>
  </WebShell>;
}
function Macro({ label, value, unit, colors }: { label: string; value: string; unit: string; colors: any }) { return <View style={[styles.macro, { borderColor: colors.border }]}><Text style={[styles.kicker, { color: colors.muted }]}>{label}</Text><Text style={[styles.macroValue, { color: colors.foreground }]}>{value} <Text style={{ color: colors.primary, fontSize: 11 }}>{unit}</Text></Text></View>; }
const styles = StyleSheet.create({ scroll: { gap: 16, paddingBottom: 70 }, hero: { borderWidth: 1, borderRadius: 20, padding: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }, heroCopy: { flex: 1, minWidth: 280, maxWidth: 700 }, kicker: { fontFamily: "monospace", fontSize: 9, letterSpacing: 1.3, fontWeight: "900" }, heroTitle: { fontSize: 28, lineHeight: 33, fontWeight: "900", marginTop: 7 }, heroText: { fontSize: 13, lineHeight: 21, marginTop: 9 }, heroStat: { minWidth: 150, borderWidth: 1, borderRadius: 14, padding: 16, alignItems: "center" }, heroStatValue: { fontSize: 28, fontWeight: "900" }, heroStatLabel: { fontSize: 10, marginTop: 3 }, notice: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: "row", gap: 8, alignItems: "center" }, noticeText: { flex: 1, fontSize: 12, fontWeight: "800" }, card: { borderWidth: 1, borderRadius: 18, padding: 19, gap: 14 }, sectionTitle: { fontSize: 19, fontWeight: "900", marginTop: 6 }, typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, typeButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 }, typeText: { fontSize: 12, fontWeight: "900" }, contentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 }, foodCard: { flex: 1, minWidth: 360 }, cardHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, count: { fontSize: 11, fontWeight: "900" }, input: { height: 43, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 }, foodList: { gap: 0 }, foodRow: { minHeight: 58, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 }, foodIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" }, foodCopy: { flex: 1, gap: 3 }, foodName: { fontSize: 13, fontWeight: "900" }, foodMeta: { fontSize: 10 }, selected: { borderWidth: 1, borderRadius: 12, padding: 11, flexDirection: "row", alignItems: "center", gap: 8 }, selectedCopy: { flex: 1, gap: 3 }, selectedName: { fontSize: 12, fontWeight: "900" }, selectedMeta: { fontSize: 10 }, quantity: { width: 66, height: 38, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, fontWeight: "800" }, smallButton: { height: 38, borderRadius: 8, paddingHorizontal: 11, alignItems: "center", justifyContent: "center" }, smallButtonText: { color: "#06111D", fontSize: 10, fontWeight: "900" }, itemRow: { paddingVertical: 10, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 8 }, itemCopy: { flex: 1, gap: 3 }, itemName: { fontSize: 13, fontWeight: "800" }, itemMeta: { fontSize: 11 }, empty: { paddingVertical: 26, textAlign: "center", fontSize: 12 }, macroGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 }, macro: { flex: 1, minWidth: 90, borderWidth: 1, padding: 10, gap: 6 }, macroValue: { fontSize: 18, fontWeight: "900" }, notes: { minHeight: 76, borderWidth: 1, borderRadius: 10, padding: 11, fontSize: 12, textAlignVertical: "top" }, saveBar: { borderWidth: 1, borderRadius: 15, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 15 }, saveTitle: { fontSize: 14, fontWeight: "900" }, saveHint: { fontSize: 11, marginTop: 3 }, saveButton: { minHeight: 44, borderRadius: 10, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 8 }, saveText: { color: "#06111D", fontSize: 12, fontWeight: "900" },
});
