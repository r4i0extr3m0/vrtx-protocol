# Changelog

## 2026-09-19

### Adicionado

- Plano nutricional por refeicao (modo coach): menu do dia com substituicoes, botoes "Consumi"/"Ajustei", aderencia nutricional, lembretes locais e busca no banco TACO (migration `20260913_b2b_nutrition_meals.sql`).

### Documentacao

- Documentos canonicos alinhados ao pivot B2B2C (VRTX Coach): `README.md`, `docs/README.md`, `docs/MASTER_DOCUMENTATION.md`, `docs/ARCHITECTURE.md`, `docs/INSTALLATION.md`, `docs/SUPABASE_SETUP.md` e `docs/INSTALL_APK_INSTRUCTIONS.md`.
- Corrigidas referencias legadas "IronLog", o repositorio errado (`ironlog.git`) e o uso de `.env.local` (o app le `.env` via `scripts/load-env.js`).
- Adicionado runbook de migrations B2B (`20260908` a `20260913`) ao `docs/SUPABASE_SETUP.md` e atualizada a secao 12 do `docs/ROADMAP_B2B.md`.

### Corrigido

- `docs/ROADMAP_B2B.md` nao afirma mais que dieta esta fora do MVP (secao 5) e os documentos legados da fase B2C foram marcados como historicos.

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
