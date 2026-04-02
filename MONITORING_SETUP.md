# IronLog – Configuração de Monitoramento e Analytics

Este documento descreve como configurar Firebase, Sentry e PostHog no projeto IronLog.

## 📋 Arquivos de Configuração

Os seguintes arquivos foram criados com placeholders e precisam ser preenchidos com suas chaves reais:

### 1. `.env.local` (Variáveis de Ambiente)
Localização: `c:\Users\victo\ironlog\.env.local`

Preencha com suas chaves reais:
```
EXPO_PUBLIC_SUPABASE_URL=https://kweokxwnknygrtxmplwd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_secret_YDWaNRJzArnDqIeEyh0gKQ_nzf7auPF
EXPO_PUBLIC_FOOD_API_URL=https://api.ironlog.ai/v1/recognize
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 2. `sentry.properties` (Configuração Sentry)
Localização: `c:\Users\victo\ironlog\sentry.properties`

Preencha com seus dados do Sentry:
```
defaults.project=ironlog
defaults.org=SEU_ORG_SLUG
auth.token=SEU_AUTH_TOKEN
```

### 3. `google-services.json` (Configuração Firebase)
Localização: `c:\Users\victo\ironlog\google-services.json`

**Importante**: Este arquivo contém credenciais sensíveis e está no `.gitignore`. 
Baixe o arquivo real do Firebase Console e substitua o placeholder.

## 🔧 Como Obter as Chaves

### Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto ou crie um novo
3. Vá para **Project Settings** → **Service Accounts**
4. Clique em **Generate New Private Key** para baixar `google-services.json`
5. Coloque o arquivo na raiz do projeto

### Sentry
1. Acesse [Sentry.io](https://sentry.io/)
2. Crie uma conta ou faça login
3. Crie um novo projeto para **React Native**
4. Copie o **DSN** (URL longa que começa com `https://`)
5. Vá para **Settings** → **Account** → **API Auth Tokens**
6. Crie um novo token com escopos: `project:read`, `project:write`, `org:read`
7. Preencha `sentry.properties` com seu org slug e auth token

### PostHog
1. Acesse [PostHog.com](https://posthog.com/)
2. Crie uma conta ou faça login
3. Crie um novo projeto para **React Native**
4. Copie a **API Key** (começa com `phc_`)
5. Copie o **Host** (geralmente `https://us.i.posthog.com` ou `https://eu.i.posthog.com`)

## 🚀 Como Usar

### Inicializar Serviços
Os serviços são inicializados automaticamente no `app/_layout.tsx`:
- **Sentry**: Inicializado pelo plugin `@sentry/react-native`
- **Firebase**: Inicializado pelo plugin `@react-native-firebase/app`
- **PostHog**: Inicializado via `PostHogProvider` se a chave estiver configurada

### Registrar Eventos

#### Firebase Analytics
```typescript
import { logAnalyticsEvent } from '@/src/services/monitoring';

await logAnalyticsEvent('workout_started', {
  duration: 60,
  exercises: 5,
});
```

#### PostHog
```typescript
import { captureEvent, identifyUser } from '@/src/services/posthog';

captureEvent('workout_started', {
  duration: 60,
  exercises: 5,
});

// Identificar usuário
identifyUser('user_123', {
  email: 'user@example.com',
  name: 'John Doe',
});
```

#### Sentry (Erros)
```typescript
import { captureError } from '@/src/services/monitoring';

try {
  // seu código
} catch (error) {
  captureError(error, { context: 'workout_screen' });
}
```

### Testar Integração
Para testar se tudo está funcionando, use a função de teste:

```typescript
import { testAllMonitoringServices, testUserIdentification } from '@/src/services/test-events';

// Testar todos os serviços
await testAllMonitoringServices();

// Testar identificação de usuário
await testUserIdentification('user_123', 'user@example.com');
```

## 📊 Verificar Dados

### Firebase Analytics
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá para **Analytics** → **DebugView**
3. Abra o app no dispositivo
4. Os eventos devem aparecer em tempo real (pode levar alguns minutos)

### Sentry
1. Acesse [Sentry.io](https://sentry.io/)
2. Vá para seu projeto
3. Clique em **Issues** para ver erros capturados
4. Clique em **Performance** para ver traces

### PostHog
1. Acesse [PostHog.com](https://posthog.com/)
2. Vá para seu projeto
3. Clique em **Live events** para ver eventos em tempo real
4. Clique em **Insights** para análises

## 🔒 Segurança

- **Nunca commite** `google-services.json` ou chaves reais no repositório
- Use `.env.local` para variáveis locais (já está no `.gitignore`)
- Mantenha `sentry.properties` fora do repositório público
- Use variáveis de ambiente com prefixo `EXPO_PUBLIC_` apenas para dados públicos

## 📝 Estrutura de Código

### Arquivos Criados
- `src/services/monitoring.ts` - Integração com Sentry e Firebase
- `src/services/posthog.ts` - Integração com PostHog
- `src/services/test-events.ts` - Funções de teste

### Arquivos Modificados
- `app/_layout.tsx` - Adicionado PostHogProvider e inicialização
- `app.config.ts` - Adicionados plugins Firebase e Sentry
- `.env` - Placeholders para todas as chaves
- `.env.local` - Variáveis de ambiente do projeto
- `.gitignore` - Adicionado `google-services.json`

## 🧪 Próximos Passos

1. Preencha as chaves em `.env.local` e `sentry.properties`
2. Baixe `google-services.json` do Firebase e coloque na raiz
3. Execute `npx expo prebuild --clean`
4. Execute `npx expo run:android` para reconstruir
5. Teste os eventos usando `testAllMonitoringServices()`
6. Verifique os dados nos consoles de cada serviço

## ❓ Troubleshooting

### Eventos não aparecem no Firebase
- Verifique se `google-services.json` está correto
- Confirme que o projeto no Firebase está correto
- Aguarde alguns minutos para os dados sincronizarem

### Sentry não captura erros
- Verifique o DSN em `.env.local`
- Confirme que a chave de autenticação em `sentry.properties` é válida
- Verifique os logs com `adb logcat | grep Sentry`

### PostHog não registra eventos
- Verifique a API Key em `.env.local`
- Confirme que o Host está correto
- Verifique se `PostHogProvider` está envolvendo o layout

## 📚 Referências

- [Firebase Documentation](https://firebase.google.com/docs)
- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)
- [PostHog React Native](https://posthog.com/docs/libraries/react-native)
