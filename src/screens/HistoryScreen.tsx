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
              Consulte sessões anteriores com foco em leitura rápida e recuperação do contexto do treino.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState 
            title="Histórico Vazio"
            description="Seu histórico ainda está vazio. Crie um treino para começar a formar a linha do tempo."
            emoji="📅"
            actionLabel="Iniciar Treino"
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
    lineHeight: 22,
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
    gap: spacing.xs,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  itemMeta: {
    fontSize: 13,
    fontWeight: "600",
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
