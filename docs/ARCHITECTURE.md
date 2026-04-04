# IronLog — Arquitetura Técnica

## 1. Visão Geral

IronLog é um aplicativo mobile offline-first construído com **React Native (Expo)** e **Supabase**. A arquitetura prioriza:
- **Offline-First**: Funciona 100% sem internet
- **Sincronização Delta**: Envia apenas mudanças para o servidor
- **Privacidade**: Dados criptografados localmente
- **Performance**: 60 FPS constante com FlashList

---

## 2. Stack Tecnológico

### Frontend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React Native | 0.81.5 | Framework mobile |
| Expo | 54.0.29 | Build e deploy |
| Expo Router | 6.0.19 | Navegação |
| TypeScript | 5.9.3 | Type safety |
| NativeWind | 4.2.1 | Styling com Tailwind |
| Zustand | 5.0.12 | State management |
| React Query | 5.90.12 | Data fetching |
| Reanimated | 4.1.6 | Animações |
| FlashList | 2.0.2 | Listas otimizadas |

### Backend & Storage
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Supabase | 2.100.1 | Auth, DB, RLS |
| tRPC | 11.7.2 | API type-safe |
| MMKV | 4.3.0 | Storage nativo criptografado |
| Expo SecureStore | 15.0.8 | Tokens seguros |
| Drizzle ORM | 0.44.7 | Database schema |

### Desenvolvimento
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Vitest | 2.1.9 | Testes unitários |
| ESLint | 9.39.2 | Linting |
| Prettier | 3.7.4 | Formatação |
| tsx | 4.21.0 | TypeScript executor |

---

## 3. Estrutura de Pastas

```
ironlog/
├── app/                          # Rotas Expo Router
│   ├── _layout.tsx              # Layout raiz com AuthGate
│   ├── (tabs)/                  # Navegação com abas
│   │   ├── _layout.tsx          # Layout das abas
│   │   ├── index.tsx            # Home
│   │   ├── workout/             # Registro de treino
│   │   ├── history/             # Histórico
│   │   └── statistics.tsx       # Estatísticas
│   ├── oauth/
│   │   └── callback.tsx         # OAuth callback handler
│   ├── login.tsx                # Tela de login
│   └── ...                      # Outras telas
│
├── src/
│   ├── api/
│   │   ├── supabase.ts          # Cliente Supabase
│   │   └── trpc.ts              # Cliente tRPC
│   │
│   ├── constants/
│   │   └── env.ts               # Variáveis de ambiente
│   │
│   ├── domain/                  # Entidades e regras de negócio
│   │   ├── entities/
│   │   │   ├── Workout.ts       # Entidade de treino
│   │   │   ├── Exercise.ts      # Entidade de exercício
│   │   │   └── ...
│   │   └── services/
│   │       ├── WorkoutService.ts
│   │       └── ...
│   │
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts           # Hook de autenticação
│   │   ├── useWorkout.ts        # Hook de treino
│   │   ├── useTheme.ts          # Hook de tema
│   │   └── ...
│   │
│   ├── infra/                   # Infraestrutura
│   │   ├── mmkv.ts              # Storage local
│   │   ├── sync-queue.ts        # Fila de sincronização
│   │   └── api-client.ts        # Cliente HTTP
│   │
│   ├── screens/                 # Telas principais
│   │   ├── HomeScreen.tsx
│   │   ├── WorkoutScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── ...
│   │
│   ├── store/                   # Zustand stores
│   │   ├── authStore.ts         # Estado de autenticação
│   │   ├── workoutStore.ts      # Estado de treinos
│   │   ├── settingsStore.ts     # Estado de configurações
│   │   └── index.ts             # Exportações
│   │
│   ├── theme/                   # Design tokens
│   │   ├── colors.ts            # Paleta de cores
│   │   ├── typography.ts        # Tipografia
│   │   └── spacing.ts           # Espaçamento
│   │
│   └── utils/                   # Funções auxiliares
│       ├── calculations.ts      # Cálculos (1RM, VTT)
│       ├── formatting.ts        # Formatação
│       └── ...
│
├── lib/
│   ├── _core/
│   │   ├── auth.ts              # Gerenciamento de tokens
│   │   ├── manus-runtime.ts     # Runtime utilities
│   │   └── nativewind-pressable.ts
│   │
│   ├── theme-provider.tsx       # Provider de tema
│   └── trpc.ts                  # Configuração tRPC
│
├── components/                  # Componentes reutilizáveis
│   ├── ui/                      # Componentes base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── haptic-tab.tsx
│   └── ...
│
├── server/                      # Backend (Node.js)
│   ├── _core/
│   │   ├── index.ts             # Servidor Express
│   │   └── middleware/
│   ├── routers/                 # tRPC routers
│   │   ├── workout.ts
│   │   ├── exercise.ts
│   │   └── ...
│   └── ...
│
├── tests/                       # Testes
│   ├── domain/
│   ├── stores/
│   └── ...
│
├── drizzle/                     # Migrations SQL
│   └── ...
│
├── supabase/                    # Configuração Supabase
│   └── ...
│
├── global.css                   # Estilos globais
├── tailwind.config.js           # Configuração Tailwind
├── babel.config.js              # Configuração Babel
├── metro.config.js              # Configuração Metro
├── app.json                     # Configuração Expo
├── eas.json                     # Configuração EAS Build
└── package.json                 # Dependências
```

