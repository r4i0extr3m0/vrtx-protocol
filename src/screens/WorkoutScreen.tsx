import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

import { 
  ScreenWrapper, 
  GlassCard, 
  NeonButton, 
  CircularTimer, 
  BadgeMetal,
} from "../components/ui";
import { AppIcon } from "@/src/components/AppIcon";
import { createExerciseEntry, createExerciseSet, summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { useTemplateStore } from "@/src/store/templateStore";
import { radius, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/src/services/analytics";
import { VoiceCoach } from "@/src/services/voiceCoach";

export function WorkoutScreen() {
  const { colors } = useTheme();
  const { workouts, activeWorkoutId, createWorkout, createFromTemplate, updateSet, completeWorkout } = useWorkout();
  const { templates } = useTemplateStore();

  const workout = workouts.find((w) => w.id === activeWorkoutId) ?? null;
  const summary = workout ? summarizeWorkout(workout) : null;

  const [showTimer, setShowTimer] = useState(false);
  const [timerProgress, setTimerProgress] = useState(1);
  const [timerLabel, setTimerLabel] = useState("60");

  const prScale = useSharedValue(0);
  const prOpacity = useSharedValue(0);

  const triggerPRAnimation = () => {
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
  };

  const handleToggleSetCompleted = (exerciseId: string, setEntry: any, index: number) => {
    if (!workout) return;
    const nextCompleted = !setEntry.completed;
    
    if (nextCompleted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowTimer(true);
      setTimerProgress(1);
      setTimerLabel("60");
      
      // Voice Coach Announcement
      VoiceCoach.announceSetComplete(index + 1, setEntry.weightKg, setEntry.reps);
      
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
      <ScreenWrapper>
        <View style={styles.header}>
          <BadgeMetal label="PROTOCOLO_DE_EXECUÇÃO" variant="primary" />
          <Text style={[styles.title, { color: colors.foreground, fontFamily: typography.family.heading }]}>
            SESSÕES_ATIVAS
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.family.mono }]}>
            REDUNDÂNCIA_LOCAL_ATIVA // SELECIONE_UM_TEMPLATE
          </Text>
        </View>

        <NeonButton 
          label="INICIAR_SESSÃO_LIMPA" 
          onPress={() => { void createWorkout("Protocolo de Execução"); }} 
          variant="primary" 
          style={styles.mainBtn}
        />

        <View style={styles.templatesSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: typography.family.mono }]}>
            TEMPLATES_DISPONÍVEIS
          </Text>
          {templates.map((t) => (
            <Pressable key={t.id} onPress={() => {
              const exercises = t.exercises.map((te) =>
                createExerciseEntry({
                  name: te.exerciseName,
                  muscleGroup: te.muscleGroup,
                  sets: Array.from({ length: te.sets }, () =>
                    createExerciseSet({ reps: te.repsTarget, weightKg: te.weightKg ?? 0, completed: false }),
                  ),
                }),
              );
              createFromTemplate(t.name, exercises);
            }}>
              <GlassCard style={styles.templateCard} intensity={15}>
                <View>
                  <Text style={[styles.templateName, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                    {t.name.toUpperCase()}
                  </Text>
                  <Text style={[styles.templateMeta, { color: colors.muted, fontFamily: typography.family.mono }]}>
                    {t.exercises.length} EXERCÍCIOS // {t.exercises.reduce((acc, e) => acc + e.sets, 0)} SÉRIES
                  </Text>
                </View>
                <AppIcon name="ChevronRight" size={20} color={colors.primary} />
              </GlassCard>
            </Pressable>
          ))}
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper withPadding={false}>
      <Animated.View style={prAnimatedStyle} pointerEvents="none">
        <Text style={{ color: "#000", fontWeight: "900", fontSize: 14, fontFamily: typography.family.mono }}>
          🏆 NOVO_RECORDE_PESSOAL!
        </Text>
      </Animated.View>

      <FlashList
        data={workout.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.workoutHeader}>
            <View style={styles.titleRow}>
              <View>
                <BadgeMetal label="SESSÃO_EM_CURSO" variant="primary" />
                <Text style={[styles.workoutTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                  {workout.name.toUpperCase()}
                </Text>
              </View>
              <NeonButton label="FINALIZAR" onPress={() => completeWorkout(workout.id)} variant="primary" style={styles.finishBtn} />
            </View>

            <View style={styles.metricsRow}>
              {[
                { label: "VOLUME", value: formatVolume(summary?.totalVolume ?? 0), icon: "Dumbbell" },
                { label: "1RM_MAX", value: `${(summary?.bestOneRM ?? 0).toFixed(1)}KG`, icon: "Trophy" },
                { label: "SÉRIES", value: String(summary?.setCount ?? 0), icon: "Hash" },
              ].map((m) => (
                <GlassCard key={m.label} style={styles.metricCard} intensity={10}>
                  <AppIcon name={m.icon as any} size={12} color={colors.primary} />
                  <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: typography.family.mono }]}>{m.value}</Text>
                  <Text style={[styles.metricLabel, { color: colors.muted, fontFamily: typography.family.mono }]}>{m.label}</Text>
                </GlassCard>
              ))}
            </View>

            {showTimer && (
              <View style={styles.timerSection}>
                <GlassCard style={styles.timerCard} intensity={30}>
                  <CircularTimer 
                    progress={timerProgress} 
                    label={timerLabel} 
                    subLabel="DESCANSO" 
                    size={140} 
                    strokeWidth={8}
                  />
                  <NeonButton label="PULAR_TIMER" onPress={() => setShowTimer(false)} variant="glass" style={styles.skipTimerBtn} />
                </GlassCard>
              </View>
            )}
          </View>
        )}
        renderItem={({ item: exercise }) => (
          <Animated.View entering={FadeInDown} style={styles.exerciseWrapper}>
            <GlassCard style={styles.exerciseCard} intensity={15}>
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                  {exercise.name.toUpperCase()}
                </Text>
                <BadgeMetal label={exercise.muscleGroup || "GERAL"} variant="metal" />
              </View>
              
              {exercise.sets.map((set: any, idx: number) => (
                <Pressable 
                  key={set.id} 
                  onPress={() => handleToggleSetCompleted(exercise.id, set, idx)}
                  style={[
                    styles.setRow, 
                    { backgroundColor: set.completed ? colors.primary + '10' : 'rgba(255,255,255,0.03)' }
                  ]}
                >
                  <Text style={[styles.setIdx, { color: colors.muted, fontFamily: typography.family.mono }]}>{idx + 1}</Text>
                  <View style={styles.setInfo}>
                    <Text style={[styles.setData, { color: colors.foreground, fontFamily: typography.family.mono }]}>
                      {set.reps} <Text style={{ fontSize: 10, color: colors.muted }}>REPS</Text>
                    </Text>
                    <Text style={[styles.setData, { color: colors.foreground, fontFamily: typography.family.mono }]}>
                      {set.weightKg} <Text style={{ fontSize: 10, color: colors.muted }}>KG</Text>
                    </Text>
                  </View>
                  <View style={[
                    styles.checkCircle, 
                    { borderColor: set.completed ? colors.primary : colors.border, backgroundColor: set.completed ? colors.primary : 'transparent' }
                  ]}>
                    {set.completed && <AppIcon name="Check" size={12} color="#000" strokeWidth={3} />}
                  </View>
                </Pressable>
              ))}
            </GlassCard>
          </Animated.View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.6,
  },
  mainBtn: {
    marginBottom: 30,
  },
  templatesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 16,
    opacity: 0.5,
  },
  templateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '900',
  },
  templateMeta: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  workoutHeader: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  finishBtn: {
    minHeight: 40,
    paddingHorizontal: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 8,
    opacity: 0.5,
  },
  timerSection: {
    marginTop: 20,
  },
  timerCard: {
    alignItems: 'center',
    padding: 20,
  },
  skipTimerBtn: {
    marginTop: 16,
    minHeight: 36,
    width: '100%',
  },
  exerciseWrapper: {
    marginBottom: 16,
  },
  exerciseCard: {
    padding: 0,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '900',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: radius.md,
  },
  setIdx: {
    width: 24,
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.5,
  },
  setInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  setData: {
    fontSize: 14,
    fontWeight: '900',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
