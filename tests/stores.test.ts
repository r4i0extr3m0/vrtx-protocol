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

  it("hydrates session with profile fields from profiles table", async () => {
    const storage = createMemoryJsonStorage();
    const getCurrentSession = vi.fn().mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_at: 123456,
    });
    const getCurrentUser = vi.fn().mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      user_metadata: { name: "Victor" },
    });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "user-1",
        email: "user@example.com",
        name: "Victor Profile",
        onboarding_completed: true,
        biometrics_enabled: true,
        weight: 82,
        height: 180,
        goal: "gain",
        activity_level: "active",
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const refreshAIUsage = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/constants/env", () => ({
      hasSupabaseEnv: () => true,
      getSupabaseEnvError: () => null,
    }));
    vi.doMock("@/src/api/supabase", () => ({
      getCurrentSession,
      getCurrentUser,
      getSupabaseClient: vi.fn(() => ({ from })),
    }));
    vi.doMock("@/src/store/premiumStore", () => ({
      usePremiumStore: {
        getState: () => ({ refreshAIUsage, resetPremium: vi.fn() }),
      },
    }));

    const { useAuthStore } = await import("../src/store/authStore");
    await useAuthStore.getState().hydrateAuth();

    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(useAuthStore.getState().user).toMatchObject({
      id: "user-1",
      email: "user@example.com",
      name: "Victor Profile",
      onboardingCompleted: true,
      biometricsEnabled: true,
      weight: 82,
      height: 180,
      goal: "gain",
      activityLevel: "active",
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(refreshAIUsage).toHaveBeenCalledWith("user-1");
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
