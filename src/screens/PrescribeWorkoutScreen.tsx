import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon } from "@/src/components/AppIcon";
import { createCoachPrescription } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useExerciseStore } from "@/src/store/exerciseStore";
import { useI18n } from "@/src/i18n";
import { useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import { createId } from "@/src/utils";
import type { PrescriptionExerciseInput } from "@/src/types";

type ScheduledOption = "today" | "tomorrow" | "none";

interface DraftExercise {
  key: string;
  name: string;
  muscleGroup?: string | null;
  sets: string;
  reps: string;
  weight: string;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveScheduledDate(option: ScheduledOption): string | null {
  if (option === "none") return null;

  const date = new Date();
  if (option === "tomorrow") {
    date.setDate(date.getDate() + 1);
  }
  return toIsoDate(date);
}

export function PrescribeWorkoutScreen() {
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string }>();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const clientName = typeof params.clientName === "string" ? params.clientName : "";
  const { colors } = useTheme();
  const { t } = useI18n();
  const { exercises: library, ensureSeedExercises } = useExerciseStore();

  const [name, setName] = useState("");
  const [when, setWhen] = useState<ScheduledOption>("none");
  const [draft, setDraft] = useState<DraftExercise[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const online = hasSupabaseEnv();

  useEffect(() => {
    ensureSeedExercises();
  }, [ensureSeedExercises]);

  const addExercise = (exerciseName: string, muscleGroup?: string | null) => {
    setDraft((current) => [
      ...current,
      {
        key: createId("draft"),
        name: exerciseName,
        muscleGroup: muscleGroup ?? null,
        sets: "3",
        reps: "10",
        weight: "",
      },
    ]);
    setLibraryOpen(false);
  };

  const updateDraft = (key: string, partial: Partial<DraftExercise>) => {
    setDraft((current) => current.map((item) => (item.key === key ? { ...item, ...partial } : item)));
  };

  const removeDraft = (key: string) => {
    setDraft((current) => current.filter((item) => item.key !== key));
  };

  const handleSave = async () => {
    if (!online || saving) return;

    if (!name.trim()) {
      setError(t("prescribe.requiredName"));
      return;
    }

    if (draft.length === 0) {
      setError(t("prescribe.requiredExercises"));
      return;
    }

    setSaving(true);
    setError(null);

    const exercises: PrescriptionExerciseInput[] = draft.map((item) => ({
      name: item.name,
      muscleGroup: item.muscleGroup ?? null,
      sets: Math.max(1, parseInt(item.sets, 10) || 3),
      repsTarget: Math.max(1, parseInt(item.reps, 10) || 10),
      weightKg: item.weight.trim() ? Number(item.weight.replace(",", ".")) : null,
    }));

    const result = await createCoachPrescription({
      clientId,
      name: name.trim(),
      scheduledFor: resolveScheduledDate(when),
      exercises,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      Alert.alert(t("prescribe.saveErrorTitle"), result.error);
      return;
    }

    Alert.alert(t("prescribe.savedTitle"), t("prescribe.savedBody"), [
      { text: t("coach.close"), onPress: () => router.back() },
    ]);
  };

  const scheduledOptions: { value: ScheduledOption; label: string }[] = [
    { value: "today", label: t("prescribe.today") },
    { value: "tomorrow", label: t("prescribe.tomorrow") },
    { value: "none", label: t("prescribe.noDate") },
  ];

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>{t("prescribe.title")}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {clientName
                ? t("prescribe.subtitle", { client: clientName })
                : t("prescribe.subtitle", { client: t("coach.student") })}
            </Text>
          </View>

          {!online ? (
            <View style={[styles.infoCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
              <Text style={[styles.infoText, { color: colors.warning }]}>{t("prescribe.offline")}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>{t("prescribe.nameLabel")}</Text>
            <TextInput
              placeholder={t("prescribe.namePlaceholder")}
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>{t("prescribe.whenLabel")}</Text>
            <View style={styles.chipRow}>
              {scheduledOptions.map((option) => {
                const selected = when === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setWhen(option.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary + "18" : colors.surfaceAlt,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selected ? colors.primary : colors.foreground }]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>{t("prescribe.exercisesLabel")}</Text>
            {draft.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>{t("prescribe.emptyExercises")}</Text>
            ) : (
              <View style={styles.draftList}>
                {draft.map((item) => (
                  <View
                    key={item.key}
                    style={[styles.draftCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.draftHead}>
                      <Text numberOfLines={1} style={[styles.draftName, { color: colors.foreground }]}>
                        {item.name}
                      </Text>
                      <Pressable onPress={() => removeDraft(item.key)} hitSlop={10} style={styles.iconButton}>
                        <AppIcon name="Trash2" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                    <View style={styles.draftFields}>
                      <View style={styles.draftField}>
                        <Text style={[styles.miniLabel, { color: colors.muted }]}>{t("prescribe.sets")}</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={item.sets}
                          onChangeText={(value) => updateDraft(item.key, { sets: value.replace(/[^0-9]/g, "") })}
                          style={[styles.miniInput, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                        />
                      </View>
                      <View style={styles.draftField}>
                        <Text style={[styles.miniLabel, { color: colors.muted }]}>{t("prescribe.reps")}</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={item.reps}
                          onChangeText={(value) => updateDraft(item.key, { reps: value.replace(/[^0-9]/g, "") })}
                          style={[styles.miniInput, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                        />
                      </View>
                      <View style={styles.draftField}>
                        <Text style={[styles.miniLabel, { color: colors.muted }]}>{t("prescribe.weight")}</Text>
                        <TextInput
                          keyboardType="decimal-pad"
                          value={item.weight}
                          placeholder="0"
                          placeholderTextColor={colors.muted}
                          onChangeText={(value) => updateDraft(item.key, { weight: value.replace(/[^0-9.,]/g, "") })}
                          style={[styles.miniInput, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={() => setLibraryOpen((current) => !current)}
              style={[styles.addRow, { borderColor: colors.primary + "60" }]}
            >
              <AppIcon name="Plus" size={18} color={colors.primary} />
              <Text style={[styles.addText, { color: colors.primary }]}>{t("prescribe.addExercise")}</Text>
            </Pressable>

            {libraryOpen ? (
              <View style={[styles.library, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.libraryTitle, { color: colors.muted }]}>{t("prescribe.libraryTitle")}</Text>
                {library.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    onPress={() => addExercise(exercise.name, exercise.muscleGroup)}
                    style={[styles.libraryRow, { borderColor: colors.border }]}
                  >
                    <View style={styles.libraryInfo}>
                      <Text numberOfLines={1} style={[styles.libraryName, { color: colors.foreground }]}>
                        {exercise.name}
                      </Text>
                      <Text numberOfLines={1} style={[styles.libraryMeta, { color: colors.muted }]}>
                        {exercise.muscleGroup}
                      </Text>
                    </View>
                    <AppIcon name="Plus" size={18} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          ) : null}

          <AppButton
            label={saving ? t("prescribe.saving") : t("prescribe.save")}
            onPress={handleSave}
            variant="brand"
            disabled={!online || saving}
            loading={saving}
          />
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
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.bodySm,
    fontWeight: "700",
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "800",
  },
  empty: {
    fontSize: typography.bodySm,
    fontWeight: "600",
  },
  draftList: {
    gap: spacing.sm,
  },
  draftCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  draftHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  draftName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  iconButton: {
    padding: 4,
  },
  draftFields: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  draftField: {
    flex: 1,
    gap: 4,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  miniInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    textAlign: "center",
    fontSize: typography.bodySm,
    fontWeight: "700",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: spacing.md,
  },
  addText: {
    fontSize: 13,
    fontWeight: "800",
  },
  library: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 2,
  },
  libraryTitle: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  libraryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  libraryInfo: {
    flex: 1,
    gap: 2,
  },
  libraryName: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  libraryMeta: {
    fontSize: 11,
    fontWeight: "600",
  },
  error: {
    fontSize: typography.bodySm,
    fontWeight: "700",
    textAlign: "center",
  },
});
