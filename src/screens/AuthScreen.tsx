import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withTiming, useSharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { useAuth, useTheme } from "@/src/hooks";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { hasSupabaseEnv } from "@/src/constants/env";
import { radius, spacing, typography, shadows } from "@/src/theme";
import { ScreenBackdrop } from "../components/ScreenBackdrop";

export function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp, status, isAuthenticated } = useAuth();
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const supabaseReady = useMemo(() => hasSupabaseEnv(), []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
      return;
    }
    if (!hasSeenOnboarding) {
      router.replace("/onboarding");
    }
  }, [hasSeenOnboarding, isAuthenticated]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("ACESSO NEGADO", "Verifique suas coordenadas (E-mail/Senha).");
      return;
    }
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (result.code === "EMAIL_NOT_CONFIRMED") {
        router.push({ pathname: "/email-pending", params: { email: email.trim() } } as never);
        return;
      }
      // Tradução de erros UX Writing
      const message = result.message?.includes("Invalid login credentials") 
        ? "Acesso negado. Verifique seu e-mail e senha." 
        : result.message;
      Alert.alert("FALHA NA AUTENTICAÇÃO", message ?? "Erro de conexão com o servidor.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/");
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("DADOS INCOMPLETOS", "Preencha os campos obrigatórios para o registro.");
      return;
    }
    setSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim() || undefined);
    setSubmitting(false);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = result.message?.includes("User already registered")
        ? "Este protocolo já está em uso. Tente fazer login."
        : result.message;
      Alert.alert("FALHA NO REGISTRO", message ?? "Não foi possível criar sua conta.");
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (status === "pending_confirmation") {
      router.replace({ pathname: "/email-pending", params: { email: email.trim() } } as never);
      return;
    }
    router.replace("/signup-wizard");
  };

  const getInputStyle = (focused: boolean) => [
    styles.input,
    { 
      backgroundColor: "rgba(255,255,255,0.05)", 
      borderColor: focused ? colors.primary : colors.border, 
      color: colors.foreground,
      borderWidth: focused ? 1.5 : 1,
    },
  ];

  return (
    <ScreenContainer>
      <ScreenBackdrop />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.hero}>
              <Text style={[styles.kicker, { color: colors.primary }]}>VRTX_COMMAND_CENTER</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {mode === "login" ? "AUTH_REQUIRED" : "NEW_PROTOCOL"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {!supabaseReady
                  ? "SISTEMA_OFFLINE: Configure as variáveis de ambiente para habilitar sincronização."
                  : mode === "login"
                    ? "Insira suas credenciais para acessar o painel de controle."
                    : "Inicie o setup do seu hardware biológico no VRTX Protocol."}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(600).springify()}
              style={[styles.form, { backgroundColor: "rgba(26, 26, 26, 0.8)", borderColor: colors.border }]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.03)", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              
              {!supabaseReady ? (
                <View style={styles.offlineWarning}>
                  <Text style={[styles.statusText, { color: colors.warning }]}>STATUS: MODO_LOCAL</Text>
                  <AppButton
                    label="Termos e Privacidade"
                    onPress={() => router.push("/terms-and-privacy" as never)}
                    variant="secondary"
                  />
                </View>
              ) : (
                <>
                  {mode === "signup" && (
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.inputLabel, { color: colors.muted }]}>OPERADOR</Text>
                      <TextInput
                        autoCapitalize="words"
                        autoCorrect={false}
                        onChangeText={setName}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        placeholder="Nome do Operador"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        style={getInputStyle(nameFocused)}
                        value={name}
                      />
                    </View>
                  )}
                  
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: colors.muted }]}>COORDENADA_EMAIL</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="email@vrtx.com"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      style={getInputStyle(emailFocused)}
                      value={email}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: colors.muted }]}>CHAVE_ACESSO</Text>
                    <TextInput
                      onChangeText={setPassword}
                      onFocus={() => setPassFocused(true)}
                      onBlur={() => setPassFocused(false)}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      secureTextEntry
                      style={getInputStyle(passFocused)}
                      value={password}
                    />
                  </View>

                  <View style={styles.buttonStack}>
                    <AppButton
                      label={submitting ? "PROCESSANDO..." : mode === "login" ? "EXECUTAR_LOGIN" : "REGISTRAR_PROTOCOLO"}
                      onPress={() => { 
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        mode === "login" ? void handleLogin() : void handleSignUp(); 
                      }}
                      disabled={submitting}
                    />
                    
                    <View style={styles.divider}>
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                      <Text style={[styles.dividerText, { color: colors.muted }]}>OU</Text>
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                    </View>

                    <AppButton
                      label={mode === "login" ? "CRIAR_NOVA_CONTA" : "JÁ_TENHO_ACESSO"}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setMode(mode === "login" ? "signup" : "login");
                      }}
                      variant="secondary"
                    />
                  </View>
                </>
              )}
            </Animated.View>
            
            <View style={styles.footer}>
              <Text style={[styles.statusFooter, { color: colors.success }]}>● STATUS DO SERVIDOR: OPERACIONAL</Text>
              <Pressable onPress={() => router.push("/terms-and-privacy" as never)}>
                <Text style={[styles.legalText, { color: colors.muted }]}>TERMOS_DE_SERVIÇO // PRIVACIDADE</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    opacity: 0.8,
  },
  form: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    overflow: "hidden",
    ...shadows.card,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  input: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  buttonStack: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  offlineWarning: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  footer: {
    alignItems: "center",
    gap: spacing.md,
  },
  statusFooter: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  legalText: {
    fontSize: 10,
    fontWeight: "600",
    textDecorationLine: "underline",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
