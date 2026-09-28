# VRTX Protocol - Instalacao

## Pre-requisitos

- Node.js 20 ou superior
- pnpm 9 (`corepack enable`)
- Android Studio/SDK e ADB para Android nativo
- Expo CLI via `npx expo`

## Desenvolvimento

```powershell
git clone https://github.com/r4i0extr3m0/vrtx-protocol.git
cd vrtx-protocol
pnpm install
Copy-Item .env.example .env
# preencher .env antes de usar recursos Supabase
pnpm typecheck
pnpm test
pnpm dev:metro
```

O script `pnpm dev` inicia Metro e o servidor opcional juntos. Para o fluxo principal, `pnpm dev:metro` e suficiente. O app pode abrir em modo local/offline sem credenciais, mas login, convite, prescricao e sincronizacao exigem Supabase.

## Variaveis

O arquivo padrao e `.env`, nao `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-anon
EXPO_PUBLIC_AI_API_URL=http://localhost:8000
```

Use apenas a chave publica `anon` no app. `service_role`, chaves de LLM e tokens de infraestrutura nunca devem receber prefixo `EXPO_PUBLIC_`.

## Android

```powershell
npx expo run:android
```

Para gerar APK local:

```powershell
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
adb install app\build\outputs\apk\release\app-release.apk
```

O identificador atual e `com.vrtxprotocol.app`. Para migrations, Edge Functions, AI API e troubleshooting, use [`RUNBOOK.md`](RUNBOOK.md).
