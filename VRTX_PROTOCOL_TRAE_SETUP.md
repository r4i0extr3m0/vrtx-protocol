# VRTX Protocol — Setup no Trae (Android + iOS)

Este guia é um “script de execução” para você colar no Trae e seguir sem dor.

## 0) Pré‑requisitos (1 vez)
- Node.js 20+ (recomendado)
- PNPM (`npm i -g pnpm`)
- Expo CLI (via `npx expo …`, não precisa instalar global)
- EAS CLI (`npm i -g eas-cli`)

> Compras (RevenueCat) **não funcionam no Expo Go**. Use **Dev Build (EAS)**.

---

## 1) Clonar o repositório
```bash
git clone https://github.com/r4i0extr3m0/vrtx-protocol.git vrtx-protocol
cd vrtx-protocol
```

---

## 2) Instalar dependências
```bash
pnpm install
```

Se quiser “garantir” módulos nativos do Expo:
```bash
npx expo install
```

---

## 3) Configurar variáveis de ambiente (obrigatório)
Crie o arquivo `.env` (NÃO commitar) baseado no exemplo:
```bash
cp .env.example .env
```

Preencha no mínimo:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AI_API_URL` (se for usar IA local)

Para testar Premium/Paywall:
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` (padrão `pro`)

---

## 4) Subir a IA localmente (opcional, recomendado no dev)
Em outro terminal:
```bash
cd ai-api
pip install -r requirements.txt --break-system-packages
```

Config mínima (DEV):
```bash
export SUPABASE_URL="https://<seu-projeto>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."
export SUPABASE_ANON_KEY="..."
export GEMINI_API_KEY="..."

# DEV: permite fallback via X-User-Id se estiver sem token (apenas desenvolvimento)
export ALLOW_INSECURE_USER_ID=true
```

Rodar:
```bash
uvicorn main:app --reload --port 8000
```

---

## 5) Rodar o app no celular (Dev Build)

### Android
```bash
eas login
eas build -p android --profile development
```
Instale o APK gerado no seu celular.

### iOS
```bash
eas build -p ios --profile development
```
Instale via TestFlight (fluxo padrão de iOS).

### Metro (Dev Client)
```bash
npx expo start --dev-client
```

---

## 6) Se der erro (checks rápidos)
- IA retornando 401: confirme login no Supabase + `SUPABASE_ANON_KEY` na AI API.
- Paywall não abre: confirme Dev Build + chaves RevenueCat.
- Dados “somem”: confirme Dev Build (não Expo Go).
