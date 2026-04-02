import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { createExerciseEntry, createExerciseSet, summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { useExerciseStore } from "@/src/store/exerciseStore";
import { useTemplateStore } from "@/src/store/templateStore";
import { radius, spacing, typography } from "@/src/theme";
import type { ExerciseEntry, ExerciseSet } from "@/src/types";
import { createId, formatVolume } from "@/src/utils";

interface SetFormModalProps {
  visible: boolean;
  editingSet: ExerciseSet | null;
  onClose: () => void;
  onSave: (reps: number, weightKg: number, completed: boolean) => void;
}

function SetFormModal({ visible, editingSet, onClose, onSave }: SetFormModalProps) {
  const { colors } = useTheme();
  const [reps, setReps] = useState(String(editingSet?.reps ?? 10));
  const [weight, setWeight] = useState(String(editingSet?.weightKg ?? 0));
  const [completed, setCompleted] = useState(editingSet?.completed ?? true);

  const handleSave = () => {
    const r = Math.max(0, parseInt(reps, 10) || 0);
    const w = Math.max(0, parseFloat(weight) || 0);
    onSave(r, w, completed);
    onClose();
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay} />
      <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.modalTitle, { color: colors.foreground }]}>
          {editingSet ? "Editar série" : "Nova série"}
        </Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.muted }]}>Repetições</Text>
            <TextInput keyboardType="number-pad" onChangeText={setReps} style={inputStyle} value={reps} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.muted }]}>Carga (kg)</Text>
            <TextInput keyboardType="decimal-pad" onChangeText={setWeight} style={inputStyle} value={weight} />
          </View>
        </View>
        <Pressable
          onPress={() => setCompleted((v) => !v)}
          style={[styles.completedToggle, { backgroundColor: completed ? colors.success + "22" : colors.surfaceAlt, borderColor: completed ? colors.success : colors.border }]}
        >
          <Text style={[styles.completedText, { color: completed ? colors.success : colors.muted }]}>
            {completed ? "✓ Série concluída" : "Marcar como concluída"}
          </Text>
        </Pressable>
        <View style={styles.row}>
          <AppButton label="Cancelar" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
          <AppButton label="Salvar" onPress={handleSave} style={{ flex: 1 }} />
        </View>
      </View>
    </Modal>
  );
}

