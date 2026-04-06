import { useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { RestTimer } from "@/src/components/RestTimer";
import { AppIcon } from "@/src/components/AppIcon";
import { FocusMode } from "@/src/components/FocusMode";
import { createExerciseEntry, createExerciseSet, summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { useGamificationStore } from "@/src/store/gamificationStore";
import { useTemplateStore } from "@/src/store/templateStore";
import { radius, spacing, shadows } from "@/src/theme";
import type { ExerciseEntry, ExerciseSet } from "@/src/types";
import { createId, formatVolume } from "@/src/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";
import { VoiceCoach } from "@/src/services/voiceCoach";

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
          onPress={() => {
            Haptics.selectionAsync();
            setCompleted((v) => !v);
          }}
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
  const { workouts, activeWorkoutId, createWorkout, createFromTemplate, removeExercise, addSet, updateSet, completeWorkout } = useWorkout();
  const { templates } = useTemplateStore();
  const recordActivity = useGamificationStore((state) => state.recordActivity);
  const addXP = useGamificationStore((state) => state.addXP);
  const streak = useGamificationStore((state) => state.streak);

  const workout = workouts.find((w) => w.id === activeWorkoutId) ?? null;
  const summary = workout ? summarizeWorkout(workout) : null;

  const [setFormVisible, setSetFormVisible] = useState(false);
  const [editingSet, setEditingSet] = useState<ExerciseSet | null>(null);
  const [targetExerciseId, setTargetExerciseId] = useState<string | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [focusModeVisible, setFocusModeVisible] = useState(false);
  const [activeExercise, setActiveExercise] = useState<ExerciseEntry | null>(null);
  const focusModeSet = activeExercise?.sets.find((setEntry) => !setEntry.completed) ?? activeExercise?.sets[0] ?? null;

  const prScale = useSharedValue(0);
  const prOpacity = useSharedValue(0);

  const triggerPRAnimation = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    VoiceCoach.speak("Novo recorde pessoal atingido! Parabéns!");
    trackEvent(ANALYTICS_EVENTS.PR_ACHIEVED, { workout_id: activeWorkoutId });
    prOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 500 })
    );
    prScale.value = withSequence(
      withSpring(1.2),
      withSpring(1),
      withTiming(0, { duration: 500 })
    );
  }, [activeWorkoutId, prOpacity, prScale]);

  const handleToggleSetCompleted = (exerciseId: string, setEntry: ExerciseSet, index: number) => {
    if (!workout) return;
    const nextCompleted = !setEntry.completed;
    
    if (nextCompleted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowTimer(true);
      
      // Voice Coach Announcement
      VoiceCoach.announceSetComplete(index + 1, setEntry.weightKg, setEntry.reps);
      VoiceCoach.announceRestStart(60); // Mocking 60s rest
      
      const current1RM = summary?.bestOneRM ?? 0;
      const set1RM = setEntry.weightKg * (1 + setEntry.reps / 30);
      if (set1RM > current1RM && current1RM > 0) {
        triggerPRAnimation();
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    updateSet(workout.id, exerciseId, setEntry.id, { completed: nextCompleted });
  };

  const prAnimatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
    opacity: prOpacity.value,
    transform: [{ scale: prScale.value }],
    zIndex: 1000,
  }));

  if (!workout) {
    return (
      <ScreenContainer className="px-5">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Treino</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Monte um treino do zero ou comece por um modelo pronto.</Text>
        </View>
        <AppButton
          label="Novo treino em branco"
          onPress={() => {
            createWorkout("Treino do dia");
          }}
          variant="brand"
        />
        <View style={{ marginTop: spacing.xl }}>
           <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Modelos prontos</Text>
           {templates.map((t) => (
              <Pressable key={t.id} onPress={() => {
                const exercises: ExerciseEntry[] = t.exercises.map((te) =>
                  createExerciseEntry({
                    id: createId("exercise"),
                    name: te.exerciseName,
                    muscleGroup: te.muscleGroup,
                    sets: Array.from({ length: te.sets }, () =>
                      createExerciseSet({ reps: te.repsTarget, weightKg: te.weightKg ?? 0, completed: false }),
                    ),
                  }),
                );
                createFromTemplate(t.name, exercises);
              }} style={[styles.templateItem, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
                <Text style={[styles.templateName, { color: colors.foreground }]}>{t.name}</Text>
                <Text style={[styles.templateMeta, { color: colors.muted }]}>
                  {t.exercises.length} exercicio{t.exercises.length !== 1 ? "s" : ""} para voce começar mais rapido
                </Text>
              </Pressable>
           ))}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5">
      <Animated.View style={prAnimatedStyle} pointerEvents="none">
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>🏆 Novo recorde!</Text>
      </Animated.View>

      <FlashList
        data={workout.exercises}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={[styles.title, { color: colors.foreground }]}>{workout.name}</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  Marque as series concluidas e acompanhe o progresso do treino em tempo real.
                </Text>
              </View>
              <Pressable 
                onPress={() => {
                  if (workout.exercises.length > 0) {
                    setActiveExercise(workout.exercises[0]);
                    setFocusModeVisible(true);
                  }
                }}
                style={[styles.focusBtn, { backgroundColor: colors.surfaceAlt }]}
              >
                <AppIcon name="Maximize2" size={20} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.summaryRow}>
              {[
                { label: "Volume", value: formatVolume(summary?.totalVolume ?? 0) },
                { label: "1RM", value: `${(summary?.bestOneRM ?? 0).toFixed(1)} kg` },
                { label: "Series", value: String(summary?.setCount ?? 0) },
              ].map((m) => (
                <View key={m.label} style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>{m.label}</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{m.value}</Text>
                </View>
              ))}
            </View>
            {showTimer && <RestTimer onFinish={() => {
              VoiceCoach.announceRestComplete();
              setShowTimer(false);
            }} />}
          </View>
        )}
        renderItem={({ item: exercise }) => (
          <Animated.View entering={FadeInDown} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>{exercise.name}</Text>
                <Text style={[styles.exerciseMeta, { color: colors.muted }]}>{exercise.muscleGroup}</Text>
              </View>
              <Pressable onPress={() => removeExercise(workout.id, exercise.id)}>
                <AppIcon name="Trash2" size={18} color={colors.error} />
              </Pressable>
            </View>

            <View style={styles.setsList}>
              {exercise.sets.map((setEntry, index) => (
                <Pressable
                  key={setEntry.id}
                  onPress={() => handleToggleSetCompleted(exercise.id, setEntry, index)}
                  style={[styles.setRow, { borderBottomColor: colors.border + "50" }]}
                >
                  <View style={styles.setInfo}>
                    <Text style={[styles.setNumber, { color: colors.muted }]}>{index + 1}</Text>
                    <Text style={[styles.setData, { color: colors.foreground }]}>
                      {setEntry.reps} reps · {setEntry.weightKg} kg
                    </Text>
                  </View>
                  <View style={[styles.checkCircle, { borderColor: setEntry.completed ? colors.success : colors.border, backgroundColor: setEntry.completed ? colors.success : "transparent" }]}>
                    {setEntry.completed && <AppIcon name="Check" size={14} color="#fff" />}
                  </View>
                </Pressable>
              ))}
            </View>
            
            <AppButton 
              label="Adicionar série" 
              onPress={() => {
                setTargetExerciseId(exercise.id);
                setEditingSet(null);
                setSetFormVisible(true);
              }} 
              variant="ghost" 
              style={{ marginTop: spacing.md }}
            />
          </Animated.View>
        )}
        ListFooterComponent={() => (
          <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            <AppButton label="Finalizar treino" onPress={() => {
              const streakBonus = streak > 0 ? 20 : 0;
              completeWorkout(workout.id);
              // XP simples para o MVP: base fixa por treino e bonus se o usuario ja vinha em streak.
              recordActivity("workout", 1);
              if (streakBonus > 0) {
                addXP(streakBonus, { source: "workout" });
              }
              router.replace("/statistics?source=workout_complete" as never);
            }} variant="brand" />
            <AppButton label="Adicionar exercicio" onPress={() => router.push("/exercises")} variant="secondary" />
          </View>
        )}
      />

      <SetFormModal
        visible={setFormVisible}
        editingSet={editingSet}
        onClose={() => setSetFormVisible(false)}
        onSave={(reps, weight, completed) => {
          if (targetExerciseId) {
            addSet(workout.id, targetExerciseId, createExerciseSet({ reps, weightKg: weight, completed }));
          }
        }}
      />

      {focusModeVisible && activeExercise && focusModeSet && (
        <FocusMode 
          isVisible={focusModeVisible}
          onClose={() => setFocusModeVisible(false)} 
          exerciseName={activeExercise.name}
          currentSet={activeExercise.sets.findIndex((setEntry) => setEntry.id === focusModeSet.id) + 1}
          totalSets={activeExercise.sets.length}
          weight={focusModeSet.weightKg}
          reps={focusModeSet.reps}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  focusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  exerciseCard: {
    padding: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  exerciseMeta: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  setsList: {
    gap: 0,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  setInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "800",
    width: 20,
  },
  setData: {
    fontSize: 15,
    fontWeight: "700",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  templateItem: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "800",
  },
  templateMeta: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: 40,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontSize: 18,
    fontWeight: "700",
  },
  completedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
