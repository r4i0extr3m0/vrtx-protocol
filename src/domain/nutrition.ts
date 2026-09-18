import type {
  CoachNutritionPlan,
  CoachPrescription,
  MealItem,
  NutritionCheckin,
  NutritionFoodItem,
  NutritionMeal,
  NutritionMealType,
  NutritionTargets,
  PrescriptionExercise,
  TacoFood,
} from "@/src/types";

export const NUTRITION_MEAL_ORDER: NutritionMealType[] = [
  "breakfast",
  "morningSnack",
  "lunch",
  "afternoonSnack",
  "dinner",
  "supper",
];

export const EMPTY_TARGETS: NutritionTargets = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

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

function addTargets(base: NutritionTargets, item: NutritionTargets): NutritionTargets {
  return {
    calories: base.calories + item.calories,
    protein: base.protein + item.protein,
    carbs: base.carbs + item.carbs,
    fat: base.fat + item.fat,
  };
}

/** Soma os macros de uma lista de alimentos do plano. */
export function sumNutritionItems(items: NutritionFoodItem[]): NutritionTargets {
  return items.reduce(
    (acc, item) =>
      addTargets(acc, {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }),
    { ...EMPTY_TARGETS },
  );
}

/** Soma os macros de uma refeicao (todos os itens). */
export function sumNutritionMeal(meal: NutritionMeal): NutritionTargets {
  return sumNutritionItems(meal.items);
}

/** Soma os macros de todas as refeicoes do plano. */
export function sumNutritionMeals(meals: NutritionMeal[]): NutritionTargets {
  return meals.reduce(
    (acc, meal) => addTargets(acc, sumNutritionMeal(meal)),
    { ...EMPTY_TARGETS },
  );
}

/** Ordena as refeicoes na sequencia natural do dia. */
export function sortNutritionMeals(meals: NutritionMeal[]): NutritionMeal[] {
  return [...meals].sort(
    (a, b) => NUTRITION_MEAL_ORDER.indexOf(a.type) - NUTRITION_MEAL_ORDER.indexOf(b.type),
  );
}

/** Cria um item do plano a partir de um alimento da base, com a quantidade em gramas. */
export function createItemFromTaco(food: TacoFood, quantity: number, unit?: string): NutritionFoodItem {
  const factor = Number.isFinite(quantity) && quantity > 0 ? quantity / 100 : 0;
  return {
    id: `item-${food.id}-${Math.random().toString(36).slice(2, 8)}`,
    foodId: food.id,
    name: food.name,
    quantity,
    unit: unit ?? food.defaultUnit ?? "g",
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
  };
}

/** Converte uma refeicao prescrita em itens do diario do aluno. */
export function nutritionMealToDietItems(meal: NutritionMeal): MealItem[] {
  return meal.items.map((item, index) => ({
    id: `plan-${meal.id}-${item.id ?? index}`,
    foodId: item.foodId ?? undefined,
    foodName: item.name,
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  }));
}

export interface NutritionAdherence {
  plannedMeals: number;
  followedMeals: number;
  rate: number;
  avgCalories: number;
  daysTracked: number;
}

/** Calcula aderencia nutricional comparando refeicoes planejadas x registradas. */
export function calculateNutritionAdherence(
  mealsPerDay: number,
  checkins: NutritionCheckin[],
  windowDays: number,
): NutritionAdherence {
  const plannedMeals = Math.max(mealsPerDay, 0) * Math.max(windowDays, 0);
  const followed = checkins.filter((checkin) => checkin.followed);
  const totalCalories = followed.reduce((acc, checkin) => acc + checkin.calories, 0);

  return {
    plannedMeals,
    followedMeals: followed.length,
    rate: plannedMeals > 0 ? Math.min(followed.length / plannedMeals, 1) : 0,
    avgCalories: followed.length > 0 ? Math.round(totalCalories / followed.length) : 0,
    daysTracked: windowDays,
  };
}

export interface MealReminder {
  mealId: string;
  type: NutritionMealType;
  title: string;
  hour: number;
  minute: number;
}

function parseTime(value: string | null | undefined): { hour: number; minute: number } | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Extrai os horarios validos das refeicoes para agendar lembretes locais. */
export function collectMealReminders(
  meals: NutritionMeal[],
  fallbackTitle: string,
): MealReminder[] {
  const reminders: MealReminder[] = [];

  for (const meal of meals) {
    const parsed = parseTime(meal.time);
    if (!parsed) continue;
    reminders.push({
      mealId: meal.id,
      type: meal.type,
      title: meal.title?.trim() || fallbackTitle,
      hour: parsed.hour,
      minute: parsed.minute,
    });
  }

  return reminders.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}
