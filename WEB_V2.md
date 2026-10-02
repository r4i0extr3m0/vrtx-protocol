# VRTX Web v2

A nova interface web está sendo introduzida por plataforma na branch `feat/web-redesign-v2`. Ela reutiliza a autenticação, stores e navegação existentes, mas troca onboarding, login e dashboard por uma camada visual dedicada ao desktop. O mobile permanece sem alteração.

A estratégia de substituição gradual é manter cada nova tela atrás do `Platform.OS === "web"`, validando cada fatia antes de substituir as demais áreas do produto.
