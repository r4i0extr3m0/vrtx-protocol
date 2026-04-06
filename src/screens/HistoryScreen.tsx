import { StyleSheet, Text, View } from "react-native";
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
import * as Haptics from "expo-haptics";

export function HistoryScreen() {
  const { colors } = useTheme();
  const { workouts } = useWorkout();

  const renderItem = ({ item: workout, index }: { item: any; index: number }) => {
    const summary = summarizeWorkout(workout);
    const isCompleted = Boolean(workout.completedAt);

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isCompleted) {
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
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isCompleted ? colors.success + "14" : colors.primary + "14",
                borderColor: isCompleted ? colors.success + "26" : colors.primary + "26",
              },
            ]}
          >
            <Text style={[styles.statusPillText, { color: isCompleted ? colors.success : colors.primary }]}>
              {isCompleted ? "Concluido" : "Em andamento"}
            </Text>
          </View>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>{workout.name}</Text>
          <Text style={[styles.itemMeta, { color: colors.muted }]}>
            {workout.date} · {summary.exerciseCount} exercícios · {formatVolume(summary.totalVolume)}
          </Text>
        </View>
        <AppButton
          label="Abrir"
          onPress={handlePress}
          variant="ghost"
          style={styles.openBtn}
        />
      </Animated.View>
    );
  };

  return (
    <ScreenContainer className="px-0 py-0">
      <FlashList
        data={workouts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Histórico</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Revise seus treinos anteriores com mais clareza e retome o contexto em poucos segundos.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState 
            title="Nada por aqui ainda"
            description="Quando voce concluir seus primeiros treinos, eles vao aparecer aqui para consulta rapida."
            emoji="📅"
            actionLabel="Comecar treino"
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
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    fontWeight: "500",
  },
  item: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: {
    flex: 1,
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusPillText: {
    fontFamily: typography.family.body,
    fontSize: 11,
    fontWeight: "700",
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  itemMeta: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  openBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  swipeContainer: {
    position: "relative",
    marginBottom: spacing.md,
    justifyContent: "center",
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    height: "100%",
    width: 100,
    borderRadius: radius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
});
