# VRTX Protocol - Documentacao

Este arquivo e o indice operacional da documentacao. Ele aponta para os documentos canonicos e para os guias que devem refletir o estado real do projeto.

> Estado do projeto: **VRTX Coach** — pivot B2B2C (o personal trainer paga e prescreve; o aluno usa o app de graca). O documento canonico do pivot e `docs/ROADMAP_B2B.md`.

## Documentos Canônicos

- `README.md` (raiz): estado atual do projeto, setup rapido e links.
- `docs/ROADMAP_B2B.md`: contexto, decisoes aprovadas, pricing, roadmap em fases e status de implementacao do pivot B2B2C.
- `docs/MASTER_DOCUMENTATION.md`: visao consolidada de produto, arquitetura, navegacao e escopo funcional.
- `docs/DOCUMENTATION_AUDIT.md`: auditoria atual de lacunas, promessas pendentes e alinhamento de docs.

## Guias Principais

- `docs/ARCHITECTURE.md`: arquitetura tecnica (mobile + offline-first + Supabase + camadas opcionais).
- `docs/SUPABASE_SETUP.md`: setup e operacao do Supabase (Auth/DB/RLS, migrations B2B + Edge Functions).
- `docs/INSTALLATION.md`: instalacao, build e troubleshooting.
- `server/README.md`: camada opcional de backend (Node/tRPC).
- `ai-api/README.md`: camada opcional de IA (Python/FastAPI).

## Fluxos Criticos (Estado Atual)

- Autenticacao:
  - login por e-mail/senha;
  - signup inicia em `AuthScreen` e segue para `signup-wizard`;
  - `profiles.role` define `user` (praticante) ou `coach` (personal), com CREF para coach.
- Onboarding autenticado:
  - implementado no `signup-wizard` (na pratica, este e o onboarding hoje);
  - o wizard coleta dados em etapas e ja configura metas nutricionais iniciais.
- Area do coach (B2B2C):
  - vinculo coach-aluno por codigo de convite `VRTX-XXXXXX`, com limite de alunos por plano (gate no RPC);
  - prescricao de treino e nutricao por aluno;
  - aderencia (feito x programado) e avaliacoes/medidas corporais;
  - plano nutricional com metas treino x descanso e menu por refeicao.
- Dieta/metas (aluno):
  - `dietStore` persiste perfil nutricional e metas diarias;
  - o cadastro inicial pode preencher esse perfil automaticamente;
  - o aluno ve o plano do coach e marca "Consumi"/"Ajustei" por refeicao.
- Exclusao de conta:
  - via Edge Function `delete-user-account` (Supabase).

## Banco de Dados e Migrations

As migrations vivem em `supabase/migrations/`. As mais recentes (plataforma B2B) devem ser aplicadas em ordem:

```
20260908_b2b_coach_platform.sql
20260909_b2b_prescriptions.sql
20260910_b2b_adherence.sql
20260911_b2b_measurements.sql
20260912_b2b_nutrition.sql
20260913_b2b_nutrition_meals.sql
```

Enquanto elas nao forem aplicadas no projeto remoto, as telas de coach exibem aviso/falham nos RPCs. Passo a passo em `docs/SUPABASE_SETUP.md`.

## Comandos

```bash
pnpm install
pnpm dev
pnpm dev:metro
pnpm dev:server
pnpm typecheck
pnpm lint
pnpm test
```

## Registro de Mudancas

- `CHANGELOG.md`: resumo das mudancas relevantes por data.
- `CONTRIBUTING.md`: fluxo de contribuicao e checks minimos antes de commit/PR.

## Documentos legados (fase B2C)

`docs/ROADMAP.md`, `docs/FEATURES.md`, `docs/SUMMARY.md`, `docs/COMPETITIVE_ANALYSIS.md` e `docs/design.md` foram escritos na fase B2C e misturam itens entregues e aspiracionais (wearables, social, premium US$4,99). Consulte-os como historico, nunca como fonte de verdade.
