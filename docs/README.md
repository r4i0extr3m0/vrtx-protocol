# VRTX Protocol - Documentacao

Este arquivo e o indice operacional da documentacao. Ele aponta para os documentos canônicos e para os guias que devem refletir o estado real do projeto.

## Documentos Canônicos

- `README.md` (raiz): estado atual do projeto, setup rapido e links.
- `docs/MASTER_DOCUMENTATION.md`: visao consolidada de produto, arquitetura, navegacao e escopo funcional.
- `docs/DOCUMENTATION_AUDIT.md`: auditoria atual de lacunas, promessas pendentes e alinhamento de docs.
- `docs/ROADMAP_B2B.md`: documento canonico do pivot B2B2C, planos e status de implementacao.

## Guias Principais

- `docs/ARCHITECTURE.md`: arquitetura tecnica (mobile + offline-first + camadas opcionais).
- `docs/SUPABASE_SETUP.md`: setup e operacao do Supabase (Auth/DB/RLS + Edge Functions).
- `docs/INSTALLATION.md`: instalacao, build e troubleshooting.
- `server/README.md`: camada opcional de backend e IA server-side.
- `docs/INTEROPERABILITY.md`: integracao app ↔ Supabase ↔ `server/` ↔ `ai-api/`.
- `docs/RUNBOOK.md`: runbook unico para ambiente, migrations e Edge Functions.
- `docs/COMMERCIAL_LAUNCH.md`: plano escolhido para billing B2B e checklist de lancamento comercial.
- `docs/AI_DEVELOPMENT.md`: processo de desenvolvimento assistido por agente.
- `docs/DEMO.md`: roteiro da demo visual e capturas existentes.

## Fluxos Criticos (Estado Atual)

- Autenticacao:
  - login por e-mail/senha;
  - signup inicia em `AuthScreen` e segue para `signup-wizard`.
- Onboarding autenticado:
  - implementado no `signup-wizard` (na pratica, este e o onboarding hoje).
  - o wizard coleta dados em etapas e ja configura metas nutricionais iniciais.
- Dieta/metas:
  - `dietStore` persiste perfil nutricional e metas diarias;
  - o cadastro inicial pode preencher esse perfil automaticamente.
- Exclusao de conta:
  - via Edge Function `delete-user-account` (Supabase).
- Perfis B2B2C:
  - `coach` e `client` em `profiles.role`;
  - vinculo por convite em `coach_clients`;
  - prescricao, aderencia, medidas e nutricao protegidas por RLS/RPC.

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
- `docs/validation/`: evidencias da validacao com personal trainers; nao tratar `ROADMAP.md` como especificacao do produto.
