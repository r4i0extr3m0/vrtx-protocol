# ROADMAP B2B — VRTX Coach

> Documento de estrategia e execucao do pivot de VRTX Protocol (app fitness B2C) para
> plataforma de prescricao e acompanhamento para personal trainers (B2B2C).
> Data: 08/09/2026. Status: VALIDACAO (fase de entrevistas com PTs antes de codar).

---

## 1. Contexto e decisao

O VRTX Protocol foi construido como app fitness B2C (freemium + RevenueCat). Analise de
mercado e de repositorio concluiu que o B2C e guerra perdida contra Hevy (gratis), Fitbod
e Strong: app store saturada, retencao baixa, US$ 4,99/mes dificil.

**Decisao:** pivotar para **B2B2C** — o personal trainer paga a assinatura; o aluno usa o
app de graca. VRTX Coach: prescricao + acompanhamento de alunos.

### Veredito dos repositorios
- **IronLog (privado, legacy):** ancestral morto. VRTX e superset — nada a portar. Manter
  arquivado; hygiene (.env versionado) pendente.
- **VRTX Protocol:** base solida. Ja tem ~70% do "app do aluno": treino, templates,
  historico, estatisticas, notificacoes, offline-first, i18n pt/en/es, design premium,
  CI (lint/typecheck/unit) e ~60 testes unitarios.

## 2. Publico, dor e mercado

| | Detalhe |
|---|---|
| Cliente | Personal trainer autonomo / dono de studio pequeno |
| Dor atual | WhatsApp + Excel + PDF; sem aderencia, prescricao padrao ou historico do aluno |
| Ja pagam | Treino Certo, Vitsa, FitPrime, TrueCoach, Trainerize (R$ 40–120/mes BR) |
| Beneficio | App de qualidade para o aluno (nao PDF), aderencia visivel, IA que monta treino |

## 3. Posicionamento e diferencial

> "Monte o treino em 5 minutos com IA, edite, e entregue ao aluno num app premium — nao num PDF."

Diferenciais vs concorrentes de PT: gerador de treino com IA (editor que o PT aprova),
app do aluno com qualidade B2C (design, offline, 60fps), analise de assimetria e
composicao corporal como features de avaliacao.

## 4. Modelo de negocio (hipoteses para validar)

- PT paga mensalidade (plano unico no MVP, ex.: R$ 49–79/mes no BR).
- Aluno usa gratis; app pode ter "pro" do aluno como up-sell futuro.
- Pagamentos: BR = Asaas/Pagar.me + Pix; global = Stripe. (RevenueCat sai do modelo.)

## 5. MVP — escopo

**Lado treinador (dashboard web)**
1. Login/role `coach`
2. Cadastro de aluno + convite por link/QR/WhatsApp
3. Montagem de treino (reusa biblioteca de exercicios/presets/dominio existentes)
4. Atribuir plano ao aluno (dias da semana)
5. Dashboard de aderencia (feito x programado, volume, quem treinou)
6. Cobranca mensal do PT

**Lado aluno (VRTX adaptado)**
1. Entrar por convite (vinculo coach-aluno)
2. Ver treino do dia prescrito
3. Marcar series/reps/carga (ja existe)
4. Devolver status automaticamente (fila de sync ja existe)
5. Enviar avaliacao corporal/medidas ao PT

**FORA do MVP:** dieta/reconhecimento de comida, chat de IA para aluno, social.
Gamificacao vira bonus de engajamento. Assimetria/composicao corporal = feature paga ao PT.

## 6. Mudancas no modelo de dados (Supabase/Postgres)

- `profiles.role` (`user` | `coach`) + `cref`
- `coach_clients` (coach_id, client_id, status invited/active, validade)
- `templates` ganham `coach_id` + compartilhamento/atribuicao
- `workouts` ganham `plan_id`, `assigned_by`, data programada
- Ajuste de RLS para leitura escopada (aluno ve so o que o coach prescreveu)

**Divida de infra a corrigir ANTES:** migrations `20260327_security_rls.sql` assumem que
tabelas ja existem (quebram sozinhas); DDL real so existe em `docs/supabase.example.sql`.
Corrigir migrations e a fundacao do multi-tenant.

## 7. Roadmap

- **Fase 0 — Validacao (agora, ~1–2 sem):** entrevistas com 3–5 PTs. GO se dor real +
  disposicao de pagar. Documentar aprendizados em `docs/`.
- **Fase 1 — MVP (3–5 sem):** schema multi-tenant + dashboard web + convite + prescricao +
  aderencia + cobranca. Metrica: 5 PTs pagantes no piloto.
- **Fase 2:** app do aluno integrado ao plano + IA program builder (PT aprova o treino).
- **Fase 3:** avaliacoes corporais, indicacao entre PTs, marketplace de treinos.

## 8. Guia de validacao com PTs

Objetivo: confirmar dor, fluxo e disposicao de pagar — nao pedir opiniao sobre features.

**Script de entrevista (30–40 min)**
1. Como voce prescreve treino hoje? (WhatsApp/Excel/PDF/plataforma?)
2. Qual a maior dor nesse processo hoje?
3. Voce sabe quantos dos seus alunos seguiram o treino esta semana? Como sabe?
4. Se um aluno faltar 3 sessoes, voce percebe? Quando?
5. Quanto tempo voce gasta por semana remontando/repassando treinos?
6. Voce ja pagou/usou Treino Certo/Vitsa/TrueCoach? Por que parou (ou nao)?
7. Mostrar 2-3 telas cruas do conceito (dashboard aderencia + treino do aluno).
8. Se custasse R$ 59/mes e seu aluno tivesse app gratis, voce assinaria hoje?

**O que observar (sinais)**
- Dor citada espontaneamente (sem voce sugerir).
- Numeros concretos ("perco 3h/semana", "40 alunos").
- Frase de compra: "isso resolveria meu problema".

**Go/No-Go (Fase 0 -> Fase 1)**
- GO: >= 3 de 5 PTs dizem que pagariam R$ 49+ e descrevem dor espontanea.
- NO-GO: dor fraca ou "interessante mas nao pagaria". Repivotar (ex.: academias, nutricionistas).

## 9. Riscos

- **CREF/normativos:** software de apoio e ok (Treino Certo etc. operam); prescricao e do
  PT — nao virar "consultoria remota".
- **Escopo:** nao adicionar dieta + IA gigante + social no MVP.
- **Canal de venda:** Instagram de PT, indicacao em academia e conteudo; sem canal, nada roda.
- **WhatsApp:** usar convite por link (nao depender de API paga do WhatsApp).

## 10. Proximos passos imediatos

1. Recrutar 3–5 PTs (rede pessoal, Instagram, academia local).
2. Rodar entrevistas com o script da secao 8 e registrar em `docs/validation/`.
3. Decidir GO/NO-GO.
4. Se GO: definir nome/dominio definitivo e corrigir migrations do Supabase.
