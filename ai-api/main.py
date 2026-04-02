import os
from typing import Literal, Optional, List

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(title="CoreIronTrack AI API", version="0.1.0")


FitnessObjective = Literal["hypertrophy", "weight_loss", "performance"]
TrainingLevel = Literal["beginner", "intermediate", "advanced"]


class Last7DaysSummary(BaseModel):
    workout_count: int = Field(ge=0)
    total_volume_kg: Optional[float] = Field(default=None, ge=0)
    avg_session_minutes: Optional[float] = Field(default=None, ge=0)
    calories_avg: Optional[int] = Field(default=None, ge=0)
    protein_g_avg: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None


class AnalyzeRequest(BaseModel):
    user_id: Optional[str] = None
    objective: FitnessObjective
    level: TrainingLevel
    last_7_days: Last7DaysSummary


class AnalyzeResponse(BaseModel):
    summary: str
    training_recommendations: List[str]
    nutrition_recommendations: List[str]
    warnings: List[str] = []
    next_best_actions: List[str] = []


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    objective: Optional[FitnessObjective] = None
    level: Optional[TrainingLevel] = None
    context: Optional[Last7DaysSummary] = None
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


def _build_analyze_prompt(req: AnalyzeRequest) -> str:
    return f"""
Você é um coach especialista em treino e nutrição focado em hipertrofia e performance.
Você deve retornar recomendações curtas e acionáveis em português (Brasil).

Dados (últimos 7 dias):
- Treinos: {req.last_7_days.workout_count}
- Volume total (kg): {req.last_7_days.total_volume_kg}
- Duração média (min): {req.last_7_days.avg_session_minutes}
- Calorias média/dia: {req.last_7_days.calories_avg}
- Proteína média/dia (g): {req.last_7_days.protein_g_avg}
- Observações: {req.last_7_days.notes}

Objetivo: {req.objective}
Nível: {req.level}

Responda APENAS em JSON com este formato:
{{
  "summary": "string",
  "training_recommendations": ["..."],
  "nutrition_recommendations": ["..."],
  "warnings": ["..."],
  "next_best_actions": ["..."]
}}
""".strip()


def _fallback_analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    wk = req.last_7_days.workout_count
    objective = req.objective

    training = []
    nutrition = []
    warnings = []
    actions = []

    if wk == 0:
        training.append("Comece com 3 treinos/semana (full body) para ganhar consistência.")
        actions.append("Agendar 3 treinos curtos (35–45min) nesta semana.")
    elif wk < 3:
        training.append("Suba para 3 sessões/semana antes de aumentar intensidade.")
        actions.append("Definir dias fixos (ex.: seg/qua/sex) e alarme de treino.")
    else:
        training.append("Mantenha 3–5 sessões/semana e progrida 1 variável por vez (carga ou repetições).")
        actions.append("Escolher 2 exercícios-base para perseguir PRs com segurança.")

    if objective == "hypertrophy":
        nutrition.append("Priorize proteína diária e superávit leve (+150 a +250 kcal), ajustando por evolução semanal.")
        training.append("Meta: 10–20 séries efetivas por grupo muscular/semana (RIR 1–3).")
    elif objective == "weight_loss":
        nutrition.append("Use déficit moderado (-300 a -500 kcal) e proteína alta para preservar massa magra.")
        training.append("Mantenha a força: foque em movimentos compostos + passos diários.")
    else:
        nutrition.append("Carboidratos ao redor do treino (pré/pós) para sustentar performance.")
        training.append("Planeje 1 semana de deload a cada 4–6 semanas se houver fadiga acumulada.")

    if req.last_7_days.protein_g_avg is not None and req.last_7_days.protein_g_avg < 120:
        warnings.append("Sua proteína média parece baixa para otimizar resultados; tente subir gradualmente.")
        actions.append("Adicionar 1 refeição proteica (ex.: iogurte grego + whey) por dia.")

    return AnalyzeResponse(
        summary="Plano gerado em modo offline (sem LLM configurado).",
        training_recommendations=training[:6],
        nutrition_recommendations=nutrition[:6],
        warnings=warnings[:6],
        next_best_actions=actions[:6],
    )


async def _call_gemini(prompt: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY não configurada")

    model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4},
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        data = r.json()
        # candidates[0].content.parts[0].text
        return (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )


async def _call_claude(prompt: str) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY não configurada")

    model = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest")
    url = "https://api.anthropic.com/v1/messages"

    payload = {
        "model": model,
        "max_tokens": 800,
        "temperature": 0.4,
        "messages": [{"role": "user", "content": prompt}],
    }

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
        # content[0].text
        parts = data.get("content", [])
        if parts and isinstance(parts, list) and "text" in parts[0]:
            return parts[0]["text"]
        return ""


async def _call_llm(prompt: str) -> str:
    provider = os.environ.get("LLM_PROVIDER", "gemini").lower()
    if provider == "claude":
        return await _call_claude(prompt)
    return await _call_gemini(prompt)


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    prompt = _build_analyze_prompt(req)

    try:
        raw = await _call_llm(prompt)
        if not raw.strip():
            raise RuntimeError("LLM retornou vazio")
        # O LLM já foi instruído para retornar JSON puro
        return AnalyzeResponse.model_validate_json(raw)
    except Exception:
        # MVP: fallback determinístico para dev/offline
        return _fallback_analyze(req)


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    # Chat MVP: transforma histórico em um único prompt.
    history = "\n".join([f"{m.role.upper()}: {m.content}" for m in req.messages[-16:]])
    ctx = req.context
    ctx_text = ""
    if ctx:
        ctx_text = (
            f"\nContexto (7d): treinos={ctx.workout_count}, "
            f"volume_kg={ctx.total_volume_kg}, "
            f"calorias={ctx.calories_avg}, "
            f"proteina_g={ctx.protein_g_avg}.\n"
        )

    prompt = f"""Você é o AI Coach do CoreIronTrack.
Responda em português (Brasil), direto e com bullets quando útil.
{ctx_text}
Objetivo: {req.objective}
Nível: {req.level}

Histórico:
{history}

ASSISTANT:
""".strip()

    try:
        raw = await _call_llm(prompt)
        reply = raw.strip()
        if not reply:
            raise RuntimeError("LLM retornou vazio")
        return ChatResponse(reply=reply)
    except Exception:
        return ChatResponse(reply="Estou sem conexão com o modelo agora. Me diga seu objetivo e como foi sua semana que eu te ajudo com um plano base.")
