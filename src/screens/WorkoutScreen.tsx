import { useState, useCallback, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { createExerciseSet, summarizeWorkout } from "@/src/domain/workout";
import { buildWorkoutExercises, WORKOUT_PRESETS, type WorkoutPreset } from "@/src/data/workoutPresets";
import { useTabBarInset, useTheme, useWorkout } from "@/src/hooks";
import { useGamificationStore } from "@/src/store/gamificationStore";
import { useExerciseStore } from "@/src/store/exerciseStore";
import { useTemplateStore } from "@/src/store/templateStore";
import { radius, spacing, shadows } from "@/src/theme";
import type { ExerciseEntry, ExerciseSet, TemplateExercise } from "@/src/types";
import { formatVolume } from "@/src/utils";
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
  const insets = useSafeAreaInsets();
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
      <View
        style={[
          styles.modalContent,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
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
  const { workouts, activeWorkoutId, createFromTemplate, removeExercise, addSet, updateSet, completeWorkout } = useWorkout();
  const { templates } = useTemplateStore();
  const { exercises, ensureSeedExercises } = useExerciseStore();
  const { contentPaddingBottom, scrollIndicatorBottom, tabBarHeight } = useTabBarInset();
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
  const [libraryMode, setLibraryMode] = useState<"ready" | "custom">("ready");
  const focusModeSet = activeExercise?.sets.find((setEntry) => !setEntry.completed) ?? activeExercise?.sets[0] ?? null;
  const hasExerciseLibrary = exercises.length > 0;

  useEffect(() => {
    ensureSeedExercises();
  }, [ensureSeedExercises]);

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

  const startPresetWorkout = (preset: WorkoutPreset) => {
    const draft = createFromTemplate(preset.name, buildWorkoutExercises(preset.exercises));
    trackEvent(ANALYTICS_EVENTS.WORKOUT_STARTED, {
      workout_id: draft.id,
      source: "ready_workout",
      preset_id: preset.id,
      workout_name: preset.name,
      exercise_count: preset.exercises.length,
    });
  };

  const savePresetAsCustom = (preset: WorkoutPreset) => {
    router.push({ pathname: "/templates", params: { mode: "duplicate", presetId: preset.id } } as never);
  };

  const startCustomWorkout = (name: string, exercises: TemplateExercise[]) => {
    const draft = createFromTemplate(name, buildWorkoutExercises(exercises));
    trackEvent(ANALYTICS_EVENTS.WORKOUT_STARTED, {
      workout_id: draft.id,
      source: "custom_workout",
      workout_name: name,
      exercise_count: exercises.length,
    });
  };

  if (!workout) {
    return (
      <ScreenContainer className="px-5">
        <ScrollView
          contentContainerStyle={[styles.emptyContent, { paddingBottom: contentPaddingBottom }]}
          keyboardShouldPersistTaps="handled"
          scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Treino</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Escolha um treino pronto para começar agora ou monte sua biblioteca personalizada.
            </Text>
          </View>

          <View style={[styles.libraryToggle, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setLibraryMode("ready")}
              style={[
                styles.libraryToggleOption,
                {
                  backgroundColor: libraryMode === "ready" ? colors.primary : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.libraryToggleText,
                  { color: libraryMode === "ready" ? "#fff" : colors.foreground },
                ]}
              >
                Treinos prontos
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLibraryMode("custom")}
              style={[
                styles.libraryToggleOption,
                {
                  backgroundColor: libraryMode === "custom" ? colors.primary : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.libraryToggleText,
                  { color: libraryMode === "custom" ? "#fff" : colors.foreground },
                ]}
              >
                Personalizados
              </Text>
            </Pressable>
          </View>

          {libraryMode === "ready" ? (
            <View style={styles.librarySection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Treinos prontos</Text>
              <Text style={[styles.sectionDescription, { color: colors.muted }]}>
                Planos base curados para tirar o app do vazio e gerar o primeiro aha sem depender de IA.
              </Text>
              {WORKOUT_PRESETS.map((preset) => (
                <View
                  key={preset.id}
                  style={[styles.presetCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
                >
                  <View style={styles.presetHeader}>
                    <View style={styles.presetTextBlock}>
                      <Text style={[styles.presetTitle, { color: colors.foreground }]}>{preset.name}</Text>
                      <Text style={[styles.presetDescription, { color: colors.muted }]}>
                        {preset.description}
                      </Text>
                    </View>
                    <View style={[styles.presetCountBadge, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.presetCountText, { color: colors.primary }]}>
                        {preset.exercises.length} exercicios
                      </Text>
                    </View>
                  </View>
                  <View style={styles.presetMetaRow}>
                    <View style={[styles.metaPill, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.metaPillText, { color: colors.foreground }]}>{preset.frequencyLabel}</Text>
                    </View>
                    <View style={[styles.metaPill, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.metaPillText, { color: colors.foreground }]}>{preset.durationLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActionStack}>
                    <AppButton label="Comecar agora" onPress={() => startPresetWorkout(preset)} variant="brand" />
                    <AppButton
                      label="Salvar como personalizado"
                      onPress={() => savePresetAsCustom(preset)}
                      variant="secondary"
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.librarySection}>
              <View
                style={[
                  styles.customHubCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  shadows.card,
                ]}
              >
                <Text style={[styles.emptyTemplateTitle, { color: colors.foreground }]}>
                  Treinos personalizados
                </Text>
                <Text style={[styles.emptyTemplateText, { color: colors.muted }]}>
                  Monte seu treino do zero e guarde uma estrutura propria sem abrir varios caminhos ao mesmo tempo.
                </Text>
                <View style={styles.emptyTemplateActions}>
                  <AppButton
                    label="Montar do zero"
                    onPress={() => router.push({ pathname: "/templates", params: { mode: "create" } } as never)}
                    variant="brand"
                  />
                  {!hasExerciseLibrary ? (
                    <AppButton
                      label="Criar exercicio"
                      onPress={() => router.push("/exercises" as never)}
                      variant="secondary"
                    />
                  ) : null}
                </View>
                <Text style={[styles.customHelperText, { color: colors.muted }]}>
                  Para adaptar um treino pronto, use `Salvar como personalizado` na aba `Treinos prontos`.
                </Text>
              </View>

              <View style={styles.customSectionHeader}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Meus treinos</Text>
                  <AppButton
                    label="Historico"
                    onPress={() => router.push("/history" as never)}
                    variant="ghost"
                    style={styles.inlineGhostButton}
                  />
                </View>
                <Text style={[styles.sectionDescription, { color: colors.muted }]}>
                  {templates.length === 0
                    ? "Ainda nao ha treinos salvos. Monte do zero ou salve um treino pronto como personalizado."
                    : `${templates.length} treino${templates.length !== 1 ? "s" : ""} salvo${templates.length !== 1 ? "s" : ""} para reutilizar quando quiser.`}
                </Text>
              </View>
              {templates.length === 0 ? (
                <View
                  style={[
                    styles.emptyTemplateState,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    shadows.card,
                  ]}
                >
                  <Text style={[styles.emptyTemplateTitle, { color: colors.foreground }]}>
                    Nenhum treino personalizado ainda
                  </Text>
                  <Text style={[styles.emptyTemplateText, { color: colors.muted }]}>
                    Use `Montar do zero` para criar o primeiro ou volte para `Treinos prontos` e salve um preset como personalizado.
                  </Text>
                  <View style={styles.emptyTemplateActions}>
                    <AppButton
                      label="Montar do zero"
                      onPress={() => router.push({ pathname: "/templates", params: { mode: "create" } } as never)}
                      variant="brand"
                    />
                    <AppButton
                      label="Ver treinos prontos"
                      onPress={() => setLibraryMode("ready")}
                      variant="secondary"
                    />
                  </View>
                </View>
              ) : (
                templates.map((template) => (
                  <View
                    key={template.id}
                    style={[styles.templateItem, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
                  >
                    <Text style={[styles.templateName, { color: colors.foreground }]}>{template.name}</Text>
                    <Text style={[styles.templateMeta, { color: colors.muted }]}>
                      {template.exercises.length} exercicio{template.exercises.length !== 1 ? "s" : ""} pronto{template.exercises.length !== 1 ? "s" : ""} para iniciar ou editar
                    </Text>
                    <View style={styles.cardActionStack}>
                      <AppButton
                        label="Comecar agora"
                        onPress={() => startCustomWorkout(template.name, template.exercises)}
                        variant="brand"
                      />
                      <AppButton
                        label="Editar treino"
                        onPress={() => router.push("/templates" as never)}
                        variant="secondary"
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
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
        contentContainerStyle={[styles.workoutListContent, { paddingBottom: contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
        contentInset={{ bottom: tabBarHeight }}
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
              trackEvent(ANALYTICS_EVENTS.WORKOUT_COMPLETED, {
                workout_id: workout.id,
                workout_name: workout.name,
                exercise_count: workout.exercises.length,
                set_count: summary?.setCount ?? 0,
                total_volume: summary?.totalVolume ?? 0,
              });
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
  emptyContent: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  workoutListContent: {
    paddingBottom: spacing.xxxl,
  },
  libraryToggle: {
    flexDirection: "row",
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  libraryToggleOption: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
  },
  libraryToggleText: {
    fontSize: 13,
    fontWeight: "800",
  },
  librarySection: {
    gap: spacing.lg,
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
  emptyTemplateState: {
    marginTop: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTemplateTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  emptyTemplateText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  emptyTemplateActions: {
    gap: spacing.sm,
  },
  customHelperText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
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
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: -spacing.sm,
  },
  customSectionHeader: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  inlineGhostButton: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  presetCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  presetHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  presetTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  presetTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  presetDescription: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  presetCountBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  presetCountText: {
    fontSize: 12,
    fontWeight: "800",
  },
  presetMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardActionStack: {
    gap: spacing.sm,
  },
  customHubCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
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
