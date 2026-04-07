import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenWrapper } from "../components/ui";
import { AppIcon } from "@/src/components/AppIcon";
import { useAuth, useTheme } from "@/src/hooks";
import { hasSupabaseEnv } from "@/src/constants/env";
import { LEGAL_VERSION } from "@/src/legal/legalTexts";
import { radius, spacing, typography } from "@/src/theme";

export function AuthScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, status, isAuthenticated, setGuestMode } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const supabaseReady = useMemo(() => hasSupabaseEnv(), []);
  const metrics = useMemo(
    () =>
      supabaseReady
        ? [
            { label: "Canal", value: "Seguro" },
            { label: "Sync", value: "Ativa" },
            { label: "Modo", value: mode === "login" ? "Entrar" : "Cadastro" },
          ]
        : [
            { label: "Canal", value: "Local" },
            { label: "Sync", value: "Pausada" },
            { label: "Modo", value: "Offline" },
          ],
    [mode, supabaseReady],
  );

  useEffect(() => {
    if (status === "guest") {
      router.replace("/(tabs)");
      return;
    }

    if (isAuthenticated) {
      router.replace("/");
      return;
    }

  }, [isAuthenticated, status, supabaseReady]);

  const handleContinueOffline = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGuestMode();
    router.replace("/(tabs)");
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!supabaseReady) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Login indisponivel", "Este app esta em modo offline. Toque em 'Continuar offline' para seguir.");
      return;
    }

    if (!email.trim() || !password) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Revise seus dados", "Preencha e-mail e senha para entrar.");
      return;
    }
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Nao foi possivel entrar", result.message ?? "Houve um problema de conexao. Tente novamente.");
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/");
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();

    if (!supabaseReady) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Cadastro indisponivel", "Este app esta em modo offline. Toque em 'Continuar offline' para seguir.");
      return;
    }

    if (!email.trim() || !password) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Faltam algumas informacoes", "Preencha os campos obrigatorios para criar sua conta.");
      return;
    }
    if (!acceptedTerms) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Aceite os termos",
        "Voce precisa aceitar os Termos e a Politica de Privacidade antes de criar sua conta.",
      );
      return;
    }
    setSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim() || undefined, {
      acceptedAt: new Date().toISOString(),
      version: LEGAL_VERSION,
    });
    setSubmitting(false);
    if (!result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Nao foi possivel criar a conta", result.message ?? "Tente novamente em instantes.");
      return;
    }
    
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/signup-wizard");
  };

  return (
    <ScreenWrapper withSafeArea={false} style={styles.screen}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom + spacing.xl, spacing.xxl),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.content,
              {
                paddingTop: Math.max(insets.top + spacing.lg, 44),
              },
            ]}
          >
            <View pointerEvents="none" style={styles.background}>
              <View style={[styles.orbLarge, { backgroundColor: colors.primaryGlow }]} />
              <View style={[styles.orbSmall, { backgroundColor: "rgba(255,255,255,0.05)" }]} />
              <View style={[styles.gridLine, styles.gridTop, { borderColor: colors.border }]} />
              <View style={[styles.gridLine, styles.gridBottom, { borderColor: colors.border }]} />
            </View>

            <View style={styles.topBar}>
              <View style={[styles.statusPill, { borderColor: colors.borderStrong, backgroundColor: "rgba(255,255,255,0.03)" }]}>
                <View style={[styles.statusDot, { backgroundColor: supabaseReady ? colors.success : colors.warning }]} />
                <Text style={[styles.statusPillText, { color: colors.foregroundMuted }]}>
                  {supabaseReady ? "Conexao segura" : "Acesso local"}
                </Text>
              </View>
              <Text style={[styles.topMeta, { color: colors.muted }]}>VRTX 2026</Text>
            </View>

            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: colors.foregroundMuted }]}>Bem-vindo</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {mode === "login" ? "Entrar na sua conta" : "Criar sua conta"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {!supabaseReady
                  ? "Voce esta no modo offline. Seus dados ficam salvos neste dispositivo."
                  : mode === "login"
                    ? "Entre para retomar seus treinos, historico e configuracoes."
                    : "Crie sua conta e siga para uma configuracao rapida."}
              </Text>
            </View>

            <View style={styles.metricsRow}>
              {metrics.map((item) => (
                <View
                  key={item.label}
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: "rgba(255,255,255,0.025)",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>{item.label}</Text>
                  <Text style={[styles.metricValue, { color: colors.foreground }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
              <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.formEyebrow, { color: colors.foregroundMuted }]}>
                  {supabaseReady ? "Acesso a conta" : "Modo offline"}
                </Text>
                <Text style={[styles.formHint, { color: colors.muted }]}>
                  {mode === "login" ? "Use seus dados para entrar com seguranca." : "Faltam poucos passos para comecar."}
                </Text>
              </View>

              {!supabaseReady ? (
                <View style={styles.offlineWarning}>
                  <Text style={[styles.offlineBadge, { color: colors.warning, borderColor: colors.warning }]}>
                    Modo offline ativo
                  </Text>
                  <Text style={[styles.offlineText, { color: colors.muted }]}>
                    Voce pode explorar o app agora mesmo. Os dados serao salvos localmente neste aparelho.
                  </Text>
                  <Pressable
                    onPress={handleContinueOffline}
                    accessibilityLabel="Continuar offline"
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.primaryButtonText}>Continuar offline</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/terms-and-privacy" as never)}
                    accessibilityLabel="Termos e privacidade"
                    style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.foregroundMuted }]}>Termos e privacidade</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {mode === "signup" && (
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.label, { color: colors.foregroundMuted }]}>Nome</Text>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        placeholder="Como voce prefere ser chamado?"
                        placeholderTextColor={colors.muted}
                        style={[
                          styles.input,
                          {
                            color: colors.foreground,
                            borderColor: colors.borderStrong,
                            backgroundColor: colors.surfaceAlt,
                          },
                        ]}
                      />
                    </View>
                  )}
                  
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { color: colors.foregroundMuted }]}>E-mail</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      placeholder="voce@exemplo.com"
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.input,
                        {
                          color: colors.foreground,
                          borderColor: colors.borderStrong,
                          backgroundColor: colors.surfaceAlt,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { color: colors.foregroundMuted }]}>Senha</Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void (mode === "login" ? handleLogin() : handleSignUp());
                      }}
                      placeholder="••••••••"
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.input,
                        {
                          color: colors.foreground,
                          borderColor: colors.borderStrong,
                          backgroundColor: colors.surfaceAlt,
                        },
                      ]}
                    />
                  </View>

                  {mode === "signup" ? (
                    <View style={styles.legalBlock}>
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: acceptedTerms }}
                        onPress={() => setAcceptedTerms((current) => !current)}
                        style={styles.legalRow}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: acceptedTerms ? colors.primary : colors.borderStrong,
                              backgroundColor: acceptedTerms ? colors.primary : "transparent",
                            },
                          ]}
                        >
                          {acceptedTerms ? <AppIcon name="Check" size={14} color="#08111F" strokeWidth={3} /> : null}
                        </View>
                        <Text style={[styles.legalCopy, { color: colors.foregroundMuted }]}>
                          Eu li e aceito os Termos e a Politica de Privacidade.
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => router.push("/terms-and-privacy" as never)}>
                        <Text style={[styles.legalLink, { color: colors.primary }]}>
                          Ler termos e politica
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <View style={styles.buttonStack}>
                    <Pressable
                      onPress={mode === "login" ? handleLogin : handleSignUp}
                      disabled={submitting || (mode === "signup" && !acceptedTerms)}
                      accessibilityLabel={mode === "login" ? "Entrar" : "Criar conta"}
                      style={[
                        styles.primaryButton,
                        {
                          backgroundColor: colors.primary,
                          opacity: submitting || (mode === "signup" && !acceptedTerms) ? 0.55 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.primaryButtonText}>
                        {submitting ? (mode === "login" ? "Entrando..." : "Criando conta...") : mode === "login" ? "Entrar" : "Criar conta"}
                      </Text>
                    </Pressable>
                    
                    <View style={styles.divider}>
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                      <Text style={[styles.dividerText, { color: colors.muted }]}>ou</Text>
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                    </View>

                    <Pressable
                      onPress={() => setMode(mode === "login" ? "signup" : "login")}
                      accessibilityLabel={mode === "login" ? "Criar conta" : "Ja tenho conta"}
                      style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.foregroundMuted }]}>
                        {mode === "login" ? "Criar conta" : "Ja tenho conta"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
            
            <View style={styles.footer}>
              <Text style={[styles.statusFooter, { color: colors.success }]}>
                Tudo pronto para voce comecar
              </Text>
              <Pressable onPress={() => router.push("/terms-and-privacy" as never)}>
                <Text style={[styles.legalText, { color: colors.muted }]}>
                  Termos de servico e privacidade
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
  screen: {
    backgroundColor: "#0B0D10",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 44,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
    gap: spacing.xl,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orbLarge: {
    position: "absolute",
    top: 40,
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  orbSmall: {
    position: "absolute",
    bottom: 120,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    opacity: 0.3,
  },
  gridTop: {
    top: 112,
  },
  gridBottom: {
    bottom: 180,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  topMeta: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  hero: {
    gap: spacing.xs,
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: typography.family.heading,
    fontSize: 32,
    lineHeight: 38,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.family.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.8,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  metricLabel: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  metricValue: {
    fontFamily: typography.family.heading,
    fontSize: typography.size.sm,
  },
  formCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: spacing.md,
    overflow: "hidden",
  },
  formHeader: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  formEyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  formHint: {
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  legalBlock: {
    gap: spacing.sm,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  legalCopy: {
    flex: 1,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  legalLink: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    fontWeight: "700",
  },
  label: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.family.body,
    fontSize: typography.size.md,
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
    fontFamily: typography.family.body,
    fontSize: 12,
    fontWeight: "700",
  },
  offlineWarning: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  offlineText: {
    fontFamily: typography.family.body,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  offlineBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: "#F8FAFC",
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: "center",
    gap: spacing.md,
  },
  statusFooter: {
    fontFamily: typography.family.body,
    fontSize: 12,
    fontWeight: "700",
  },
  legalText: {
    fontFamily: typography.family.body,
    fontSize: 11,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});
