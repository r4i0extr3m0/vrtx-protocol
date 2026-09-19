# VRTX Protocol — Guia de Configuração do Supabase

## 🔑 O Que Você Precisa

Para conectar o VRTX Protocol ao Supabase corretamente, você precisa de:

1. **Conta Supabase** (gratuita em https://supabase.com)
2. **Projeto Supabase** criado
3. **Duas chaves de API**:
   - `EXPO_PUBLIC_SUPABASE_URL` — URL do seu projeto
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Chave anônima pública

---

## 📋 Passo a Passo para Obter as Credenciais

### 1. Criar Conta Supabase

1. Acesse https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub ou email
4. Crie uma nova organização (ou use a padrão)

### 2. Criar um Novo Projeto

1. Clique em "New project"
2. Preencha os dados:
   - **Name**: `vrtx-protocol` (ou outro nome)
   - **Database Password**: Crie uma senha forte (guarde bem!)
   - **Region**: Escolha a região mais próxima (ex: `sa-east-1` para Brasil)
3. Clique em "Create new project"
4. Aguarde 2-3 minutos enquanto o projeto é criado

### 3. Obter as Credenciais

Após o projeto ser criado:

1. Clique em "Settings" (engrenagem) no menu esquerdo
2. Clique em "API" no submenu
3. Você verá:
   - **Project URL** → Copie isso para `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** → Copie isso para `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Exemplo**:
```
EXPO_PUBLIC_SUPABASE_URL=https://xyzabc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔧 Configurar no VRTX Protocol

### Opção 1: Arquivo `.env` (Recomendado)

1. Na raiz do projeto, crie um arquivo chamado `.env`:
   ```bash
   touch .env
   ```

2. Adicione as credenciais:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-aqui
   EXPO_PUBLIC_AI_API_URL=http://localhost:8000
   ```

3. **Importante**: Não faça commit deste arquivo (já está no `.gitignore`).

> Use a chave **publishable/anon** (`sb_publishable_...` ou JWT `anon`). O app rejeita `sb_secret_` no client (`src/constants/env.ts`). O app lê apenas `.env`, não `.env.local` (ver `scripts/load-env.js`).

### Opção 2: Variáveis de Ambiente do Sistema

**Windows (PowerShell)**:
```powershell
$env:EXPO_PUBLIC_SUPABASE_URL = "https://seu-projeto.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY = "sua-chave-anonima-aqui"
[Environment]::SetEnvironmentVariable("EXPO_PUBLIC_SUPABASE_URL", $env:EXPO_PUBLIC_SUPABASE_URL, "User")
[Environment]::SetEnvironmentVariable("EXPO_PUBLIC_SUPABASE_ANON_KEY", $env:EXPO_PUBLIC_SUPABASE_ANON_KEY, "User")
```

**macOS/Linux**:
```bash
export EXPO_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anonima-aqui"
```

---

## ✅ Verificar Configuração

### 1. Verificar se as Variáveis Estão Carregadas

```bash
# Windows (PowerShell)
$env:EXPO_PUBLIC_SUPABASE_URL
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY

# macOS/Linux
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Ambas devem retornar valores (não vazias).

### 2. Verificar no Código

O arquivo `src/constants/env.ts` verifica automaticamente:
```typescript
export function hasSupabaseEnv(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
```

Se retornar `false`, as credenciais não estão configuradas.

### 3. Testar Conexão

1. Abra o app
2. Tente criar uma conta
3. Se funcionar, a conexão está OK
4. Se der erro "credenciais supabase ainda não configuradas", volte ao passo anterior

---

## 🗄️ Banco de Dados e Migrations (obrigatório para o modo coach)

O schema da plataforma B2B é definido pelas migrations em `supabase/migrations/`. Aplique-as no **SQL Editor** do Supabase, **uma por vez e nesta ordem**:

```
20260908_b2b_coach_platform.sql    # roles (coach/user), planos, coach_clients, RLS
20260909_b2b_prescriptions.sql     # prescrição de treino
20260910_b2b_adherence.sql         # aderência (feito x programado)
20260911_b2b_measurements.sql      # avaliações/medidas corporais
20260912_b2b_nutrition.sql         # plano nutricional (metas treino x descanso)
20260913_b2b_nutrition_meals.sql   # refeições + check-ins de adesão nutricional
```

Passos:

1. Supabase → **SQL Editor** → **New query**.
2. Cole o conteúdo de uma migration e clique em **Run**. Repita na ordem acima.
3. Confirme em **Table Editor** que as tabelas `coach_clients`, `coach_nutrition_plans` e `coach_nutrition_checkins` existem.
4. As migrations já habilitam RLS e criam os RPCs `security definer` que validam o vínculo coach-aluno (inclusive o limite de alunos por plano).

> Enquanto as migrations não forem aplicadas, as telas de coach exibem aviso ou falham nos RPCs. Inverter a ordem quebra dependências entre tabelas/funções.

### Edge Functions

O repositório inclui duas funções em `supabase/functions/`:

- `delete-user-account`: usada pela tela de exclusão de conta.
- `revenuecat-webhook`: integração de assinaturas (legado B2C).

Publique pelo Dashboard (**Edge Functions**) ou com a CLI:

```bash
supabase functions deploy delete-user-account
```

### Configurar Email (Opcional)

1. Clique em "Authentication" → "Email Templates"
2. Configure templates de email para confirmação

---

## 🔐 Segurança

### ⚠️ IMPORTANTE

- **Nunca** compartilhe a chave `EXPO_PUBLIC_SUPABASE_ANON_KEY` publicamente
- **Nunca** faça commit do `.env` (já está no `.gitignore`)
- A chave "anon"/publishable é pública por design (usada no frontend)
- Para operações sensíveis, use a chave "service_role" apenas no backend

### Rotação de Chaves

Se a chave vazar:
1. Vá para Supabase → Settings → API
2. Clique em "Regenerate" ao lado da chave comprometida
3. Atualize no seu `.env`

---

## 🐛 Troubleshooting

### Erro: "Credenciais Supabase ainda não configuradas"

**Causa**: As variáveis de ambiente não estão sendo lidas

**Solução**:
1. Verifique se `.env` existe na raiz do projeto
2. Verifique se as variáveis têm os nomes corretos:
   - `EXPO_PUBLIC_SUPABASE_URL` (não `SUPABASE_URL`)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (não `SUPABASE_KEY`)
3. Reinicie o servidor Expo: `pnpm dev:metro` (ou `npx expo start --dev-client --port 8082`)
4. Limpe o cache: `npx expo start --dev-client --port 8082 --clear`

### Erro: "Failed to create account"

**Causa**: Supabase não conseguiu criar o usuário

**Possíveis razões**:
1. Email já existe
2. Senha muito fraca
3. Supabase não está respondendo
4. RLS bloqueando a operação

**Solução**:
1. Verifique em Supabase → Authentication → Users se o email existe
2. Tente com uma senha mais forte (8+ caracteres)
3. Verifique a conexão de internet
4. Verifique as policies de RLS

### Erro: "Network request failed"

**Causa**: Não conseguiu conectar ao Supabase

**Solução**:
1. Verifique a URL do Supabase (deve ser `https://...supabase.co`)
2. Verifique a conexão de internet
3. Verifique se o firewall não está bloqueando
4. Tente usar VPN se estiver em rede restrita

---

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

---

## ✨ Próximos Passos

Após configurar o Supabase:

1. **Aplicar as migrations B2B** na ordem da seção "Banco de Dados e Migrations"
2. **Criar conta** no app (praticante ou personal)
3. **Fazer login** com a conta criada
4. **Testar o modo coach**: gerar convite e entrar com o código em outro dispositivo
5. **Testar offline-first** criando um treino
6. **Sincronizar** quando conectar à internet

---

**Status**: Guia de Configuração Completo

**Última atualização**: 19 de Setembro de 2026
