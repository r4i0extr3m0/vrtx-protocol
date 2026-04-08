# VRTX Protocol

Aplicativo mobile de treino, dieta e acompanhamento fitness com foco em operacao offline-first, autenticacao via Supabase e camada opcional de servicos em `server/`.

## Estado Atual

- App principal em React Native + Expo Router.
- Autenticacao por e-mail/senha com fluxo de `signup-wizard`.
- Wizard de cadastro expandido com:
  - dados da conta;
  - perfil base;
  - rotina e nivel de atividade;
  - objetivo fisico;
  - composicao corporal opcional.
- Metas nutricionais configuradas automaticamente a partir do cadastro.
- Exclusao de conta operacional via Edge Function `delete-user-account`.
- Camada `server/` opcional para evolucoes full-stack e IA.

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

- `docs/README.md`: indice operacional e estado atual do projeto.
- `docs/MASTER_DOCUMENTATION.md`: visao consolidada de produto, arquitetura e escopo.
- `docs/DOCUMENTATION_AUDIT.md`: auditoria atual de lacunas e promessas pendentes.
- `CHANGELOG.md`: historico resumido de mudancas relevantes.
- `CONTRIBUTING.md`: fluxo recomendado para contribuir.
- `server/README.md`: guia da camada opcional de backend.

## Observacoes

- O `OnboardingScreen` existe, mas o fluxo real de onboarding autenticado hoje acontece no `signup-wizard`.
- O roadmap em `docs/ROADMAP.md` mistura itens entregues e aspiracionais; valide sempre com os documentos canônicos acima antes de assumir uma feature como pronta.
