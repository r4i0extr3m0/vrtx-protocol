import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useWorkout, useTheme } from "@/src/hooks";
import { summarizeWorkout } from "@/src/domain/workout";
import { radius, spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";

export function HistoryDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workouts } = useWorkout();

  const workout = useMemo(() => workouts.find((w) => w.id === id), [workouts, id]);
  const summary = useMemo(() => (workout ? summarizeWorkout(workout) : null), [workout]);

  if (!workout) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text style={{ color: colors.foreground }}>Treino não encontrado.</Text>
        <AppButton label="Voltar" onPress={() => router.back()} variant="ghost" />
      </ScreenContainer>
    );
  }

  const handleDelete = () => {
    Alert.alert("Excluir treino", "Deseja realmente apagar este registro do histórico?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          // Implementação de deleteWorkout na store se necessário, ou update com flag
          Alert.alert("Funcionalidade de exclusão em breve.");
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{workout.name}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {workout.date} • {workout.startedAt.split("T")[1].substring(0, 5)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryItem, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {formatVolume(summary?.totalVolume ?? 0)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Volume</Text>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {summary?.setCount ?? 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Séries</Text>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {summary?.exerciseCount ?? 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Exercícios</Text>
          </View>
        </View>

        {workout.exercises.map((exercise) => (
          <SectionCard key={exercise.id} title={exercise.name} subtitle={exercise.muscleGroup}>
            <View style={styles.setsList}>
              {exercise.sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={[styles.setText, { color: colors.foreground, width: 30 }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.setText, { color: colors.foreground, flex: 1 }]}>
                    {set.weightKg} kg x {set.reps}
                  </Text>
                  {set.completed && (
                    <View style={[styles.badge, { backgroundColor: colors.success + "20" }]}>
                      <Text style={[styles.badgeText, { color: colors.success }]}>OK</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </SectionCard>
        ))}

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <AppButton label="Editar treino" onPress={() => Alert.alert("Edição em breve")} variant="secondary" />
          <AppButton label="Excluir do histórico" onPress={handleDelete} variant="ghost" />
        </View>
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
    fontSize: typography.hero,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.section,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  setsList: {
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  setText: {
    fontSize: typography.body,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
