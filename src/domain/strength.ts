export interface LoadSetInput {
  reps: number;
  weightKg: number;
  completed?: boolean;
}

/**
 * Calcula o volume total de treino somando carga x repetições das séries concluídas.
 */
export function calculateWorkoutVolume(sets: LoadSetInput[]): number {
  return sets.reduce((total, current) => {
    if (current.completed === false) {
      return total;
    }

    return total + current.reps * current.weightKg;
  }, 0);
}

/**
 * Calcula a estimativa de 1RM pela fórmula de Brzycki.
 */
export function calculateOneRM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) {
    return 0;
  }

  if (reps === 1) {
    return weightKg;
  }

  const divisor = 1.0278 - 0.0278 * reps;
  if (divisor <= 0) {
    return weightKg;
  }

  return Number((weightKg / divisor).toFixed(2));
}

export function findBestEstimatedOneRM(sets: LoadSetInput[]): number {
  return sets.reduce((best, current) => {
    if (current.completed === false) {
      return best;
    }

    return Math.max(best, calculateOneRM(current.weightKg, current.reps));
  }, 0);
}
