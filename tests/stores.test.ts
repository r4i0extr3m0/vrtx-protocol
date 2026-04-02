import { beforeEach, describe, expect, it, vi } from "vitest";

import { createExerciseFixture, createMemoryJsonStorage } from "../src/test-utils";

describe("authStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("falls back to guest mode when Supabase env is missing", async () => {
    const storage = createMemoryJsonStorage();

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/constants/env", () => ({
      hasSupabaseEnv: () => false,
    }));
    vi.doMock("@/src/api/supabase", () => ({
      getCurrentSession: vi.fn(),
      getCurrentUser: vi.fn(),
      getSupabaseClient: vi.fn(),
    }));

    const { useAuthStore } = await import("../src/store/authStore");
    await useAuthStore.getState().hydrateAuth();

    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe("workoutStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates workouts and enqueues sync operations", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: {
        getState: () => ({ enqueue }),
      },
    }));

    const { useWorkoutStore } = await import("../src/store/workoutStore");
    const workout = useWorkoutStore.getState().createWorkout("Treino A");

    expect(workout.name).toBe("Treino A");
    expect(useWorkoutStore.getState().activeWorkoutId).toBe(workout.id);
    expect(useWorkoutStore.getState().workouts[0].syncStatus).toBe("pending");
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it("adds exercises and completes the active workout", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: {
        getState: () => ({ enqueue }),
      },
    }));

    const { useWorkoutStore } = await import("../src/store/workoutStore");
    const store = useWorkoutStore.getState();
    const workout = store.createWorkout("Treino B");
    store.addExercise(workout.id, createExerciseFixture());
    store.completeWorkout(workout.id);

    const updated = useWorkoutStore.getState().workouts.find((entry) => entry.id === workout.id);

    expect(updated?.exercises).toHaveLength(1);
    expect(updated?.completedAt).toBeTruthy();
    expect(useWorkoutStore.getState().activeWorkoutId).toBeNull();
    expect(enqueue).toHaveBeenCalledTimes(3);
  });
});
