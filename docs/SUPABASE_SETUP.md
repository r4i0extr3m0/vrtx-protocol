# VRTX Protocol - Supabase

## Credenciais do app

Crie `.env` a partir de `.env.example` e preencha:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=chave-publica-anon
```

No dashboard Supabase, a URL fica em **Project Settings > API > Project URL** e a chave usada pelo mobile em **Publishable/Legacy anon key**, conforme a tela do projeto. O codigo atual le `EXPO_PUBLIC_SUPABASE_ANON_KEY`; nao invente outro nome.

## Aplicar schema

As migrations versionadas sao a fonte de verdade e devem ser executadas em ordem:

1. `20260326_initial_schema.sql`
2. `20260327_security_rls.sql`
3. `20260403_add_premium_fields.sql`
4. `20260908_b2b_coach_platform.sql`
5. `20260909_b2b_prescriptions.sql`
6. `20260910_b2b_adherence.sql`
7. `20260911_b2b_measurements.sql`
8. `20260912_b2b_nutrition.sql`
9. `20260913_b2b_nutrition_meals.sql`
10. `20260919_b2b_stripe_billing.sql`

As migrations `20260908` a `20260913` depend umas das outras e criam o modelo multi-tenant: roles/planos, `coach_clients`, prescricoes, check-ins, medidas, metas nutricionais e refeicoes. Nao aplique apenas a ultima migration.

Use o mecanismo de migrations do seu projeto Supabase ou o SQL Editor em uma sessao controlada. Depois valide as tabelas e RPCs no checklist de [`RUNBOOK.md`](RUNBOOK.md).

## Edge Functions

`delete-user-account`, `create-checkout-session` e `stripe-webhook` exigem `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. `create-checkout-session` tambem exige `STRIPE_SECRET_KEY`; `stripe-webhook` exige `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`. Essas chaves nunca vao para `.env` do app.

## RLS e seguranca

RLS deve permanecer habilitado nas tabelas B2B. O app chama RPCs como `b2b_create_invite`, `b2b_claim_invite`, `b2b_assign_workout` e `b2b_record_nutrition_checkin`; autorizacao de tenant e limite de plano sao regras do banco, nao apenas da interface.
