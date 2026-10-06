# VRTX Web v2

A nova interface web está sendo introduzida por plataforma na branch `feat/web-redesign-v2`. Ela reutiliza a autenticação, stores e navegação existentes, mas troca onboarding, login e dashboard por uma camada visual dedicada ao desktop. O mobile permanece sem alteração.

A estratégia de substituição gradual é manter cada nova tela atrás do `Platform.OS === "web"`, validando cada fatia antes de substituir as demais áreas do produto.


## Fase 2 — telas internas

A segunda fase adiciona `WebSectionScreen`, um sistema compartilhado para treino, nutrição, progresso, histórico, perfil, configurações, Coach IA, relatórios, VRTX Pro e biblioteca de exercícios. Cada rota usa a variante web apenas em `Platform.OS === "web"`; o componente mobile original permanece como fallback nativo.

Também foi adicionado um breakpoint compacto ao `WebShell`: em telas menores, a navegação lateral reduz para ícones e os painéis continuam fluidos.
