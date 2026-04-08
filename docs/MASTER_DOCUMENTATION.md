# VRTX Protocol - Documento Mestre do Projeto

## 1. Resumo Executivo

O **VRTX Protocol** e um aplicativo mobile premium de fitness, nutricao e acompanhamento de performance construido com **React Native + Expo**. O produto foi desenhado para oferecer uma experiencia moderna, responsiva e orientada a dados, com foco em:

- gestao de treinos e historico de execucao;
- acompanhamento nutricional e metas diarias;
- analise de progresso por metricas e graficos;
- mecanismos de engajamento, streaks e gamificacao;
- operacao resiliente em ambiente mobile, com base tecnica preparada para sincronizacao, observabilidade e evolucao comercial.

O projeto combina uma aplicacao mobile, um backend Node.js com tRPC, integracoes com Supabase, servicos de analytics/monitoramento e uma API complementar para recursos de IA.

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

O projeto e aderente a usuarios que desejam:

- registrar treinos e acompanhar evolucao historica;
- monitorar ingestao alimentar e metas caloricas/macros;
- visualizar indicadores e estatisticas;
- receber valor adicional por recursos premium, IA e personalizacao.

## 3. Escopo Funcional

### 3.1 Autenticacao e acesso

- login por email e senha;
- fluxo de criacao de conta;
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
  - `profile`.

### 4.3 Rotas complementares

- `login`;
- `signup-wizard`;
- `forgot-password`;
- `terms-and-privacy`;
- `camera`;
- `profile`;
- `gamification`;
- `diet/*`;
- `history/[id]`;
- `workout/[id]`;
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

- **Supabase** para autenticacao e servicos relacionados;
- **Drizzle ORM** e migracoes em `drizzle/`;
- suporte a configuracao por variaveis de ambiente;
- estrutura para politicas, sincronizacao e expansao do backend.

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
- identidade visual premium e forte orientacao a UX;
- preparacao para analytics, monetizacao e IA;
- infraestrutura suficiente para continuar iterando produto e distribuicao.

As proximas evolucoes naturais incluem:

- endurecimento do fluxo de autenticacao em producao;
- consolidacao do onboarding e signup wizard;
- reducao adicional de ruido de logs e warnings;
- ampliacao de cobertura de testes;
- refinamento da camada premium e dos fluxos assistidos por IA.

## 13. Mapa da Documentacao

Todos os documentos do projeto foram centralizados em `docs/`. Os principais sao:

- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/FEATURES.md`
- `docs/SUPABASE_SETUP.md`
- `docs/MONITORING_SETUP.md`
- `docs/INSTALLATION.md`
- `docs/TESTING_REPORT.md`
- `docs/ROADMAP.md`
- `docs/logs do app.md`

Este arquivo deve ser tratado como a referencia principal para entendimento executivo e tecnico do projeto. Os demais documentos funcionam como anexos especializados por tema.
