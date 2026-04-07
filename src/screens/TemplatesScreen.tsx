import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { SectionCard } from "@/src/components/SectionCard";
import { WORKOUT_PRESETS } from "@/src/data/workoutPresets";
import { useTheme } from "@/src/hooks";
import { useExerciseStore } from "@/src/store/exerciseStore";
import { useTemplateStore } from "@/src/store/templateStore";
import { radius, spacing, typography } from "@/src/theme";
import type { Template, TemplateExercise } from "@/src/types";

interface TemplateFormData {
  name: string;
  exercises: TemplateExercise[];
}

const emptyForm: TemplateFormData = {
  name: "",
  exercises: [],
};

export function TemplatesScreen() {
  const params = useLocalSearchParams<{ mode?: string; presetId?: string }>();
  const { colors } = useTheme();
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTemplateStore();
  const { exercises: exerciseLibrary, ensureSeedExercises } = useExerciseStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>(emptyForm);
  const [addExerciseVisible, setAddExerciseVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [setsInput, setSetsInput] = useState("3");
  const [repsInput, setRepsInput] = useState("10");
  const [handledPrefillKey, setHandledPrefillKey] = useState<string | null>(null);

  const selectedPreset = useMemo(
    () => WORKOUT_PRESETS.find((preset) => preset.id === params.presetId) ?? null,
    [params.presetId],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openCreateFromPreset = (presetId: string) => {
    const preset = WORKOUT_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    setEditingId(null);
    setForm({
      name: `${preset.name} personalizado`,
      exercises: preset.exercises.map((exercise) => ({ ...exercise })),
    });
    setModalVisible(true);
  };

  const openEdit = (template: Template) => {
    setEditingId(template.id);
    setForm({ name: template.name, exercises: [...template.exercises] });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert("Campo obrigatório", "Informe o nome do treino.");
      return;
    }
    if (editingId) {
      updateTemplate(editingId, { name: form.name.trim(), exercises: form.exercises });
    } else {
      createTemplate(form.name.trim(), form.exercises);
    }
    setModalVisible(false);
    router.replace("/templates" as never);
  };

  const handleDelete = (template: Template) => {
    Alert.alert(
      "Excluir treino",
      `Deseja excluir "${template.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteTemplate(template.id) },
      ],
    );
  };

  const handleAddExercise = () => {
    const exercise = exerciseLibrary.find((ex) => ex.id === selectedExerciseId);
    if (!exercise) {
      Alert.alert("Selecione um exercício", "Escolha um exercício da lista.");
      return;
    }
    const sets = Math.max(1, parseInt(setsInput, 10) || 3);
    const reps = Math.max(1, parseInt(repsInput, 10) || 10);
    const entry: TemplateExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets,
      repsTarget: reps,
    };
    setForm((f) => ({ ...f, exercises: [...f.exercises, entry] }));
    setAddExerciseVisible(false);
    setSelectedExerciseId("");
    setSetsInput("3");
    setRepsInput("10");
  };

  const removeExercise = (index: number) => {
    setForm((f) => ({
      ...f,
      exercises: f.exercises.filter((_, i) => i !== index),
    }));
  };

  const updateExerciseConfig = (index: number, field: "sets" | "repsTarget", value: string) => {
    const parsed = Math.max(1, parseInt(value, 10) || 1);
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, [field]: parsed } : exercise,
      ),
    }));
  };

  useEffect(() => {
    ensureSeedExercises();
  }, [ensureSeedExercises]);

  useEffect(() => {
    const mode = params.mode;
    const prefillKey = `${mode ?? "default"}:${params.presetId ?? "none"}`;

    if (handledPrefillKey === prefillKey) {
      return;
    }

    if (mode === "create") {
      openCreate();
      setHandledPrefillKey(prefillKey);
      return;
    }

    if (mode === "duplicate" && selectedPreset) {
      openCreateFromPreset(selectedPreset.id);
      setHandledPrefillKey(prefillKey);
    }
  }, [handledPrefillKey, params.mode, params.presetId, selectedPreset]);

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Treinos personalizados</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Salve um treino seu, ajuste series e reps e reaproveite sem recomecar do zero.
          </Text>
        </View>

        <AppButton label="Montar do zero" onPress={openCreate} />

        <SectionCard
          title="Meus treinos"
          subtitle={`${templates.length} treino${templates.length !== 1 ? "s" : ""} salvo${templates.length !== 1 ? "s" : ""}`}
        >
          {templates.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>
              Nenhum treino salvo ainda. Crie o primeiro para repetir sua rotina sem recomecar do zero.
            </Text>
          ) : (
            templates.map((template) => (
              <View
                key={template.id}
                style={[
                  styles.item,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
              >
                <View style={styles.itemText}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                    {template.name}
                  </Text>
                  <Text style={[styles.itemMeta, { color: colors.muted }]}>
                    {template.exercises.length} exercício{template.exercises.length !== 1 ? "s" : ""}
                  </Text>
                  {template.exercises.slice(0, 3).map((ex, i) => (
                    <Text key={i} style={[styles.exerciseChip, { color: colors.muted }]}>
                      · {ex.exerciseName} — {ex.sets}×{ex.repsTarget}
                    </Text>
                  ))}
                  {template.exercises.length > 3 && (
                    <Text style={[styles.exerciseChip, { color: colors.muted }]}>
                      +{template.exercises.length - 3} mais
                    </Text>
                  )}
                </View>
                <View style={styles.itemActions}>
                  <AppButton
                    label="Editar"
                    onPress={() => openEdit(template)}
                    variant="ghost"
                    style={styles.actionBtn}
                  />
                  <AppButton
                    label="Excluir"
                    onPress={() => handleDelete(template)}
                    variant="ghost"
                    style={styles.actionBtn}
                  />
                </View>
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>

      {/* Template form modal */}
      <Modal
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <Pressable onPress={() => setModalVisible(false)} style={styles.overlay} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={24}
          style={styles.modalKeyboard}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingId ? "Editar treino" : selectedPreset ? "Duplicar e ajustar" : "Novo treino"}
            </Text>

            <TextInput
              autoCapitalize="words"
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Nome do treino *"
              placeholderTextColor={colors.muted}
              style={[inputStyle, { marginBottom: spacing.md }]}
              value={form.name}
            />

            <Text style={[styles.label, { color: colors.muted, marginBottom: spacing.sm }]}>
              Exercícios ({form.exercises.length})
            </Text>

            {form.exercises.map((ex, index) => (
              <View
                key={index}
                style={[
                  styles.exerciseRow,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseRowName, { color: colors.foreground }]}>
                    {ex.exerciseName}
                  </Text>
                  <Text style={[styles.exerciseRowMeta, { color: colors.muted }]}>
                    {ex.sets} séries × {ex.repsTarget} reps
                  </Text>
                  <View style={styles.exerciseAdjustRow}>
                    <View style={styles.exerciseAdjustField}>
                      <Text style={[styles.adjustLabel, { color: colors.muted }]}>Séries</Text>
                      <TextInput
                        keyboardType="number-pad"
                        onChangeText={(value) => updateExerciseConfig(index, "sets", value)}
                        style={[styles.miniInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                        value={String(ex.sets)}
                      />
                    </View>
                    <View style={styles.exerciseAdjustField}>
                      <Text style={[styles.adjustLabel, { color: colors.muted }]}>Reps</Text>
                      <TextInput
                        keyboardType="number-pad"
                        onChangeText={(value) => updateExerciseConfig(index, "repsTarget", value)}
                        style={[styles.miniInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                        value={String(ex.repsTarget)}
                      />
                    </View>
                  </View>
                </View>
                <AppButton
                  label="×"
                  onPress={() => removeExercise(index)}
                  variant="ghost"
                  style={styles.removeBtn}
                />
              </View>
            ))}

            <AppButton
              label="+ Adicionar exercício"
              onPress={() => setAddExerciseVisible(true)}
              variant="secondary"
              style={{ marginTop: spacing.sm, marginBottom: spacing.md }}
            />

            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                onPress={() => {
                  setModalVisible(false);
                  router.replace("/templates" as never);
                }}
                variant="secondary"
                style={styles.modalBtn}
              />
              <AppButton label={editingId ? "Salvar" : "Criar"} onPress={handleSave} style={styles.modalBtn} />
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add exercise picker modal */}
      <Modal
        animationType="slide"
        onRequestClose={() => setAddExerciseVisible(false)}
        transparent
        visible={addExerciseVisible}
      >
        <Pressable onPress={() => setAddExerciseVisible(false)} style={styles.overlay} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={24}
          style={styles.modalKeyboard}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Selecionar exercício
            </Text>

            {exerciseLibrary.length === 0 ? (
              <View style={styles.emptyLibraryState}>
                <Text style={[styles.empty, { color: colors.muted }]}>
                  Sua biblioteca minima ainda nao apareceu. Abra `Exercicios` para criar mais itens ou use o seed inicial.
                </Text>
                <AppButton
                  label="Abrir exercicios"
                  onPress={() => {
                    setAddExerciseVisible(false);
                    router.push("/exercises" as never);
                  }}
                  variant="secondary"
                />
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 200 }}
                showsVerticalScrollIndicator={false}
              >
                {exerciseLibrary.map((ex) => (
                  <Pressable
                    key={ex.id}
                    onPress={() => setSelectedExerciseId(ex.id)}
                    style={[
                      styles.exercisePickerItem,
                      {
                        backgroundColor:
                          selectedExerciseId === ex.id ? colors.primary : colors.surfaceAlt,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.exercisePickerText,
                        {
                          color:
                            selectedExerciseId === ex.id ? colors.background : colors.foreground,
                        },
                      ]}
                    >
                      {ex.name}
                    </Text>
                    <Text
                      style={[
                        styles.exercisePickerMeta,
                        {
                          color:
                            selectedExerciseId === ex.id ? colors.background : colors.muted,
                        },
                      ]}
                    >
                      {ex.muscleGroup}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={styles.setsRepsRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted, marginBottom: spacing.xs }]}>
                  Séries
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={setSetsInput}
                  style={inputStyle}
                  value={setsInput}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.muted, marginBottom: spacing.xs }]}>
                  Reps alvo
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={setRepsInput}
                  style={inputStyle}
                  value={repsInput}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                onPress={() => setAddExerciseVisible(false)}
                variant="secondary"
                style={styles.modalBtn}
              />
              <AppButton label="Adicionar" onPress={handleAddExercise} style={styles.modalBtn} />
            </View>
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
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  empty: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  item: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemText: {
    gap: spacing.xxs,
  },
  itemTitle: {
    fontSize: typography.section,
    fontWeight: "800",
  },
  itemMeta: {
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: "600",
  },
  exerciseChip: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: "85%",
  },
  modalKeyboard: {
    justifyContent: "flex-end",
  },
  modalTitle: {
    fontSize: typography.section,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  exerciseRowName: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  exerciseRowMeta: {
    fontSize: typography.caption,
  },
  exerciseAdjustRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  exerciseAdjustField: {
    flex: 1,
    gap: 6,
  },
  adjustLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  miniInput: {
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
  },
  removeBtn: {
    minHeight: 40,
    minWidth: 40,
    paddingHorizontal: spacing.sm,
  },
  exercisePickerItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exercisePickerText: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  exercisePickerMeta: {
    fontSize: typography.caption,
  },
  setsRepsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
  emptyLibraryState: {
    gap: spacing.md,
  },
});
