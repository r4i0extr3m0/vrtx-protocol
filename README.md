# VRTX Protocol

App mobile (React Native + Expo) do **VRTX Coach**: plataforma B2B2C em que o personal trainer prescreve treino e nutricao e acompanha a aderencia dos alunos, enquanto o aluno usa o app de graca. Operacao offline-first, autenticacao/dados no Supabase e camadas opcionais em `server/` (Node/tRPC) e `ai-api/` (FastAPI).

O repositorio nasceu como app fitness B2C e foi reposicionado para B2B2C. O documento canonico do pivot e `docs/ROADMAP_B2B.md`.

## Estado Atual

- App principal em React Native + Expo Router (mesmo app para os dois papeis: coach e aluno).
- Autenticacao por e-mail/senha com `profiles.role` (`user` | `coach`) e fluxo de `signup-wizard` (tipo de conta + CREF).
- Wizard de cadastro expandido com dados da conta, perfil base, rotina e nivel de atividade, objetivo fisico e composicao corporal opcional.
- Area do coach:
  - "Meus Alunos" com convite por codigo (`VRTX-XXXXXX`), limite por plano e remocao;
  - prescricao de treino (aluno ve o treino do dia);
  - dashboard de aderencia (feito x programado) e detalhe por aluno;
  - avaliacoes/medidas corporais com mapa visual estilo bioimpedancia;
  - plano nutricional com metas de treino x descanso e menu por refeicao (substituicoes, "Consumi"/"Ajustei", busca no banco TACO).
- Metas nutricionais configuradas automaticamente a partir do cadastro.
- Exclusao de conta operacional via Edge Function `delete-user-account`.
- Camadas `server/` (Node/tRPC) e `ai-api/` (FastAPI) opcionais para evolucoes full-stack e IA.

## Setup Rapido

```bash
pnpm install
pnpm dev
```

Comandos uteis:

```bash
pnpm dev:metro
pnpm dev:server
pnpm typecheck
pnpm lint
pnpm test
```

## Variaveis de Ambiente

Minimas para autenticar com Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Sem essas variaveis o app continua funcionando em modo local/offline para fluxos nao autenticados.

## Documentacao

- `docs/ROADMAP_B2B.md`: **documento canonico do pivot B2B2C** (contexto, decisoes, pricing, roadmap e status de implementacao).
- `docs/README.md`: indice operacional e estado atual do projeto.
- `docs/MASTER_DOCUMENTATION.md`: visao consolidada de produto, arquitetura e escopo.
- `docs/ARCHITECTURE.md`: arquitetura tecnica (mobile offline-first + Supabase + camadas opcionais).
- `docs/DOCUMENTATION_AUDIT.md`: auditoria atual de lacunas e promessas pendentes.
- `CHANGELOG.md`: historico resumido de mudancas relevantes.
- `CONTRIBUTING.md`: fluxo recomendado para contribuir.
- `server/README.md`: guia da camada opcional de backend.

## Observacoes

- O `OnboardingScreen` existe, mas o fluxo real de onboarding autenticado hoje acontece no `signup-wizard`.
- `docs/ROADMAP.md`, `docs/FEATURES.md` e `docs/SUMMARY.md` sao da fase B2C e misturam itens entregues e aspiracionais; valide sempre pelo `docs/ROADMAP_B2B.md` e `docs/MASTER_DOCUMENTATION.md`.
- As migrations B2B (`supabase/migrations/20260908...20260913`) precisam ser aplicadas no projeto Supabase remoto antes de usar as telas de coach (ver `docs/SUPABASE_SETUP.md`).
