import React, { useEffect, useState } from "react";
import { Alert, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { AppIcon } from "@/src/components/AppIcon";
import { useAuth, useTheme } from "@/src/hooks";
import { LEGAL_VERSION } from "@/src/legal/legalTexts";
import { spacing, typography, radius } from "@/src/theme";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { AppButton } from "@/src/components/AppButton";
import * as Haptics from "expo-haptics";

type Step = "account" | "profile" | "goals";

export function SignupWizardScreen() {
  const { colors } = useTheme();
  const { signUp, updateProfile, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>(isAuthenticated ? "profile" : "account");
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState<"gain" | "lose" | "maintain">("maintain");

  useEffect(() => {
    if (isAuthenticated) {
      setStep("profile");
    }
  }, [isAuthenticated]);

  const parseOptionalNumber = (value: string): number | undefined => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleAccountSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Campos obrigatórios", "Preencha e-mail e senha.");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Aceite os termos", "Voce precisa aceitar os Termos e a Politica de Privacidade.");
      return;
    }
    setLoading(true);
    const result = await signUp(email, password, name, {
      acceptedAt: new Date().toISOString(),
      version: LEGAL_VERSION,
    });
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("profile");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Falha ao criar conta", result.message ?? "Não foi possível criar sua conta.");
    }
  };

  const handleProfileSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("goals");
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    const result = await updateProfile({
      weight: parseOptionalNumber(weight),
      height: parseOptionalNumber(height),
      goal,
      onboardingCompleted: true,
    });
    setLoading(false);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Falha ao salvar perfil", result.message ?? "Não foi possível concluir seu cadastro.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/");
  };

  const renderStep = () => {
    switch (step) {
      case "account":
        return (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Crie sua conta</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Comece sua jornada fitness hoje.</Text>
            
            <TextInput
              placeholder="Nome"
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="E-mail"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              placeholder="Senha"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
              value={password}
              onChangeText={setPassword}
            />

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
                      borderColor: acceptedTerms ? colors.primary : colors.border,
                      backgroundColor: acceptedTerms ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {acceptedTerms ? <AppIcon name="Check" size={14} color="#08111F" strokeWidth={3} /> : null}
                </View>
                <Text style={[styles.legalCopy, { color: colors.muted }]}>
                  Eu li e aceito os Termos e a Politica de Privacidade.
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push("/terms-and-privacy" as never)}>
                <Text style={[styles.legalLink, { color: colors.primary }]}>Ler termos e politica</Text>
              </Pressable>
            </View>
            
            <AppButton 
              label={loading ? "Criando..." : "Continuar"} 
              onPress={handleAccountSubmit} 
              disabled={loading || !email || !password || !acceptedTerms}
            />
          </Animated.View>
        );
      case "profile":
        return (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Sobre você</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Isso nos ajuda a calcular suas metas.</Text>
            
            <View style={styles.row}>
              <TextInput
                placeholder="Peso (kg)"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={[styles.input, { flex: 1, backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                value={weight}
                onChangeText={setWeight}
              />
              <TextInput
                placeholder="Altura (cm)"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={[styles.input, { flex: 1, backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                value={height}
                onChangeText={setHeight}
              />
            </View>
            
            <AppButton label="Próximo" onPress={handleProfileSubmit} />
          </Animated.View>
        );
      case "goals":
        return (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Qual seu objetivo?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Podemos mudar isso depois.</Text>
            
            <View style={styles.goalOptions}>
              {(["lose", "maintain", "gain"] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    setGoal(g);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.goalCard,
                    { 
                      backgroundColor: goal === g ? colors.primary + "20" : colors.surfaceAlt,
                      borderColor: goal === g ? colors.primary : colors.border
                    }
                  ]}
                >
                  <Text style={[styles.goalText, { color: goal === g ? colors.primary : colors.foreground }]}>
                    {g === "lose" ? "Perder Peso" : g === "maintain" ? "Manter" : "Ganhar Massa"}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <AppButton label={loading ? "Finalizando..." : "Começar Treino"} onPress={handleFinalSubmit} disabled={loading} />
          </Animated.View>
        );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {(["account", "profile", "goals"] as const).map((s, i) => (
            <View 
              key={s} 
              style={[
                styles.progressDot, 
                { 
                  backgroundColor: step === s ? colors.primary : colors.border,
                  width: step === s ? 24 : 8
                }
              ]} 
            />
          ))}
        </View>
      </View>
      
      <View style={styles.content}>
        {renderStep()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  progressContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  stepContainer: {
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.hero,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    marginBottom: spacing.md,
  },
  input: {
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
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
    fontSize: typography.bodySm,
    lineHeight: 20,
  },
  legalLink: {
    fontSize: typography.bodySm,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  goalOptions: {
    gap: spacing.md,
  },
  goalCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  goalText: {
    fontSize: typography.section,
    fontWeight: "700",
  },
});
