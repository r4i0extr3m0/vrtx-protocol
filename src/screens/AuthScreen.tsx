import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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

import { ScreenWrapper } from "../components/ui";
import { useAuth, useTheme } from "@/src/hooks";
import { hasSupabaseEnv } from "@/src/constants/env";
import { radius, spacing, typography } from "@/src/theme";

export function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp, status, isAuthenticated, setGuestMode } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const supabaseReady = useMemo(() => hasSupabaseEnv(), []);
  const metrics = useMemo(
    () =>
      supabaseReady
        ? [
            { label: "CANAL", value: "SECURE" },
            { label: "SYNC", value: "LIVE" },
            { label: "MODE", value: mode === "login" ? "AUTH" : "CREATE" },
          ]
        : [
            { label: "CANAL", value: "LOCAL" },
            { label: "SYNC", value: "OFF" },
            { label: "MODE", value: "GUEST" },
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
    if (!supabaseReady) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("LOGIN INDISPONIVEL", "Este build está em modo offline. Use 'Continuar offline'.");
      return;
    }

    if (!email.trim() || !password) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("ACESSO NEGADO", "Verifique suas coordenadas (E-mail/Senha).");
      return;
    }
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("FALHA NA AUTENTICAÇÃO", result.message ?? "Erro de conexão com o servidor.");
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/");
  };

  const handleSignUp = async () => {
    if (!supabaseReady) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("REGISTRO INDISPONIVEL", "Este build está em modo offline. Use 'Continuar offline'.");
      return;
    }

    if (!email.trim() || !password) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("DADOS INCOMPLETOS", "Preencha os campos obrigatórios para o registro.");
      return;
    }
    setSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim() || undefined);
    setSubmitting(false);
    if (!result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("FALHA NO REGISTRO", result.message ?? "Não foi possível criar sua conta.");
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
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
                  {supabaseReady ? "SECURE_CHANNEL" : "LOCAL_CHANNEL"}
                </Text>
              </View>
              <Text style={[styles.topMeta, { color: colors.muted }]}>VRTX // 2026</Text>
            </View>

            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: colors.foregroundMuted }]}>VRTX // AUTH</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {mode === "login" ? "Entrar no sistema" : "Criar nova conta"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {!supabaseReady
                  ? "Modo offline detectado. Use a entrada local para continuar."
                  : mode === "login"
                    ? "Acesse seu ambiente com credenciais válidas."
                    : "Cadastre a conta e siga para o setup do protocolo."}
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
                  {supabaseReady ? "AUTHENTICATION_GATE" : "LOCAL_ACCESS_GATE"}
                </Text>
                <Text style={[styles.formHint, { color: colors.muted }]}>
                  {mode === "login" ? "Entrada rápida com validação direta." : "Cadastro simples antes do setup."}
                </Text>
              </View>

              {!supabaseReady ? (
                <View style={styles.offlineWarning}>
                  <Text style={[styles.offlineBadge, { color: colors.warning, borderColor: colors.warning }]}>
                    STATUS: MODO_LOCAL
                  </Text>
                  <Text style={[styles.offlineText, { color: colors.muted }]}>
                    O sistema está operando em modo de isolamento. Os dados serão salvos localmente.
                  </Text>
                  <Pressable
                    onPress={handleContinueOffline}
                    accessibilityLabel="CONTINUAR OFFLINE"
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.primaryButtonText}>CONTINUAR OFFLINE</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/terms-and-privacy" as never)}
                    accessibilityLabel="TERMOS E PRIVACIDADE"
                    style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.foregroundMuted }]}>TERMOS E PRIVACIDADE</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {mode === "signup" && (
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.label, { color: colors.foregroundMuted }]}>OPERADOR</Text>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        placeholder="Nome do Operador"
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
                    <Text style={[styles.label, { color: colors.foregroundMuted }]}>COORDENADA_EMAIL</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="email@vrtx.com"
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
                    <Text style={[styles.label, { color: colors.foregroundMuted }]}>CHAVE_ACESSO</Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCorrect={false}
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

                  <View style={styles.buttonStack}>
                    <Pressable
                      onPress={mode === "login" ? handleLogin : handleSignUp}
                      disabled={submitting}
                      accessibilityLabel={mode === "login" ? "EXECUTAR LOGIN" : "REGISTRAR PROTOCOLO"}
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={styles.primaryButtonText}>
                        {submitting ? "PROCESSANDO..." : mode === "login" ? "EXECUTAR LOGIN" : "REGISTRAR PROTOCOLO"}
                      </Text>
                    </Pressable>
                    
                    <View style={styles.divider}>
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                      <Text style={[styles.dividerText, { color: colors.muted }]}>OU</Text>
                      <View style={[styles.line, { backgroundColor: colors.border }]} />
                    </View>

                    <Pressable
                      onPress={() => setMode(mode === "login" ? "signup" : "login")}
                      accessibilityLabel={mode === "login" ? "CRIAR NOVA CONTA" : "JÁ TENHO ACESSO"}
                      style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.foregroundMuted }]}>
                        {mode === "login" ? "CRIAR NOVA CONTA" : "JÁ TENHO ACESSO"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
            
            <View style={styles.footer}>
              <Text style={[styles.statusFooter, { color: colors.success }]}>
                ● STATUS: OPERACIONAL • VRTX v2.0
              </Text>
              <Pressable onPress={() => router.push("/terms-and-privacy" as never)}>
                <Text style={[styles.legalText, { color: colors.muted }]}>
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
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.wide,
  },
  topMeta: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.wider,
  },
  hero: {
    gap: spacing.xs,
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.widest,
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
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.wide,
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
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.wider,
  },
  formHint: {
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.wide,
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
    fontFamily: typography.family.mono,
    fontSize: 10,
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
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.wide,
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
    fontFamily: typography.family.mono,
    fontSize: typography.size.sm,
    letterSpacing: typography.letterSpacing.wide,
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
    fontFamily: typography.family.mono,
    fontSize: typography.size.sm,
    letterSpacing: typography.letterSpacing.wide,
  },
  footer: {
    alignItems: "center",
    gap: spacing.md,
  },
  statusFooter: {
    fontFamily: typography.family.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  legalText: {
    fontFamily: typography.family.mono,
    fontSize: 9,
    textDecorationLine: "underline",
    letterSpacing: 0.5,
  },
});
