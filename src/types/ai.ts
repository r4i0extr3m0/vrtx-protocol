export type FitnessObjective = "hypertrophy" | "weight_loss" | "performance";
export type TrainingLevel = "beginner" | "intermediate" | "advanced";

export interface Last7DaysSummary {
  workoutCount: number;
  totalVolumeKg?: number;
  avgSessionMinutes?: number;
  caloriesAvg?: number;
  proteinGAvg?: number;
  notes?: string;
}

export interface AIAnalyzeRequest {
  userId?: string;
  objective: FitnessObjective;
  level: TrainingLevel;
  last7Days: Last7DaysSummary;
}

export interface AIAnalyzeResponse {
  summary: string;
  trainingRecommendations: string[];
  nutritionRecommendations: string[];
  warnings?: string[];
  nextBestActions?: string[];
}

export type AIChatRole = "user" | "assistant";

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
  createdAt: number;
}

export interface AIChatRequest {
  objective?: FitnessObjective;
  level?: TrainingLevel;
  context?: Last7DaysSummary;
  messages: Array<Pick<AIChatMessage, "role" | "content">>;
}

export interface AIChatResponse {
  reply: string;
}

