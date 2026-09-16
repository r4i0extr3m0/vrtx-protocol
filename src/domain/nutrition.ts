import type {
  CoachNutritionPlan,
  CoachPrescription,
  NutritionTargets,
  PrescriptionExercise,
} from "@/src/types";

/** Seleciona as metas do dia conforme treino ou descanso. */
export function selectNutritionTargets(
  plan: CoachNutritionPlan,
  isTrainingDay: boolean,
): NutritionTargets {
  return isTrainingDay ? plan.trainingDay : plan.restDay;
}

/** Estima o gasto calorico de um treino prescrito. */
export function estimateWorkoutBurn(exercises: PrescriptionExercise[]): number {
  const totalReps = exercises.reduce(
    (acc, exercise) => acc + (exercise.targetSets ?? 3) * (exercise.targetReps ?? 10),
    0,
  );
  return Math.round(60 + totalReps * 1.4);
}

/** Retorna o treino prescrito para a data informada, se houver. */
export function findTodayPrescription(
  prescriptions: CoachPrescription[],
  isoToday: string,
): CoachPrescription | null {
  return prescriptions.find((item) => item.scheduledFor === isoToday) ?? null;
}
