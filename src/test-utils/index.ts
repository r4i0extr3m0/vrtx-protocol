import type { ExerciseEntry, ExerciseSet, SyncQueueOperation, Workout } from "@/src/types";

type StorageShape = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
};

export function createMemoryJsonStorage(): StorageShape {
  const map = new Map<string, string>();

  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

export function createSetFixture(partial?: Partial<ExerciseSet>): ExerciseSet {
  return {
    id: partial?.id ?? "set-1",
    reps: partial?.reps ?? 5,
    weightKg: partial?.weightKg ?? 100,
    completed: partial?.completed ?? true,
    notes: partial?.notes,
  };
}

export function createExerciseFixture(partial?: Partial<ExerciseEntry>): ExerciseEntry {
  return {
    id: partial?.id ?? "exercise-1",
    name: partial?.name ?? "Supino reto",
    muscleGroup: partial?.muscleGroup ?? "Peito",
    sets: partial?.sets ?? [createSetFixture()],
    notes: partial?.notes,
  };
}

export function createWorkoutFixture(partial?: Partial<Workout>): Workout {
  return {
    id: partial?.id ?? "workout-1",
    userId: partial?.userId,
    name: partial?.name ?? "Treino A",
    date: partial?.date ?? "2026-03-26",
    startedAt: partial?.startedAt ?? "2026-03-26T10:00:00.000Z",
    completedAt: partial?.completedAt,
    notes: partial?.notes,
    exercises: partial?.exercises ?? [createExerciseFixture()],
    syncStatus: partial?.syncStatus ?? "local",
  };
}

export function createSyncOperationFixture(
  partial?: Partial<SyncQueueOperation<Workout>>,
): SyncQueueOperation<Workout> {
  return {
    id: partial?.id ?? "sync-1",
    entity: partial?.entity ?? "workout",
    type: partial?.type ?? "create",
    table: partial?.table ?? "workouts",
    data: partial?.data ?? createWorkoutFixture(),
    timestamp: partial?.timestamp ?? Date.now(),
    retries: partial?.retries ?? 0,
    lastError: partial?.lastError,
  };
}
