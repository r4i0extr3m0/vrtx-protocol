import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useAuth, useTheme } from "@/src/hooks";
import { calculateDietGoals, type DietProfile, useDietStore } from "@/src/store/dietStore";
import { radius, spacing, typography } from "@/src/theme";

type SetupStep = "base" | "routine" | "bio" | "review" | "manual";

const SEX_OPTIONS = [
  { value: "male" as const, label: "Masculino" },
  { value: "female" as const, label: "Feminino" },
  { value: "unspecified" as const, label: "Prefiro nao dizer" },
];

const GOAL_OPTIONS = [
  { value: "lose" as const, label: "Reduzir gordura" },
  { value: "maintain" as const, label: "Manter performance" },
  { value: "gain" as const, label: "Ganhar massa" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary" as const, label: "Baixa", description: "Muito tempo sentado" },
  { value: "light" as const, label: "Leve", description: "Caminho um pouco" },
  { value: "moderate" as const, label: "Moderada", description: "Me movimento bastante" },
  { value: "active" as const, label: "Alta", description: "Trabalho ativo / muito movimento" },
];

const WORKOUT_OPTIONS = [0, 2, 3, 4, 5, 6];

function parseDecimal(value: string): number | undefined {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatGoalValue(value: number, suffix: string): string {
  return `${Math.round(value)} ${suffix}`;
}

function areBioInputsInconsistent(weightKg: number, bodyFat?: number, leanMass?: number): boolean {
  if (typeof bodyFat !== "number" || typeof leanMass !== "number") {
    return false;
  }

  const inferredLeanMass = weightKg * (1 - bodyFat / 100);
  return Math.abs(inferredLeanMass - leanMass) > 3;
}

export function GoalsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const {
    dailyGoals,
    profile,
    goalsConfigured,
    goalsLockedManually,
    setDailyGoals,
    applyGoalSetup,
    setDietProfile,
    setGoalsLockedManually,
  } = useDietStore();

  const isSetupFlow = mode === "setup" || !goalsConfigured;
  const [step, setStep] = useState<SetupStep>(isSetupFlow ? "base" : "manual");

  const [sex, setSex] = useState<DietProfile["sex"]>(profile?.sex ?? "unspecified");
  const [age, setAge] = useState(profile ? String(profile.age) : "");
  const [heightCm, setHeightCm] = useState(
    profile ? String(profile.heightCm) : user?.height ? String(user.height) : "",
  );
  const [weightKg, setWeightKg] = useState(
    profile ? String(profile.weightKg) : user?.weight ? String(user.weight) : "",
  );
  const [goal, setGoal] = useState<DietProfile["goal"]>(profile?.goal ?? user?.goal ?? "maintain");
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(profile?.workoutsPerWeek ?? 3);
  const [activityLevel, setActivityLevel] = useState<DietProfile["activityLevel"]>(
    profile?.activityLevel ?? (user?.activityLevel === "active" || user?.activityLevel === "light" || user?.activityLevel === "moderate"
      ? user.activityLevel
      : "moderate"),
  );
  const [hasBioimpedance, setHasBioimpedance] = useState(Boolean(profile?.bodyFatPercentage || profile?.leanMassKg));
  const [bodyFatPercentage, setBodyFatPercentage] = useState(
    profile?.bodyFatPercentage ? String(profile.bodyFatPercentage) : "",
  );
  const [leanMassKg, setLeanMassKg] = useState(profile?.leanMassKg ? String(profile.leanMassKg) : "");

  const [calories, setCalories] = useState(String(dailyGoals.calories));
  const [protein, setProtein] = useState(String(dailyGoals.protein));
  const [carbs, setCarbs] = useState(String(dailyGoals.carbs));
  const [fat, setFat] = useState(String(dailyGoals.fat));
  const [waterMl, setWaterMl] = useState(String(dailyGoals.waterMl ?? 2500));
  const [manualLockEnabled, setManualLockEnabled] = useState(goalsLockedManually);

  useEffect(() => {
    if (!isSetupFlow) {
      setStep("manual");
    }
  }, [isSetupFlow]);

  const parsedProfile = useMemo((): DietProfile | null => {
    const parsedAge = parseDecimal(age);
    const parsedHeight = parseDecimal(heightCm);
    const parsedWeight = parseDecimal(weightKg);

    if (!parsedAge || !parsedHeight || !parsedWeight) {
      return null;
    }

    const parsedBodyFat = parseDecimal(bodyFatPercentage);
    const parsedLeanMass = parseDecimal(leanMassKg);

    return {
      sex,
      age: Math.round(parsedAge),
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      goal,
      activityLevel,
      workoutsPerWeek,
      bodyFatPercentage: hasBioimpedance ? parsedBodyFat : undefined,
      leanMassKg: hasBioimpedance ? parsedLeanMass : undefined,
    };
  }, [activityLevel, age, bodyFatPercentage, goal, hasBioimpedance, heightCm, leanMassKg, sex, weightKg, workoutsPerWeek]);

  const calculatedGoals = useMemo(() => {
    if (!parsedProfile) {
      return null;
    }

    try {
      return calculateDietGoals(parsedProfile);
    } catch {
      return null;
    }
  }, [parsedProfile]);

  useEffect(() => {
    if (!isSetupFlow) {
      return;
    }

    if (!calculatedGoals) {
      return;
    }

    setCalories(String(calculatedGoals.calories));
    setProtein(String(calculatedGoals.protein));
    setCarbs(String(calculatedGoals.carbs));
    setFat(String(calculatedGoals.fat));
    setWaterMl(String(calculatedGoals.waterMl ?? 2500));
  }, [calculatedGoals, isSetupFlow]);

  const reviewCards = [
    { label: "Calorias", value: formatGoalValue(parseDecimal(calories) ?? 0, "kcal"), subtitle: "Meta diaria" },
    { label: "Proteina", value: formatGoalValue(parseDecimal(protein) ?? 0, "g"), subtitle: "Prioridade do protocolo" },
    { label: "Carboidratos", value: formatGoalValue(parseDecimal(carbs) ?? 0, "g"), subtitle: "Energia para treino" },
    { label: "Gorduras", value: formatGoalValue(parseDecimal(fat) ?? 0, "g"), subtitle: "Base hormonal" },
    { label: "Agua", value: formatGoalValue(parseDecimal(waterMl) ?? 0, "ml"), subtitle: "Meta diaria" },
  ];

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground },
  ];

  const optionCardStyle = (selected: boolean) => [
    styles.optionCard,
    {
      backgroundColor: selected ? colors.primary + "12" : colors.surfaceAlt,
      borderColor: selected ? colors.primary : colors.border,
    },
  ];

  const validateBaseStep = () => {
    if (!age.trim() || !heightCm.trim() || !weightKg.trim()) {
      Alert.alert("Dados incompletos", "Preencha os campos obrigatorios para continuar.");
      return false;
    }

    if (!parsedProfile) {
      Alert.alert("Dados incompletos", "Preencha os campos obrigatorios para continuar.");
      return false;
    }

    try {
      calculateDietGoals(parsedProfile);
    } catch {
      Alert.alert("Valor fora do padrao", "Revise idade, altura, peso e objetivo antes de continuar.");
      return false;
    }

    return true;
  };

  const validateBioStep = () => {
    if (!hasBioimpedance) {
      return true;
    }

    const parsedBodyFat = parseDecimal(bodyFatPercentage);
    const parsedLeanMass = parseDecimal(leanMassKg);

    if (bodyFatPercentage.trim() && (!parsedBodyFat || parsedBodyFat < 3 || parsedBodyFat > 60)) {
      Alert.alert("Valor fora do padrao", "Verifique o numero informado (ex.: % gordura entre 3 e 60).");
      return false;
    }

    if (leanMassKg.trim() && (!parsedLeanMass || parsedLeanMass <= 0)) {
      Alert.alert("Valor fora do padrao", "Verifique o numero informado (ex.: % gordura entre 3 e 60).");
      return false;
    }

    if (parsedProfile && parsedLeanMass && parsedLeanMass > parsedProfile.weightKg) {
      Alert.alert("Valor fora do padrao", "A massa magra nao pode ser maior que o peso atual.");
      return false;
    }

    if (!bodyFatPercentage.trim() && !leanMassKg.trim()) {
      Alert.alert("Dados incompletos", "Preencha ao menos um campo ou pule esta etapa.");
      return false;
    }

    return true;
  };

  const persistManualGoals = () => {
    const parsedCalories = parseDecimal(calories) ?? 0;
    const parsedProtein = parseDecimal(protein) ?? 0;
    const parsedCarbs = parseDecimal(carbs) ?? 0;
    const parsedFat = parseDecimal(fat) ?? 0;
    const parsedWater = parseDecimal(waterMl) ?? 0;

    if (parsedCalories <= 0 || parsedWater <= 0 || parsedProtein < 0 || parsedCarbs < 0 || parsedFat < 0) {
      Alert.alert("Valor fora do padrao", "Revise calorias, macros e agua antes de salvar.");
      return;
    }

    if (!validateBaseStep()) {
      return;
    }

    if (hasBioimpedance && !validateBioStep()) {
      return;
    }

    if (parsedProfile && manualLockEnabled) {
      setGoalsLockedManually(true);
      setDietProfile(parsedProfile);
    }

    if (parsedProfile) {
      if (!manualLockEnabled) {
        const recalculatedGoals = applyGoalSetup(parsedProfile);
        setCalories(String(recalculatedGoals.calories));
        setProtein(String(recalculatedGoals.protein));
        setCarbs(String(recalculatedGoals.carbs));
        setFat(String(recalculatedGoals.fat));
        setWaterMl(String(recalculatedGoals.waterMl ?? 2500));
        setGoalsLockedManually(false);
        Alert.alert("Metas atualizadas", "Painel recalibrado.");
        router.back();
        return;
      }
    }

    setDailyGoals({
      calories: Math.round(parsedCalories),
      protein: Math.round(parsedProtein),
      carbs: Math.round(parsedCarbs),
      fat: Math.round(parsedFat),
      waterMl: Math.round(parsedWater),
    });
    setGoalsLockedManually(manualLockEnabled);
    Alert.alert("Metas atualizadas", "Painel recalibrado.");
    router.back();
  };

  const handleConfirmSetup = () => {
    if (!parsedProfile) {
      Alert.alert("Dados incompletos", "Preencha os campos obrigatorios para continuar.");
      return;
    }

    const parsedBodyFat = parseDecimal(bodyFatPercentage);
    const parsedLeanMass = parseDecimal(leanMassKg);
    if (areBioInputsInconsistent(parsedProfile.weightKg, parsedBodyFat, parsedLeanMass)) {
      Alert.alert("Valor fora do padrao", "Vamos usar % gordura como referencia.");
    }

    applyGoalSetup(parsedProfile);
    setDailyGoals({
      calories: Math.round(parseDecimal(calories) ?? 0),
      protein: Math.round(parseDecimal(protein) ?? 0),
      carbs: Math.round(parseDecimal(carbs) ?? 0),
      fat: Math.round(parseDecimal(fat) ?? 0),
      waterMl: Math.round(parseDecimal(waterMl) ?? 2500),
    });
    setGoalsLockedManually(false);
    Alert.alert("Metas atualizadas", "Painel recalibrado.");
    router.back();
  };

  const renderHeader = (title: string, subtitle: string) => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
    </View>
  );

  const renderSetupHeader = () => {
    switch (step) {
      case "base":
        return renderHeader("Base do protocolo", "Vamos calibrar suas metas com dados minimos. Sem enrolacao.");
      case "routine":
        return renderHeader("Rotina e carga", "Isso ajusta seu gasto diario e evita metas irreais.");
      case "bio":
        return renderHeader("Bioimpedancia (opcional)", "Se voce tiver % de gordura ou massa magra, a proteina fica mais precisa.");
      case "review":
        return renderHeader("Metas prontas", "Ajuste fino e opcional. Voce pode editar quando quiser.");
      default:
        return renderHeader("Metas do protocolo", "Ajuste fino. Sem culpa. Sem ruido.");
    }
  };

  const renderBaseStep = () => (
    <>
      <SectionCard title="Sexo" subtitle="Impacta o calculo basal e ajuda a calibrar melhor o protocolo.">
        <View style={styles.optionGrid}>
          {SEX_OPTIONS.map((option) => (
            <Pressable key={option.value} onPress={() => setSex(option.value)} style={optionCardStyle(sex === option.value)}>
              <Text style={[styles.optionTitle, { color: sex === option.value ? colors.primary : colors.foreground }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Base" subtitle="Os campos abaixo sao o minimo obrigatorio para gerar kcal, macros e agua.">
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Idade</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setAge}
            placeholder="Ex.: 29"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={age}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Altura (cm)</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setHeightCm}
            placeholder="Ex.: 178"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={heightCm}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Peso atual (kg)</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setWeightKg}
            placeholder="Ex.: 82,5"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={weightKg}
          />
        </View>
      </SectionCard>

      <SectionCard title="Objetivo" subtitle="Escolha a direcao principal do protocolo.">
        <View style={styles.optionGrid}>
          {GOAL_OPTIONS.map((option) => (
            <Pressable key={option.value} onPress={() => setGoal(option.value)} style={optionCardStyle(goal === option.value)}>
              <Text style={[styles.optionTitle, { color: goal === option.value ? colors.primary : colors.foreground }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Treinos por semana" subtitle="Conte sessoes de musculacao ou treinos estruturados.">
        <View style={styles.quickOptionsRow}>
          {WORKOUT_OPTIONS.map((option) => {
            const label = option === 6 ? "6+" : String(option);
            const selected = workoutsPerWeek === option || (option === 6 && workoutsPerWeek >= 6);
            return (
              <Pressable
                key={option}
                onPress={() => setWorkoutsPerWeek(option === 6 ? 6 : option)}
                style={[
                  styles.quickOption,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.quickOptionText, { color: selected ? "#fff" : colors.foreground }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <View style={styles.actionsRow}>
        <AppButton label="Voltar" onPress={() => router.back()} variant="secondary" style={styles.flexButton} />
        <AppButton
          label="Continuar"
          onPress={() => {
            if (validateBaseStep()) {
              setStep("routine");
            }
          }}
          style={styles.flexButton}
        />
      </View>
    </>
  );

  const renderRoutineStep = () => (
    <>
      <SectionCard title="Atividade fora do treino" subtitle="Isso ajusta seu gasto diario e evita metas irreais.">
        <View style={styles.optionColumn}>
          {ACTIVITY_OPTIONS.map((option) => (
            <Pressable key={option.value} onPress={() => setActivityLevel(option.value)} style={optionCardStyle(activityLevel === option.value)}>
              <Text style={[styles.optionTitle, { color: activityLevel === option.value ? colors.primary : colors.foreground }]}>
                {option.label}
              </Text>
              <Text style={[styles.optionDescription, { color: colors.muted }]}>{option.description}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <View style={styles.actionsRow}>
        <AppButton label="Voltar" onPress={() => setStep("base")} variant="secondary" style={styles.flexButton} />
        <AppButton
          label="Ver metas"
          onPress={() => {
            if (validateBaseStep()) {
              setStep("bio");
            }
          }}
          style={styles.flexButton}
        />
      </View>
    </>
  );

  const renderBioStep = () => (
    <>
      <SectionCard title="Voce tem bioimpedancia?" subtitle="Se tiver, a proteina fica mais precisa.">
        <View style={styles.binaryRow}>
          <Pressable onPress={() => setHasBioimpedance(true)} style={optionCardStyle(hasBioimpedance)}>
            <Text style={[styles.optionTitle, { color: hasBioimpedance ? colors.primary : colors.foreground }]}>Tenho</Text>
          </Pressable>
          <Pressable onPress={() => setHasBioimpedance(false)} style={optionCardStyle(!hasBioimpedance)}>
            <Text style={[styles.optionTitle, { color: !hasBioimpedance ? colors.primary : colors.foreground }]}>Nao tenho / pular</Text>
          </Pressable>
        </View>

        {hasBioimpedance ? (
          <View style={styles.bioFields}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>% Gordura corporal (opcional)</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setBodyFatPercentage}
                placeholder="Ex.: 18"
                placeholderTextColor={colors.muted}
                style={inputStyle}
                value={bodyFatPercentage}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Massa magra (kg) (opcional)</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setLeanMassKg}
                placeholder="Ex.: 62,0"
                placeholderTextColor={colors.muted}
                style={inputStyle}
                value={leanMassKg}
              />
            </View>
            <Text style={[styles.helperText, { color: colors.muted }]}>Preencha apenas um dos campos se preferir.</Text>
          </View>
        ) : null}
      </SectionCard>

      <View style={styles.actionsColumn}>
        <AppButton
          label="Salvar metas"
          onPress={() => {
            if (!validateBaseStep()) {
              return;
            }

            if (!validateBioStep()) {
              return;
            }

            setStep("review");
          }}
        />
        <AppButton label="Pular esta etapa" onPress={() => setStep("review")} variant="secondary" />
      </View>
    </>
  );

  const renderReviewStep = () => (
    <>
      <View style={styles.goalCardsGrid}>
        {reviewCards.map((card) => (
          <View
            key={card.label}
            style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.goalCardLabel, { color: colors.muted }]}>{card.label}</Text>
            <Text style={[styles.goalCardValue, { color: colors.foreground }]}>{card.value}</Text>
            <Text style={[styles.goalCardSubtitle, { color: colors.muted }]}>{card.subtitle}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsColumn}>
        <AppButton label="Ir para Dieta" onPress={handleConfirmSetup} />
        <AppButton label="Editar agora" onPress={() => setStep("manual")} variant="secondary" />
      </View>
    </>
  );

  const renderManualScreen = () => (
    <>
      {renderHeader("Metas do protocolo", "Ajuste fino. Sem culpa. Sem ruido.")}

      <SectionCard title="Metas manuais" subtitle="Voce pode sobrescrever kcal, macros e agua quando quiser.">
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Calorias (kcal/dia)</Text>
          <TextInput keyboardType="number-pad" onChangeText={setCalories} style={inputStyle} value={calories} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Proteina (g)</Text>
          <TextInput keyboardType="number-pad" onChangeText={setProtein} style={inputStyle} value={protein} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Carboidratos (g)</Text>
          <TextInput keyboardType="number-pad" onChangeText={setCarbs} style={inputStyle} value={carbs} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Gorduras (g)</Text>
          <TextInput keyboardType="number-pad" onChangeText={setFat} style={inputStyle} value={fat} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Agua (ml)</Text>
          <TextInput keyboardType="number-pad" onChangeText={setWaterMl} style={inputStyle} value={waterMl} />
        </View>
      </SectionCard>

      <View style={[styles.toggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.toggleText}>
          <Text style={[styles.toggleTitle, { color: colors.foreground }]}>Fixar metas manualmente</Text>
          <Text style={[styles.toggleSubtitle, { color: colors.muted }]}>
            Quando ativo, o VRTX nao recalcula automaticamente.
          </Text>
        </View>
        <Switch
          onValueChange={setManualLockEnabled}
          thumbColor="#fff"
          trackColor={{ false: colors.border, true: colors.primary }}
          value={manualLockEnabled}
        />
      </View>

      <View style={styles.actionsColumn}>
        <AppButton label="Salvar alteracoes" onPress={persistManualGoals} />
        <AppButton
          label={isSetupFlow ? "Cancelar" : "Voltar"}
          onPress={() => {
            if (isSetupFlow && goalsConfigured) {
              setStep("review");
              return;
            }

            if (isSetupFlow && !goalsConfigured && calculatedGoals) {
              setStep("review");
              return;
            }

            router.back();
          }}
          variant="secondary"
        />
      </View>
    </>
  );

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step !== "manual" ? renderSetupHeader() : null}

        {step === "base" ? renderBaseStep() : null}
        {step === "routine" ? renderRoutineStep() : null}
        {step === "bio" ? renderBioStep() : null}
        {step === "review" ? renderReviewStep() : null}
        {step === "manual" ? renderManualScreen() : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    fontWeight: "500",
  },
  optionGrid: {
    gap: spacing.sm,
  },
  optionColumn: {
    gap: spacing.sm,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  inputGroup: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: "700",
  },
  quickOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickOption: {
    minWidth: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  quickOptionText: {
    fontSize: 14,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionsColumn: {
    gap: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  binaryRow: {
    gap: spacing.sm,
  },
  bioFields: {
    marginTop: spacing.lg,
  },
  helperText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  goalCardsGrid: {
    gap: spacing.md,
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  goalCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  goalCardValue: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1,
  },
  goalCardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  toggleCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  toggleText: {
    flex: 1,
    gap: spacing.xs,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  toggleSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
