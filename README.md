# CoreIronTrack – App Premium de Treino e Dieta Offline‑First

**CoreIronTrack** é um aplicativo mobile de fitness de alta performance focado em privacidade, escala e experiência do usuário. Construído com **React Native (Expo)**, ele oferece um ecossistema completo para treinos, nutrição e gamificação, funcionando perfeitamente offline e sincronizando com o **Supabase** através de uma arquitetura de sincronização delta otimizada.

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

# Analytics & Monitoramento
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_key
```

### Guia de Build
1. **Instalar dependências**: `pnpm install`
2. **Rodar em desenvolvimento**: `pnpm dev`
3. **Rodar testes unitários**: `pnpm test`
4. **Rodar testes E2E (Android)**: `pnpm detox build -c android.debug.release && pnpm detox test -c android.debug.release`
5. **Gerar build de produção (EAS)**: `eas build --platform android`

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
