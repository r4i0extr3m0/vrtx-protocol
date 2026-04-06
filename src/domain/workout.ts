import type { ExerciseEntry, ExerciseSet, Workout } from "@/src/types";
import { calculateWorkoutVolume, findBestEstimatedOneRM } from "./strength";
import { createId, toIsoDate, toIsoTimestamp } from "@/src/utils";

export interface WorkoutSummary {
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
  bestOneRM: number;
}

export function createExerciseSet(partial?: Partial<ExerciseSet>): ExerciseSet {
  return {
    id: partial?.id ?? createId("set"),
    reps: partial?.reps ?? 0,
    weightKg: partial?.weightKg ?? 0,
    completed: partial?.completed ?? true,
    notes: partial?.notes,
  };
}

export function createExerciseEntry(partial?: Partial<ExerciseEntry>): ExerciseEntry {
  return {
    id: partial?.id ?? createId("exercise"),
    name: partial?.name ?? "Novo exercicio",
    muscleGroup: partial?.muscleGroup ?? "Geral",
    sets: partial?.sets ?? [createExerciseSet()],
    notes: partial?.notes,
  };
}

export function createWorkoutDraft(partial?: Partial<Workout>): Workout {
  const now = new Date();

  return {
    id: partial?.id ?? createId("workout"),
    userId: partial?.userId,
    name: partial?.name ?? "Novo treino",
    date: partial?.date ?? toIsoDate(now),
    startedAt: partial?.startedAt ?? toIsoTimestamp(now),
    completedAt: partial?.completedAt,
    notes: partial?.notes,
    exercises: partial?.exercises ?? [],
    syncStatus: partial?.syncStatus ?? "local",
  };
}

export function summarizeWorkout(workout: Workout): WorkoutSummary {
  const allSets = workout.exercises.flatMap((exercise) => exercise.sets);

  return {
    exerciseCount: workout.exercises.length,
    setCount: allSets.length,
    totalVolume: calculateWorkoutVolume(allSets),
    bestOneRM: findBestEstimatedOneRM(allSets),
  };
}
