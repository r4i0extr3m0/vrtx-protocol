export interface ExerciseSet {
  id: string;
  reps: number;
  weightKg: number;
  completed: boolean;
  notes?: string;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  userId?: string;
  name: string;
  date: string;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  exercises: ExerciseEntry[];
  syncStatus: "local" | "pending" | "synced" | "failed";
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  biometricsEnabled?: boolean;
  onboardingCompleted?: boolean;
  weight?: number;
  height?: number;
  goal?: "gain" | "lose" | "maintain";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  notes?: string;
  createdAt: string;
  syncStatus: "local" | "pending" | "synced" | "failed";
}

export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  repsTarget: number;
  weightKg?: number;
}

export interface Template {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: string;
  syncStatus: "local" | "pending" | "synced" | "failed";
}

export interface MealItem {
  id: string;
  foodName: string;
  quantity: number; // em gramas
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: "local" | "pending" | "synced" | "failed";
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Food {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  syncStatus: "local" | "pending" | "synced" | "failed";
}

export interface GamificationData {
  streak: number;
  totalXP: number;
  level: number;
  badges: string[];
  lastActivityDate?: string;
}

export interface SyncQueueOperation<TData = object> {
  id: string;
  entity: "workout" | "auth" | "exercise" | "template" | "meal" | "food" | "gamification";
  type: "create" | "update" | "delete";
  table: string;
  data: TData;
  timestamp: number;
  retries: number;
  lastError?: string;
}
