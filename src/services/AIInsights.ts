import { env } from "@/src/constants/env";
import type {
  AIAnalyzeRequest,
  AIAnalyzeResponse,
  AIChatRequest,
  AIChatResponse,
  AIFeedbackRequest,
} from "@/src/types/ai";

function getBaseUrl(): string {
  return env.aiApiUrl.replace(/\/+$/, "");
}

async function fetchJsonWithTimeout<T>(url: string, init: RequestInit, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(id);
  }
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

  const metaRaw = (obj.meta ?? {}) as Record<string, unknown>;
  const meta = {
    mode: typeof metaRaw.mode === "string" ? metaRaw.mode : undefined,
    provider: typeof metaRaw.provider === "string" ? metaRaw.provider : undefined,
    cacheKey:
      typeof metaRaw.cache_key === "string"
        ? metaRaw.cache_key
        : typeof metaRaw.cacheKey === "string"
          ? metaRaw.cacheKey
          : undefined,
  };

  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    trainingRecommendations: asStringArray(obj.trainingRecommendations ?? obj.training_recommendations),
    nutritionRecommendations: asStringArray(obj.nutritionRecommendations ?? obj.nutrition_recommendations),
    warnings: asStringArray(obj.warnings),
    nextBestActions: asStringArray(obj.nextBestActions ?? obj.next_best_actions),
    meta,
  };
}

export async function fetchAIRecommendations(req: AIAnalyzeRequest): Promise<AIAnalyzeResponse> {
  const url = `${getBaseUrl()}/analyze`;
  const json = await fetchJsonWithTimeout<unknown>(
    url,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toApiAnalyzeRequest(req)),
    },
    15000
  );

  return fromApiAnalyzeResponse(json);
}

export async function sendAIChatMessage(req: AIChatRequest): Promise<AIChatResponse> {
  const url = `${getBaseUrl()}/chat`;
  return await fetchJsonWithTimeout<AIChatResponse>(
    url,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toApiChatRequest(req)),
    },
    20000
  );
}

export async function sendAIFeedback(req: AIFeedbackRequest): Promise<{ ok: boolean; stored?: boolean }> {
  const url = `${getBaseUrl()}/feedback`;
  return await fetchJsonWithTimeout<{ ok: boolean; stored?: boolean }>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: req.kind,
      rating: req.rating,
      user_id: req.userId,
      cache_key: req.cacheKey,
      comment: req.comment,
    }),
  });
}
