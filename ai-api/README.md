# VRTX Protocol AI API (FastAPI)

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

### Monetização (Premium + limites)

Para habilitar travas por usuário e checar premium no Supabase:

```bash
# Redis (Upstash) - recomendado em produção
export UPSTASH_REDIS_REST_URL="..."
export UPSTASH_REDIS_REST_TOKEN="..."

# Supabase (server-side)
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."
export SUPABASE_ANON_KEY="..." # usado para validar o access_token do usuário (Auth)

# Segurança: em produção, exija Authorization Bearer (Supabase access token)
export ALLOW_INSECURE_USER_ID=false
```

Limites (defaults):
```bash
export FREE_ANALYZE_LIMIT=5
export FREE_CHAT_LIMIT=0
export PREMIUM_ANALYZE_LIMIT=100
export PREMIUM_CHAT_LIMIT=200
```

## Endpoints

- `GET /health` → status
- `GET /usage` → limites restantes por dia (por usuário)
- `POST /analyze` → recomendações estruturadas (JSON)
- `POST /chat` → chat simples (MVP)
- `POST /feedback` → like/dislike para melhorar o sistema

## Integração no app

No `.env` do app:

```env
EXPO_PUBLIC_AI_API_URL=http://localhost:8000
```
