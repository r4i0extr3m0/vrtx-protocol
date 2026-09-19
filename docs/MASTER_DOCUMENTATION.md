# VRTX Protocol - Documento Mestre do Projeto

## 1. Resumo Executivo

O **VRTX Protocol** e um aplicativo mobile premium de fitness, nutricao e acompanhamento de performance construido com **React Native + Expo**. O produto foi desenhado para oferecer uma experiencia moderna, responsiva e orientada a dados, com foco em:

- gestao de treinos e historico de execucao;
- acompanhamento nutricional e metas diarias;
- analise de progresso por metricas e graficos;
- mecanismos de engajamento, streaks e gamificacao;
- operacao resiliente em ambiente mobile, com base tecnica preparada para sincronizacao, observabilidade e evolucao comercial.

O projeto combina uma aplicacao mobile, uma API de dados no Supabase (Auth/DB/RLS), um backend Node.js opcional com tRPC, servicos de analytics/monitoramento e uma API complementar para recursos de IA.

### 1.1 Reposicionamento B2B2C (estado atual)

O VRTX Protocol nasceu como app fitness B2C (freemium + RevenueCat). Apos analise de mercado, o produto foi reposicionado para **B2B2C**: o **personal trainer** paga a assinatura e prescreve treino/nutricao; o **aluno** usa o app de graca.

- Produto: **VRTX Coach** (modo coach + app do aluno no mesmo binario).
- Papeis: `profiles.role` (`user` = praticante | `coach` = personal) + `cref` para coach.
- Vinculo: codigo de convite `VRTX-XXXXXX` gerado pelo coach; isolamento por RLS.
- Planos do PT (referencia): Basico (5 alunos), Plus (10), Premier (20); limite HARD no vinculo desde o MVP.
- Escopo entregue ate agora: convite/vinculo, prescricao de treino, aderencia (feito x programado), avaliacoes/medidas corporais com mapa visual e plano nutricional com metas treino x descanso + menu por refeicao.
- Documento canonico do pivot (decisoes, pricing, roadmap, riscos e status): `docs/ROADMAP_B2B.md`.
- Cobranca permanece fora do escopo atual (fase posterior).

## 2. Visao do Produto

### 2.1 Proposta de valor

O VRTX Protocol busca entregar uma central de performance pessoal para usuarios que desejam registrar, acompanhar e evoluir treinos, composicao corporal, habitos nutricionais e progresso fisico com uma interface premium e preparada para escala.

### 2.2 Objetivos principais

- centralizar a jornada de treino, dieta e performance em um unico app;
- oferecer uma experiencia mobile sofisticada, com boa legibilidade e fluidez;
- reduzir friccao de uso com navegacao simples, feedback visual e haptico;
- sustentar futuras camadas premium, analytics e automacao inteligente;
- manter uma base de codigo organizada para iteracao rapida.

### 2.3 Perfil de uso

O produto atende dois perfis no mesmo app:

**Personal trainer / dono de studio (coach).** Quer prescrever treino e dieta, entregar um app de qualidade ao aluno (nao PDF) e enxergar aderencia sem depender de WhatsApp/Excel.

**Praticante (aluno ou usuario solo).** Quer:

- registrar treinos e acompanhar evolucao historica;
- monitorar ingestao alimentar e metas caloricas/macros;
- seguir o plano prescrito pelo coach (quando vinculado) ou usar o app de forma autonoma (solo, gratis);
- visualizar indicadores e estatisticas;
- receber valor adicional por recursos premium, IA e personalizacao.

## 3. Escopo Funcional

### 3.1 Autenticacao e acesso

- login por email e senha;
- fluxo de criacao de conta com escolha de papel: praticante (`user`) ou personal (`coach`, com CREF);
- vinculo coach-aluno por codigo de convite (`VRTX-XXXXXX`), com guarda de papel;
- fluxo de confirmacao de email;
- `signup-wizard` como onboarding autenticado principal no estado atual do app;
- wizard de cadastro/perfil em multiplas etapas com conta, perfil base, rotina, objetivo e composicao corporal opcional;
- `OnboardingScreen` permanece como camada separada e nao e hoje a fonte principal do onboarding autenticado;
- suporte estrutural para autenticacao via Supabase;
- modo guest/offline quando o Supabase nao esta configurado no build de desenvolvimento;
- preparacao para biometria e fluxos de seguranca do dispositivo.

