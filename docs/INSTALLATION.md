# IronLog — Guia de Instalação

## 📱 Instalação Rápida

### Via Expo Go (Desenvolvimento)
A forma mais rápida de testar o app em desenvolvimento:

```bash
# 1. Clonar repositório
git clone https://github.com/r4i0extr3m0/ironlog.git
cd ironlog

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase

# 4. Rodar em desenvolvimento
npx expo start --android
# Escanear QR code com Expo Go no dispositivo
```

### Via APK (Produção)
Para instalar como app nativo no dispositivo:

```bash
# 1. Gerar APK
npx expo prebuild --platform android --clean
cd android
./gradlew.bat assembleRelease

# 2. Instalar no dispositivo
adb install app/build/outputs/apk/release/app-release.apk

# 3. Abrir app e fazer login
```

---

## 🔧 Pré-requisitos

### Sistema Operacional
- **Windows 10+** ou **macOS 10.15+** ou **Linux**
- **Node.js 18+** (verificar: `node --version`)
- **npm 9+** ou **pnpm 9+** (recomendado: `npm install -g pnpm`)

### Android
- **Android SDK** (instalado via Android Studio)
- **Java 11+** (verificar: `java --version`)
- **ADB** (Android Debug Bridge)
- **Dispositivo Android 7.0+** ou **Emulador**

### Variáveis de Ambiente
```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\seu-usuario\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $env:ANDROID_HOME, "User")

# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 📥 Instalação Detalhada

### Passo 1: Clonar Repositório

```bash
git clone https://github.com/r4i0extr3m0/ironlog.git
cd ironlog
```

### Passo 2: Instalar Dependências

```bash
# Usando pnpm (recomendado)
pnpm install

# Ou usando npm
npm install
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local com suas credenciais
# EXPO_PUBLIC_SUPABASE_URL=sua_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave
# EXPO_PUBLIC_FOOD_API_URL=sua_api_url
```

### Passo 4: Conectar Dispositivo

```bash
# Verificar se dispositivo está conectado
adb devices

# Habilitar USB Debugging no dispositivo
# Configurações > Sobre o telefone > Número da compilação (clicar 7x)
# Configurações > Opções do desenvolvedor > Depuração USB
```

### Passo 5: Rodar em Desenvolvimento

#### Opção A: Via Expo Go (Mais Rápido)
```bash
npx expo start --android
# Escanear QR code com Expo Go
```

#### Opção B: Via APK (Mais Realista)
```bash
# Gerar APK
npx expo prebuild --platform android --clean

# Compilar
cd android
./gradlew.bat assembleRelease

# Instalar
adb install app/build/outputs/apk/release/app-release.apk

# Abrir app
adb shell am start -n com.ironlog.app/.MainActivity
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to Metro"

**Causa**: Dispositivo não consegue alcançar o servidor Metro

**Solução**:
```bash
# Opção 1: Usar ADB reverse (USB)
adb reverse tcp:8085 tcp:8085
npx expo start --android --localhost

# Opção 2: Usar WiFi (mesmo network)
# Verificar IP da máquina
ipconfig getifaddr en0  # macOS
ipconfig              # Windows

# Configurar no dispositivo
# Expo Go > Dev Settings > Debug server host & port
# Inserir: seu-ip:8085
```

### Erro: "MMKV initialization failed"

**Causa**: MMKV (storage nativo) não inicializou

**Solução**:
```bash
# App usa memory storage como fallback
# Dados não serão persistidos entre sessões
# Reinstalar app resolve:
adb uninstall com.ironlog.app
adb install app/build/outputs/apk/release/app-release.apk
```

### Erro: "Supabase connection failed"

**Causa**: Credenciais incorretas ou sem internet

**Solução**:
```bash
# 1. Verificar variáveis de ambiente
cat .env.local

# 2. Verificar conexão de internet
ping 8.8.8.8

# 3. App funciona offline
# Dados sincronizam quando conectar
```

### Erro: "SDK location not found"

**Causa**: ANDROID_HOME não configurado

**Solução**:
```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\seu-usuario\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $env:ANDROID_HOME, "User")

# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### Erro: "Gradle build failed"

**Causa**: Dependências ou cache corrompido

**Solução**:
```bash
# Limpar cache
cd android
./gradlew.bat clean

# Reconstruir
./gradlew.bat assembleRelease
```

---

## 🚀 Próximos Passos

### Após Instalação
1. **Abrir app** e fazer login com email/senha
2. **Criar primeiro treino** para testar funcionalidade
3. **Desabilitar internet** para testar offline-first
4. **Sincronizar** quando conectar novamente

### Desenvolvimento
1. Fazer alterações no código
2. Salvar arquivo (Metro recarrega automaticamente)
3. Testar no dispositivo

### Contribuição
Veja [CONTRIBUTING.md](CONTRIBUTING.md) para contribuir com melhorias

---

## 📚 Recursos Adicionais

- [Documentação Expo](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Guide](https://expo.github.io/router)

---

## ❓ Perguntas Frequentes

**P: Posso rodar em emulador?**
R: Sim, use `npx expo start --android` e selecione o emulador

**P: Preciso de conta Supabase?**
R: Sim, crie em [supabase.com](https://supabase.com)

**P: Funciona offline?**
R: Sim, 100% offline-first. Sincroniza quando conectar

**P: Posso usar em iOS?**
R: Sim, use `npx expo start --ios` (requer macOS)

**P: Como contribuir?**
R: Veja [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Última atualização**: 31 de Março de 2026
