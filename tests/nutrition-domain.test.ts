import { describe, expect, it } from "vitest";

import {
  estimateWorkoutBurn,
  findTodayPrescription,
  selectNutritionTargets,
} from "../src/domain/nutrition";
import type { CoachNutritionPlan, CoachPrescription, PrescriptionExercise } from "../src/types";

const plan: CoachNutritionPlan = {
  id: "plan-1",
  coachId: "coach-1",
  clientId: "client-1",
  trainingDay: { calories: 2800, protein: 180, carbs: 300, fat: 80 },
  restDay: { calories: 2200, protein: 160, carbs: 200, fat: 75 },
  waterMl: 3000,
  notes: null,
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

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
});
