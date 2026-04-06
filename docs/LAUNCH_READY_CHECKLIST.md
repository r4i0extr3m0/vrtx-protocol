# Launch Ready

## Changelog

- Home simplificada para o Command Center com `Hoje`, `Status` e `Proxima acao`.
- `Status` refeito com baseline fixo de 4 semanas, `Performance` aberta e `Recuperacao` com gating suave no Pro.
- Finalizacao do treino agora fecha o loop e leva direto para `Status` com contexto pos-treino.
- Tab bar final ajustada para `Home | Treino | Status | Historico | Perfil`.
- XP do treino mantido simples: ganho fixo por treino e bonus leve quando ja existe streak.

## Checklist

- [x] `pnpm -s typecheck`
- [x] `pnpm -s lint`
- [x] `pnpm -s test`
- [x] Metro iniciado em modo dev-client na porta `8082`
- [x] Dev-client Android aberto via deep link em `com.vrtxprotocol.app/.MainActivity`
- [ ] Navegacao visual completa no aparelho: `Home -> Treino -> Status -> Home`

## Observacoes

- `Performance` continua livre no plano Free.
- `Recuperacao` mostra uma previa com CTA interno para `Desbloquear Recuperacao (Pro)`.
- O smoke test em device confirmou abertura do app pelo dev-client, mas a validacao visual completa do fluxo ainda precisa de confirmacao na tela do aparelho.
