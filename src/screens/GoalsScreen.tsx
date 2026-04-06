import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useTheme } from "@/src/hooks";
import { useDietStore } from "@/src/store/dietStore";
import { radius, spacing, typography } from "@/src/theme";

export function GoalsScreen() {
  const { colors } = useTheme();
  const { dailyGoals, setDailyGoals } = useDietStore();

  const [calories, setCalories] = useState(String(dailyGoals.calories));
  const [protein, setProtein] = useState(String(dailyGoals.protein));
  const [carbs, setCarbs] = useState(String(dailyGoals.carbs));
  const [fat, setFat] = useState(String(dailyGoals.fat));

  const handleSave = () => {
    const c = parseInt(calories, 10) || 0;
    const p = parseInt(protein, 10) || 0;
    const cb = parseInt(carbs, 10) || 0;
    const f = parseInt(fat, 10) || 0;

    if (c <= 0) {
      Alert.alert("Meta invalida", "Defina um valor de calorias maior que zero para continuar.");
      return;
    }

    setDailyGoals({ calories: c, protein: p, carbs: cb, fat: f });
    Alert.alert("Metas atualizadas", "Suas metas nutricionais ja foram salvas.");
    router.back();
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Metas diarias</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Ajuste seus objetivos do dia para manter a alimentacao alinhada com sua rotina.
          </Text>
        </View>

        <SectionCard title="Calorias" subtitle="Escolha a meta total de energia que voce quer atingir ao longo do dia.">
          <TextInput
            keyboardType="number-pad"
            onChangeText={setCalories}
            style={inputStyle}
            value={calories}
          />
        </SectionCard>

        <SectionCard title="Macronutrientes" subtitle="Defina a distribuicao de proteina, carbo e gordura da forma que fizer mais sentido para voce.">
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Proteina (g)</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setProtein}
              style={inputStyle}
              value={protein}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Carboidratos (g)</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setCarbs}
              style={inputStyle}
              value={carbs}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Gorduras (g)</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setFat}
              style={inputStyle}
              value={fat}
            />
          </View>
        </SectionCard>

        <AppButton label="Salvar metas" onPress={handleSave} />
      </ScrollView>
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
    lineHeight: 24,
    fontWeight: "500",
  },
  inputGroup: {
    gap: spacing.xs,
    marginBottom: spacing.md,
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
});
