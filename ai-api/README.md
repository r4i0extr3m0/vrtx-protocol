# CoreIronTrack AI API (FastAPI)

API simples para gerar **recomendações preditivas** (treino + nutrição) usando um LLM (Gemini ou Claude).

## Rodar localmente

```bash
cd ai-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt --break-system-packages
uvicorn main:app --reload --port 8000
```

## Variáveis de ambiente

Escolha um provedor:

```bash
export LLM_PROVIDER=gemini   # ou claude
```

### Gemini
```bash
export GEMINI_API_KEY="..."
export GEMINI_MODEL="gemini-2.0-flash"   # opcional
```

### Claude (Anthropic)
```bash
export ANTHROPIC_API_KEY="..."
export ANTHROPIC_MODEL="claude-3-5-sonnet-latest" # opcional
```

## Endpoints

- `GET /health` → status
- `POST /analyze` → recomendações estruturadas (JSON)
- `POST /chat` → chat simples (MVP)

## Integração no app

No `.env` do app:

```env
EXPO_PUBLIC_AI_API_URL=http://localhost:8000
```

