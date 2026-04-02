import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import {
  ExerciseAsymmetry,
  AsymmetryAlert,
  AsymmetryAnalyzer,
} from "@/src/domain/entities/AsymmetryAnalysis";

interface AsymmetryState {
  asymmetries: ExerciseAsymmetry[];
  alerts: AsymmetryAlert[];
  addAsymmetry: (asymmetry: ExerciseAsymmetry) => void;
  getAsymmetriesByExercise: (exerciseId: string) => ExerciseAsymmetry[];
  getLatestAsymmetry: (exerciseId: string) => ExerciseAsymmetry | null;
  getAlerts: () => AsymmetryAlert[];
  dismissAlert: (alertId: string) => void;
  calculateAndAddAsymmetry: (
    exerciseId: string,
    exerciseName: string,
    left: number,
    right: number,
    unit: "kg" | "lbs" | "reps"
  ) => void;
}

export const useAsymmetryStore = create<AsymmetryState>()(
  persist(
    (set, get) => ({
      asymmetries: [],
      alerts: [],

      addAsymmetry: (asymmetry: ExerciseAsymmetry) => {
        set((state) => ({
          asymmetries: [...state.asymmetries, asymmetry],
        }));
      },

      getAsymmetriesByExercise: (exerciseId: string) => {
        return get().asymmetries.filter((a) => a.exerciseId === exerciseId);
      },

      getLatestAsymmetry: (exerciseId: string) => {
        const asymmetries = get().getAsymmetriesByExercise(exerciseId);
        return asymmetries.length > 0 ? asymmetries[asymmetries.length - 1] : null;
      },

      getAlerts: () => {
        return get().alerts;
      },

      dismissAlert: (alertId: string) => {
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== alertId),
        }));
      },

      calculateAndAddAsymmetry: (
        exerciseId: string,
        exerciseName: string,
        left: number,
        right: number,
        unit: "kg" | "lbs" | "reps"
      ) => {
        const asymmetryPercentage = AsymmetryAnalyzer.calculateAsymmetry(left, right);
        const asymmetry: ExerciseAsymmetry = {
          exerciseId,
          exerciseName,
          leftSide: left,
          rightSide: right,
          asymmetryPercentage,
          date: new Date(),
          unit,
        };

        get().addAsymmetry(asymmetry);

        // Check for alerts
        const alertLevel = AsymmetryAnalyzer.isAsymmetryAlert(asymmetryPercentage);
        if (alertLevel) {
          const side = left > right ? "right" : "left";
          const alert: AsymmetryAlert = {
            id: `${exerciseId}-${Date.now()}`,
            exerciseId,
            exerciseName,
            asymmetryPercentage,
            severity: alertLevel,
            message:
              alertLevel === "critical"
                ? `Assimetria crítica detectada: ${asymmetryPercentage.toFixed(1)}%`
                : `Assimetria detectada: ${asymmetryPercentage.toFixed(1)}%`,
            suggestedExercises: AsymmetryAnalyzer.getSuggestedExercises(
              exerciseName,
              side
            ),
            createdAt: new Date(),
          };

          set((state) => ({
            alerts: [...state.alerts, alert],
          }));
        }
      },
    }),
    {
      name: "asymmetry-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
    }
  )
);
