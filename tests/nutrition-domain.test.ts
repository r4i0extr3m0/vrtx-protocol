import { describe, expect, it } from "vitest";

import {
  calculateNutritionAdherence,
  collectMealReminders,
  createItemFromTaco,
  estimateWorkoutBurn,
  findTodayPrescription,
  nutritionMealToDietItems,
  selectNutritionTargets,
  sortNutritionMeals,
  sumNutritionMeals,
} from "../src/domain/nutrition";
import type {
  CoachNutritionPlan,
  CoachPrescription,
  NutritionCheckin,
  NutritionMeal,
  NutritionMealType,
  PrescriptionExercise,
  TacoFood,
} from "../src/types";

const plan: CoachNutritionPlan = {
  id: "plan-1",
  coachId: "coach-1",
  clientId: "client-1",
  trainingDay: { calories: 2800, protein: 180, carbs: 300, fat: 80 },
  restDay: { calories: 2200, protein: 160, carbs: 200, fat: 75 },
  waterMl: 3000,
  notes: null,
  meals: [],
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function meal(type: NutritionMealType, calories: number, time?: string): NutritionMeal {
  return {
    id: `meal-${type}`,
    type,
    title: null,
    time: time ?? null,
    notes: null,
    items: [
      {
        id: `item-${type}`,
        name: "Alimento",
        quantity: 100,
        unit: "g",
        calories,
        protein: 10,
        carbs: 20,
        fat: 5,
      },
    ],
  };
}

function exercise(sets: number, reps: number): PrescriptionExercise {
  return { id: "exercise-1", name: "Supino reto", targetSets: sets, targetReps: reps };
}

function prescription(id: string, scheduledFor: string | null): CoachPrescription {
  return {
    id,
    coachId: "coach-1",
    clientId: "client-1",
    name: `Treino ${id}`,
    notes: null,
    scheduledFor,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    exercises: [],
  };
}

function checkin(id: string, followed: boolean, calories: number): NutritionCheckin {
  return {
    id,
    coachId: "coach-1",
    clientId: "client-1",
    mealId: `meal-${id}`,
    mealType: "lunch",
    happenedOn: "2026-05-01",
    followed,
    calories,
    createdAt: "2026-05-01T12:00:00.000Z",
  };
}

describe("nutrition domain", () => {
  it("selects training or rest day targets", () => {
    expect(selectNutritionTargets(plan, true)).toBe(plan.trainingDay);
    expect(selectNutritionTargets(plan, false)).toBe(plan.restDay);
  });

  it("estimates workout burn from sets and reps", () => {
    expect(estimateWorkoutBurn([exercise(3, 10)])).toBe(102);
    expect(estimateWorkoutBurn([exercise(3, 10), exercise(4, 8)])).toBe(147);
  });

  it("finds the prescription scheduled for today", () => {
    const prescriptions = [
      prescription("a", "2026-05-02"),
      prescription("b", "2026-05-01"),
      prescription("c", null),
    ];

    expect(findTodayPrescription(prescriptions, "2026-05-01")?.id).toBe("b");
    expect(findTodayPrescription(prescriptions, "2026-05-03")).toBeNull();
  });

  it("sums macros across the whole meal plan", () => {
    const meals = [meal("breakfast", 400), meal("lunch", 700)];

    expect(sumNutritionMeals(meals)).toEqual({
      calories: 1100,
      protein: 20,
      carbs: 40,
      fat: 10,
    });
  });

  it("sorts meals in the natural order of the day", () => {
    const sorted = sortNutritionMeals([meal("dinner", 600), meal("breakfast", 400), meal("lunch", 700)]);

    expect(sorted.map((item) => item.type)).toEqual(["breakfast", "lunch", "dinner"]);
  });

  it("creates an item from a TACO food scaled by gram", () => {
    const food: TacoFood = {
      id: "t-arroz",
      name: "Arroz branco cozido",
      category: "Cereais",
      caloriesPer100g: 128,
      proteinPer100g: 2.5,
      carbsPer100g: 28.1,
      fatPer100g: 0.2,
    };

    const item = createItemFromTaco(food, 150);

    expect(item.name).toBe("Arroz branco cozido");
    expect(item.unit).toBe("g");
    expect(item.calories).toBe(192);
    expect(item.protein).toBe(3.8);
    expect(item.carbs).toBe(42.2);
    expect(item.fat).toBe(0.3);
  });

  it("converts a prescribed meal into diet diary items", () => {
    const items = nutritionMealToDietItems(meal("lunch", 700));

    expect(items).toHaveLength(1);
    expect(items[0].foodName).toBe("Alimento");
    expect(items[0].quantity).toBe(100);
    expect(items[0].calories).toBe(700);
  });

  it("calculates nutrition adherence over a window", () => {
    const adherence = calculateNutritionAdherence(
      4,
      [checkin("1", true, 2800), checkin("2", true, 2600), checkin("3", false, 0)],
      7,
    );

    expect(adherence.plannedMeals).toBe(28);
    expect(adherence.followedMeals).toBe(2);
    expect(adherence.avgCalories).toBe(2700);
    expect(adherence.rate).toBeCloseTo(2 / 28, 4);
  });

  it("collects valid meal reminders ordered by time", () => {
    const reminders = collectMealReminders(
      [meal("dinner", 600, "20:00"), meal("breakfast", 400, "07:30"), meal("lunch", 700, "invalido")],
      "Refeicao",
    );

    expect(reminders).toHaveLength(2);
    expect(reminders[0]).toMatchObject({ type: "breakfast", hour: 7, minute: 30 });
    expect(reminders[1]).toMatchObject({ type: "dinner", hour: 20, minute: 0 });
  });
});
