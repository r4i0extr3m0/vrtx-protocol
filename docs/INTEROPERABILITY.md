# VRTX Protocol - Interoperabilidade

## Limites das camadas

```text
app/ + src/  ->  Supabase Auth/DB/RPC/Edge Functions
     |                 |
     |                 +-> RLS isola coach, client e dados vinculados
     +-> ai-api/ (HTTP opcional, token Bearer)
     +-> server/ (tRPC/Drizzle opcional, sem substituir Supabase B2B)
```

O app mobile e o unico cliente obrigatorio. O Supabase e a fonte de verdade dos dados B2B. `server/` nao deve duplicar regras de tenant sem um contrato aprovado; `ai-api/` nao deve receber chaves publicas ou secretas que nao precise.

## Contratos principais

| Origem | Destino | Contrato atual |
| --- | --- | --- |
| app | Supabase Auth | email/senha e sessao Supabase |
| app | Supabase RPC | `b2b_create_invite`, `b2b_claim_invite`, `b2b_remove_client`, `b2b_assign_workout`, `b2b_record_checkin`, `b2b_submit_measurement`, `b2b_upsert_nutrition_plan`, `b2b_record_nutrition_checkin` |
| app | Supabase tables | `profiles`, `coach_clients`, prescricoes, check-ins, medidas e nutricao, sempre sob RLS |
| app | `ai-api/` | `POST /analyze`, `/chat`, `/feedback`; URL em `EXPO_PUBLIC_AI_API_URL` |
| app/server | Edge Function | `delete-user-account`; chamada autenticada e operacao administrativa no servidor |

## Identidade e tenant

O JWT do Supabase identifica `auth.uid()`. `profiles.role` define `coach` ou `client`; `profiles.coach_plan` define o limite do coach. `coach_clients` e o vinculo de tenant. Toda operacao que recebe `client_id` deve ser validada contra esse vinculo por RLS ou RPC `security definer`.

## Dados de nutricao

`20260912_b2b_nutrition.sql` cria o plano por dia de treino/descanso. `20260913_b2b_nutrition_meals.sql` adiciona `meals` como JSONB array e `coach_nutrition_checkins` para o status por refeicao. O contrato de refeicoes e um array JSON com `id`, `type`, `title`, `time`, `notes` e `items`; alteracoes precisam manter esse formato.

## Integracoes externas

Apple Health, Google Fit/Health Connect e Strava nao possuem adapter, permissao, tabela ou contrato versionado neste repositorio. Permanecem aspiracionais no roadmap B2C e nao devem ser descritas como integracoes disponiveis.
