import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { useSyncStore } from "@/src/store/syncStore";
import type { DailyGoals, Food, Meal } from "@/src/types";
import { createId, toIsoTimestamp } from "@/src/utils";

type DietGoal = "lose" | "maintain" | "gain";
type DietActivityLevel = "sedentary" | "light" | "moderate" | "active";
type DietSex = "male" | "female" | "unspecified";

export interface DietProfile {
  sex: DietSex;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: DietGoal;
  activityLevel: DietActivityLevel;
  workoutsPerWeek: number;
  bodyFatPercentage?: number;
  leanMassKg?: number;
}

// --- Schemas de Validação ---
const dailyGoalsSchema = z.object({
  calories: z.number().min(500).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(2000),
  fat: z.number().min(0).max(500),
  waterMl: z.number().min(500).max(10000).default(2500),
});

const dietProfileSchema = z.object({
  sex: z.enum(["male", "female", "unspecified"]),
  age: z.number().min(13).max(100),
  heightCm: z.number().min(120).max(250),
  weightKg: z.number().min(30).max(350),
  goal: z.enum(["lose", "maintain", "gain"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active"]),
  workoutsPerWeek: z.number().min(0).max(7),
  bodyFatPercentage: z.number().min(3).max(60).optional(),
  leanMassKg: z.number().min(20).max(250).optional(),
}).refine((value) => value.leanMassKg === undefined || value.leanMassKg <= value.weightKg, {
  message: "Lean mass cannot exceed total weight.",
  path: ["leanMassKg"],
});

const mealItemSchema = z.object({
  foodId: z.string().optional(),
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  unit: z.string(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

const mealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "water"]),
  items: z.array(mealItemSchema),
  totalCalories: z.number().nonnegative(),
  totalProtein: z.number().nonnegative(),
  totalCarbs: z.number().nonnegative(),
  totalFat: z.number().nonnegative(),
  notes: z.string().max(500).optional(),
});

const foodSchema = z.object({
  name: z.string().min(1).max(100),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  servingSize: z.number().positive(),
  servingUnit: z.string(),
  category: z.string().optional(),
});

interface DietStoreState {
  meals: Meal[];
  dailyGoals: DailyGoals;
  foods: Food[];
  waterIntake: number; // em ml
  profile: DietProfile | null;
  goalsConfigured: boolean;
  goalsLockedManually: boolean;
  goalsSetupPromptDismissed: boolean;
  hydrated: boolean;
  addMeal: (meal: Omit<Meal, "id" | "createdAt" | "updatedAt" | "syncStatus">) => Meal;
  updateMeal: (id: string, partial: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  setDailyGoals: (goals: DailyGoals) => void;
  applyGoalSetup: (profile: DietProfile, manualOverride?: boolean) => DailyGoals;
  setDietProfile: (profile: DietProfile) => DietProfile;
  refreshGoalsFromProfile: (force?: boolean) => DailyGoals | null;
  setGoalsConfigured: (value: boolean) => void;
  setGoalsLockedManually: (value: boolean) => void;
  dismissGoalsSetupPrompt: () => void;
  addFood: (food: Omit<Food, "id" | "syncStatus">) => Food;
  addWater: (amountMl: number) => void;
  resetWater: () => void;
  setHydrated: (value: boolean) => void;
  fetchFoodByBarcode: (barcode: string) => Promise<Food | null>;
}

const DEFAULT_DAILY_GOALS: DailyGoals = {
  calories: 2500,
  protein: 150,
  carbs: 300,
  fat: 70,
  waterMl: 2500,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getActivityFactor(activityLevel: DietActivityLevel): number {
  switch (activityLevel) {
    case "light":
      return 1.35;
    case "moderate":
      return 1.5;
    case "active":
      return 1.7;
    default:
      return 1.2;
  }
}

function inferLeanMassKg(profile: DietProfile): number | null {
  if (typeof profile.bodyFatPercentage === "number" && Number.isFinite(profile.bodyFatPercentage)) {
    return profile.weightKg * (1 - profile.bodyFatPercentage / 100);
  }

  if (typeof profile.leanMassKg === "number" && Number.isFinite(profile.leanMassKg)) {
    return profile.leanMassKg;
  }

  return null;
}

export function calculateDietGoals(profile: DietProfile): DailyGoals {
  const validatedProfile = dietProfileSchema.parse(profile);
  const sexOffset = validatedProfile.sex === "male" ? 5 : validatedProfile.sex === "female" ? -161 : -78;
  const bmr = 10 * validatedProfile.weightKg + 6.25 * validatedProfile.heightCm - 5 * validatedProfile.age + sexOffset;
  const activityFactor = getActivityFactor(validatedProfile.activityLevel) + Math.min(validatedProfile.workoutsPerWeek, 7) * 0.02;
  const estimatedTdee = bmr * activityFactor;
  const targetCalories =
    validatedProfile.goal === "lose"
      ? Math.max(1200, estimatedTdee - 400)
      : validatedProfile.goal === "gain"
        ? estimatedTdee + 220
        : estimatedTdee;

  const leanMassKg = inferLeanMassKg(validatedProfile);
  const proteinBaseKg =
    leanMassKg ??
    validatedProfile.weightKg;
  const proteinMultiplier =
    leanMassKg !== null
      ? validatedProfile.goal === "lose"
        ? 2.3
        : 2
      : validatedProfile.goal === "lose"
        ? 2
        : validatedProfile.goal === "gain"
          ? 1.8
          : 1.7;
  const fatMultiplier = validatedProfile.goal === "gain" ? 0.95 : validatedProfile.goal === "maintain" ? 0.9 : 0.8;

  const protein = clamp(Math.round(proteinBaseKg * proteinMultiplier), 80, 260);
  const fat = clamp(Math.round(validatedProfile.weightKg * fatMultiplier), 40, 120);
  const remainingCalories = Math.max(targetCalories - protein * 4 - fat * 9, 200);
  const carbs = Math.max(40, Math.round(remainingCalories / 4));
  const waterMl = clamp(Math.round(validatedProfile.weightKg * 35 + validatedProfile.workoutsPerWeek * 250), 1800, 5000);

  return dailyGoalsSchema.parse({
    calories: Math.round(targetCalories),
    protein,
    carbs,
    fat,
    waterMl,
  });
}

function enqueueDietOperation(
  entity: "meal" | "food" | "gamification",
  type: "create" | "update" | "delete",
  data: any,
): void {
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entity,
    type,
    table: entity === "meal" ? "meals" : entity === "food" ? "foods" : "gamification",
    data,
    timestamp: Date.now(),
    retries: 0,
  });
}

export const useDietStore = create<DietStoreState>()(
  persist(
    (set, get) => ({
      meals: [],
      dailyGoals: DEFAULT_DAILY_GOALS,
      foods: [],
      waterIntake: 0,
      profile: null,
      goalsConfigured: false,
      goalsLockedManually: false,
      goalsSetupPromptDismissed: false,
      hydrated: false,
      addMeal: (mealData) => {
        const validated = mealSchema.parse(mealData);
        
        const meal: Meal = {
          ...validated,
          id: createId("meal"),
          createdAt: toIsoTimestamp(new Date()),
          updatedAt: toIsoTimestamp(new Date()),
          syncStatus: "pending",
        };
        set((state) => ({ meals: [meal, ...state.meals] }));
        enqueueDietOperation("meal", "create", meal);
        
        if (meal.mealType === "water") {
          const totalWater = meal.items.reduce(
            (acc, item) => acc + (item.amount ?? item.quantity ?? 0),
            0,
          );
          get().addWater(totalWater);
        }
        
        return meal;
      },
      updateMeal: (id, partial) => {
        const current = get().meals.find(m => m.id === id);
        if (!current) return;

        const validatedPartial = mealSchema.partial().parse(partial);

        const nextMeals = get().meals.map((m) =>
          m.id === id
            ? { ...m, ...validatedPartial, updatedAt: toIsoTimestamp(new Date()), syncStatus: "pending" as const }
            : m,
        );
        const updated = nextMeals.find((m) => m.id === id);
        set({ meals: nextMeals });
        if (updated) enqueueDietOperation("meal", "update", updated);
      },
      deleteMeal: (id) => {
        const target = get().meals.find((m) => m.id === id);
        set((state) => ({ meals: state.meals.filter((m) => m.id !== id) }));
        if (target) enqueueDietOperation("meal", "delete", target);
      },
      setDailyGoals: (goals) => {
        const validated = dailyGoalsSchema.parse(goals);
        set({ dailyGoals: validated, goalsConfigured: true });
      },
      applyGoalSetup: (profile, manualOverride = false) => {
        const validatedProfile = dietProfileSchema.parse(profile);
        const calculatedGoals = calculateDietGoals(validatedProfile);
        set({
          profile: validatedProfile,
          dailyGoals: calculatedGoals,
          goalsConfigured: true,
          goalsLockedManually: manualOverride ? true : get().goalsLockedManually,
          goalsSetupPromptDismissed: true,
        });
        return calculatedGoals;
      },
      setDietProfile: (profile) => {
        const validatedProfile = dietProfileSchema.parse(profile);
        const shouldRecalculate = !get().goalsLockedManually;
        set((state) => ({
          profile: validatedProfile,
          dailyGoals: shouldRecalculate ? calculateDietGoals(validatedProfile) : state.dailyGoals,
          goalsConfigured: true,
          goalsSetupPromptDismissed: true,
        }));
        return validatedProfile;
      },
      refreshGoalsFromProfile: (force = false) => {
        const currentProfile = get().profile;

        if (!currentProfile) {
          return null;
        }

        if (get().goalsLockedManually && !force) {
          return null;
        }

        const recalculatedGoals = calculateDietGoals(currentProfile);
        set({
          dailyGoals: recalculatedGoals,
          goalsConfigured: true,
          goalsSetupPromptDismissed: true,
        });
        return recalculatedGoals;
      },
      setGoalsConfigured: (value) => {
        set({ goalsConfigured: value });
      },
      setGoalsLockedManually: (value) => {
        set({ goalsLockedManually: value, goalsConfigured: true });
      },
      dismissGoalsSetupPrompt: () => {
        set({ goalsSetupPromptDismissed: true });
      },
      addFood: (foodData) => {
        const validated = foodSchema.parse(foodData);
        const food: Food = {
          id: createId("food"),
          name: validated.name,
          calories: validated.calories,
          protein: validated.protein,
          carbs: validated.carbs,
          fat: validated.fat,
          caloriesPer100g: validated.calories,
          proteinPer100g: validated.protein,
          carbsPer100g: validated.carbs,
          fatPer100g: validated.fat,
          servingSize: validated.servingSize,
          servingUnit: validated.servingUnit,
          category: validated.category,
          syncStatus: "pending",
        };
        set((state) => ({ foods: [food, ...state.foods] }));
        enqueueDietOperation("food", "create", food);
        return food;
      },
      addWater: (amountMl) => {
        set((state) => ({ waterIntake: state.waterIntake + amountMl }));
      },
      resetWater: () => {
        set({ waterIntake: 0 });
      },
      setHydrated: (value) => set({ hydrated: value }),
      fetchFoodByBarcode: async (barcode) => {
        try {
          // Mock para teste conforme solicitado
          if (barcode === "00000000") {
            return {
              id: "mock-food",
              name: "Alimento Mock",
              calories: 100,
              protein: 10,
              carbs: 20,
              fat: 2,
              caloriesPer100g: 100,
              proteinPer100g: 10,
              carbsPer100g: 20,
              fatPer100g: 2,
              servingSize: 100,
              servingUnit: "g",
              syncStatus: "synced"
            };
          }
          
          const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
          const data = await response.json();
          
          if (data.status === 1) {
            const product = data.product;
            return {
              id: createId("food"),
              name: product.product_name || "Unknown Food",
              calories: product.nutriments?.["energy-kcal_100g"] || 0,
              protein: product.nutriments?.proteins_100g || 0,
              carbs: product.nutriments?.carbohydrates_100g || 0,
              fat: product.nutriments?.fat_100g || 0,
              caloriesPer100g: product.nutriments?.["energy-kcal_100g"] || 0,
              proteinPer100g: product.nutriments?.proteins_100g || 0,
              carbsPer100g: product.nutriments?.carbohydrates_100g || 0,
              fatPer100g: product.nutriments?.fat_100g || 0,
              servingSize: 100,
              servingUnit: "g",
              syncStatus: "pending"
            };
          }
          return null;
        } catch (error) {
          console.error("Error fetching food by barcode:", error);
          return null;
        }
      }
    }),
    {
      name: "vrtxprotocol-diet-store",
      version: 2,
      storage: createJSONStorage(() => mmkvJsonStorage),
      migrate: (persistedState: any) => {
        const dailyGoals = dailyGoalsSchema.safeParse({
          ...DEFAULT_DAILY_GOALS,
          ...(persistedState?.dailyGoals ?? {}),
        }).success
          ? dailyGoalsSchema.parse({
              ...DEFAULT_DAILY_GOALS,
              ...(persistedState?.dailyGoals ?? {}),
            })
          : DEFAULT_DAILY_GOALS;

        const hasDietHistory =
          Array.isArray(persistedState?.meals) && persistedState.meals.length > 0;

        return {
          ...persistedState,
          dailyGoals,
          profile: persistedState?.profile ?? null,
          goalsConfigured: persistedState?.goalsConfigured ?? hasDietHistory,
          goalsLockedManually: persistedState?.goalsLockedManually ?? false,
          goalsSetupPromptDismissed: persistedState?.goalsSetupPromptDismissed ?? hasDietHistory,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
