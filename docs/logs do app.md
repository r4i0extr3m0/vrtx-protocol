# Logs do App

## Descricao do app

- Nome: VRTX Protocol
- Plataforma atual de teste: Android com Expo Dev Client
- Stack principal: Expo Router, React Native, Zustand, Supabase, RevenueCat
- Fluxos em foco nesta investigacao:
  - abertura do app
  - onboarding
  - autenticacao
  - criacao de conta

## Sintomas observados

1. Flicker na abertura do app com redirecionamentos acontecendo cedo demais.
2. App abrindo no menu de desenvolvimento do Expo em vez da interface real.
3. Botao de continuar do onboarding sem avancar em alguns testes.
4. Criacao de conta com retorno confuso por causa do fluxo de confirmacao de e-mail do Supabase.
5. Problemas de contraste visual em partes do onboarding e em Termos e Privacidade.

## Logs e erros coletados

### Expo

Arquivo de apoio: `expo_logs.txt`

Trechos relevantes:

```text
npm warn Unknown project config "node-linker"
Port 8081 is being used by another process
Input is required, but 'npx expo' is in non-interactive mode.
Required input:
> Use port 8082 instead?
Skipping dev server
```

Leitura:

- O Metro falhou inicialmente porque a porta `8081` ja estava ocupada.
- Em modo nao interativo, o Expo nao conseguiu confirmar a troca de porta automaticamente.
- A estabilizacao foi feita usando a porta `8082`.

### Android / logcat

Arquivo de apoio: `logcat_errors.txt`

Trechos relevantes:

```text
backend_error host=127.0.0.1 path=/mobile/telemetry detail=Failed to connect to /127.0.0.1:8000
backend_error host=192.168.15.112 path=/mobile/telemetry detail=CLEARTEXT communication to 192.168.15.112 not permitted by network security policy
backend_error host=seek-concluded-artificial-achieving.trycloudflare.com path=/mobile/telemetry detail=Unable to resolve host
```

Leitura:

- Havia tentativas de telemetria para destinos locais e remotos indisponiveis.
- Parte dos erros e ruido do dispositivo nao sao do fluxo principal de autenticacao do VRTX, mas atrapalham a leitura do log.

## Causas identificadas

### 1. Hydration prematura de auth/onboarding

- O app redirecionava antes de a persistencia do Zustand terminar de hidratar.
- Isso gerava flicker e podia mandar o usuario para rotas erradas logo no bootstrap.

### 2. Fluxo de signup incompleto

- O `SignupWizardScreen` dependia de `updateProfile`, mas esse metodo nao estava exposto corretamente no hook de auth.
- O fluxo de `signUp` precisava distinguir conta criada com sessao ativa vs. conta aguardando confirmacao por e-mail.

### 3. Problemas operacionais do ambiente

- Metro preso na porta `8081`.
- Expo Dev Menu tomando foco no dispositivo.
- Necessidade de `adb reverse` e relancamento do app para garantir conexao com o bundler.

## Ajustes aplicados

### Estado e bootstrap

- Adicionado rastreamento de `hasHydrated` em auth e onboarding.
- `AuthGate` ajustado para esperar a hydration antes de decidir redirecionamentos.

### Autenticacao

- `useAuth` passou a expor `updateProfile`.
- `authStore.signUp()` passou a retornar `requiresEmailConfirmation`.
- `AuthScreen` passou a encaminhar corretamente para `email-pending` quando a conta exige confirmacao.
- `SignupWizardScreen` recebeu tratamento de loading e erro no update de perfil.

### Interface

- Conflitos do `pull` resolvidos em `src/screens/AuthScreen.tsx` e `src/screens/OnboardingScreen.tsx`.
- Ajustes de contraste reaplicados no onboarding apos a atualizacao do branch.

## Arquivos importantes nesta investigacao

- `app/_layout.tsx`
- `src/hooks/useAuth.ts`
- `src/store/authStore.ts`
- `src/store/onboardingStore.ts`
- `src/screens/AuthScreen.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/screens/SignupWizardScreen.tsx`
- `src/screens/TermsAndPrivacyScreen.tsx`
- `src/screens/EmailPendingScreen.tsx`

## Estado atual

- `git pull --rebase --autostash origin main` foi aplicado.
- O branch local foi atualizado para o estado mais recente de `origin/main`.
- Os conflitos do autostash foram reconciliados manualmente.
- Os arquivos de tela com conflito ficaram sem diagnosticos no editor apos a resolucao.

## Pendencias

1. Validar o app no dispositivo depois do pull.
2. Confirmar se o onboarding avanca corretamente em todas as etapas.
3. Executar novo teste real de criacao de conta.
4. Confirmar em qual tela o app termina apos signup e confirmacao pendente.
5. Revisar possivel configuracao duplicada de linking se o flicker persistir.

## Fontes adicionais

- `expo_full_logs.txt`
- `logcat_output.txt`
- `SESSION_PROGRESS.md`
- `TESTING_REPORT.md`
