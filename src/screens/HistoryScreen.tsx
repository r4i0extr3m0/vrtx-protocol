import { StyleSheet, Text, View, Platform } from "react-native";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import Animated, { FadeInDown } from "react-native-reanimated";

import { 
  ScreenWrapper, 
  GlassCard, 
  NeonButton, 
  BadgeMetal 
} from "../components/ui";
import { summarizeWorkout } from "@/src/domain/workout";
import { useTheme, useWorkout } from "@/src/hooks";
import { spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import * as Haptics from "expo-haptics";
import { AppIcon } from "@/src/components/AppIcon";

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
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <Pressable onPress={handlePress}>
          <GlassCard style={styles.item} intensity={15}>
            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                <BadgeMetal label={workout.date} variant="metal" />
                <BadgeMetal label={workout.completedAt ? "CONCLUÍDO" : "EM_CURSO"} variant={workout.completedAt ? "success" : "warning"} />
              </View>
              
              <Text style={[styles.itemTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                {workout.name.toUpperCase()}
              </Text>
              
              <View style={styles.itemFooter}>
                <View style={styles.metaItem}>
                  <AppIcon name="Dumbbell" size={10} color={colors.primary} />
                  <Text style={[styles.itemMeta, { color: colors.muted, fontFamily: typography.family.mono }]}>
                    {summary.exerciseCount} EXERCÍCIOS
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <AppIcon name="Activity" size={10} color={colors.primary} />
                  <Text style={[styles.itemMeta, { color: colors.muted, fontFamily: typography.family.mono }]}>
                    {formatVolume(summary.totalVolume)}
                  </Text>
                </View>
              </View>
            </View>
            <AppIcon name="ChevronRight" size={20} color={colors.muted} />
          </GlassCard>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ScreenWrapper withSafeArea={false}>
      <FlashList
        data={workouts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                LOGS_DE_DESEMPENHO
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.family.mono }]}>
                STATUS: ACESSO_HISTÓRICO_AUTORIZADO
              </Text>
            </View>
            <BadgeMetal label="TELEMETRY" variant="metal" />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GlassCard style={styles.emptyCard} intensity={10}>
              <AppIcon name="Database" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: typography.family.heading }]}>
                DADOS_NÃO_ENCONTRADOS
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.muted, fontFamily: typography.family.mono }]}>
                NENHUM_REGISTRO_DETECTADO_NO_SISTEMA
              </Text>
              <NeonButton 
                label="INICIAR_PROTOCOLO" 
                onPress={() => router.push("/workout" as never)} 
                variant="primary" 
                style={styles.emptyBtn}
              />
            </GlassCard>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

import { Pressable } from "react-native";

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  itemContent: {
    flex: 1,
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  itemFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemMeta: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  emptyContainer: {
    marginTop: 40,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  emptyDesc: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.5,
  },
  emptyBtn: {
    width: '100%',
    marginTop: 8,
  },
});
