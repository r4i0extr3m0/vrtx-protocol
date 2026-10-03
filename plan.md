# VRTX Web v2

## Objetivo
Criar uma camada web nova para o VRTX Protocol sem substituir a experiência mobile nem remover a versão web atual. A v2 entra por plataforma: no web, onboarding, autenticação e dashboard usam novos componentes; no iOS/Android, as telas existentes permanecem inalteradas.

## Direção de design
- **Movimento:** performance editorial / premium training OS — um cruzamento de dashboards de saúde premium com revistas esportivas contemporâneas.
- **Princípios:** hierarquia forte, densidade controlada, ações óbvias e contraste confortável.
- **Cor:** carvão quase preto como base; branco quente para leitura; azul elétrico como assinatura de ação; verde e âmbar apenas para estados.
- **Layout:** shell assimétrico com sidebar fixa, canvas largo e módulos em blocos; evitar o card-grid centralizado genérico.
- **Assinaturas:** marca VRTX em wordmark monoespaçado, barra de progresso azul, superfícies em camadas e uma faixa de “próxima ação”.
- **Interação:** hover e foco elevam o elemento, nunca deslocam o layout; ações primárias têm feedback de escala e brilho discreto.
- **Animação:** entradas curtas em cascata, transformações de 180–260ms e sem movimento ornamental contínuo.
- **Tipografia:** sans condensada/forte para títulos e system sans para corpo; mono apenas em labels e números técnicos.
- **Essência:** o sistema operacional do treino para pessoas que querem clareza entre esforço, alimentação e progresso. Personalidade: preciso, confiante, humano.
- **Voz:** direta, encorajadora e sem clichês. Exemplos: “Seu próximo passo já está claro.” / “Feche o loop do dia.”
- **Wordmark:** VRTX com espaçamento amplo, acompanhado de um quadrado dividido em quatro como marca de sistema.
- **Cor proprietária:** `#8CC8FF` — azul gelo energético, usado em CTAs, progressos e estados ativos.

## Estrutura
- `src/screens/web/WebOnboardingScreen.tsx`: apresentação desktop responsiva.
- `src/screens/web/WebAuthScreen.tsx`: login/cadastro em duas colunas, preservando auth e offline.
- `src/screens/web/WebHomeScreen.tsx`: dashboard web com shell, métricas e próximas ações.
- Os arquivos de tela existentes continuam sendo wrappers de compatibilidade e delegam à v2 somente quando `Platform.OS === "web"`.
- `public/manus-routes.json`: manifesto das rotas públicas e principais telas.

## Compatibilidade
A v2 usa os hooks e stores existentes. Não altera Supabase, contratos de autenticação, navegação mobile ou dados locais. A primeira entrega cobre a camada visual; a substituição das demais telas pode acontecer por fatias sobre o mesmo shell.
