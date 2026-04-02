import { describe, expect, it } from "vitest";

import { calculateOneRM, calculateWorkoutVolume, findBestEstimatedOneRM } from "../src/domain/strength";
import {
  createExerciseEntry,
  createExerciseSet,
  createWorkoutDraft,
  summarizeWorkout,
} from "../src/domain/workout";

describe("workout domain", () => {
  it("creates default draft and summarizes volume and 1RM", () => {
    const bench = createExerciseEntry({
      name: "Supino reto",
      sets: [
        createExerciseSet({ reps: 5, weightKg: 100 }),
        createExerciseSet({ reps: 8, weightKg: 80 }),
      ],
    });
    const squat = createExerciseEntry({
      name: "Agachamento",
      sets: [createExerciseSet({ reps: 3, weightKg: 140 })],
    });

    const workout = createWorkoutDraft({
      name: "Treino de força",
      exercises: [bench, squat],
    });

    const summary = summarizeWorkout(workout);

    expect(workout.name).toBe("Treino de força");
    expect(summary.exerciseCount).toBe(2);
    expect(summary.setCount).toBe(3);
    expect(summary.totalVolume).toBe(1560);
    expect(summary.bestOneRM).toBeCloseTo(148.24, 2);
  });

  it("ignores incomplete sets in volume and estimated 1RM", () => {
    const sets = [
      createExerciseSet({ reps: 5, weightKg: 100, completed: true }),
      createExerciseSet({ reps: 10, weightKg: 60, completed: false }),
    ];

    expect(calculateWorkoutVolume(sets)).toBe(500);
    expect(findBestEstimatedOneRM(sets)).toBeCloseTo(calculateOneRM(100, 5), 5);
  });

  it("creates fallback defaults for exercise and set factories", () => {
    const setEntry = createExerciseSet();
    const exercise = createExerciseEntry();
    const workout = createWorkoutDraft();

    expect(setEntry.completed).toBe(true);
    expect(exercise.sets).toHaveLength(1);
    expect(workout.exercises).toEqual([]);
    expect(workout.syncStatus).toBe("local");
  });
});
