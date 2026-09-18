import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon } from "@/src/components/AppIcon";
import { NutritionMealPlanner } from "@/src/components/NutritionMealPlanner";
import { SectionCard } from "@/src/components/SectionCard";
import { getCoachClientNutritionPlan, upsertCoachNutritionPlan } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useI18n } from "@/src/i18n";
import { useTabBarInset, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import type { NutritionMeal, NutritionMealType, NutritionPlanInput, NutritionTargets } from "@/src/types";
import { createId } from "@/src/utils";

interface NumericFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

function NumericField({ label, value, onChangeText, placeholder }: NumericFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
      />
    </View>
  );
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

const DEFAULTS: NutritionPlanInput = {
  trainingDay: { calories: 2800, protein: 180, carbs: 300, fat: 80 },
  restDay: { calories: 2200, protein: 160, carbs: 200, fat: 75 },
  waterMl: 3000,
};

interface TargetForm {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

function toForm(targets: NutritionTargets): TargetForm {
  return {
    calories: String(targets.calories),
    protein: String(targets.protein),
    carbs: String(targets.carbs),
    fat: String(targets.fat),
  };
}

function parseTargets(form: TargetForm): NutritionTargets | null {
  const calories = parseNumber(form.calories);
  const protein = parseNumber(form.protein);
  const carbs = parseNumber(form.carbs);
  const fat = parseNumber(form.fat);
  if (calories === null || protein === null || carbs === null || fat === null) {
    return null;
  }
  return { calories, protein, carbs, fat };
}

const DEFAULT_MEAL_TYPES: NutritionMealType[] = ["breakfast", "lunch", "afternoonSnack", "dinner"];

function createDefaultMeals(): NutritionMeal[] {
  return DEFAULT_MEAL_TYPES.map((type) => ({
    id: createId("meal"),
    type,
    title: null,
    time: null,
    notes: null,
    items: [],
  }));
}

export function CoachNutritionScreen() {
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string }>();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const clientName = typeof params.clientName === "string" ? params.clientName : "";
  const { colors } = useTheme();
  const { t } = useI18n();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();

  const [training, setTraining] = useState<TargetForm>(toForm(DEFAULTS.trainingDay));
  const [rest, setRest] = useState<TargetForm>(toForm(DEFAULTS.restDay));
  const [waterMl, setWaterMl] = useState(String(DEFAULTS.waterMl));
  const [notes, setNotes] = useState("");
  const [meals, setMeals] = useState<NutritionMeal[]>(createDefaultMeals);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const online = hasSupabaseEnv();
  const title = clientName || t("adherence.clientFallback");

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getCoachClientNutritionPlan(clientId);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setTraining(toForm(result.data.trainingDay));
      setRest(toForm(result.data.restDay));
      setWaterMl(String(result.data.waterMl));
      setNotes(result.data.notes ?? "");
      if (result.data.meals.length > 0) {
        setMeals(result.data.meals);
      }
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    if (online) {
      void load();
    } else {
      setLoading(false);
    }
  }, [online, load]);

  const handleSave = async () => {
    if (!online || saving || !clientId) return;

    const trainingTargets = parseTargets(training);
    const restTargets = parseTargets(rest);
    const water = parseNumber(waterMl);

    if (!trainingTargets || !restTargets || water === null) {
      setError(t("nutrition.requiredField"));
      return;
    }

    setSaving(true);
    setError(null);
    const result = await upsertCoachNutritionPlan(clientId, {
      trainingDay: trainingTargets,
      restDay: restTargets,
      waterMl: water,
      notes: notes.trim() || null,
      meals: meals.filter((meal) => meal.items.length > 0 || Boolean(meal.title?.trim())),
    });
    setSaving(false);

    if (result.error) {
      Alert.alert(t("nutrition.saveErrorTitle"), result.error);
      return;
    }

    Alert.alert(t("nutrition.savedTitle"), t("nutrition.savedBody"));
  };

  const renderTargetFields = (form: TargetForm, setForm: (next: TargetForm) => void) => (
    <>
      <NumericField
        label={t("nutrition.calories")}
        value={form.calories}
        onChangeText={(value) => setForm({ ...form, calories: value })}
        placeholder="2800"
      />
      <View style={styles.fieldRow}>
        <NumericField
          label={t("nutrition.protein")}
          value={form.protein}
          onChangeText={(value) => setForm({ ...form, protein: value })}
          placeholder="180"
        />
        <NumericField
          label={t("nutrition.carbs")}
          value={form.carbs}
          onChangeText={(value) => setForm({ ...form, carbs: value })}
          placeholder="300"
        />
        <NumericField
          label={t("nutrition.fat")}
          value={form.fat}
          onChangeText={(value) => setForm({ ...form, fat: value })}
          placeholder="80"
        />
      </View>
    </>
  );

  return (
    <ScreenContainer className="px-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: contentPaddingBottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t("nutrition.coachTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {t("nutrition.coachSubtitle", { client: title })}
            </Text>
          </View>

          {!online ? (
            <View style={[styles.notice, { backgroundColor: colors.warning + "15" }]}>
              <Text style={[styles.noticeText, { color: colors.warning }]}>
                {t("nutrition.offline")}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.notice, { backgroundColor: colors.error + "15" }]}>
              <Text style={[styles.noticeText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <SectionCard title={t("nutrition.sectionTraining")} delay={60}>
            <View style={styles.sectionIconRow}>
              <AppIcon name="Dumbbell" size={16} color={colors.primary} />
              <Text style={[styles.sectionHint, { color: colors.muted }]}>
                {t("nutrition.trainingDay")}
              </Text>
            </View>
            {renderTargetFields(training, setTraining)}
          </SectionCard>

          <SectionCard title={t("nutrition.sectionRest")} delay={120}>
            <View style={styles.sectionIconRow}>
              <AppIcon name="Moon" size={16} color={colors.muted} />
              <Text style={[styles.sectionHint, { color: colors.muted }]}>
                {t("nutrition.restDay")}
              </Text>
            </View>
            {renderTargetFields(rest, setRest)}
          </SectionCard>

          <SectionCard title={t("nutrition.mealsTitle")} icon="Utensils" delay={180} subtitle={t("nutrition.mealsHint")}>
            <NutritionMealPlanner meals={meals} onChange={setMeals} />
          </SectionCard>

          <SectionCard title={t("nutrition.water")} delay={240}>
            <NumericField
              label={t("nutrition.waterLabel")}
              value={waterMl}
              onChangeText={setWaterMl}
              placeholder="3000"
            />
            <NumericField
              label={t("nutrition.notes")}
              value={notes}
              onChangeText={setNotes}
              placeholder={t("nutrition.notesPlaceholder")}
            />
          </SectionCard>

          <AppButton
            label={t("nutrition.save")}
            variant="brand"
            loading={saving}
            onPress={handleSave}
            disabled={!online}
          />

          {loading ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t("nutrition.loading")}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.bodySm,
    fontWeight: "600",
  },
  notice: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  noticeText: {
    fontSize: typography.bodySm,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  field: {
    flex: 1,
    gap: 2,
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    fontWeight: "700",
  },
  empty: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.md,
  },
});
