from pathlib import Path

ROOT = Path('/home/ubuntu/ironlog')

files = {
    'src/components/AppButton.tsx': '''import { Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (disabled) {
      return;
    }

    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor:
            variant === "primary"
              ? colors.primary
              : variant === "secondary"
                ? colors.surfaceAlt
                : "transparent",
          borderColor: variant === "ghost" ? colors.border : "transparent",
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: variant === "primary" ? colors.background : colors.foreground,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: typography.body,
    fontWeight: "700",
  },
});
''',
    'src/components/MetricCard.tsx': '''import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      {hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: {
    fontSize: typography.metric,
    fontWeight: "800",
  },
  hint: {
    fontSize: typography.caption,
    lineHeight: 16,
  },
});
''',
    'src/components/SectionCard.tsx': '''import { StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.section,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 20,
  },
});
''',
    'src/components/SyncStatusPill.tsx': '''import { StyleSheet, Text, View } from "react-native";

import { useSync, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

export function SyncStatusPill() {
  const { colors } = useTheme();
  const { pendingCount, networkReachable, isProcessing } = useSync();

  const statusLabel = isProcessing
    ? "Sincronizando"
    : pendingCount > 0
      ? `${pendingCount} pendência${pendingCount > 1 ? "s" : ""}`
      : networkReachable
        ? "Em dia"
        : "Offline";

  const backgroundColor = isProcessing
    ? colors.primaryStrong
    : pendingCount > 0
      ? colors.warning
      : networkReachable
        ? colors.success
        : colors.surfaceAlt;

  const foreground = pendingCount > 0 || isProcessing ? colors.background : colors.foreground;

  return (
    <View style={[styles.pill, { backgroundColor }]}> 
      <Text style={[styles.label, { color: foreground }]}>{statusLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
''',
    'src/navigation/tabOptions.ts': '''import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

import { Colors } from "@/constants/theme";

export function createTabScreenOptions(scheme: "light" | "dark"): BottomTabNavigationOptions {
  const colors = Colors[scheme];

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: 0.5,
      height: 72,
      paddingTop: 8,
      paddingBottom: 10,
    },
  };
}
''',
    'src/screens/AuthScreen.tsx': '''import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { useAuth, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

export function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, setGuestMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(True)
    const result = await signIn(email.trim(), password);
    setSubmitting(False)

    if (!result.success) {
      Alert.alert("Falha ao entrar", result.message ?? "Não foi possível autenticar sua sessão.");
      return;
    }

    router.replace("/");
  };

  const handleGuest = () => {
    setGuestMode();
    router.replace("/");
  };

  return (
    <ScreenContainer className="px-6 py-8">
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={[styles.kicker, { color: colors.primary }]}>IronLog</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Seu diário de treino com resiliência offline-first.</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Entre com Supabase quando as credenciais estiverem configuradas ou continue em modo local para registrar seus treinos sem depender de internet.</Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="E-mail"
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Senha"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            value={password}
          />
          <AppButton label={submitting ? "Entrando..." : "Entrar"} onPress={() => { void handleLogin(); }} />
          <AppButton label="Continuar no modo local" onPress={handleGuest} variant="secondary" />
        </View>
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
''',
    'src/screens/HomeScreen.tsx': '''import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { MetricCard } from "@/src/components/MetricCard";
import { SectionCard } from "@/src/components/SectionCard";
import { SyncStatusPill } from "@/src/components/SyncStatusPill";
import { useWorkout, useTheme } from "@/src/hooks";
import { summarizeWorkout } from "@/src/domain/workout";
import { spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";

export function HomeScreen() {
  const { colors } = useTheme();
  const { workouts, createWorkout } = useWorkout();
  const latestWorkout = workouts[0] ?? null;
  const summary = latestWorkout ? summarizeWorkout(latestWorkout) : null;

  const handleNewWorkout = () => {
    const draft = createWorkout("Treino rápido");
    router.push(`/workout/${draft.id}`);
  };

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]}>Controle o treino sem perder ritmo.</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Tudo salva primeiro no dispositivo e sincroniza em segundo plano quando houver internet.</Text>
          </View>
          <SyncStatusPill />
        </View>

        <SectionCard
          title={latestWorkout ? latestWorkout.name : "Pronto para treinar"}
          subtitle={latestWorkout ? `Última sessão em ${latestWorkout.date}` : "Crie uma nova sessão para começar a registrar séries, carga e progressão."}
        >
          <AppButton label="Novo treino" onPress={handleNewWorkout} />
        </SectionCard>

        <View style={styles.metricRow}>
          <MetricCard label="Treinos" value={String(workouts.length)} hint="Sessões registradas localmente" />
          <MetricCard label="Volume" value={summary ? formatVolume(summary.totalVolume) : "0 kg"} hint="Volume da sessão mais recente" />
        </View>

        <View style={styles.metricRow}>
          <MetricCard label="Exercícios" value={summary ? String(summary.exerciseCount) : "0"} hint="No treino atual" />
          <MetricCard label="1RM" value={summary ? `${summary.bestOneRM.toFixed(1)} kg` : "0 kg"} hint="Melhor estimativa recente" />
        </View>

        <SectionCard title="Resumo operacional" subtitle="Visão rápida do estado atual do diário de treino.">
          <Text style={[styles.body, { color: colors.foreground }]}>
            {latestWorkout
              ? `Sua sessão mais recente inclui ${summary?.setCount ?? 0} séries, com foco em execução rápida e persistência local imediata.`
              : "Nenhum treino salvo ainda. O IronLog já está preparado para operar offline e começar a construir seu histórico."}
          </Text>
        </SectionCard>
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
    gap: spacing.md,
  },
  headerText: {
    gap: spacing.sm,
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
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  body: {
    fontSize: typography.body,
    lineHeight: 22,
  },
});
''',
    'src/screens/WorkoutScreen.tsx': '''import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { createExerciseEntry, createExerciseSet, summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";

export function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { workouts, createWorkout, addExercise, completeWorkout } = useWorkout();

  const fallbackWorkout = workouts[0] ?? createWorkout("Treino do dia");
  const workout = workouts.find((entry) => entry.id === id) ?? fallbackWorkout;
  const summary = summarizeWorkout(workout);

  const handleAddExercise = () => {
    addExercise(
      workout.id,
      createExerciseEntry({
        name: `Exercício ${workout.exercises.length + 1}`,
        muscleGroup: "Força",
        sets: [
          createExerciseSet({ reps: 5, weightKg: 100 }),
          createExerciseSet({ reps: 5, weightKg: 100 }),
          createExerciseSet({ reps: 5, weightKg: 100 }),
        ],
      }),
    );
  };

  const handleFinish = () => {
    completeWorkout(workout.id);
    router.replace("/");
  };

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{workout.name}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Sessão em {workout.date}. Tudo o que você editar aqui entra primeiro na store local e depois segue para a fila de sincronização.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Volume</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatVolume(summary.totalVolume)}</Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>1RM</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{summary.bestOneRM.toFixed(1)} kg</Text>
          </View>
        </View>

        <SectionCard title="Exercícios" subtitle="Blocos compactos para registrar séries com baixa fricção.">
          {workout.exercises.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>Ainda não há exercícios nesta sessão. Adicione o primeiro bloco para começar.</Text>
          ) : (
            workout.exercises.map((exercise) => (
              <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}> 
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>{exercise.name}</Text>
                  <Text style={[styles.exerciseMeta, { color: colors.muted }]}>{exercise.muscleGroup}</Text>
                </View>
                {exercise.sets.map((setEntry, index) => (
                  <View key={setEntry.id} style={styles.setRow}>
                    <Text style={[styles.setLabel, { color: colors.muted }]}>Série {index + 1}</Text>
                    <Text style={[styles.setValue, { color: colors.foreground }]}>{setEntry.reps} reps × {setEntry.weightKg} kg</Text>
                  </View>
                ))}
              </View>
            ))
          )}
          <AppButton label="Adicionar exercício rápido" onPress={handleAddExercise} variant="secondary" />
        </SectionCard>

        <AppButton label="Concluir treino" onPress={handleFinish} />
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
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.hero,
    fontWeight: "900",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryBox: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: typography.section,
    fontWeight: "900",
  },
  empty: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  exerciseCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseHeader: {
    gap: spacing.xxs,
  },
  exerciseTitle: {
    fontSize: typography.section,
    fontWeight: "800",
  },
  exerciseMeta: {
    fontSize: typography.caption,
    fontWeight: "600",
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  setLabel: {
    fontSize: typography.body,
  },
  setValue: {
    fontSize: typography.body,
    fontWeight: "700",
  },
});
''',
    'src/screens/HistoryScreen.tsx': '''import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";

export function HistoryScreen() {
  const { colors } = useTheme();
  const { workouts } = useWorkout();

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Histórico</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Consulte sessões anteriores com foco em leitura rápida e recuperação do contexto do treino.</Text>
        </View>

        <SectionCard title="Sessões salvas" subtitle="As entradas abaixo já estão persistidas localmente.">
          {workouts.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>Seu histórico ainda está vazio. Crie um treino para começar a formar a linha do tempo.</Text>
          ) : (
            workouts.map((workout) => {
              const summary = summarizeWorkout(workout);
              return (
                <View key={workout.id} style={[styles.item, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}> 
                  <View style={styles.itemText}>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]}>{workout.name}</Text>
                    <Text style={[styles.itemMeta, { color: colors.muted }]}>{workout.date} · {summary.exerciseCount} exercícios · {formatVolume(summary.totalVolume)}</Text>
                  </View>
                  <AppButton label="Abrir" onPress={() => router.push(`/workout/${workout.id}`)} variant="ghost" />
                </View>
              );
            })
          )}
        </SectionCard>
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
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  empty: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  item: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  itemText: {
    gap: spacing.xs,
  },
  itemTitle: {
    fontSize: typography.section,
    fontWeight: "800",
  },
  itemMeta: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
''',
    'src/screens/StatisticsScreen.tsx': '''import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { MetricCard } from "@/src/components/MetricCard";
import { SectionCard } from "@/src/components/SectionCard";
import { summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";

export function StatisticsScreen() {
  const { colors } = useTheme();
  const { workouts } = useWorkout();
  const summaries = workouts.map((workout) => summarizeWorkout(workout));
  const totalVolume = summaries.reduce((acc, current) => acc + current.totalVolume, 0);
  const bestOneRM = summaries.reduce((acc, current) => Math.max(acc, current.bestOneRM), 0);
  const totalExercises = summaries.reduce((acc, current) => acc + current.exerciseCount, 0);

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Estatísticas</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Métricas diretas para acompanhar progressão, densidade de treino e força estimada.</Text>
        </View>

        <View style={styles.metricRow}>
          <MetricCard label="Volume total" value={formatVolume(totalVolume)} hint="Soma de todas as sessões salvas" />
          <MetricCard label="1RM máximo" value={`${bestOneRM.toFixed(1)} kg`} hint="Melhor estimativa pelo método de Brzycki" />
        </View>

        <SectionCard title="Leitura rápida" subtitle="Resumo analítico das sessões já registradas.">
          <Text style={[styles.body, { color: colors.foreground }]}>Você acumulou {workouts.length} sessões, totalizando {totalExercises} exercícios registrados. A base analítica já está pronta para receber refinamentos como gráficos e comparações por exercício.</Text>
        </SectionCard>
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
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  body: {
    fontSize: typography.body,
    lineHeight: 22,
  },
});
''',
    'src/screens/SyncStatusScreen.tsx': '''import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { useSync, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

export function SyncStatusScreen() {
  const { colors } = useTheme();
  const { queue, processPending, networkReachable, lastError, lastSyncedAt } = useSync();

  return (
    <ScreenContainer className="px-5 py-5" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Status de sincronização</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>A fila é processada em ordem FIFO e tenta novamente automaticamente quando a rede volta.</Text>
        </View>

        <View style={[styles.statusBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.statusLine, { color: colors.foreground }]}>Rede: {networkReachable ? "disponível" : "offline"}</Text>
          <Text style={[styles.statusLine, { color: colors.foreground }]}>Pendências: {queue.length}</Text>
          <Text style={[styles.statusLine, { color: colors.foreground }]}>Última sincronização: {lastSyncedAt ?? "ainda não executada"}</Text>
          <Text style={[styles.statusLine, { color: colors.warning }]}>Último erro: {lastError ?? "nenhum"}</Text>
        </View>

        <AppButton label="Tentar sincronizar agora" onPress={() => { void processPending(); }} />

        {queue.map((operation) => (
          <View key={operation.id} style={[styles.queueItem, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}> 
            <Text style={[styles.queueTitle, { color: colors.foreground }]}>{operation.type.toUpperCase()} · {operation.table}</Text>
            <Text style={[styles.queueMeta, { color: colors.muted }]}>Retries: {operation.retries} · Timestamp: {new Date(operation.timestamp).toLocaleString("pt-BR")}</Text>
          </View>
        ))}
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
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  statusBox: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusLine: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  queueItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  queueTitle: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  queueMeta: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
''',
    'src/screens/SettingsScreen.tsx': '''import { Alert, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useAuth, useTheme } from "@/src/hooks";
import { spacing, typography } from "@/src/theme";

export function SettingsScreen() {
  const { colors, scheme } = useTheme();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    Alert.alert("Sessão encerrada", "Os dados locais continuam disponíveis no dispositivo.");
  };

  return (
    <ScreenContainer className="px-5 py-5">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Ajustes</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Controles essenciais do ambiente local, do tema e da sessão sincronizada.</Text>
        </View>

        <SectionCard title="Perfil" subtitle="Informações disponíveis na sessão atual.">
          <Text style={[styles.body, { color: colors.foreground }]}>Conta: {user?.email ?? "modo local"}</Text>
          <Text style={[styles.body, { color: colors.foreground }]}>Tema ativo: {scheme}</Text>
        </SectionCard>

        <AppButton label="Encerrar sessão" onPress={() => { void handleLogout(); }} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  body: {
    fontSize: typography.body,
    lineHeight: 22,
  },
});
''',
    'app/login.tsx': '''import { AuthScreen } from "@/src/screens/AuthScreen";

export default AuthScreen;
''',
    'app/sync-status.tsx': '''import { SyncStatusScreen } from "@/src/screens/SyncStatusScreen";

export default SyncStatusScreen;
''',
    'app/settings.tsx': '''import { SettingsScreen } from "@/src/screens/SettingsScreen";

export default SettingsScreen;
''',
    'app/workout/[id].tsx': '''import { WorkoutScreen } from "@/src/screens/WorkoutScreen";

export default WorkoutScreen;
''',
    'app/(tabs)/index.tsx': '''import { HomeScreen } from "@/src/screens/HomeScreen";

export default HomeScreen;
''',
    'app/(tabs)/history.tsx': '''import { HistoryScreen } from "@/src/screens/HistoryScreen";

export default HistoryScreen;
''',
    'app/(tabs)/statistics.tsx': '''import { StatisticsScreen } from "@/src/screens/StatisticsScreen";

export default StatisticsScreen;
''',
    'app/(tabs)/workout.tsx': '''import { WorkoutScreen } from "@/src/screens/WorkoutScreen";

export default WorkoutScreen;
''',
    'app/(tabs)/_layout.tsx': '''import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Treino",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="dumbbell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
''',
    'components/ui/icon-symbol.tsx': '''import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "dumbbell.fill": "fitness-center",
  "clock.fill": "history",
  "chart.bar.fill": "bar-chart",
  "arrow.trianglehead.clockwise": "sync",
  "gearshape.fill": "settings",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
''',
    'app/_layout.tsx': '''import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, SplashScreen, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { initializeMMKV } from "@/src/infra/mmkv";
import { useAuth } from "@/src/hooks";
import { spacing, typography } from "@/src/theme";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthGate() {
  const pathname = usePathname();
  const { status, isAuthenticated, hydrateAuth } = useAuth();

  useEffect(() => {
    initializeMMKV();
    void hydrateAuth().finally(() => {
      void SplashScreen.hideAsync();
    });
  }, [hydrateAuth]);

  if (status === "idle" || status === "loading") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.xl,
          backgroundColor: "#0B0D10",
        }}
      >
        <Text style={{ color: "#F4F7FB", fontSize: typography.section, fontWeight: "800" }}>Carregando IronLog…</Text>
      </View>
    );
  }

  const inAuthRoute = pathname.startsWith("/login");
  if (!isAuthenticated && inAuthRoute === false) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated && inAuthRoute) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="workout/[id]" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="sync-status" options={{ presentation: "modal" }} />
      <Stack.Screen name="oauth/callback" />
    </Stack>
  );
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthGate />
          <StatusBar style="light" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  if (Platform.OS === "web") {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>{content}</SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
''',
}

for relative_path, content in files.items():
    file_path = ROOT / relative_path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content.strip() + "\n", encoding="utf-8")

print('Navigation and screens scaffold written.')
