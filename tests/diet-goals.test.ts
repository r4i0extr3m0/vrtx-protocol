import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryJsonStorage } from "../src/test-utils";

describe("diet goals", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects inconsistent body composition values and returns rounded goals", async () => {
    const storage = createMemoryJsonStorage();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue: vi.fn() }) },
    }));

    const { calculateDietGoals } = await import("../src/store/dietStore");

    expect(() =>
      calculateDietGoals({
        sex: "male",
        age: 29,
        heightCm: 178,
        weightKg: 82.5,
        goal: "maintain",
        activityLevel: "moderate",
        workoutsPerWeek: 4,
        leanMassKg: 90,
      }),
    ).toThrow();

    const goals = calculateDietGoals({
      sex: "female",
      age: 31,
      heightCm: 165,
      weightKg: 68.4,
      goal: "lose",
      activityLevel: "light",
      workoutsPerWeek: 3,
      bodyFatPercentage: 24,
    });

    expect(Number.isInteger(goals.calories)).toBe(true);
    expect(Number.isInteger(goals.protein)).toBe(true);
    expect(Number.isInteger(goals.carbs)).toBe(true);
    expect(Number.isInteger(goals.fat)).toBe(true);
    expect(Number.isInteger(goals.waterMl ?? 0)).toBe(true);
  });

  it("keeps manual goals untouched while the lock is active", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useDietStore } = await import("../src/store/dietStore");
    const manualGoals = {
      calories: 2100,
      protein: 180,
      carbs: 190,
      fat: 70,
      waterMl: 3200,
    };

    useDietStore.getState().setDailyGoals(manualGoals);
    useDietStore.getState().setGoalsLockedManually(true);
    useDietStore.getState().setDietProfile({
      sex: "male",
      age: 29,
      heightCm: 178,
      weightKg: 88,
      goal: "gain",
      activityLevel: "active",
      workoutsPerWeek: 5,
    });

    expect(useDietStore.getState().dailyGoals).toEqual(manualGoals);
    expect(useDietStore.getState().goalsLockedManually).toBe(true);
  });

  it("recalculates from the latest profile after manual lock is disabled", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { calculateDietGoals, useDietStore } = await import("../src/store/dietStore");
    const profile = {
      sex: "male" as const,
      age: 34,
      heightCm: 180,
      weightKg: 92,
      goal: "lose" as const,
      activityLevel: "moderate" as const,
      workoutsPerWeek: 4,
      bodyFatPercentage: 22,
    };

    useDietStore.getState().setDailyGoals({
      calories: 2600,
      protein: 200,
      carbs: 250,
      fat: 80,
      waterMl: 3500,
    });
    useDietStore.getState().setGoalsLockedManually(true);
    useDietStore.getState().setDietProfile(profile);
    useDietStore.getState().setGoalsLockedManually(false);

    const refreshed = useDietStore.getState().refreshGoalsFromProfile();
    const expected = calculateDietGoals(profile);

    expect(refreshed).toEqual(expected);
    expect(useDietStore.getState().dailyGoals).toEqual(expected);
    expect(useDietStore.getState().goalsLockedManually).toBe(false);
  });
});
