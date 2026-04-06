import { beforeEach, describe, expect, it, vi } from "vitest";

import { createExerciseFixture, createMemoryJsonStorage } from "../src/test-utils";

describe("authStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("keeps the visitor idle when Supabase env is missing", async () => {
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

    expect(useAuthStore.getState().status).toBe("idle");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("clears auth state and premium cache on sign out", async () => {
    const storage = createMemoryJsonStorage();
    const signOut = vi.fn().mockResolvedValue(undefined);
    const resetPremium = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/constants/env", () => ({
      hasSupabaseEnv: () => true,
      getSupabaseEnvError: () => null,
    }));
    vi.doMock("@/src/api/supabase", () => ({
      getCurrentSession: vi.fn(),
      getCurrentUser: vi.fn(),
      getSupabaseClient: vi.fn(() => ({
        auth: { signOut },
      })),
    }));
    vi.doMock("@/src/store/premiumStore", () => ({
      usePremiumStore: {
        getState: () => ({ refreshAIUsage: vi.fn(), resetPremium }),
      },
    }));

    const { useAuthStore } = await import("../src/store/authStore");
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "Victor",
        onboardingCompleted: true,
      },
      session: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: 123456,
      },
      status: "authenticated",
      hasHydrated: true,
    });

    await useAuthStore.getState().signOut();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(resetPremium).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
      session: null,
      status: "guest",
      hasHydrated: true,
    });
  });

  it("clears local auth state even when remote sign out fails", async () => {
    const storage = createMemoryJsonStorage();
    const signOut = vi.fn().mockRejectedValue(new Error("network down"));
    const resetPremium = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/constants/env", () => ({
      hasSupabaseEnv: () => true,
      getSupabaseEnvError: () => null,
    }));
    vi.doMock("@/src/api/supabase", () => ({
      getCurrentSession: vi.fn(),
      getCurrentUser: vi.fn(),
      getSupabaseClient: vi.fn(() => ({
        auth: { signOut },
      })),
    }));
    vi.doMock("@/src/store/premiumStore", () => ({
      usePremiumStore: {
        getState: () => ({ refreshAIUsage: vi.fn(), resetPremium }),
      },
    }));

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { useAuthStore } = await import("../src/store/authStore");
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "Victor",
        onboardingCompleted: true,
      },
      session: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: 123456,
      },
      status: "authenticated",
      hasHydrated: true,
    });

    await useAuthStore.getState().signOut();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(resetPremium).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
      session: null,
      status: "guest",
      hasHydrated: true,
    });
  });

  it("switches to guest mode explicitly without keeping auth residue", async () => {
    const storage = createMemoryJsonStorage();

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/constants/env", () => ({
      hasSupabaseEnv: () => true,
      getSupabaseEnvError: () => null,
    }));
    vi.doMock("@/src/api/supabase", () => ({
      getCurrentSession: vi.fn(),
      getCurrentUser: vi.fn(),
      getSupabaseClient: vi.fn(),
    }));
    vi.doMock("@/src/store/premiumStore", () => ({
      usePremiumStore: {
        getState: () => ({ refreshAIUsage: vi.fn(), resetPremium: vi.fn() }),
      },
    }));

    const { useAuthStore } = await import("../src/store/authStore");
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "Victor",
        onboardingCompleted: false,
      },
      session: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: 123456,
      },
      status: "authenticated",
      hasHydrated: true,
    });

    useAuthStore.getState().setGuestMode();

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
      session: null,
      status: "guest",
      hasHydrated: true,
    });
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

  it("updates profile via auth metadata when profiles table is unavailable", async () => {
    const storage = createMemoryJsonStorage();
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const upsert = vi.fn().mockResolvedValue({
      error: {
        code: "PGRST205",
        message: "Could not find the table 'public.profiles' in the schema cache",
      },
    });
    const from = vi.fn().mockReturnValue({ upsert });

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/constants/env", () => ({
      hasSupabaseEnv: () => true,
      getSupabaseEnvError: () => null,
    }));
    vi.doMock("@/src/api/supabase", () => ({
      getCurrentSession: vi.fn(),
      getCurrentUser: vi.fn(),
      getSupabaseClient: vi.fn(() => ({
        auth: { updateUser },
        from,
      })),
    }));
    vi.doMock("@/src/store/premiumStore", () => ({
      usePremiumStore: {
        getState: () => ({ refreshAIUsage: vi.fn(), resetPremium: vi.fn() }),
      },
    }));

    const { useAuthStore } = await import("../src/store/authStore");
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "Victor",
      },
      isAuthenticated: true,
      status: "authenticated",
      hasHydrated: true,
    });

    const result = await useAuthStore.getState().updateProfile({
      weight: 82,
      onboardingCompleted: true,
    });

    expect(result).toEqual({ success: true });
    expect(updateUser).toHaveBeenCalledWith({
      data: {
        weight: 82,
        onboardingCompleted: true,
      },
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(useAuthStore.getState().user).toMatchObject({
      id: "user-1",
      email: "user@example.com",
      weight: 82,
      onboardingCompleted: true,
    });
  });

  it("translates thrown duplicate signup errors instead of using the generic fallback", async () => {
    const storage = createMemoryJsonStorage();
    const signUp = vi.fn().mockRejectedValue({
      code: "user_already_exists",
      message: "User already registered",
    });

    vi.doMock("@/src/infra/mmkv", () => ({
      mmkvJsonStorage: storage,
    }));
    vi.doMock("@/src/constants/env", () => ({
      hasSupabaseEnv: () => true,
      getSupabaseEnvError: () => null,
    }));
    vi.doMock("@/src/api/supabase", () => ({
      getCurrentSession: vi.fn(),
      getCurrentUser: vi.fn(),
      getSupabaseClient: vi.fn(() => ({
        auth: { signUp },
      })),
    }));
    vi.doMock("@/src/store/premiumStore", () => ({
      usePremiumStore: {
        getState: () => ({ refreshAIUsage: vi.fn(), resetPremium: vi.fn() }),
      },
    }));

    const { useAuthStore } = await import("../src/store/authStore");
    const result = await useAuthStore.getState().signUp("user@example.com", "Test123456!", "Victor");

    expect(result).toMatchObject({
      success: false,
      code: "USER_ALREADY_EXISTS",
      message: "Este e-mail ja esta cadastrado. Entre com sua senha ou recupere o acesso.",
    });
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