---

## 4. Fluxo de Dados Offline-First

### Diagrama de Sincronização

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuário Registra Treino                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Salvar em MMKV (Imediato)     │
        │  - Criptografado AES          │
        │  - Sem dependência de internet │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  Enfileirar em SyncQueue       │
        │  - Operação FIFO               │
        │  - Deduplicação automática     │
        └────────────┬───────────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Conectado à Internet?   │
        └────────────┬──────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
    Não │                           │ Sim
        │                           │
        ▼                           ▼
    ┌────────┐         ┌──────────────────────┐
    │ Aguard │         │ Sincronizar Delta    │
    │ Conexão│         │ - Enviar apenas diffs│
    └────────┘         │ - Retry exponencial  │
                       │ - Resolver conflitos │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ Confirmar no Servidor│
                       │ - Atualizar timestamp│
                       │ - Limpar fila        │
                       └──────────────────────┘
```

### Fluxo de Sincronização Delta

1. **Usuário registra treino** → Salvo em MMKV imediatamente
2. **Operação enfileirada** → SyncQueueService adiciona à fila
3. **Deduplicação** → Se houver operação anterior no mesmo treino, mescla
4. **Quando conecta** → Sincroniza apenas as mudanças (delta)
5. **Retry automático** → Se falhar, tenta novamente com backoff exponencial
6. **Confirmação** → Quando sincronizado, remove da fila

---

## 5. Autenticação & Segurança

### Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuário Abre App                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  AuthGate Verifica Sessão      │
        │  - Restaura estado do MMKV     │
        │  - Verifica token em SecureStore
        └────────────┬───────────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Sessão Válida?          │
        └────────────┬──────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
    Não │                           │ Sim
        │                           │
        ▼                           ▼
    ┌────────┐         ┌──────────────────────┐
    │ Login  │         │ Redirecionar para    │
    │ Screen │         │ Home (Autenticado)   │
    └────────┘         └──────────────────────┘
```

### Armazenamento de Tokens

- **Token de Sessão**: Armazenado em `Expo SecureStore` (encriptado pelo SO)
- **Dados do Usuário**: Armazenado em MMKV criptografado
- **Refresh Token**: Gerenciado automaticamente pelo Supabase

### Validação de Dados

Todas as camadas usam **Zod** para validação:
- Frontend: Validação antes de enviar
- Backend: Validação ao receber
- Database: RLS (Row Level Security) no Supabase

---

## 6. State Management com Zustand

### Stores Principais

#### `authStore.ts`
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  hydrateAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

#### `workoutStore.ts`
```typescript
interface WorkoutState {
  workouts: Workout[];
  activeWorkoutId: string | null;
  hydrated: boolean;
  createWorkout: (data: CreateWorkoutInput) => void;
  updateWorkout: (id: string, data: UpdateWorkoutInput) => void;
  completeWorkout: (id: string) => void;
  // ... mais ações
}
```

