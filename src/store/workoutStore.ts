import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";

import { createWorkoutDraft, summarizeWorkout } from "@/src/domain/workout";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { useSyncStore } from "@/src/store/syncStore";
import type { ExerciseEntry, Workout, ExerciseSet } from "@/src/types";
import { createId, toIsoTimestamp } from "@/src/utils";

// --- Schemas de Validação ---
const setSchema = z.object({
  id: z.string(),
  reps: z.number().int().min(0).max(1000),
  weightKg: z.number().min(0).max(1000),
  completed: z.boolean(),
  notes: z.string().max(500).optional(),
});

const exerciseEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroup: z.string(),
  sets: z.array(setSchema),
  notes: z.string().max(500).optional(),
});

const workoutSchema = z.object({
  name: z.string().min(1).max(100),
  exercises: z.array(exerciseEntrySchema),
  notes: z.string().max(1000).optional(),
});

interface WorkoutStoreState {
  workouts: Workout[];
  activeWorkoutId: string | null;
  hydrated: boolean;
  createWorkout: (name?: string) => Workout;
  createFromTemplate: (
    templateName: string,
    exercises: ExerciseEntry[],
    meta?: { prescriptionId?: string; coachId?: string },
  ) => Workout;
  updateWorkout: (id: string, partial: Partial<Workout>) => void;
  addExercise: (workoutId: string, exercise: ExerciseEntry) => void;
  removeExercise: (workoutId: string, exerciseId: string) => void;
  addSet: (workoutId: string, exerciseId: string, set: ExerciseSet) => void;
  updateSet: (workoutId: string, exerciseId: string, setId: string, partial: Partial<ExerciseSet>) => void;
  removeSet: (workoutId: string, exerciseId: string, setId: string) => void;
  completeWorkout: (workoutId: string) => void;
  setHydrated: (value: boolean) => void;
}

