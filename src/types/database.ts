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

export type UserRole = "client" | "coach";

export type CoachPlan = "free" | "basic" | "plus" | "premier";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
  biometricsEnabled?: boolean;
  onboardingCompleted?: boolean;
  weight?: number;
  height?: number;
  goal?: "gain" | "lose" | "maintain";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  role?: UserRole;
  cref?: string;
  coachPlan?: CoachPlan | null;
}

export type CoachClientStatus = "pending" | "active" | "removed";

export interface CoachClientLink {
  id: string;
  coachId: string;
  clientId: string | null;
  inviteCode: string;
  status: CoachClientStatus;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface CoachClientListItem {
  linkId: string;
  clientId: string | null;
  name: string;
  email: string;
  status: CoachClientStatus;
  inviteCode: string;
  acceptedAt?: string | null;
}

export interface ClaimInviteResult {
  coachId: string;
  coachName?: string;
}

export interface PrescriptionExercise {
  id: string;
  name: string;
  muscleGroup?: string | null;
  targetSets: number;
  targetReps: number;
  targetWeightKg?: number | null;
  notes?: string | null;
}

export type PrescriptionStatus = "active" | "archived";

export interface CoachPrescription {
  id: string;
  coachId: string;
  clientId: string;
  name: string;
  notes?: string | null;
  scheduledFor?: string | null;
  status: PrescriptionStatus;
  createdAt: string;
  exercises: PrescriptionExercise[];
}

export interface PrescriptionExerciseInput {
  name: string;
  muscleGroup?: string | null;
  sets: number;
  repsTarget: number;
  weightKg?: number | null;
  notes?: string | null;
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
  id?: string;
  foodId?: string;
  foodName?: string;
  name?: string;
  quantity?: number; // em gramas
  amount?: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "water";
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: "local" | "pending" | "synced" | "failed";
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl?: number;
}

export interface Food {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: number;
  servingUnit?: string;
  category?: string;
  syncStatus: "local" | "pending" | "synced" | "failed";
}

export interface GamificationData {
  streak: number;
  totalXP: number;
  level: number;
  badges: string[];
  lastActivityDate?: string;
  // v2: missões + liga (MVP local)
  dailyId?: string; // YYYY-MM-DD
  dailyMissions?: {
    id: string;
    title: string;
    description: string;
    target: number;
    progress: number;
    rewardXp: number;
    completedAt?: string; // ISO
    claimedAt?: string; // ISO
    kind: "workout" | "diet" | "water" | "checkin";
  }[];
  weekId?: string; // ex: 2026-W14
  league?: {
    tier: "Bronze" | "Prata" | "Ouro" | "Safira" | "Rubi" | "Esmeralda" | "Diamante";
    xpThisWeek: number;
    rank: number;
    promotionCutoff: number;
    demotionCutoff: number;
  };
}

export interface SyncQueueOperation<TData = object> {
  id: string;
  entity:
    | "workout"
    | "auth"
    | "exercise"
    | "template"
    | "meal"
    | "food"
    | "gamification"
    | "body_composition";
  type: "create" | "update" | "delete";
  table: string;
  data: TData;
  timestamp: number;
  retries: number;
  lastError?: string;
}

// ----------------------------
// Bioimpedância / Composição corporal
// ----------------------------

export interface BodyCompositionSegments {
  // Valores em kg (quando aplicável) ou percentuais; para MVP usamos kg de massa muscular por segmento.
  leftArmKg?: number;
  rightArmKg?: number;
  leftLegKg?: number;
  rightLegKg?: number;
  trunkKg?: number;
}

export interface BodyCompositionEntry {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  bodyFatPercent?: number;
  leanMassKg?: number;
  muscleMassKg?: number;
  segments?: BodyCompositionSegments;
  notes?: string;
  createdAt: string;
  syncStatus: "local" | "pending" | "synced" | "failed";
}
