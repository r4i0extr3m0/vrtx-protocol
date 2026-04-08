import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon } from "@/src/components/AppIcon";
import { useAuth, useTheme } from "@/src/hooks";
import { LEGAL_VERSION } from "@/src/legal/legalTexts";
import { calculateDietGoals, type DietProfile, useDietStore } from "@/src/store/dietStore";
import { radius, spacing, typography } from "@/src/theme";

type Step = "account" | "profile" | "routine" | "goals" | "body";

const STEPS: Step[] = ["account", "profile", "routine", "goals", "body"];

const SEX_OPTIONS = [
  { value: "male" as const, label: "Masculino" },
  { value: "female" as const, label: "Feminino" },
  { value: "unspecified" as const, label: "Prefiro nao dizer" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary" as const, label: "Baixa", description: "Rotina mais parada" },
  { value: "light" as const, label: "Leve", description: "Movimento moderado no dia" },
  { value: "moderate" as const, label: "Moderada", description: "Boa frequencia de atividade" },
  { value: "active" as const, label: "Alta", description: "Rotina intensa e ativa" },
];

const WORKOUT_OPTIONS = [0, 2, 3, 4, 5, 6];

export function SignupWizardScreen() {
  const { colors } = useTheme();
  const { signUp, updateProfile, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState<Step>(isAuthenticated ? "profile" : "account");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<DietProfile["sex"]>("unspecified");
  const [weight, setWeight] = useState(user?.weight ? String(user.weight) : "");
  const [height, setHeight] = useState(user?.height ? String(user.height) : "");
  const [activityLevel, setActivityLevel] = useState<DietProfile["activityLevel"]>(
    user?.activityLevel === "light" || user?.activityLevel === "moderate" || user?.activityLevel === "active"
      ? user.activityLevel
      : "moderate",
  );
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [goal, setGoal] = useState<"gain" | "lose" | "maintain">(user?.goal ?? "maintain");
  const [hasBioimpedance, setHasBioimpedance] = useState(false);
  const [bodyFatPercentage, setBodyFatPercentage] = useState("");
  const [leanMassKg, setLeanMassKg] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      setStep("profile");
      setEmail(user?.email ?? "");
      setName(user?.name ?? "");
    }
  }, [isAuthenticated, user?.email, user?.name]);

  const currentStepIndex = STEPS.indexOf(step);
  const canGoBack = currentStepIndex > 0;

  const parseOptionalNumber = (value: string): number | undefined => {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const dietProfile = useMemo((): DietProfile | null => {
    const parsedAge = parseOptionalNumber(age);
    const parsedWeight = parseOptionalNumber(weight);
    const parsedHeight = parseOptionalNumber(height);

    if (!parsedAge || !parsedWeight || !parsedHeight) {
      return null;
    }

    return {
      sex,
      age: Math.round(parsedAge),
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      goal,
      activityLevel,
      workoutsPerWeek,
      bodyFatPercentage: hasBioimpedance ? parseOptionalNumber(bodyFatPercentage) : undefined,
      leanMassKg: hasBioimpedance ? parseOptionalNumber(leanMassKg) : undefined,
    };
  }, [activityLevel, age, bodyFatPercentage, goal, hasBioimpedance, height, leanMassKg, sex, weight, workoutsPerWeek]);

  const goToNextStep = () => {
    const nextStep = STEPS[currentStepIndex + 1];
    if (!nextStep) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(nextStep);
  };

  const goToPreviousStep = () => {
    const previousStep = STEPS[currentStepIndex - 1];
    if (!previousStep) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(previousStep);
  };

  const validateProfileStep = () => {
    if (!age.trim() || !weight.trim() || !height.trim()) {
      Alert.alert("Dados incompletos", "Preencha idade, peso e altura para continuar.");
      return false;
    }

    const parsedAge = parseOptionalNumber(age);
    const parsedWeight = parseOptionalNumber(weight);
    const parsedHeight = parseOptionalNumber(height);

    if (!parsedAge || parsedAge < 13 || parsedAge > 100) {
      Alert.alert("Idade invalida", "Informe uma idade entre 13 e 100 anos.");
      return false;
    }

    if (!parsedWeight || parsedWeight < 30 || parsedWeight > 350) {
      Alert.alert("Peso invalido", "Informe um peso entre 30 e 350 kg.");
      return false;
    }

    if (!parsedHeight || parsedHeight < 120 || parsedHeight > 250) {
      Alert.alert("Altura invalida", "Informe uma altura entre 120 e 250 cm.");
      return false;
    }

    return true;
  };

  const validateBodyStep = () => {
    if (!hasBioimpedance) {
      return true;
    }

    const parsedBodyFat = parseOptionalNumber(bodyFatPercentage);
    const parsedLeanMass = parseOptionalNumber(leanMassKg);
    const parsedWeight = parseOptionalNumber(weight);

    if (!bodyFatPercentage.trim() && !leanMassKg.trim()) {
      Alert.alert("Dados incompletos", "Preencha ao menos um dado de bioimpedancia ou deixe essa etapa desmarcada.");
      return false;
    }

    if (bodyFatPercentage.trim() && (!parsedBodyFat || parsedBodyFat < 3 || parsedBodyFat > 60)) {
      Alert.alert("Percentual invalido", "Informe um percentual de gordura entre 3 e 60.");
      return false;
    }

    if (leanMassKg.trim() && (!parsedLeanMass || parsedLeanMass <= 0)) {
      Alert.alert("Massa magra invalida", "Informe um valor valido para massa magra.");
      return false;
    }

    if (parsedWeight && parsedLeanMass && parsedLeanMass > parsedWeight) {
      Alert.alert("Valor inconsistente", "A massa magra nao pode ser maior que o peso total.");
      return false;
    }

    return true;
  };

  const handleAccountSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Campos obrigatorios", "Preencha e-mail e senha.");
      return;
    }

    if (!acceptedTerms) {
      Alert.alert("Aceite os termos", "Voce precisa aceitar os Termos e a Politica de Privacidade.");
      return;
    }

    setLoading(true);
    const result = await signUp(email.trim(), password, name.trim() || undefined, {
      acceptedAt: new Date().toISOString(),
      version: LEGAL_VERSION,
    });
    setLoading(false);

    if (!result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Falha ao criar conta", result.message ?? "Nao foi possivel criar sua conta.");
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep("profile");
  };

  const handleProfileSubmit = () => {
    if (!validateProfileStep()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    goToNextStep();
  };

  const handleGoalSubmit = () => {
    if (!dietProfile) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Dados incompletos", "Revise suas informacoes antes de continuar.");
      return;
    }

    try {
      calculateDietGoals(dietProfile);
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Dados invalidos", "Revise idade, peso, altura, rotina e objetivo.");
      return;
    }

    goToNextStep();
  };

  const handleFinalSubmit = async () => {
    if (!dietProfile) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Dados incompletos", "Revise seus dados antes de concluir o cadastro.");
      return;
    }

    if (!validateBodyStep()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      calculateDietGoals(dietProfile);
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Dados invalidos", "Nao foi possivel calcular suas metas com os dados informados.");
      return;
    }

    setLoading(true);
    const result = await updateProfile({
      name: name.trim() || undefined,
      weight: dietProfile.weightKg,
      height: dietProfile.heightCm,
      goal,
      activityLevel,
      onboardingCompleted: true,
    });

    if (result.success) {
      useDietStore.getState().applyGoalSetup(dietProfile);
    }

    setLoading(false);

    if (!result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Falha ao salvar perfil", result.message ?? "Nao foi possivel concluir seu cadastro.");
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/");
  };

  const renderStep = () => {
    switch (step) {
      case "account":
        return (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Crie sua conta</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Comece sua jornada e configure seu protocolo inicial.</Text>

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
              disabled={loading || !email.trim() || !password || !acceptedTerms}
            />
          </Animated.View>
        );

      case "profile":
        return (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Seu perfil base</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Esses dados sustentam treino, dieta e metas iniciais.</Text>

            <View style={styles.optionGroup}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Sexo biologico</Text>
              <View style={styles.chipWrap}>
                {SEX_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSex(option.value)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: sex === option.value ? colors.primary + "18" : colors.surfaceAlt,
                        borderColor: sex === option.value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.optionChipText, { color: sex === option.value ? colors.primary : colors.foreground }]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextInput
              placeholder="Idade"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
              value={age}
              onChangeText={setAge}
            />

            <View style={styles.row}>
              <TextInput
                placeholder="Peso (kg)"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={[styles.input, styles.flexInput, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                value={weight}
                onChangeText={setWeight}
              />
              <TextInput
                placeholder="Altura (cm)"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={[styles.input, styles.flexInput, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                value={height}
                onChangeText={setHeight}
              />
            </View>

            <AppButton label="Proximo" onPress={handleProfileSubmit} />
          </Animated.View>
        );

      case "routine":
        return (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Sua rotina</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Isso melhora o calculo de gasto energetico e recuperacao.</Text>

            <View style={styles.optionGroup}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Nivel de atividade</Text>
              <View style={styles.goalOptions}>
                {ACTIVITY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setActivityLevel(option.value);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.goalCard,
                      {
                        backgroundColor: activityLevel === option.value ? colors.primary + "18" : colors.surfaceAlt,
                        borderColor: activityLevel === option.value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.goalText, { color: activityLevel === option.value ? colors.primary : colors.foreground }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.goalHint, { color: colors.muted }]}>{option.description}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.optionGroup}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Treinos por semana</Text>
              <View style={styles.chipWrap}>
                {WORKOUT_OPTIONS.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setWorkoutsPerWeek(value)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: workoutsPerWeek === value ? colors.primary + "18" : colors.surfaceAlt,
                        borderColor: workoutsPerWeek === value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: workoutsPerWeek === value ? colors.primary : colors.foreground },
                      ]}
                    >
                      {value === 0 ? "0" : `${value}x`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <AppButton label="Proximo" onPress={goToNextStep} />
          </Animated.View>
        );

      case "goals":
        return (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Qual seu objetivo?</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Podemos ajustar tudo depois sem perder seu historico.</Text>

            <View style={styles.goalOptions}>
              {(["lose", "maintain", "gain"] as const).map((targetGoal) => (
                <Pressable
                  key={targetGoal}
                  onPress={() => {
                    setGoal(targetGoal);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: goal === targetGoal ? colors.primary + "20" : colors.surfaceAlt,
                      borderColor: goal === targetGoal ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.goalText, { color: goal === targetGoal ? colors.primary : colors.foreground }]}>
                    {targetGoal === "lose" ? "Perder gordura" : targetGoal === "maintain" ? "Manter performance" : "Ganhar massa"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AppButton label="Proximo" onPress={handleGoalSubmit} />
          </Animated.View>
        );

      case "body":
        return (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>Composicao corporal</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Opcional, mas melhora a precisao das metas e da analise corporal.</Text>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasBioimpedance }}
              onPress={() => setHasBioimpedance((current) => !current)}
              style={styles.legalRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: hasBioimpedance ? colors.primary : colors.border,
                    backgroundColor: hasBioimpedance ? colors.primary : "transparent",
                  },
                ]}
              >
                {hasBioimpedance ? <AppIcon name="Check" size={14} color="#08111F" strokeWidth={3} /> : null}
              </View>
              <Text style={[styles.legalCopy, { color: colors.muted }]}>
                Tenho dados de bioimpedancia e quero usar isso agora.
              </Text>
            </Pressable>

            {hasBioimpedance ? (
              <View style={styles.row}>
                <TextInput
                  placeholder="% gordura"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  style={[styles.input, styles.flexInput, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                  value={bodyFatPercentage}
                  onChangeText={setBodyFatPercentage}
                />
                <TextInput
                  placeholder="Massa magra (kg)"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  style={[styles.input, styles.flexInput, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
                  value={leanMassKg}
                  onChangeText={setLeanMassKg}
                />
              </View>
            ) : (
              <View style={[styles.noteCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.noteText, { color: colors.muted }]}>
                  Sem problema. O app monta as metas iniciais com idade, rotina, peso, altura e objetivo.
                </Text>
              </View>
            )}

            <AppButton
              label={loading ? "Finalizando..." : "Concluir Cadastro"}
              onPress={handleFinalSubmit}
              disabled={loading}
            />
          </Animated.View>
        );
    }
  };

  return (
    <ScreenContainer
      scrollable
      keyboardAvoiding
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
      edges={["top", "bottom", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable onPress={goToPreviousStep} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Voltar</Text>
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <View style={styles.progressContainer}>
          {STEPS.map((wizardStep) => (
            <View
              key={wizardStep}
              style={[
                styles.progressDot,
                {
                  backgroundColor: step === wizardStep ? colors.primary : colors.border,
                  width: step === wizardStep ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>{renderStep()}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  backButtonPlaceholder: {
    alignSelf: "stretch",
    height: 28,
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: typography.bodySm,
    fontWeight: "700",
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
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
  flexInput: {
    flex: 1,
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
  optionGroup: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.bodySm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionChipText: {
    fontSize: typography.bodySm,
    fontWeight: "700",
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
    textAlign: "center",
  },
  goalHint: {
    fontSize: typography.caption,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  noteCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  noteText: {
    fontSize: typography.bodySm,
    lineHeight: 20,
  },
});
