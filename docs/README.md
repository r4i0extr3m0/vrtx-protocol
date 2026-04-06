# VRTX Protocol – App Premium de Treino e Dieta Offline‑First

**VRTX Protocol** é um aplicativo mobile de fitness de alta performance focado em privacidade, escala e experiência do usuário. Construído com **React Native (Expo)**, ele oferece um ecossistema completo para treinos, nutrição e gamificação, funcionando perfeitamente offline e sincronizando com o **Supabase** através de uma arquitetura de sincronização delta otimizada.

---

## Documentos Canônicos

- `docs/README.md`: índice operacional, setup, execução local, testes e links principais.
- `docs/MASTER_DOCUMENTATION.md`: visão de produto, arquitetura, navegação e escopo funcional.
- `server/README.md`: guia técnico especializado para capacidades full-stack opcionais; não substitui os documentos canônicos acima.

## Documentos de Apoio

- `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/ROADMAP.md` e relatórios de auditoria servem como material complementar.
- Arquivos de suporte históricos em `docs/` não devem ser tratados como fonte primária de verdade sem validação contra os dois documentos canônicos acima.

## Escopo Atual

- O app mobile offline-first é a superfície principal do produto.
- A camada `server/` e `drizzle/` permanece opcional e preparada para expansão, mas não deve ser interpretada como backend obrigatório para o fluxo local/guest.
- `server/README.md` deve ser lido apenas quando houver necessidade real de API, sync multi-dispositivo, storage, LLM server-side ou persistência relacional.
- `drizzle/` é infraestrutura de schema e migrações para essa camada opcional; hoje não é a fonte de verdade do fluxo local/offline do app.

---

## 🚀 Fase 4: Preparação para Mercado

### 1. Testes & Qualidade
- **Detox (E2E)**: Fluxos críticos testados automaticamente (Onboarding -> Login -> Treino).
- **Vitest**: Testes unitários para lógica de domínio e stores.

### 2. Analytics & Monitoramento
- **Firebase Analytics**: Rastreamento de eventos como `workout_started`, `meal_added`, etc.
- **PostHog**: Análise profunda de comportamento do usuário e funis de conversão.
- **Sentry**: Monitoramento de erros em tempo real e logs de crash.

### 3. Performance & Assets
- **FlashList**: Otimização de todas as listas para 60 FPS.
- **Startup Time**: Reduzido através de lazy loading e otimização de bundles.
- **Branding**: Ícones adaptativos e splash screen otimizados para Dark Mode.

---

## ⚙️ Configuração & Build

### Variáveis de Ambiente (`.env`)
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI (API local/servidor)
EXPO_PUBLIC_AI_API_URL=http://localhost:8000

# RevenueCat (assinatura)
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_revenuecat_android_key
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_revenuecat_ios_key
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro

# Analytics & Monitoramento
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_key
```

### Guia de Build
1. **Instalar dependências**: `pnpm install`
2. **Rodar backend local**: `pnpm dev:server`
3. **Rodar Metro para dev client mobile**: `pnpm dev:metro`
4. **Rodar stack completa local**: `pnpm dev`
5. **Rodar testes unitários/stores**: `pnpm test` ou `pnpm test:unit`
6. **Rodar testes E2E (Detox/Android)**: `pnpm detox build -c android.debug.release && pnpm test:e2e`

### CI Recomendada

- `typecheck`: `pnpm typecheck`
- `lint`: `pnpm lint`
- `unit`: `pnpm test:unit`
- `e2e`: execução separada/manual até o ambiente Android de CI ficar estável
- Checks recomendados para bloqueio de merge hoje: `typecheck`, `lint` e `unit`
7. **Gerar build de produção (EAS)**: `eas build --platform android`

### Desenvolvimento Mobile
- O fluxo principal usa **Expo Dev Client**, não `expo start --web`.
- O script `pnpm dev:metro` sobe o Metro em `LAN` na porta `8082`, adequado para abrir o app no dispositivo físico.
- Em builds sem variáveis do Supabase, o app entra em **guest mode** e permite navegação local/offline sem bloquear em login.

---

## 🛠️ Tecnologias
- **Frontend**: React Native (Expo), NativeWind, Reanimated.
- **Performance**: @shopify/flash-list, react-native-mmkv.
- **Backend**: Supabase (Auth, DB, RLS).
- **Monitoramento**: Sentry, Firebase Analytics, PostHog.

---

## 🧠 IA Preditiva (FastAPI)

O projeto inclui uma API em `ai-api/` para gerar recomendações e chat (MVP).

```bash
cd ai-api
pip install -r requirements.txt --break-system-packages
uvicorn main:app --reload --port 8000
```

---

Desenvolvido para ser o diário de treino definitivo: **Rápido, Privado e Inteligente.**