#### `settingsStore.ts`
```typescript
interface SettingsState {
  theme: 'light' | 'dark' | 'auto';
  units: 'kg' | 'lbs';
  language: 'pt-BR' | 'en';
  // ... mais configurações
}
```

### Persistência

Todos os stores usam `mmkvJsonStorage` para persistência:
```typescript
const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      // ... estado
    }),
    {
      name: 'workout-store',
      storage: mmkvJsonStorage,
    }
  )
);
```

---

## 7. Navegação com Expo Router

### Estrutura de Rotas

```
/                           # Root layout com AuthGate
├── (tabs)                  # Navegação com abas
│   ├── index               # Home
│   ├── workout             # Registro de treino
│   ├── history             # Histórico
│   └── statistics          # Estatísticas
├── login                   # Tela de login
├── oauth/callback          # OAuth callback
└── [outros]                # Outras telas
```

### AuthGate (Guardião de Navegação)

O `AuthGate` em `app/_layout.tsx` controla o fluxo:
1. Restaura estado de autenticação
2. Se autenticado → Redireciona para `(tabs)`
3. Se não autenticado → Redireciona para `login`
4. Protege rotas que requerem autenticação

---

## 8. Performance & Otimizações

### FlashList
- Substitui `FlatList` nativa por `FlashList` do Shopify
- Garante 60 FPS mesmo com milhares de registros
- Usado em: Histórico de treinos, lista de exercícios

### Sincronização Delta
- Envia apenas mudanças, não dados completos
- Economiza banda e bateria
- Implementado em `SyncQueueService`

### Memoização
- Componentes usam `React.memo`
- Hooks usam `useMemo` e `useCallback`
- Evita re-renders desnecessários

### Code Splitting
- Rotas lazy-loaded com Expo Router
- Reduz tamanho do bundle inicial
- Carregamento sob demanda

---

## 9. Tratamento de Erros

### Estratégia de Erro

1. **Nível de Componente**: Try-catch com fallback UI
2. **Nível de Hook**: Retorna estado de erro
3. **Nível de Store**: Ação de erro com retry
4. **Nível de API**: Retry automático com backoff

### Exemplo de Tratamento

```typescript
// Hook com tratamento de erro
export function useWorkout() {
  const [error, setError] = useState<Error | null>(null);
  
  const createWorkout = useCallback(async (data) => {
    try {
      // ... criar treino
    } catch (err) {
      setError(err);
      // Retry automático
    }
  }, []);
  
  return { createWorkout, error };
}
```

---

## 10. Testes

### Estrutura de Testes

```
tests/
├── domain/                  # Testes de entidades
│   ├── Workout.test.ts
│   └── Exercise.test.ts
├── stores/                  # Testes de stores
│   ├── authStore.test.ts
│   └── workoutStore.test.ts
└── utils/                   # Testes de utilitários
    └── calculations.test.ts
```

### Executar Testes

```bash
pnpm test              # Rodar testes uma vez
pnpm test:watch       # Modo watch
```

---

## 11. Deployment

### Desenvolvimento
```bash
npx expo start --android
```

### Produção (APK)
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

### Play Store (Futuro)
```bash
eas build --platform android
eas submit --platform android
```

---

## 12. Monitoramento & Debugging

### Logging
- Console logs em desenvolvimento
- Sentry para produção (futuro)
- Logs de sincronização em `SyncQueueService`

### Debugging
- React DevTools com Expo
- Redux DevTools para Zustand (futuro)
- Network tab no Chrome DevTools

---

## 13. Escalabilidade

### Banco de Dados
- Supabase PostgreSQL com RLS
- Índices em campos frequentemente consultados
- Particionamento por usuário

### Cache
- MMKV para cache local
- React Query para cache de API
- Invalidação automática após sincronização

### Sincronização
- Fila FIFO com deduplicação
- Retry exponencial com limite
- Resolução automática de conflitos

---

**Última atualização**: 31 de Março de 2026
