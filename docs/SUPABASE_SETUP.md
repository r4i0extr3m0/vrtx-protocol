# IronLog — Guia de Configuração do Supabase

## 🔑 O Que Você Precisa

Para conectar o IronLog ao Supabase corretamente, você precisa de:

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
   - **Name**: `ironlog` (ou outro nome)
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

## 🔧 Configurar no IronLog

### Opção 1: Arquivo `.env.local` (Recomendado)

1. Na raiz do projeto, crie um arquivo chamado `.env.local`:
   ```bash
   touch .env.local
   ```

2. Adicione as credenciais:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
   EXPO_PUBLIC_FOOD_API_URL=https://api.ironlog.ai/v1/recognize
   ```

3. **Importante**: Não faça commit deste arquivo (já está no `.gitignore`)

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

## 🗄️ Configurar Banco de Dados (Opcional)

Se quiser usar recursos avançados do Supabase:

### 1. Criar Tabelas

1. No Supabase, clique em "SQL Editor"
2. Clique em "New Query"
3. Cole o SQL para criar tabelas (veja `supabase/migrations/`)
4. Clique em "Run"

### 2. Habilitar RLS (Row Level Security)

1. Clique em "Authentication" → "Policies"
2. Crie policies para proteger dados por usuário

### 3. Configurar Email (Opcional)

1. Clique em "Authentication" → "Email Templates"
2. Configure templates de email para confirmação

---

## 🔐 Segurança

### ⚠️ IMPORTANTE

- **Nunca** compartilhe a chave `EXPO_PUBLIC_SUPABASE_ANON_KEY` publicamente
- **Nunca** faça commit do `.env.local` (já está no `.gitignore`)
- A chave "anon" é pública por design (usada no frontend)
- Para operações sensíveis, use a chave "service_role" apenas no backend

### Rotação de Chaves

Se a chave vazar:
1. Vá para Supabase → Settings → API
2. Clique em "Regenerate" ao lado da chave comprometida
3. Atualize no seu `.env.local`

---

## 🐛 Troubleshooting

### Erro: "Credenciais Supabase ainda não configuradas"

**Causa**: As variáveis de ambiente não estão sendo lidas

**Solução**:
1. Verifique se `.env.local` existe na raiz do projeto
2. Verifique se as variáveis têm os nomes corretos:
   - `EXPO_PUBLIC_SUPABASE_URL` (não `SUPABASE_URL`)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (não `SUPABASE_KEY`)
3. Reinicie o servidor Expo: `npx expo start --android`
4. Limpe o cache: `npx expo start --android --clear`

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

1. **Criar conta** no app
2. **Fazer login** com a conta criada
3. **Testar offline-first** criando um treino
4. **Sincronizar** quando conectar à internet

---

**Status**: Guia de Configuração Completo

**Última atualização**: 31 de Março de 2026
