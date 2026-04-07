import { createExerciseEntry, createExerciseSet } from "@/src/domain/workout";
import type { ExerciseEntry, TemplateExercise } from "@/src/types";
import { createId } from "@/src/utils";

export interface WorkoutPreset {
  id: string;
  name: string;
  description: string;
  frequencyLabel: string;
  durationLabel: string;
  exercises: TemplateExercise[];
}

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: "full-body-3x",
    name: "Full Body",
    description: "Para quem quer consistencia com tres sessoes bem distribuidas na semana.",
    frequencyLabel: "3x/semana",
    durationLabel: "45-55 min",
    exercises: [
      { exerciseId: "preset-squat", exerciseName: "Agachamento livre", muscleGroup: "Pernas", sets: 3, repsTarget: 8, weightKg: 0 },
      { exerciseId: "preset-bench", exerciseName: "Supino reto", muscleGroup: "Peito", sets: 3, repsTarget: 8, weightKg: 0 },
      { exerciseId: "preset-row", exerciseName: "Remada curvada", muscleGroup: "Costas", sets: 3, repsTarget: 10, weightKg: 0 },
      { exerciseId: "preset-press", exerciseName: "Desenvolvimento com halteres", muscleGroup: "Ombros", sets: 2, repsTarget: 10, weightKg: 0 },
    ],
  },
  {
    id: "abc-5x",
    name: "ABC",
    description: "Boa opcao para quem treina mais dias e quer dividir o volume por grupamento.",
    frequencyLabel: "5x/semana",
    durationLabel: "55-70 min",
    exercises: [
      { exerciseId: "preset-bench-incline", exerciseName: "Supino inclinado", muscleGroup: "Peito", sets: 4, repsTarget: 10, weightKg: 0 },
      { exerciseId: "preset-fly", exerciseName: "Crucifixo maquina", muscleGroup: "Peito", sets: 3, repsTarget: 12, weightKg: 0 },
      { exerciseId: "preset-lat", exerciseName: "Puxada frontal", muscleGroup: "Costas", sets: 4, repsTarget: 10, weightKg: 0 },
      { exerciseId: "preset-curl", exerciseName: "Rosca direta", muscleGroup: "Bracos", sets: 3, repsTarget: 12, weightKg: 0 },
    ],
  },
  {
    id: "ppl-6x",
    name: "PPL",
    description: "Push, pull, legs para quem curte rotina intensa e progressao frequente.",
    frequencyLabel: "6x/semana",
    durationLabel: "60-75 min",
    exercises: [
      { exerciseId: "preset-press-shoulder", exerciseName: "Desenvolvimento militar", muscleGroup: "Ombros", sets: 4, repsTarget: 8, weightKg: 0 },
      { exerciseId: "preset-dip", exerciseName: "Paralelas", muscleGroup: "Triceps", sets: 3, repsTarget: 10, weightKg: 0 },
      { exerciseId: "preset-pullup", exerciseName: "Barra fixa", muscleGroup: "Costas", sets: 4, repsTarget: 8, weightKg: 0 },
      { exerciseId: "preset-romanian", exerciseName: "Levantamento romeno", muscleGroup: "Posterior", sets: 3, repsTarget: 10, weightKg: 0 },
    ],
  },
  {
    id: "upper-lower-4x",
    name: "Upper/Lower",
    description: "Divide superior e inferior com recuperacao equilibrada e bom ganho de volume.",
    frequencyLabel: "4x/semana",
    durationLabel: "50-65 min",
    exercises: [
      { exerciseId: "preset-row-machine", exerciseName: "Remada maquina", muscleGroup: "Costas", sets: 3, repsTarget: 10, weightKg: 0 },
      { exerciseId: "preset-bench-dumbbell", exerciseName: "Supino com halteres", muscleGroup: "Peito", sets: 3, repsTarget: 10, weightKg: 0 },
      { exerciseId: "preset-leg-press", exerciseName: "Leg press", muscleGroup: "Pernas", sets: 4, repsTarget: 12, weightKg: 0 },
      { exerciseId: "preset-lunge", exerciseName: "Afundo", muscleGroup: "Pernas", sets: 3, repsTarget: 12, weightKg: 0 },
    ],
  },
  {
    id: "quick-25",
    name: "Treino rapido 25min",
    description: "Fallback enxuto para dias corridos sem perder o habito de treinar.",
    frequencyLabel: "Quando precisar",
    durationLabel: "25 min",
    exercises: [
      { exerciseId: "preset-goblet", exerciseName: "Agachamento goblet", muscleGroup: "Pernas", sets: 3, repsTarget: 12, weightKg: 0 },
      { exerciseId: "preset-pushup", exerciseName: "Flexao de bracos", muscleGroup: "Peito", sets: 3, repsTarget: 12, weightKg: 0 },
      { exerciseId: "preset-row-band", exerciseName: "Remada com elástico", muscleGroup: "Costas", sets: 3, repsTarget: 15, weightKg: 0 },
    ],
  },
];

export function buildWorkoutExercises(templateExercises: TemplateExercise[]): ExerciseEntry[] {
  return templateExercises.map((exercise) =>
    createExerciseEntry({
      id: createId("exercise"),
      name: exercise.exerciseName,
      muscleGroup: exercise.muscleGroup,
      sets: Array.from({ length: exercise.sets }, () =>
        createExerciseSet({
          reps: exercise.repsTarget,
          weightKg: exercise.weightKg ?? 0,
          completed: false,
        }),
      ),
    }),
  );
}
