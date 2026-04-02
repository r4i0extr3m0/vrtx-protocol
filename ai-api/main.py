import hashlib
import json
import os
import re
import time
import asyncio
from typing import Literal, Optional, List, Dict, Any, Tuple

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
    meta: Dict[str, Any] = {}


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


class _TTLCache:
    def __init__(self, ttl_seconds: int, max_items: int) -> None:
        self.ttl_seconds = ttl_seconds
        self.max_items = max_items
        self._store: Dict[str, Tuple[float, str]] = {}

    def get(self, key: str) -> Optional[str]:
        item = self._store.get(key)
        if not item:
            return None
        expires_at, value = item
        if time.time() > expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: str) -> None:
        if len(self._store) >= self.max_items:
            # prune: remove expired first, then oldest
            now = time.time()
            expired = [k for k, (exp, _) in self._store.items() if exp <= now]
            for k in expired:
                self._store.pop(k, None)
            if len(self._store) >= self.max_items:
                # remove one arbitrary (dict order ~= insertion order)
                oldest_key = next(iter(self._store.keys()))
                self._store.pop(oldest_key, None)
        self._store[key] = (time.time() + self.ttl_seconds, value)


ANALYZE_CACHE = _TTLCache(ttl_seconds=int(os.environ.get("ANALYZE_CACHE_TTL_SECONDS", "3600")), max_items=512)


def _stable_json_dumps(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _analyze_cache_key(req: AnalyzeRequest) -> str:
    payload = req.model_dump()
    raw = _stable_json_dumps(payload)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _extract_json_object(text: str) -> str:
    cleaned = text.strip()
    # Remove ```json fences if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    # Try direct JSON
    try:
        json.loads(cleaned)
        return cleaned
    except Exception:
        pass

    # Try to find first {...} block
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        candidate = cleaned[start : end + 1]
        json.loads(candidate)  # raises if invalid
        return candidate

    raise ValueError("Não foi possível extrair JSON da resposta do LLM")


def _build_analyze_prompt(req: AnalyzeRequest) -> str:
    return f"""
Você é um coach especialista em treino e nutrição.
Você deve retornar recomendações curtas, específicas e acionáveis em português (Brasil).

Regras:
- Personalize as sugestões usando os números fornecidos.
- Evite generalidades; use metas, ranges e exemplos práticos.
- Quando houver falta de dados, peça UMA informação faltante (máximo 1) e sugira um plano provisório.
- Não mencione política, modelos, prompts ou termos técnicos.

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
    max_attempts = int(os.environ.get("LLM_MAX_ATTEMPTS", "3"))
    backoff_seconds = 1.0

    for attempt in range(1, max_attempts + 1):
        try:
            if provider == "claude":
                return await _call_claude(prompt)
            return await _call_gemini(prompt)
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            # retry on rate limit / server errors
            if status in (408, 409, 429) or 500 <= status <= 599:
                if attempt == max_attempts:
                    raise
                await asyncio.sleep(backoff_seconds)
                backoff_seconds = min(backoff_seconds * 2, 8)
                continue
            raise
        except (httpx.TimeoutException, httpx.NetworkError):
            if attempt == max_attempts:
                raise
            await asyncio.sleep(backoff_seconds)
            backoff_seconds = min(backoff_seconds * 2, 8)
            continue


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    cache_key = _analyze_cache_key(req)
    cached = ANALYZE_CACHE.get(cache_key)
    if cached:
        try:
            model = AnalyzeResponse.model_validate_json(cached)
            model.meta = {**(model.meta or {}), "mode": "cache", "cache_key": cache_key}
            return model
        except Exception:
            # cache corrupta: ignora
            pass

    prompt = _build_analyze_prompt(req)

    try:
        raw = await _call_llm(prompt)
        if not raw.strip():
            raise RuntimeError("LLM retornou vazio")
        json_text = _extract_json_object(raw)
        model = AnalyzeResponse.model_validate_json(json_text)
        model.meta = {**(model.meta or {}), "mode": "llm", "provider": os.environ.get("LLM_PROVIDER", "gemini"), "cache_key": cache_key}
        ANALYZE_CACHE.set(cache_key, model.model_dump_json())
        return model
    except Exception:
        # MVP: fallback determinístico para dev/offline
        model = _fallback_analyze(req)
        model.meta = {**(model.meta or {}), "mode": "fallback", "cache_key": cache_key}
        ANALYZE_CACHE.set(cache_key, model.model_dump_json())
        return model


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


class FeedbackRequest(BaseModel):
    kind: Literal["analyze", "chat"]
    rating: Literal[-1, 1]
    user_id: Optional[str] = None
    cache_key: Optional[str] = None
    comment: Optional[str] = Field(default=None, max_length=500)


@app.post("/feedback")
async def feedback(req: FeedbackRequest) -> dict:
    # MVP: grava em JSONL local (em serverless pode ser efêmero; para produção usar DB/KV)
    path = os.environ.get("FEEDBACK_PATH", "./feedback.jsonl")
    payload = {**req.model_dump(), "ts": int(time.time())}
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write(_stable_json_dumps(payload) + "\n")
    except Exception:
        # não falha a UX se não der pra persistir
        return {"ok": True, "stored": False}
    return {"ok": True, "stored": True}
