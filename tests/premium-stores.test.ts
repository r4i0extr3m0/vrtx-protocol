import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryJsonStorage } from "../src/test-utils";

describe("settingsStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("updates theme and units correctly", async () => {
    const storage = createMemoryJsonStorage();
    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));

    const { useSettingsStore } = await import("../src/store/settingsStore");
    const store = useSettingsStore.getState();

    store.setTheme("dark");
    store.setUnits("lb");

    expect(useSettingsStore.getState().theme).toBe("dark");
    expect(useSettingsStore.getState().units).toBe("lb");
  });
});

describe("dietStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("adds a meal and enqueues sync", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();
    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useDietStore } = await import("../src/store/dietStore");
    const meal = useDietStore.getState().addMeal({
      date: "2026-03-26",
      mealType: "lunch",
      items: [],
      totalCalories: 500,
      totalProtein: 30,
      totalCarbs: 50,
      totalFat: 15,
    });

    expect(meal.mealType).toBe("lunch");
    expect(useDietStore.getState().meals).toHaveLength(1);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ entity: "meal", type: "create" })
    );
  });
});

describe("gamificationStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("adds XP and levels up correctly", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();
    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useGamificationStore } = await import("../src/store/gamificationStore");
    
    // Level 1: 0-99 XP
    // Level 2: 100-399 XP (sqrt(100/100)+1 = 2)
    useGamificationStore.getState().addXP(150);

    expect(useGamificationStore.getState().totalXP).toBe(150);
    expect(useGamificationStore.getState().level).toBe(2);
    expect(useGamificationStore.getState().badges).toContain("xp_100");
  });

  it("updates streak correctly", async () => {
    const storage = createMemoryJsonStorage();
    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue: vi.fn() }) },
    }));

    const { useGamificationStore } = await import("../src/store/gamificationStore");
    
    // First activity
    useGamificationStore.getState().addXP(10);
    expect(useGamificationStore.getState().streak).toBe(1);
  });
});