export function WorkoutScreen() {
  const { colors } = useTheme();
  const { workouts, activeWorkoutId, createWorkout, createFromTemplate, addExercise, removeExercise, addSet, updateSet, removeSet, completeWorkout } = useWorkout();
  const { exercises: exerciseLibrary } = useExerciseStore();
  const { templates } = useTemplateStore();

  const workout = workouts.find((w) => w.id === activeWorkoutId) ?? null;
  const summary = workout ? summarizeWorkout(workout) : null;

  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [setFormVisible, setSetFormVisible] = useState(false);
  const [editingSet, setEditingSet] = useState<ExerciseSet | null>(null);
  const [targetExerciseId, setTargetExerciseId] = useState<string | null>(null);
  const [selectedExerciseLibId, setSelectedExerciseLibId] = useState<string>("");

  const handleStartFromTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const exercises: ExerciseEntry[] = template.exercises.map((te) =>
      createExerciseEntry({
        id: createId("exercise"),
        name: te.exerciseName,
        muscleGroup: te.muscleGroup,
        sets: Array.from({ length: te.sets }, () =>
          createExerciseSet({ reps: te.repsTarget, weightKg: te.weightKg ?? 0, completed: false }),
        ),
      }),
    );
    createFromTemplate(template.name, exercises);
  };

  const handleAddExerciseFromLibrary = () => {
    if (!workout) return;
    const ex = exerciseLibrary.find((e) => e.id === selectedExerciseLibId);
    if (!ex) { Alert.alert("Selecione um exercício"); return; }
    addExercise(workout.id, createExerciseEntry({ id: createId("exercise"), name: ex.name, muscleGroup: ex.muscleGroup, sets: [createExerciseSet({ reps: 10, weightKg: 0, completed: false })] }));
    setExercisePickerVisible(false);
    setSelectedExerciseLibId("");
  };

  const handleAddQuickExercise = () => {
    if (!workout) return;
    addExercise(workout.id, createExerciseEntry({ id: createId("exercise"), name: "Novo exercício", muscleGroup: "Geral", sets: [createExerciseSet({ reps: 10, weightKg: 0, completed: false })] }));
  };

  const openAddSet = (exerciseId: string) => { setTargetExerciseId(exerciseId); setEditingSet(null); setSetFormVisible(true); };
  const openEditSet = (exerciseId: string, setEntry: ExerciseSet) => { setTargetExerciseId(exerciseId); setEditingSet(setEntry); setSetFormVisible(true); };

  const handleSaveSet = (reps: number, weightKg: number, completed: boolean) => {
    if (!workout || !targetExerciseId) return;
    if (editingSet) {
      updateSet(workout.id, targetExerciseId, editingSet.id, { reps, weightKg, completed });
    } else {
      addSet(workout.id, targetExerciseId, createExerciseSet({ reps, weightKg, completed }));
    }
  };

  const handleToggleSetCompleted = (exerciseId: string, setEntry: ExerciseSet) => {
    if (!workout) return;
    updateSet(workout.id, exerciseId, setEntry.id, { completed: !setEntry.completed });
  };

  const handleFinish = () => {
    if (!workout) return;
    Alert.alert("Concluir treino", "Deseja finalizar e salvar esta sessão no histórico?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Concluir", onPress: () => { completeWorkout(workout.id); router.replace("/"); } },
    ]);
  };

  if (!workout) {
    return (
      <ScreenContainer className="px-5 py-5">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Treino</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Inicie uma nova sessão em branco ou a partir de um template.</Text>
          </View>
          <AppButton label="Novo treino em branco" onPress={() => createWorkout("Treino do dia")} />
          {templates.length > 0 && (
            <SectionCard title="Iniciar de template" subtitle="Toque para iniciar a sessão.">
              {templates.map((t) => (
                <Pressable key={t.id} onPress={() => handleStartFromTemplate(t.id)} style={[styles.templateItem, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={[styles.templateName, { color: colors.foreground }]}>{t.name}</Text>
                  <Text style={[styles.templateMeta, { color: colors.muted }]}>{t.exercises.length} exercício{t.exercises.length !== 1 ? "s" : ""}</Text>
                </Pressable>
              ))}
            </SectionCard>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{workout.name}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{workout.date} · Sessão em andamento</Text>
        </View>

        <View style={styles.summaryRow}>
          {[
            { label: "Volume", value: formatVolume(summary?.totalVolume ?? 0) },
            { label: "1RM", value: `${(summary?.bestOneRM ?? 0).toFixed(1)} kg` },
            { label: "Séries", value: String(summary?.setCount ?? 0) },
          ].map((m) => (
            <View key={m.label} style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>{m.label}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{m.value}</Text>
            </View>
          ))}
        </View>

        {workout.exercises.length === 0 && (
          <Text style={[styles.empty, { color: colors.muted }]}>Nenhum exercício ainda. Adicione abaixo.</Text>
        )}

        {workout.exercises.map((exercise) => (
          <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>{exercise.name}</Text>
                <Text style={[styles.exerciseMeta, { color: colors.muted }]}>{exercise.muscleGroup}</Text>
              </View>
              <AppButton label="Remover" onPress={() => removeExercise(workout.id, exercise.id)} variant="ghost" style={styles.removeBtn} />
            </View>

            {exercise.sets.map((setEntry, index) => (
              <Pressable
                key={setEntry.id}
                onLongPress={() => openEditSet(exercise.id, setEntry)}
                onPress={() => handleToggleSetCompleted(exercise.id, setEntry)}
                style={[styles.setRow, { backgroundColor: setEntry.completed ? colors.success + "18" : colors.surfaceAlt, borderColor: setEntry.completed ? colors.success : colors.border }]}
              >
                <Text style={[styles.setIndex, { color: colors.muted }]}>{index + 1}</Text>
                <Text style={[styles.setValues, { color: colors.foreground }]}>{setEntry.reps} reps × {setEntry.weightKg} kg</Text>
                <Text style={[styles.setStatus, { color: setEntry.completed ? colors.success : colors.muted }]}>{setEntry.completed ? "✓" : "○"}</Text>
                <AppButton label="Editar" onPress={() => openEditSet(exercise.id, setEntry)} variant="ghost" style={styles.editSetBtn} />
                <AppButton label="×" onPress={() => removeSet(workout.id, exercise.id, setEntry.id)} variant="ghost" style={styles.editSetBtn} />
              </Pressable>
            ))}

            <AppButton label="+ Série" onPress={() => openAddSet(exercise.id)} variant="secondary" style={styles.addSetBtn} />
          </View>
        ))}

        <View style={styles.addExerciseRow}>
          {exerciseLibrary.length > 0 && (
            <AppButton label="Do banco" onPress={() => setExercisePickerVisible(true)} variant="secondary" style={{ flex: 1 }} />
          )}
          <AppButton label="Exercício rápido" onPress={handleAddQuickExercise} variant="secondary" style={{ flex: 1 }} />
        </View>

        <AppButton label="Concluir treino" onPress={handleFinish} />
      </ScrollView>

      <SetFormModal editingSet={editingSet} onClose={() => setSetFormVisible(false)} onSave={handleSaveSet} visible={setFormVisible} />

      <Modal animationType="slide" onRequestClose={() => setExercisePickerVisible(false)} transparent visible={exercisePickerVisible}>
        <Pressable onPress={() => setExercisePickerVisible(false)} style={styles.overlay} />
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Selecionar exercício</Text>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {exerciseLibrary.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => setSelectedExerciseLibId(ex.id)}
                style={[styles.exercisePickerItem, { backgroundColor: selectedExerciseLibId === ex.id ? colors.primary : colors.surfaceAlt, borderColor: colors.border }]}
              >
                <Text style={[styles.exercisePickerText, { color: selectedExerciseLibId === ex.id ? colors.background : colors.foreground }]}>{ex.name}</Text>
                <Text style={[styles.exercisePickerMeta, { color: selectedExerciseLibId === ex.id ? colors.background : colors.muted }]}>{ex.muscleGroup}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.row}>
            <AppButton label="Cancelar" onPress={() => setExercisePickerVisible(false)} variant="secondary" style={{ flex: 1 }} />
            <AppButton label="Adicionar" onPress={handleAddExerciseFromLibrary} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.sm },
  title: { fontSize: typography.hero, fontWeight: "900", lineHeight: 36 },
  subtitle: { fontSize: typography.body, lineHeight: 22 },
  empty: { fontSize: typography.body, lineHeight: 22 },
  summaryRow: { flexDirection: "row", gap: spacing.sm },
  summaryBox: { flex: 1, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.xxs },
  summaryLabel: { fontSize: typography.caption, fontWeight: "700", textTransform: "uppercase" },
  summaryValue: { fontSize: typography.section, fontWeight: "900" },
  exerciseCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  exerciseHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  exerciseTitle: { fontSize: typography.section, fontWeight: "800" },
  exerciseMeta: { fontSize: typography.caption, fontWeight: "600" },
  removeBtn: { minHeight: 36, paddingHorizontal: spacing.sm },
  setRow: { flexDirection: "row", alignItems: "center", borderRadius: radius.md, borderWidth: 1, padding: spacing.sm, gap: spacing.sm },
  setIndex: { fontSize: typography.caption, fontWeight: "700", width: 20, textAlign: "center" },
  setValues: { flex: 1, fontSize: typography.body, fontWeight: "600" },
  setStatus: { fontSize: typography.section, fontWeight: "900", width: 24, textAlign: "center" },
  editSetBtn: { minHeight: 36, paddingHorizontal: spacing.xs },
  addSetBtn: { minHeight: 40 },
  addExerciseRow: { flexDirection: "row", gap: spacing.md },
  templateItem: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.xxs },
  templateName: { fontSize: typography.section, fontWeight: "800" },
  templateMeta: { fontSize: typography.caption },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, padding: spacing.lg, gap: spacing.md, maxHeight: "80%" },
  modalTitle: { fontSize: typography.section, fontWeight: "900" },
  input: { minHeight: 52, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md, fontSize: typography.body },
  label: { fontSize: typography.caption, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: spacing.xs },
  completedToggle: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, alignItems: "center" },
  completedText: { fontSize: typography.body, fontWeight: "700" },
  row: { flexDirection: "row", gap: spacing.md },
  exercisePickerItem: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  exercisePickerText: { fontSize: typography.body, fontWeight: "700" },
  exercisePickerMeta: { fontSize: typography.caption },
});
