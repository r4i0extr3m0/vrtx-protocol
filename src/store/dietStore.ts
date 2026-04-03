import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { useSyncStore } from "@/src/store/syncStore";
import type { DailyGoals, Food, Meal } from "@/src/types";
import { createId, toIsoTimestamp } from "@/src/utils";

// --- Schemas de Validação ---
const dailyGoalsSchema = z.object({
  calories: z.number().min(500).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(2000),
  fat: z.number().min(0).max(500),
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
  hydrated: boolean;
  addMeal: (meal: Omit<Meal, "id" | "createdAt" | "updatedAt" | "syncStatus">) => Meal;
  updateMeal: (id: string, partial: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  setDailyGoals: (goals: DailyGoals) => void;
  addFood: (food: Omit<Food, "id" | "syncStatus">) => Food;
  addWater: (amountMl: number) => void;
  resetWater: () => void;
  setHydrated: (value: boolean) => void;
  fetchFoodByBarcode: (barcode: string) => Promise<Food | null>;
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
      dailyGoals: {
        calories: 2500,
        protein: 150,
        carbs: 300,
        fat: 70,
      },
      foods: [],
      waterIntake: 0,
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
          const totalWater = meal.items.reduce((acc, item) => acc + item.amount, 0);
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
        set({ dailyGoals: validated });
      },
      addFood: (foodData) => {
        const validated = foodSchema.parse(foodData);
        const food: Food = {
          ...validated,
          id: createId("food"),
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
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
