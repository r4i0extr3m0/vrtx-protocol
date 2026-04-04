import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { useAuth, useTheme } from "@/src/hooks";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { hasSupabaseEnv } from "@/src/constants/env";
import { radius, spacing, typography } from "@/src/theme";

export function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabaseReady = useMemo(() => hasSupabaseEnv(), []);

  useEffect(() => {
    if (!hasSeenOnboarding) {
      router.replace("/onboarding");
    }
  }, [hasSeenOnboarding]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Campos obrigatórios", "Preencha e-mail e senha.");
      return;
    }
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      Alert.alert("Falha ao entrar", result.message ?? "Não foi possível autenticar sua sessão.");
      return;
    }
    router.replace("/");
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Campos obrigatórios", "Preencha e-mail e senha.");
      return;
    }
    setSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim() || undefined);
    setSubmitting(false);
    if (!result.success) {
      Alert.alert("Falha ao criar conta", result.message ?? "Não foi possível criar sua conta.");
      return;
    }
    router.replace("/signup-wizard");
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <ScreenContainer className="px-6 py-8">
      <LinearGradient
        colors={[colors.primary + "10", "transparent", colors.info + "08"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(450)} style={styles.hero}>
          <Text style={[styles.kicker, { color: colors.primary }]}>VRTX Protocol</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {mode === "login" ? "Bem-vindo de volta." : "Crie sua conta."}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {!supabaseReady
              ? "Login temporariamente indisponível neste build. Configure Supabase no .env e gere um novo Dev Build."
              : mode === "login"
                ? "Entre com suas credenciais para sincronizar seus dados com segurança."
                : "Crie uma conta para sincronizar treinos, dieta e progresso em todos os dispositivos."}
          </Text>
          <Animated.View entering={FadeIn.delay(180)} style={styles.pillsRow}>
            <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.pillText, { color: colors.foreground }]}>Offline‑first</Text>
            </View>
            <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.pillText, { color: colors.foreground }]}>Privacidade</Text>
            </View>
            <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.pillText, { color: colors.foreground }]}>IA Contextual</Text>
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(450)}
          style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {!supabaseReady ? (
            <>
              <AppButton
                label="Ver Termos e Privacidade"
                onPress={() => router.push("/terms-and-privacy" as never)}
                variant="secondary"
              />
            </>
          ) : (
            <>
          {mode === "signup" && (
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setName}
              placeholder="Nome (opcional)"
              placeholderTextColor={colors.muted}
              style={inputStyle}
              value={name}
            />
          )}
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="E-mail"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Senha"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={inputStyle}
            value={password}
          />
          {mode === "login" ? (
            <>
              <AppButton
                label={submitting ? "Entrando..." : "Entrar"}
                onPress={() => { void handleLogin(); }}
                disabled={submitting}
              />
              <AppButton
                label="Esqueci a Senha"
                onPress={() => router.push("/forgot-password" as never)}
                variant="ghost"
              />
              <AppButton
                label="Criar conta"
                onPress={() => setMode("signup")}
                variant="secondary"
              />
            </>
          ) : (
            <>
              <AppButton
                label={submitting ? "Criando conta..." : "Criar conta"}
                onPress={() => { void handleSignUp(); }}
                disabled={submitting}
              />
              <AppButton
                label="Já tenho conta"
                onPress={() => setMode("login")}
                variant="secondary"
              />
            </>
          )}
          <AppButton 
            label="Termos e Privacidade" 
            onPress={() => router.push("/terms-and-privacy" as never)} 
            variant="ghost" 
          />
            </>
          )}
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "space-between",
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.md,
    paddingTop: spacing.xxl,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  kicker: {
    fontSize: typography.caption,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: typography.hero,
    fontWeight: "900",
    lineHeight: 38,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  form: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
  },
});