### 3.2 Treino

- home com acesso rapido a acoes principais;
- criacao e acompanhamento de treinos;
- visualizacao de exercicios;
- modelos/templates;
- historico de treinos;
- detalhamento por treino;
- area de estatisticas e progresso.

### 3.3 Nutricao

- tela principal de dieta/nutricao;
- registro de refeicoes;
- configuracao de metas;
- configuracao inicial de metas nutricionais a partir do cadastro;
- calculo de progresso calorico e macros;
- banner e fluxo para camera/IA aplicada a alimentacao.

### 3.4 Performance e engajamento

- gamificacao com XP, streak, badges e missoes;
- relatorios e graficos;
- indicadores de evolucao;
- componentes visuais de celebracao e reforco de progresso.

### 3.5 Conta, configuracoes e operacao

- tela de perfil;
- configuracoes;
- termos e privacidade;
- exclusao de conta via Edge Function dedicada;
- telas auxiliares como premium, sync status, camera e callback OAuth.

### 3.6 Modo coach (B2B2C)

- area "Meus Alunos": lista de alunos, geracao de convite, compartilhamento e remocao;
- entrada por codigo de convite no lado do aluno + limite de alunos por plano (UI e RPC);
- prescricao de treino: coach monta/atribui e o aluno ve o treino do dia;
- aderencia: feito x programado (check-in ao concluir treino prescrito, lista por aluno e detalhe);
- avaliacoes/medidas corporais enviadas pelo aluno, com historico e variacao, incluindo mapa corporal visual estilo bioimpedancia;
- nutricao: metas para dia de treino x descanso, alternancia automatica pelo treino do dia, gasto estimado e saldo calorico;
- plano por refeicao: menu do dia (cafe, almoco, lanche, jantar) com horario, itens e substituicoes; aluno marca "Consumi"/"Ajustei"; aderencia nutricional; lembretes locais; busca no banco TACO;
- hub de detalhe do aluno concentrando aderencia, medidas e prescricao.

## 4. Estrutura de Navegacao

O projeto utiliza **Expo Router** com estrutura baseada em arquivos.

### 4.1 Layout principal

- `app/_layout.tsx`: raiz da aplicacao, providers globais, gate de autenticacao, configuracao de `Stack`, analytics e inicializacao de servicos.

### 4.2 Navegacao por abas

- `app/(tabs)/_layout.tsx`: navega pelo conjunto principal de telas.
- abas principais:
  - `index` (home);
  - `workout`;
  - `history`;
  - `statistics`;
  - `diet`;
  - `students` (Meus Alunos — exibida no modo coach);
  - `profile`.

### 4.3 Rotas complementares

- `login`, `signup-wizard`, `forgot-password`, `onboarding`;
- `join-coach` (aluno entra com codigo de convite);
- `coach/client/[clientId]` (hub do aluno);
- `coach/adherence/[clientId]`, `coach/measurements/[clientId]`, `coach/nutrition/[clientId]`;
- `prescribe/[clientId]` (montagem/atribuicao de treino);
- `measurements` (avaliacao corporal do aluno);
- `diet/*` (`index`, `add-meal`, `goals`);
- `history/[id]`, `workout/[id]`;
- `templates`, `exercises`, `reports`, `asymmetry`, `body-composition`, `ai-coach`;
- `premium`, `settings`, `delete-account`, `sync-status`, `terms-and-privacy`, `camera`;
- `oauth/callback`.

## 5. Arquitetura Tecnica

### 5.1 Frontend mobile

O frontend e implementado em **React Native 0.81.5** com **Expo 54** e **React 19**, utilizando:

- **Expo Router** para navegacao;
- **TypeScript** para seguranca de tipos;
- **NativeWind** para estilizacao;
- **Zustand** para estado global;
- **React Query** para integracao de dados;
- **Reanimated** para animacoes;
- **MMKV** e mecanismos locais para persistencia e performance.

### 5.2 Backend e camada de servicos

