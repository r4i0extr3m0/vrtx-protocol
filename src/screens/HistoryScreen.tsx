import { StyleSheet, Text, View, Platform } from "react-native";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import { EmptyState } from "@/src/components/EmptyState";
import { ScreenBackdrop } from "../components/ScreenBackdrop";
import * as Haptics from "expo-haptics";

export function HistoryScreen() {
  const { colors } = useTheme();
  const { workouts } = useWorkout();

  const renderItem = ({ item: workout, index }: { item: any; index: number }) => {
    const summary = summarizeWorkout(workout);

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (workout.completedAt) {
        router.push({ pathname: "/history/[id]", params: { id: workout.id } } as never);
      } else {
        router.push({ pathname: "/workout/[id]", params: { id: workout.id } } as never);
      }
    };

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50)}
        style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.itemText}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>{workout.name.toUpperCase()}</Text>
          <Text style={[styles.itemMeta, { color: colors.muted }]}>
            {workout.date} // {summary.exerciseCount} EXERCÍCIOS // {formatVolume(summary.totalVolume)}
          </Text>
        </View>
        <AppButton
          label="ABRIR"
          onPress={handlePress}
          variant="ghost"
          style={styles.openBtn}
        />
      </Animated.View>
    );
  };

  return (
    <ScreenContainer className="px-0 py-0">
      <ScreenBackdrop />
      <FlashList
        data={workouts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>LOGS_DE_DESEMPENHO</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Acesso aos registros históricos de telemetria e performance do protocolo.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState 
            title="LOGS_NÃO_ENCONTRADOS"
            description="Nenhum registro de atividade detectado no sistema. Inicie um novo protocolo para gerar logs."
            emoji="📡"
            actionLabel="INICIAR_PROTOCOLO"
            onAction={() => router.push("/workout" as never)}
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  item: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemText: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  itemMeta: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  openBtn: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
  },
});
