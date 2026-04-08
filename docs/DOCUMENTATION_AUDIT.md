# VRTX Protocol - Auditoria de Documentacao e Escopo

## Data

- 2026-04-08

## Objetivo da Auditoria

- verificar divergencias entre codigo, fluxo real do app e documentacao;
- identificar solicitacoes ja feitas mas ainda incompletas;
- atualizar os documentos canônicos para reduzir ambiguidade operacional.

## O Que Foi Corrigido Nesta Auditoria

- Criado `README.md` raiz com estado atual do produto.
- Criado `CONTRIBUTING.md` com fluxo de contribuicao e checks minimos.
- Criado `CHANGELOG.md` para registrar alteracoes relevantes.
- Atualizados `docs/README.md`, `docs/MASTER_DOCUMENTATION.md`, `docs/ROADMAP.md` e `docs/todo.md`.
- Expandido o `signup-wizard` para incluir perguntas de perfil e rotina que estavam ausentes no cadastro.
- Corrigido o fluxo de exclusao de conta com a Edge Function `delete-user-account`.

## Divergencias Encontradas

### 1. Onboarding real vs. onboarding documentado

Estado real:
- o fluxo autenticado usa `signup-wizard` como onboarding principal;
- `OnboardingScreen.tsx` existe, mas nao e a etapa principal do fluxo de cadastro autenticado.

Acao:
- documentacao ajustada para deixar isso explicito.

### 2. Cadastro prometia coleta progressiva, mas o wizard estava curto

Estado anterior:
- o cadastro coletava basicamente `peso`, `altura` e `objetivo`.

Impacto:
- a documentacao dizia que havia coleta progressiva de perfil;
- o `dietStore` ja suportava mais contexto do que o cadastro realmente pedia.

Acao:
- o wizard agora coleta:
  - idade;
  - sexo biologico;
  - peso e altura;
  - nivel de atividade;
  - treinos por semana;
  - objetivo;
  - bioimpedancia opcional.

### 3. Roadmap e docs historicos misturavam entregue com aspiracional

Estado real:
- varios arquivos antigos em `docs/` descrevem intencao futura como se fosse estado consolidado.

Acao:
- os documentos canônicos agora deixam mais claro:
  - o que esta implementado;
  - o que e camada opcional;
  - o que ainda e roadmap.

## Pendencias Reais Ainda Abertas

### Produto

- `OnboardingScreen.tsx` continua sem ser integrado como tour guiado de primeira abertura.
- `NotificationSettingsScreen.tsx` ainda tem TODO para logica de notificacoes de streak/PR.
- Parte do roadmap de comunidade, wearables e monetizacao continua aspiracional.

### Documentacao

- Existem arquivos historicos em `docs/` que podem continuar desatualizados e nao devem ser tratados como fonte primaria.
- Sempre valide primeiro com:
  - `README.md`
  - `docs/README.md`
  - `docs/MASTER_DOCUMENTATION.md`
  - este arquivo.

## Fonte de Verdade Recomendada

1. `README.md`
2. `docs/README.md`
3. `docs/MASTER_DOCUMENTATION.md`
4. `docs/DOCUMENTATION_AUDIT.md`
5. `CHANGELOG.md`
