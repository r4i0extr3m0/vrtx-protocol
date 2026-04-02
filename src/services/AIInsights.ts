import { env } from "@/src/constants/env";
import type { AIAnalyzeRequest, AIAnalyzeResponse, AIChatRequest, AIChatResponse } from "@/src/types/ai";

function getBaseUrl(): string {
  return env.aiApiUrl.replace(/\/+$/, "");
}

function toApiAnalyzeRequest(req: AIAnalyzeRequest) {
  return {
    user_id: req.userId,
    objective: req.objective,
    level: req.level,
    last_7_days: {
      workout_count: req.last7Days.workoutCount,
      total_volume_kg: req.last7Days.totalVolumeKg,
      avg_session_minutes: req.last7Days.avgSessionMinutes,
      calories_avg: req.last7Days.caloriesAvg,
      protein_g_avg: req.last7Days.proteinGAvg,
      notes: req.last7Days.notes,
    },
  };
}

function toApiChatRequest(req: AIChatRequest) {
  return {
    objective: req.objective,
    level: req.level,
    context: req.context
      ? {
          workout_count: req.context.workoutCount,
          total_volume_kg: req.context.totalVolumeKg,
          avg_session_minutes: req.context.avgSessionMinutes,
          calories_avg: req.context.caloriesAvg,
          protein_g_avg: req.context.proteinGAvg,
          notes: req.context.notes,
        }
      : undefined,
    messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
  };
}

function fromApiAnalyzeResponse(json: unknown): AIAnalyzeResponse {
  const obj = (json ?? {}) as Record<string, unknown>;
  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    trainingRecommendations: asStringArray(obj.trainingRecommendations ?? obj.training_recommendations),
    nutritionRecommendations: asStringArray(obj.nutritionRecommendations ?? obj.nutrition_recommendations),
    warnings: asStringArray(obj.warnings),
    nextBestActions: asStringArray(obj.nextBestActions ?? obj.next_best_actions),
  };
}

export async function fetchAIRecommendations(req: AIAnalyzeRequest): Promise<AIAnalyzeResponse> {
  const url = `${getBaseUrl()}/analyze`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(toApiAnalyzeRequest(req)),
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar AI API (${response.status})`);
  }

  const json = (await response.json()) as unknown;
  return fromApiAnalyzeResponse(json);
}

export async function sendAIChatMessage(req: AIChatRequest): Promise<AIChatResponse> {
  const url = `${getBaseUrl()}/chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(toApiChatRequest(req)),
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar AI Chat (${response.status})`);
  }

  return (await response.json()) as AIChatResponse;
}