function enqueueWorkoutOperation(type: "create" | "update" | "delete", workout: Workout): void {
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entity: "workout",
    type,
    table: "workouts",
    data: workout,
    timestamp: Date.now(),
    retries: 0,
  });
}

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      workouts: [],
      activeWorkoutId: null,
      hydrated: false,
      createWorkout: (name) => {
        const draft = createWorkoutDraft({
          name: name ?? "Novo treino",
          syncStatus: "pending",
        });

        set((state) => ({
          workouts: [draft, ...state.workouts],
          activeWorkoutId: draft.id,
        }));

        enqueueWorkoutOperation("create", draft);
        return draft;
      },
      updateWorkout: (id, partial) => {
        // Validação parcial
        const validatedPartial = workoutSchema.partial().parse(partial);

        const nextWorkouts = get().workouts.map((workout) =>
          workout.id === id ? { ...workout, ...validatedPartial, syncStatus: "pending" as const } : workout,
        );
        const updatedWorkout = nextWorkouts.find((workout) => workout.id === id);

        set({ workouts: nextWorkouts });

        if (updatedWorkout) {
          enqueueWorkoutOperation("update", updatedWorkout);
        }
      },
      addExercise: (workoutId, exercise) => {
        // Validação
        const validatedExercise = exerciseEntrySchema.parse(exercise);

        const nextWorkouts = get().workouts.map((workout) => {
          if (workout.id !== workoutId) {
            return workout;
          }

          return {
            ...workout,
            exercises: [...workout.exercises, validatedExercise],
            syncStatus: "pending" as const,
          };
        });
        const updatedWorkout = nextWorkouts.find((workout) => workout.id === workoutId);

        set({ workouts: nextWorkouts });

        if (updatedWorkout) {
          enqueueWorkoutOperation("update", updatedWorkout);
        }
      },
      createFromTemplate: (templateName, exercises, meta) => {
        // Validação
        const validatedExercises = z.array(exerciseEntrySchema).parse(exercises);

        const draft = createWorkoutDraft({
          name: templateName,
          exercises: validatedExercises,
          syncStatus: "pending",
          prescriptionId: meta?.prescriptionId,
          coachId: meta?.coachId,
        });
        set((state) => ({
          workouts: [draft, ...state.workouts],
          activeWorkoutId: draft.id,
        }));
        enqueueWorkoutOperation("create", draft);
        return draft;
      },
      removeExercise: (workoutId, exerciseId) => {
        const nextWorkouts = get().workouts.map((workout) => {
          if (workout.id !== workoutId) return workout;
          return {
            ...workout,
            exercises: workout.exercises.filter((ex) => ex.id !== exerciseId),
            syncStatus: "pending" as const,
          };
        });
        const updatedWorkout = nextWorkouts.find((w) => w.id === workoutId);
        set({ workouts: nextWorkouts });
        if (updatedWorkout) enqueueWorkoutOperation("update", updatedWorkout);
      },
      addSet: (workoutId, exerciseId, set_) => {
        // Validação
        const validatedSet = setSchema.parse(set_);

        const nextWorkouts = get().workouts.map((workout) => {
          if (workout.id !== workoutId) return workout;
          return {
            ...workout,
            exercises: workout.exercises.map((ex) =>
              ex.id !== exerciseId
                ? ex
                : { ...ex, sets: [...ex.sets, validatedSet] },
            ),
            syncStatus: "pending" as const,
          };
        });
        const updatedWorkout = nextWorkouts.find((w) => w.id === workoutId);
        set({ workouts: nextWorkouts });
        if (updatedWorkout) enqueueWorkoutOperation("update", updatedWorkout);
      },
      updateSet: (workoutId, exerciseId, setId, partial) => {
        // Validação parcial
        const validatedPartial = setSchema.partial().parse(partial);

        const nextWorkouts = get().workouts.map((workout) => {
          if (workout.id !== workoutId) return workout;
          return {
            ...workout,
            exercises: workout.exercises.map((ex) =>
              ex.id !== exerciseId
                ? ex
                : {
                    ...ex,
                    sets: ex.sets.map((s) =>
                      s.id !== setId ? s : { ...s, ...validatedPartial },
                    ),
                  },
            ),
            syncStatus: "pending" as const,
          };
        });
        const updatedWorkout = nextWorkouts.find((w) => w.id === workoutId);
        set({ workouts: nextWorkouts });
        if (updatedWorkout) enqueueWorkoutOperation("update", updatedWorkout);
      },
      removeSet: (workoutId, exerciseId, setId) => {
        const nextWorkouts = get().workouts.map((workout) => {
          if (workout.id !== workoutId) return workout;
          return {
            ...workout,
            exercises: workout.exercises.map((ex) =>
              ex.id !== exerciseId
                ? ex
                : { ...ex, sets: ex.sets.filter((s) => s.id !== setId) },
            ),
            syncStatus: "pending" as const,
          };
        });
        const updatedWorkout = nextWorkouts.find((w) => w.id === workoutId);
        set({ workouts: nextWorkouts });
        if (updatedWorkout) enqueueWorkoutOperation("update", updatedWorkout);
      },
      completeWorkout: (workoutId) => {
        const nextWorkouts = get().workouts.map((workout) => {
          if (workout.id !== workoutId) {
            return workout;
          }

          return {
            ...workout,
            completedAt: toIsoTimestamp(new Date()),
            syncStatus: "pending" as const,
          };
        });
        const updatedWorkout = nextWorkouts.find((workout) => workout.id === workoutId);

        set({
          workouts: nextWorkouts,
          activeWorkoutId: null,
        });

        if (updatedWorkout) {
          enqueueWorkoutOperation("update", updatedWorkout);
        }
      },
      setHydrated: (value) => {
        set({ hydrated: value });
      },
    }),
    {
      name: "vrtxprotocol-workout-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function selectWorkoutSummary(workoutId: string): ReturnType<typeof summarizeWorkout> | null {
  const workout = useWorkoutStore.getState().workouts.find((entry) => entry.id === workoutId);
  return workout ? summarizeWorkout(workout) : null;
}