O repositorio contem uma camada de servidor em `server/` com:

- **Express**;
- **tRPC**;
- modulos de contexto, cookies, sistema, oauth e integracoes;
- estrutura preparada para recursos full-stack e rotas tipadas.

### 5.2.1 Status de escopo

- o backend do repositorio deve ser tratado como **camada opcional/evolutiva**;
- o fluxo principal validado hoje e o app mobile com suporte local, guest mode e integracoes condicionais;
- sync multi-dispositivo, auth full backend-first e expansao de schema em `drizzle/` devem ser considerados roadmap tecnico, nao premissa operacional obrigatoria.

### 5.3 Dados e autenticacao

O ecossistema de dados contempla:

- **Supabase** para autenticacao e dados operacionais do app;
- as **migrations canonicas da plataforma B2B vivem em `supabase/migrations/`** (`20260908` a `20260913`), com RLS por `auth.uid()`, papeis (`coach`/`user`) e RPCs `security definer` que validam o vinculo coach-aluno (inclusive limite de alunos por plano);
- Edge Functions do Supabase para operacoes server-side (ex.: `delete-user-account`);
- **Drizzle ORM** e o diretorio `drizzle/` como camada legada/opcional (nao e a fonte de verdade do schema B2B);
- configuracao por variaveis de ambiente (`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`);
- estrutura para politicas, sincronizacao e expansao do backend.

> Enquanto as migrations B2B nao forem aplicadas no projeto remoto, as telas de coach falham nos RPCs. Ordem de aplicacao e passos em `docs/SUPABASE_SETUP.md`.

### 5.4 Observabilidade e monetizacao

O projeto integra ou prepara integracao com:

- **Sentry** para erros e monitoramento;
- **Firebase Analytics**;
- **PostHog**;
- **RevenueCat** para monetizacao e assinatura premium.

### 5.5 IA e recursos complementares

Existe uma API dedicada em `ai-api/` baseada em **FastAPI**, voltada a recomendacoes e extensoes inteligentes do produto.

## 6. Stack Tecnologica

### 6.1 Aplicacao

- React 19.1.0
- React Native 0.81.5
- Expo 54.0.29
- Expo Router 6.0.19
- TypeScript 5.9.3

### 6.2 Estado, UI e performance

- Zustand
- NativeWind
- React Native Reanimated
- React Native Gesture Handler
- React Native SVG
- FlashList
- MMKV

### 6.3 Integracoes e dados

- Supabase
- TanStack React Query
- tRPC
- Drizzle ORM
- Axios

### 6.4 Analytics, erros e comercial

- Sentry
- Firebase Analytics / Crashlytics
- PostHog
- RevenueCat

### 6.5 Ferramentas de desenvolvimento

- ESLint
- Prettier
- Vitest
- Jest
- Detox
- tsx
- esbuild
- EAS Build

## 7. Organizacao do Repositorio

### 7.1 Diretorios principais

- `app/`: definicao das rotas da aplicacao;
- `components/`: componentes compartilhados fora de `src/`;
- `src/`: dominio principal do produto, hooks, telas, stores, servicos e componentes;
- `lib/`: providers e infraestrutura compartilhada;
- `server/`: backend Node.js/tRPC;
- `ai-api/`: API Python/FastAPI;
- `drizzle/`: schema e migracoes;
- `docs/`: documentacao consolidada do projeto;
- `assets/`: imagens e recursos visuais;
- `e2e/`: cenarios de teste de ponta a ponta.

### 7.2 Convencoes observadas

- separacao entre rotas (`app/`) e implementacoes de tela (`src/screens/`);
- stores dedicadas por contexto funcional;
- servicos desacoplados para analytics, monitoramento e receita;
- documentacao versionada dentro do repositorio.

## 8. Funcionalidades por Modulo

### 8.1 Home

- ponto central de entrada;
- atalhos para modulos principais;
- acesso rapido a treinos, dieta, historico e estatisticas.

### 8.2 Workout

- abertura de treino;
- gerenciamento de exercicios;
- detalhamento por treino;
- base para templates e progresso.

### 8.3 History

