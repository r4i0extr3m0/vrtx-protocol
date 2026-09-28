# VRTX Protocol - Runbook local

## 1. Preparar o ambiente

```powershell
pnpm install
Copy-Item .env.example .env
pnpm typecheck
pnpm test
```

Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` para auth e dados remotos. `EXPO_PUBLIC_AI_API_URL` so e necessario ao usar a API Python.

## 2. Aplicar Supabase

Aplique todas as migrations em ordem, começando por `20260326_initial_schema.sql`, depois `20260327_security_rls.sql`, `20260403_add_premium_fields.sql`, `20260908_b2b_coach_platform.sql`, `20260909_b2b_prescriptions.sql`, `20260910_b2b_adherence.sql`, `20260911_b2b_measurements.sql`, `20260912_b2b_nutrition.sql`, `20260913_b2b_nutrition_meals.sql` e `20260919_b2b_stripe_billing.sql`.

Verifique no SQL Editor:

```sql
select to_regclass('public.coach_clients');
select to_regprocedure('public.b2b_create_invite()');
select to_regprocedure('public.b2b_claim_invite(text)');
select to_regclass('public.coach_nutrition_checkins');
```

Nao rode somente a migration mais recente: `20260913` depende de `20260912`, que depende da fundacao B2B.

## 3. Edge Functions

`delete-user-account` e obrigatoria para exclusao de conta. Configure nas Functions `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`; `create-checkout-session` exige `STRIPE_SECRET_KEY` e `stripe-webhook` exige `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`. Essas chaves nunca devem estar no app.

## 4. Executar o app

```powershell
pnpm dev:metro
```

Para iniciar tambem a camada tRPC opcional:

```powershell
pnpm dev
```

O app usa a porta Expo configurada pelo script (`8082`). Para Android nativo, veja `docs/INSTALL_APK_INSTRUCTIONS.md`.

## 5. Executar AI API (opcional)

```powershell
cd ai-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Configure `LLM_PROVIDER` e a chave do provedor no processo Python. Em producao, defina `ALLOW_INSECURE_USER_ID=false` e use validacao Bearer. Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ao Expo.

## 6. Smoke test B2B

1. Criar uma conta `coach` e uma conta `client`.
2. Confirmar que o coach gera um codigo e o client o resgata.
3. Confirmar que outro client nao enxerga o vinculo.
4. Prescrever treino, medida e plano nutricional.
5. Registrar treino e check-in de refeicao no client.
6. Confirmar aderencia e medidas no coach.
7. Testar logout, modo offline e sincronizacao posterior.
8. Como coach, abrir Perfil > Plano e assinatura e iniciar um checkout Stripe de teste.

## 7. Checks antes de PR

```powershell
pnpm typecheck
pnpm lint
pnpm test
```

Mudancas em schema exigem migration nova e atualizacao de `INTEROPERABILITY.md` quando alterarem um contrato.
