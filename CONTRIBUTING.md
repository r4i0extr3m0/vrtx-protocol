# Contribuindo com o VRTX Protocol

## Fluxo Recomendado

1. Sincronize a branch principal.
2. Crie uma branch de trabalho descritiva.
3. Implemente a mudanca com escopo pequeno e objetivo.
4. Atualize testes e documentacao quando a alteracao afetar comportamento, setup ou arquitetura.
5. Rode os checks locais antes de abrir PR ou gerar commit final.

## Checks Minimos

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Se houver impacto em fluxo mobile real, valide tambem no dispositivo com `pnpm dev:metro`.

## Regras Praticas

- Preserve o fluxo offline-first.
- Nao trate `server/` como dependencia obrigatoria do app mobile sem atualizar os documentos canônicos.
- Nao anuncie uma feature como pronta no roadmap ou README sem evidencia no codigo.
- Prefira mudancas incrementais em vez de reescrever telas amplas sem necessidade.
- Em alteracoes de auth, onboarding, dieta ou exclusao de conta, valide o caminho ponta a ponta.

## Documentacao Que Deve Ficar Alinhada

- `README.md`
- `CHANGELOG.md`
- `docs/README.md`
- `docs/MASTER_DOCUMENTATION.md`
- `docs/DOCUMENTATION_AUDIT.md`

## Commits

- Use mensagens objetivas e auditaveis.
- Prefira o formato `tipo: resumo curto`.
- Exemplos:
  - `fix: harden delete account jwt flow`
  - `feat: expand signup wizard profile intake`
  - `docs: refresh canonical project documentation`