- consulta de treinos anteriores;
- detalhamento por item;
- reaproveitamento de sessoes passadas.

### 8.4 Statistics e Reports

- exibicao de metricas e graficos;
- leitura de tendencias;
- base para recursos premium de relatorio.

### 8.5 Dieta e IA

- log alimentar;
- metas nutricionais;
- adicao de refeicoes;
- camera e reconhecimento assistido.

### 8.6 Gamification

- evolucao por XP;
- streaks;
- badges;
- missoes diarias;
- liga semanal.

### 8.7 Perfil e conta

- gerenciamento de sessao;
- configuracoes de usuario;
- opcoes relacionadas a assinatura e conta.

## 9. Qualidade, Testes e Operacao

### 9.1 Testes

O projeto possui estrutura para:

- testes unitarios com **Vitest**;
- testes adicionais com **Jest**;
- testes end-to-end com **Detox**.

### 9.2 Scripts principais

Com base em `package.json`, os comandos mais importantes sao:

```bash
pnpm dev
pnpm dev:server
pnpm dev:metro
pnpm lint
pnpm test
pnpm typecheck
pnpm android
pnpm ios
```

### 9.3 Build e distribuicao

- suporte a build com **EAS**;
- configuracoes centralizadas em `eas.json`;
- suporte a `expo-dev-client` para depuracao e validacao manual.

## 10. Configuracao de Ambiente

As variaveis de ambiente sao parte critica do funcionamento do app. Entre as principais:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AI_API_URL`
- `EXPO_PUBLIC_REVENUECAT_*`
- `EXPO_PUBLIC_SENTRY_DSN`
- `EXPO_PUBLIC_POSTHOG_*`
- credenciais Firebase

Os detalhes operacionais de configuracao permanecem documentados em:

- `docs/SUPABASE_SETUP.md`
- `docs/MONITORING_SETUP.md`
- `docs/INSTALLATION.md`

## 11. Seguranca e Boas Praticas

- separacao entre chaves publicas e configuracoes sensiveis;
- armazenamento seguro e persistencia local controlada;
- uso de monitoramento para captura de falhas;
- estrutura preparada para politicas e controle de acesso;
- documentacao especifica para configuracao do Supabase.

## 12. Estado Atual e Direcao Evolutiva

Pelo conjunto de telas, servicos e documentacao existente, o projeto ja contempla:

- uma base funcional ampla para treino, nutricao e engajamento;
- a plataforma **B2B2C (modo coach)** implementada no app: convite/vinculo, prescricao, aderencia, medidas e nutricao por refeicao;
- identidade visual premium e forte orientacao a UX;
- preparacao para analytics, monetizacao e IA;
- infraestrutura suficiente para continuar iterando produto e distribuicao.

As proximas evolucoes naturais incluem:

- aplicar as migrations B2B (`20260908` a `20260913`) no projeto Supabase remoto;
- endurecimento do fluxo de autenticacao em producao;
- consolidacao do onboarding e signup wizard;
- reducao adicional de ruido de logs e warnings;
- ampliacao de cobertura de testes;
- cobranca do personal trainer (fase posterior) e refinamento dos fluxos assistidos por IA.

## 13. Mapa da Documentacao

Todos os documentos do projeto foram centralizados em `docs/`. Os principais sao:

- `docs/README.md`
- `docs/ROADMAP_B2B.md` (canonico do pivot B2B2C)
- `docs/ARCHITECTURE.md`
- `docs/SUPABASE_SETUP.md`
- `docs/INSTALLATION.md`
- `docs/MONITORING_SETUP.md`
- `docs/TESTING_REPORT.md`
- `docs/DOCUMENTATION_AUDIT.md`
- `docs/logs do app.md`
- `server/README.md`, `ai-api/README.md`

`docs/ROADMAP.md`, `docs/FEATURES.md` e `docs/SUMMARY.md` sao documentos legados da fase B2C (misturam entregue e aspiracional) e devem ser lidos apenas como historico.

Este arquivo deve ser tratado como a referencia principal para entendimento executivo e tecnico do projeto, sempre em conjunto com `docs/ROADMAP_B2B.md` (estrategia atual). Os demais documentos funcionam como anexos especializados por tema.
