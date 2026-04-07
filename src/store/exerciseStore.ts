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
  ensureSeedExercises: () => void;
  setHydrated: (value: boolean) => void;
}

const seedCreatedAt = toIsoTimestamp(new Date());

const DEFAULT_EXERCISES: Exercise[] = [
  { id: "seed-barbell-squat", name: "Agachamento Livre", muscleGroup: "Pernas", equipment: "Barra", notes: "Movimento base de pernas.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-leg-press", name: "Leg Press", muscleGroup: "Pernas", equipment: "Maquina", notes: "Boa opcao para volume em quadriceps.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-romanian-deadlift", name: "Levantamento Terra Romeno", muscleGroup: "Posterior", equipment: "Barra", notes: "Foco em posterior e gluteos.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-bench-press", name: "Supino Reto", muscleGroup: "Peito", equipment: "Barra", notes: "Empurrar horizontal classico.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-incline-dumbbell-press", name: "Supino Inclinado com Halteres", muscleGroup: "Peito", equipment: "Halteres", notes: "Variacao para parte superior do peito.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-lat-pulldown", name: "Puxada Frontal", muscleGroup: "Costas", equipment: "Polia", notes: "Puxada vertical para dorsais.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-seated-row", name: "Remada Baixa", muscleGroup: "Costas", equipment: "Polia", notes: "Remada horizontal para meio das costas.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-shoulder-press", name: "Desenvolvimento", muscleGroup: "Ombros", equipment: "Halteres", notes: "Press vertical para deltoides.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-lateral-raise", name: "Elevacao Lateral", muscleGroup: "Ombros", equipment: "Halteres", notes: "Isolamento simples de ombros.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-barbell-curl", name: "Rosca Direta", muscleGroup: "Biceps", equipment: "Barra", notes: "Base para biceps.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-triceps-pushdown", name: "Triceps na Polia", muscleGroup: "Triceps", equipment: "Polia", notes: "Extensao simples para triceps.", createdAt: seedCreatedAt, syncStatus: "synced" },
  { id: "seed-plank", name: "Prancha", muscleGroup: "Core", equipment: "Peso corporal", notes: "Opcao minima para core.", createdAt: seedCreatedAt, syncStatus: "synced" },
];

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
      exercises: DEFAULT_EXERCISES,
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
      ensureSeedExercises: () => {
        if (get().exercises.length > 0) {
          return;
        }
        set({ exercises: DEFAULT_EXERCISES });
      },
      setHydrated: (value) => {
        set({ hydrated: value });
      },
    }),
    {
      name: "vrtxprotocol-exercise-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.ensureSeedExercises();
        state?.setHydrated(true);
      },
    },
  ),
);
