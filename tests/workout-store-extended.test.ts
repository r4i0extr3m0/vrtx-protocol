import { beforeEach, describe, expect, it, vi } from "vitest";

import { createExerciseFixture, createMemoryJsonStorage, createSetFixture } from "../src/test-utils";

describe("workoutStore (extended)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates workout from template with pre-populated exercises", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useWorkoutStore } = await import("../src/store/workoutStore");
    const exercises = [createExerciseFixture({ id: "ex-1", name: "Supino" })];
    const workout = useWorkoutStore.getState().createFromTemplate("Push A", exercises);

    expect(workout.name).toBe("Push A");
    expect(workout.exercises).toHaveLength(1);
    expect(useWorkoutStore.getState().activeWorkoutId).toBe(workout.id);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it("adds a set to an exercise", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useWorkoutStore } = await import("../src/store/workoutStore");
    const store = useWorkoutStore.getState();
    const workout = store.createWorkout("Treino C");
    const exercise = createExerciseFixture({ id: "ex-2", sets: [] });
    store.addExercise(workout.id, exercise);

    const newSet = createSetFixture({ id: "set-new", reps: 8, weightKg: 80 });
    store.addSet(workout.id, exercise.id, newSet);

    const updated = useWorkoutStore.getState().workouts.find((w) => w.id === workout.id);
    const updatedExercise = updated?.exercises.find((e) => e.id === exercise.id);
    expect(updatedExercise?.sets).toHaveLength(1);
    expect(updatedExercise?.sets[0].reps).toBe(8);
  });

  it("updates a set's reps and weight", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useWorkoutStore } = await import("../src/store/workoutStore");
    const store = useWorkoutStore.getState();
    const set = createSetFixture({ id: "set-upd", reps: 5, weightKg: 100 });
    const exercise = createExerciseFixture({ id: "ex-upd", sets: [set] });
    const workout = store.createWorkout("Treino D");
    store.addExercise(workout.id, exercise);
    store.updateSet(workout.id, exercise.id, set.id, { reps: 10, weightKg: 120 });

    const updated = useWorkoutStore.getState().workouts.find((w) => w.id === workout.id);
    const updatedSet = updated?.exercises[0].sets.find((s) => s.id === set.id);
    expect(updatedSet?.reps).toBe(10);
    expect(updatedSet?.weightKg).toBe(120);
  });

  it("removes a set from an exercise", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useWorkoutStore } = await import("../src/store/workoutStore");
    const store = useWorkoutStore.getState();
    const set = createSetFixture({ id: "set-del" });
    const exercise = createExerciseFixture({ id: "ex-del", sets: [set] });
    const workout = store.createWorkout("Treino E");
    store.addExercise(workout.id, exercise);
    store.removeSet(workout.id, exercise.id, set.id);

    const updated = useWorkoutStore.getState().workouts.find((w) => w.id === workout.id);
    expect(updated?.exercises[0].sets).toHaveLength(0);
  });

  it("removes an exercise from the workout", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useWorkoutStore } = await import("../src/store/workoutStore");
    const store = useWorkoutStore.getState();
    const exercise = createExerciseFixture({ id: "ex-rem" });
    const workout = store.createWorkout("Treino F");
    store.addExercise(workout.id, exercise);
    store.removeExercise(workout.id, exercise.id);

    const updated = useWorkoutStore.getState().workouts.find((w) => w.id === workout.id);
    expect(updated?.exercises).toHaveLength(0);
  });
});
