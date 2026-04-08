# Changelog

## 2026-04-08

### Corrigido

- Fluxo de exclusao de conta via Supabase Edge Function `delete-user-account`.
- Erro `Invalid JWT` removido do caminho de exclusao ao desabilitar a verificacao automatica do gateway e manter a validacao explicita do token dentro da funcao.

### Alterado

- `signup-wizard` expandido para coletar idade, sexo biologico, nivel de atividade, treinos por semana e composicao corporal opcional.
- Cadastro inicial agora configura melhor o `dietStore` e as metas nutricionais do usuario.

### Documentacao

- Criado `README.md` raiz com estado atual do produto.
- Criado `CONTRIBUTING.md` com fluxo de contribuicao e checks obrigatorios.
- Atualizados `docs/README.md`, `docs/MASTER_DOCUMENTATION.md`, `docs/DOCUMENTATION_AUDIT.md`, `docs/ROADMAP.md` e `docs/todo.md`.
