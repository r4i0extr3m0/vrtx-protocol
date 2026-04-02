export interface ExerciseAsymmetry {
  exerciseId: string;
  exerciseName: string;
  leftSide: number; // weight or reps
  rightSide: number;
  asymmetryPercentage: number;
  date: Date;
  unit: "kg" | "lbs" | "reps";
}

export interface AsymmetryAlert {
  id: string;
  exerciseId: string;
  exerciseName: string;
  asymmetryPercentage: number;
  severity: "warning" | "critical"; // warning: 10-15%, critical: >15%
  message: string;
  suggestedExercises: string[];
  createdAt: Date;
}

export interface AsymmetryTrend {
  exerciseId: string;
  exerciseName: string;
  currentAsymmetry: number;
  previousAsymmetry: number | null;
  trend: "improving" | "worsening" | "stable";
  changePercentage: number;
}

export class AsymmetryAnalyzer {
  static calculateAsymmetry(left: number, right: number): number {
    if (left === 0 && right === 0) return 0;
    const max = Math.max(left, right);
    const min = Math.min(left, right);
    return ((max - min) / max) * 100;
  }

  static isAsymmetryAlert(asymmetry: number): "warning" | "critical" | null {
    if (asymmetry >= 15) return "critical";
    if (asymmetry >= 10) return "warning";
    return null;
  }

  static getSuggestedExercises(exerciseName: string, side: "left" | "right"): string[] {
    const suggestions: Record<string, Record<string, string[]>> = {
      "Supino": {
        left: ["Supino com haltere", "Supino unilateral esquerdo"],
        right: ["Supino com haltere", "Supino unilateral direito"],
      },
      "Rosca Direta": {
        left: ["Rosca com haltere esquerdo", "Rosca Scott unilateral"],
        right: ["Rosca com haltere direito", "Rosca Scott unilateral"],
      },
      "Agachamento": {
        left: ["Agachamento com haltere unilateral", "Leg press unilateral"],
        right: ["Agachamento com haltere unilateral", "Leg press unilateral"],
      },
      "Leg Press": {
        left: ["Leg press unilateral esquerdo", "Agachamento com haltere"],
        right: ["Leg press unilateral direito", "Agachamento com haltere"],
      },
    };

    return suggestions[exerciseName]?.[side] || [
      "Exercícios unilaterais para corrigir desequilíbrio",
      "Aumentar volume no lado mais fraco",
    ];
  }

  static calculateTrend(
    current: ExerciseAsymmetry,
    previous: ExerciseAsymmetry | null
  ): AsymmetryTrend {
    const trend: AsymmetryTrend = {
      exerciseId: current.exerciseId,
      exerciseName: current.exerciseName,
      currentAsymmetry: current.asymmetryPercentage,
      previousAsymmetry: previous?.asymmetryPercentage ?? null,
      trend: "stable",
      changePercentage: 0,
    };

    if (previous) {
      const change = current.asymmetryPercentage - previous.asymmetryPercentage;
      trend.changePercentage = change;

      if (change < -0.5) {
        trend.trend = "improving";
      } else if (change > 0.5) {
        trend.trend = "worsening";
      }
    }

    return trend;
  }
}
