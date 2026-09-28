# VRTX Coach - Plano de lancamento comercial

## Decisao adotada

O produto comercial sera **B2B2C**:

- coach/personal e o cliente pagante;
- client/aluno usa o app sem pagar;
- planos iniciais: Basic (5 alunos), Plus (10) e Premier (20);
- checkout e cobranca recorrente: **Stripe Billing**;
- Supabase e a fonte de verdade da assinatura e do limite do plano;
- RevenueCat fica fora do fluxo do coach e pode ser removido ou mantido apenas para um eventual produto B2C separado.

Stripe foi escolhido por ter assinaturas, portal do cliente, webhooks, testes, cancelamento e expansao internacional no mesmo produto. O Pix e outros meios locais devem ser habilitados somente depois de confirmar disponibilidade e conciliacao no pais-alvo.

## O que ainda precisa ser implementado no repositorio

- tabela de assinaturas do coach, eventos de webhook e idempotencia;
- Edge Function ou endpoint server-side para criar Checkout Sessions;
- webhook Stripe com assinatura verificada e atualizacao transacional do plano;
- estados `trialing`, `active`, `past_due`, `cancelled` e `expired`;
- portal de faturamento, cancelamento e troca de plano;
- bloqueio server-side de novos convites quando a assinatura nao estiver ativa;
- tela de checkout/estado da assinatura no app;
- testes de renovacao, falha, reembolso, cancelamento e replay de webhook;
- separacao definitiva entre `coach_plan` comercial e o Premium B2C legado.

A migration `20260403_add_premium_fields.sql` e RevenueCat nao atendem esses requisitos.

Implementacao atual: a migration `20260919_b2b_stripe_billing.sql`, as Functions
`create-checkout-session` e `stripe-webhook` e a tela Perfil > Plano e assinatura ja
estao no repositorio. Ainda faltam configurar os secrets Stripe, criar o endpoint no
Dashboard Stripe e executar um pagamento de teste ponta a ponta.

## O que o responsavel precisa fazer fora do codigo

### Conta e negocio

- [ ] Definir pessoa juridica ou responsavel comercial e dados de faturamento.
- [ ] Comprar/configurar dominio oficial e e-mail de suporte.
- [ ] Criar conta Stripe Business e concluir verificacao/KYC.
- [ ] Definir moeda, impostos, politica de reembolso, trial e dia de cobranca.
- [ ] Confirmar se o produto sera vendido inicialmente no Brasil ou internacionalmente.
- [ ] Validar legalmente a relacao coach-aluno, prescricao de treino/nutricao e tratamento de dados de saude.

### Stripe

- [ ] Criar produtos e precos recorrentes de Basic, Plus e Premier.
- [ ] Criar ambiente Test e depois Live; nunca misturar chaves.
- [ ] Configurar Customer Portal.
- [ ] Configurar endpoint de webhook HTTPS.
- [ ] Habilitar eventos de assinatura, pagamento falho, cancelamento, reembolso e invoice.
- [ ] Criar segredo de assinatura do webhook e armazena-lo apenas no Supabase/server.
- [ ] Fazer pagamentos de teste e confirmar que o plano do coach muda no banco.
- [ ] Confirmar cancelamento, renovacao e inadimplencia antes de vender.

### Supabase e infraestrutura

- [ ] Criar projetos separados de staging e producao.
- [ ] Aplicar as oito migrations em banco limpo e registrar o resultado.
- [ ] Configurar secrets das Edge Functions, incluindo service role apenas no backend.
- [ ] Publicar `delete-user-account` e testar exclusao real.
- [ ] Configurar backups, alertas, logs e politica de restauracao.
- [ ] Configurar URL publica da AI API, Redis/Upstash e `ALLOW_INSECURE_USER_ID=false`.
- [ ] Restringir CORS da AI API aos clientes esperados.

### Legal e lojas

- [ ] Substituir todos os campos `[PREENCHER]` em Termos e Privacidade.
- [ ] Definir controlador, contato LGPD, canal de solicitacoes e foro.
- [ ] Publicar Termos e Privacidade em URLs HTTPS publicas.
- [ ] Preparar contrato comercial e politica de cancelamento/reembolso.
- [ ] Criar conta Apple Developer e Google Play Console.
- [ ] Configurar certificados, keystore, App Store Connect e Google Play.
- [ ] Preencher fichas de privacidade, coleta de dados, dados de saude e classificacao etaria.
- [ ] Preparar screenshots, descricao, suporte e contas de revisao.

### Validacao comercial

- [ ] Entrevistar pelo menos cinco coaches; obter pelo menos tres sinais de compra a R$ 49+.
- [ ] Rodar piloto com coaches reais em staging/producao controlada.
- [ ] Validar convite, prescricao, aderencia, medidas, nutricao e notificacoes.
- [ ] Validar offline, sincronizacao, troca de dispositivo e exclusao de conta.
- [ ] Definir suporte, SLA, reembolso e resposta a incidentes.

## Criterio de liberacao

Nao cobrar publicamente enquanto algum item abaixo estiver aberto:

1. pagamento real confirmado e reconciliado por webhook;
2. assinatura controla o limite de alunos no banco;
3. cancelamento e inadimplencia removem acesso comercial sem apagar dados do aluno;
4. RLS passou por testes negativos entre dois coaches;
5. Termos e Privacidade foram revisados e publicados;
6. build de producao foi testado em Android e iOS;
7. backups, monitoramento e suporte estao operacionais.
