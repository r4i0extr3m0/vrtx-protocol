import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { 
  ScreenWrapper, 
  GlassCard, 
  NeonButton, 
  InputGlass, 
  BadgeMetal 
} from "../components/ui";
import { useAuth, useTheme } from "@/src/hooks";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { hasSupabaseEnv } from "@/src/constants/env";
import { spacing, typography } from "@/src/theme";

export function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp, status, isAuthenticated } = useAuth();
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
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
      Alert.alert("FALHA NA AUTENTICAÇÃO", result.message ?? "Erro de conexão com o servidor.");
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
      Alert.alert("FALHA NO REGISTRO", result.message ?? "Não foi possível criar sua conta.");
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (status === "pending_confirmation") {
      router.replace({ pathname: "/email-pending", params: { email: email.trim() } } as never);
      return;
    }
    router.replace("/signup-wizard");
  };

  return (
    <ScreenWrapper withSafeArea={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.hero}>
              <BadgeMetal label="VRTX_COMMAND_CENTER" variant="primary" style={styles.heroBadge} />
              <Text style={[styles.title, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                {mode === "login" ? "AUTH_REQUIRED" : "NEW_PROTOCOL"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.family.mono }]}>
                {!supabaseReady
                  ? "SISTEMA_OFFLINE: Redundância local ativa."
                  : mode === "login"
                    ? "Insira suas credenciais de acesso."
                    : "Inicie o setup do seu hardware biológico."}
              </Text>
            </Animated.View>

            <GlassCard style={styles.formCard} intensity={20}>
              {!supabaseReady ? (
                <View style={styles.offlineWarning}>
                  <BadgeMetal label="STATUS: MODO_LOCAL" variant="warning" />
                  <Text style={[styles.offlineText, { color: colors.muted, fontFamily: typography.family.mono }]}>
                    O sistema está operando em modo de isolamento. Os dados serão salvos localmente.
                  </Text>
                  <NeonButton
                    label="Termos e Privacidade"
                    onPress={() => router.push("/terms-and-privacy" as never)}
                    variant="glass"
                    style={{ width: '100%' }}
                  />
                </View>
              ) : (
                <>
                  {mode === "signup" && (
                    <InputGlass
                      label="OPERADOR"
                      placeholder="Nome do Operador"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  )}
                  
                  <InputGlass
                    label="COORDENADA_EMAIL"
                    placeholder="email@vrtx.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <InputGlass
                    label="CHAVE_ACESSO"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />

                  <View style={styles.buttonStack}>
                    <NeonButton
                      label={submitting ? "PROCESSANDO..." : mode === "login" ? "EXECUTAR_LOGIN" : "REGISTRAR_PROTOCOLO"}
                      onPress={mode === "login" ? handleLogin : handleSignUp}
                      disabled={submitting}
                      variant="primary"
                    />
                    
                    <View style={styles.divider}>
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                      <Text style={[styles.dividerText, { color: colors.muted, fontFamily: typography.family.mono }]}>OU</Text>
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                    </View>

                    <NeonButton
                      label={mode === "login" ? "CRIAR_NOVA_CONTA" : "JÁ_TENHO_ACESSO"}
                      onPress={() => setMode(mode === "login" ? "signup" : "login")}
                      variant="glass"
                    />
                  </View>
                </>
              )}
            </GlassCard>
            
            <View style={styles.footer}>
              <Text style={[styles.statusFooter, { color: colors.success, fontFamily: typography.family.mono }]}>
                ● STATUS: OPERACIONAL • VRTX v2.0
              </Text>
              <Pressable onPress={() => router.push("/terms-and-privacy" as never)}>
                <Text style={[styles.legalText, { color: colors.muted, fontFamily: typography.family.mono }]}>
                  TERMOS_DE_SERVIÇO // PRIVACIDADE
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  heroBadge: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 1,
  },
  formCard: {
    padding: 0,
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
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
  },
  offlineWarning: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  offlineText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
    gap: spacing.md,
  },
  statusFooter: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  legalText: {
    fontSize: 9,
    fontWeight: "600",
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },
});
