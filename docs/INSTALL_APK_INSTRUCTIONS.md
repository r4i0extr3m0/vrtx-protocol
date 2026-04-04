# IronLog — Instruções para Instalar APK no Dispositivo

## ✅ APK Gerado com Sucesso!

O APK foi compilado com sucesso em:
```
c:\Users\victo\ironlog\android\app\build\outputs\apk\release\app-release.apk
```

**Tamanho**: ~50-60 MB
**Versão**: 1.0.0
**Compatibilidade**: Android 7.0+

---

## 📱 Passo a Passo para Instalar

### 1. Conectar Dispositivo via USB

1. Conectar o dispositivo Android ao computador via cabo USB
2. No dispositivo, aceitar a solicitação de "Permitir depuração USB"
3. Verificar conexão:
   ```bash
   adb devices
   ```
   Deve aparecer o ID do dispositivo na lista

### 2. Instalar APK

```bash
adb install c:\Users\victo\ironlog\android\app\build\outputs\apk\release\app-release.apk
```

**Esperado**:
```
Success
```

### 3. Abrir App

```bash
adb shell am start -n com.ironlog.app/.MainActivity
```

Ou abrir manualmente no dispositivo procurando por "IronLog"

---

## 🔧 Troubleshooting

### Erro: "adb: no devices/emulators found"

**Solução**:
1. Verificar se USB Debugging está habilitado no dispositivo
   - Configurações > Sobre o telefone > Número da compilação (clicar 7x)
   - Configurações > Opções do desenvolvedor > Depuração USB (ativar)

2. Reiniciar ADB:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

3. Desconectar e reconectar o cabo USB

### Erro: "Failure [INSTALL_FAILED_INVALID_APK]"

**Solução**:
- APK pode estar corrompido
- Tentar novamente:
  ```bash
  adb uninstall com.ironlog.app
  adb install c:\Users\victo\ironlog\android\app\build\outputs\apk\release\app-release.apk
  ```

### Erro: "Failure [INSTALL_FAILED_INSUFFICIENT_STORAGE]"

**Solução**:
- Liberar espaço no dispositivo (precisa de ~100 MB)
- Desinstalar apps desnecessários

---

## ✅ Após Instalação

### Testar Funcionalidades

1. **Login**
   - Abrir app
   - Fazer login com credenciais Supabase
   - Verificar se carrega a tela Home

2. **Offline-First**
   - Desabilitar internet no dispositivo (Modo Avião)
   - Criar um treino
   - Verificar se salva localmente
   - Reabilitar internet
   - Verificar se sincroniza

3. **Navegação**
   - Testar abas: Home, Treino, Histórico, Estatísticas
   - Testar criação de treino
   - Testar visualização de histórico

4. **Performance**
   - Verificar se app responde rápido
   - Verificar se não há travamentos
   - Verificar se animações são suaves

---

## 📊 Próximos Passos

### Imediato
- [ ] Conectar dispositivo via USB
- [ ] Instalar APK
- [ ] Testar fluxo básico

### Curto Prazo (Esta semana)
- [ ] Testar offline-first completo
- [ ] Testar sincronização
- [ ] Documentar bugs encontrados
- [ ] Coletar feedback de UX

### Médio Prazo (Próximas 2 semanas)
- [ ] Implementar melhorias de UX (onboarding, animações)
- [ ] Corrigir bugs críticos
- [ ] Preparar para beta testing

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar [INSTALLATION.md](INSTALLATION.md) para troubleshooting detalhado
2. Verificar logs do app:
   ```bash
   adb logcat | grep ReactNativeJS
   ```
3. Abrir issue no GitHub

---

**Status**: ✅ APK pronto para instalação

**Arquivo APK**: `android/app/build/outputs/apk/release/app-release.apk`

**Próximo passo**: Conectar dispositivo e executar `adb install`
