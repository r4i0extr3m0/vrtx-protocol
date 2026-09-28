# VRTX Protocol - Arquitetura Atual

## Visao geral

O VRTX e um app React Native + Expo Router com modo solo e modo B2B2C. O Supabase e a fonte de verdade para autenticacao, perfis, vinculos coach-aluno, prescricoes, aderencia, medidas e nutricao. O armazenamento local sustenta o uso offline; a sincronizacao depende dos servicos implementados no app.

## Componentes

| Camada | Responsabilidade | Status |
| --- | --- | --- |
| `app/` | Rotas Expo Router, auth gate e abas | obrigatoria |
| `src/`, `components/`, `hooks/`, `lib/` | telas, estado, cliente Supabase, UI e infraestrutura mobile | obrigatoria |
| `supabase/` | migrations, RLS, RPCs e Edge Functions | obrigatoria para login/sync B2B |
| `server/` | Express + tRPC + Drizzle para evolucoes server-side | opcional |
| `ai-api/` | FastAPI para analise/chat com LLM | opcional |

## Fluxo B2B2C

1. O usuario cria uma conta com `profiles.role = client` ou `coach`.
2. O coach gera um codigo via `b2b_create_invite`; o aluno o informa no app e chama `b2b_claim_invite`.
3. `coach_clients` registra o vinculo. As policies RLS limitam leituras e escritas ao coach, ao aluno vinculado e as RPCs autorizadas.
4. O coach prescreve treino e nutricao via RPCs. O aluno executa, registra check-ins e envia medidas; o coach consulta aderencia e progresso.

Os limites de alunos sao definidos por `profiles.coach_plan` e aplicados no banco. O app nao deve simular autorizacao apenas escondendo botoes.

## Dados e sincronizacao

O app primeiro atualiza o estado local e usa a fila de sincronizacao quando a operacao depende de rede. Escritas B2B sensiveis passam por RPCs Supabase e devem ser idempotentes quando a tela puder repetir uma acao. RLS e a barreira de tenant; nao confiar em `client_id` fornecido pela UI sem validar o vinculo no banco.

## Integracoes opcionais

- `server/`: nao e necessario para o fluxo atual de auth, coach, aluno ou Supabase. Use-o para novas APIs tRPC/Drizzle e documente qualquer contrato compartilhado.
- `ai-api/`: recebe chamadas HTTP para `/analyze`, `/chat` e `/feedback`. Deve validar o bearer token quando publicado; chaves de LLM e `SUPABASE_SERVICE_ROLE_KEY` ficam somente no processo Python.
- Apple Health, Google Fit/Health Connect e Strava: ainda nao possuem contrato ou adaptador implementado; continuam fora da arquitetura operacional.

## Navegacao e pastas

As rotas ficam em `app/`; componentes e telas reutilizaveis ficam em `src/` e `components/`. Migrations Supabase ficam em `supabase/migrations/`. Consulte [`INTEROPERABILITY.md`](INTEROPERABILITY.md) para contratos e [`RUNBOOK.md`](RUNBOOK.md) para executar cada camada.
