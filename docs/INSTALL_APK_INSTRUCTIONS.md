# VRTX Protocol - Instalar APK

## Gerar

Na raiz do repositorio:

```powershell
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
```

O arquivo sera gerado em `android/app/build/outputs/apk/release/app-release.apk`.

## Instalar e abrir

```powershell
adb devices
adb install android\app\build\outputs\apk\release\app-release.apk
adb shell monkey -p com.vrtxprotocol.app 1
```

Configure `.env` e gere o build novamente se o APK precisar autenticar ou acessar Supabase. Sem essas variaveis, valide apenas os fluxos locais/offline.

## Diagnostico rapido

```powershell
adb kill-server
adb start-server
adb devices
adb logcat | Select-String 'ReactNativeJS|Expo|Supabase'
```

Se o Metro nao for alcancado por Wi-Fi, use `adb reverse tcp:8082 tcp:8082` e inicie `pnpm dev:metro`.
