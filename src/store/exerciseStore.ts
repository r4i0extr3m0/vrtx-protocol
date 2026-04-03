import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { useSyncStore } from "@/src/store/syncStore";
import type { Exercise } from "@/src/types";
import { createId, toIsoTimestamp } from "@/src/utils";

interface ExerciseStoreState {
  exercises: Exercise[];
  hydrated: boolean;
  createExercise: (data: Pick<Exercise, "name" | "muscleGroup" | "equipment" | "notes">) => Exercise;
  updateExercise: (id: string, partial: Partial<Pick<Exercise, "name" | "muscleGroup" | "equipment" | "notes">>) => void;
  deleteExercise: (id: string) => void;
  setHydrated: (value: boolean) => void;
}

function enqueueExerciseOperation(type: "create" | "update" | "delete", exercise: Exercise): void {
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entity: "exercise",
    type,
    table: "exercises",
    data: exercise,
    timestamp: Date.now(),
    retries: 0,
  });
}

export const useExerciseStore = create<ExerciseStoreState>()(
  persist(
    (set, get) => ({
      exercises: [],
      hydrated: false,
      createExercise: (data) => {
        const exercise: Exercise = {
          id: createId("exercise"),
          name: data.name,
          muscleGroup: data.muscleGroup,
          equipment: data.equipment,
          notes: data.notes,
          createdAt: toIsoTimestamp(new Date()),
          syncStatus: "pending",
        };
        set((state) => ({ exercises: [exercise, ...state.exercises] }));
        enqueueExerciseOperation("create", exercise);
        return exercise;
      },
      updateExercise: (id, partial) => {
        const nextExercises = get().exercises.map((ex) =>
          ex.id === id ? { ...ex, ...partial, syncStatus: "pending" as const } : ex,
        );
        const updated = nextExercises.find((ex) => ex.id === id);
        set({ exercises: nextExercises });
        if (updated) {
          enqueueExerciseOperation("update", updated);
        }
      },
      deleteExercise: (id) => {
        const target = get().exercises.find((ex) => ex.id === id);
        set((state) => ({ exercises: state.exercises.filter((ex) => ex.id !== id) }));
        if (target) {
          enqueueExerciseOperation("delete", target);
        }
      },
      setHydrated: (value) => {
        set({ hydrated: value });
      },
    }),
    {
      name: "vrtxprotocol-exercise-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
