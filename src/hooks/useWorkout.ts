import { useMemo } from "react";

import { useWorkoutStore } from "@/src/store/workoutStore";

export function useWorkout() {
  const workouts = useWorkoutStore((state) => state.workouts);
  const activeWorkoutId = useWorkoutStore((state) => state.activeWorkoutId);
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const createWorkout = useWorkoutStore((state) => state.createWorkout);
  const createFromTemplate = useWorkoutStore((state) => state.createFromTemplate);
  const updateWorkout = useWorkoutStore((state) => state.updateWorkout);
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const removeExercise = useWorkoutStore((state) => state.removeExercise);
  const addSet = useWorkoutStore((state) => state.addSet);
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const removeSet = useWorkoutStore((state) => state.removeSet);
  const completeWorkout = useWorkoutStore((state) => state.completeWorkout);

  return useMemo(
    () => ({
      workouts,
      activeWorkoutId,
      hydrated,
      createWorkout,
      createFromTemplate,
      updateWorkout,
      addExercise,
      removeExercise,
      addSet,
      updateSet,
      removeSet,
      completeWorkout,
    }),
    [
      activeWorkoutId,
      addExercise,
      addSet,
      completeWorkout,
      createFromTemplate,
      createWorkout,
      hydrated,
      removeExercise,
      removeSet,
      updateSet,
      updateWorkout,
      workouts,
    ],
  );
}
