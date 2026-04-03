import { env } from "@/src/constants/env";
import { useAuthStore } from "@/src/store/authStore";
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

export class AIApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function withUserHeader(headers: HeadersInit | undefined, userId?: string): HeadersInit {
  const base = { ...(headers ?? {}) } as Record<string, string>;
  const token = useAuthStore.getState().session?.accessToken;
  if (token) {
    base.Authorization = `Bearer ${token}`;
  } else if (userId) {
    // Fallback dev: permite autenticação insegura quando a API estiver com ALLOW_INSECURE_USER_ID=true
    base["X-User-Id"] = userId;
  }
  return base;
}

async function fetchJsonWithTimeout<T>(url: string, init: RequestInit, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      let code: string | undefined;
      try {
        const errJson = (await response.json()) as any;
        code = typeof errJson?.error === "string" ? errJson.error : typeof errJson?.detail?.error === "string" ? errJson.detail.error : undefined;
        message =
          typeof errJson?.message === "string"
            ? errJson.message
            : typeof errJson?.detail?.message === "string"
              ? errJson.detail.message
              : message;
      } catch {
        // ignore
      }
      throw new AIApiError(message, response.status, code);
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
      headers: withUserHeader({ "content-type": "application/json" }, req.userId),
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
      headers: withUserHeader({ "content-type": "application/json" }, req.userId),
      body: JSON.stringify(toApiChatRequest(req)),
    },
    20000
  );
}

export async function sendAIFeedback(req: AIFeedbackRequest): Promise<{ ok: boolean; stored?: boolean }> {
  const url = `${getBaseUrl()}/feedback`;
  return await fetchJsonWithTimeout<{ ok: boolean; stored?: boolean }>(url, {
    method: "POST",
    headers: withUserHeader({ "content-type": "application/json" }, req.userId),
    body: JSON.stringify({
      kind: req.kind,
      rating: req.rating,
      user_id: req.userId,
      cache_key: req.cacheKey,
      comment: req.comment,
    }),
  });
}

export interface AIUsageResponse {
  user_id: string;
  is_premium: boolean;
  analyze: { limit: number; used: number; remaining: number };
  chat: { limit: number; used: number; remaining: number };
  reset_at: string;
}

export async function fetchAIUsage(userId: string): Promise<AIUsageResponse> {
  const url = `${getBaseUrl()}/usage?user_id=${encodeURIComponent(userId)}`;
  return await fetchJsonWithTimeout<AIUsageResponse>(
    url,
    {
      method: "GET",
      headers: withUserHeader({}, userId),
    },
    8000
  );
}
