import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppIcon } from "@/src/components/AppIcon";
import { useAuth, useTheme, useWorkout } from "@/src/hooks";
import { useDietStore } from "@/src/store/dietStore";
import { usePremiumStore } from "@/src/store/premiumStore";
import { AIApiError, fetchAIRecommendations, sendAIFeedback } from "@/src/services/AIInsights";
import type { AIAnalyzeResponse, FitnessObjective, TrainingLevel } from "@/src/types/ai";
import { WebShell } from "./WebChrome";

const objective: FitnessObjective = "hypertrophy";
const level: TrainingLevel = "intermediate";

function formatVolume(value: number): string {
  return `${Math.round(value).toLocaleString("pt-BR")} kg`;
}

export function WebAICoachScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { workouts } = useWorkout();
  const meals = useDietStore((state) => state.meals);
  const aiUsage = usePremiumStore((state) => state.aiUsage);
  const refreshAIUsage = usePremiumStore((state) => state.refreshAIUsage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<AIAnalyzeResponse | null>(null);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);

  const last7Days = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentWorkouts = workouts.filter((workout) => {
      const date = Date.parse(workout.startedAt || workout.date);
      return Number.isFinite(date) && date >= since;
    });
    const totalVolumeKg = recentWorkouts.reduce(
      (total, workout) => total + workout.exercises.reduce(
        (exerciseTotal, exercise) => exerciseTotal + exercise.sets.reduce((setTotal, set) => setTotal + set.reps * set.weightKg, 0),
        0,
      ),
      0,
    );
    const recentMeals = meals.filter((meal) => Date.parse(meal.createdAt) >= since);
    return {
      workoutCount: recentWorkouts.length,
      totalVolumeKg,
      caloriesAvg: Math.round(recentMeals.reduce((total, meal) => total + meal.totalCalories, 0) / 7) || undefined,
      proteinGAvg: Math.round(recentMeals.reduce((total, meal) => total + meal.totalProtein, 0) / 7) || undefined,
    };
  }, [meals, workouts]);

  const generateReading = async () => {
    if (!user?.id) {
      setError("Entre na sua conta para gerar uma leitura personalizada.");
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await fetchAIRecommendations({ userId: user.id, objective, level, last7Days });
      setReading(result);
      void refreshAIUsage(user.id);
    } catch (cause) {
      if (cause instanceof AIApiError && (cause.status === 403 || cause.status === 429)) {
        setError("Você atingiu o limite disponível para hoje. Conheça o VRTX Pro para continuar.");
      } else if (cause instanceof AIApiError && cause.status === 401) {
        setError("Sua sessão expirou. Entre novamente para continuar usando o Coach IA.");
      } else {
        setError("Não foi possível gerar a leitura agora. Verifique a conexão e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const rateReading = async (rating: -1 | 1) => {
    if (!reading || !user?.id || feedback) return;
    setFeedback(rating === 1 ? "positive" : "negative");
    try {
      await sendAIFeedback({ kind: "analyze", rating, userId: user.id, cacheKey: reading.meta?.cacheKey });
    } catch {
      // Feedback não deve interromper a leitura.
    }
  };

  return (
    <WebShell backRoute="/" eyebrow="Inteligência" title="Uma leitura para hoje.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <View style={styles.heroCopy}>
            <Text style={styles.darkKicker}>COACH IA · ÚLTIMOS 7 DIAS</Text>
            <Text style={styles.heroTitle}>Menos informação solta. Mais clareza para a próxima decisão.</Text>
            <Text style={styles.heroText}>Cruze treino, alimentação e consistência para receber uma leitura prática, baseada no seu contexto real.</Text>
          </View>
          <View style={[styles.contextCard, { backgroundColor: "rgba(6,17,29,0.14)", borderColor: "rgba(6,17,29,0.16)" }]}>
            <Text style={styles.contextLabel}>CONTEXTO ENVIADO</Text>
            <Text style={styles.contextValue}>{last7Days.workoutCount} sessões</Text>
            <Text style={styles.contextHint}>{formatVolume(last7Days.totalVolumeKg)} de volume</Text>
            <Text style={styles.contextHint}>{last7Days.proteinGAvg ?? 0} g de proteína/dia</Text>
          </View>
        </View>

        {error ? (
          <View style={[styles.notice, { backgroundColor: colors.error + "12", borderColor: colors.error + "55" }]}>
            <AppIcon name="AlertTriangle" size={18} color={colors.error} />
            <Text style={[styles.noticeText, { color: colors.error }]}>{error}</Text>
            {error.includes("VRTX Pro") ? <Pressable onPress={() => router.push("/premium" as never)}><Text style={[styles.noticeAction, { color: colors.primary }]}>Ver planos</Text></Pressable> : null}
          </View>
        ) : null}

        {!reading ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "18" }]}><AppIcon name="Sparkles" size={23} color={colors.primary} /></View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Pronto para uma leitura útil?</Text>
            <Text style={[styles.emptyText, { color: colors.foregroundMuted }]}>A IA vai analisar seu ritmo recente e devolver recomendações de treino, nutrição e próximos passos. Você continua no controle: a leitura é uma sugestão, não um diagnóstico.</Text>
            <Pressable disabled={loading} onPress={() => void generateReading()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 }]}>
              {loading ? <ActivityIndicator color="#06111D" /> : <AppIcon name="Zap" size={17} color="#06111D" />}
              <Text style={styles.primaryButtonText}>{loading ? "Gerando leitura..." : "Gerar leitura"}</Text>
            </Pressable>
            <Text style={[styles.limit, { color: colors.muted }]}>{aiUsage ? `${aiUsage.analyze.used}/${aiUsage.analyze.limit} leituras usadas · renova em ${aiUsage.reset_at.slice(0, 10)}` : "A leitura usa o limite diário da sua conta."}</Text>
          </View>
        ) : (
          <View style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.resultHeader}><View><Text style={[styles.resultKicker, { color: colors.primary }]}>LEITURA PERSONALIZADA</Text><Text style={[styles.resultTitle, { color: colors.foreground }]}>O que merece atenção agora</Text></View><View style={[styles.mode, { borderColor: colors.border }]}><View style={[styles.modeDot, { backgroundColor: colors.success }]} /><Text style={[styles.modeText, { color: colors.muted }]}>{reading.meta?.mode === "cache" ? "Atualizada" : "Gerada agora"}</Text></View></View>
            <Text style={[styles.summary, { color: colors.foreground }]}>{reading.summary}</Text>
            <ResultSection title="Treino" icon="Dumbbell" items={reading.trainingRecommendations} colors={colors} />
            <ResultSection title="Nutrição" icon="Apple" items={reading.nutritionRecommendations} colors={colors} />
            {reading.nextBestActions?.length ? <ResultSection title="Próximos passos" icon="ArrowRight" items={reading.nextBestActions} colors={colors} /> : null}
            {reading.warnings?.length ? <ResultSection title="Atenção" icon="AlertTriangle" items={reading.warnings} colors={colors} warning /> : null}
            <View style={[styles.resultFooter, { borderTopColor: colors.border }]}><Text style={[styles.feedbackLabel, { color: colors.muted }]}>Essa leitura foi útil?</Text><Pressable disabled={Boolean(feedback)} onPress={() => void rateReading(1)} style={[styles.feedbackButton, { borderColor: colors.border }]}><AppIcon name="Check" size={15} color={feedback === "positive" ? colors.success : colors.muted} /></Pressable><Pressable disabled={Boolean(feedback)} onPress={() => void rateReading(-1)} style={[styles.feedbackButton, { borderColor: colors.border }]}><AppIcon name="X" size={15} color={feedback === "negative" ? colors.error : colors.muted} /></Pressable><Pressable onPress={() => void generateReading()} style={styles.newReading}><Text style={[styles.newReadingText, { color: colors.primary }]}>Nova leitura</Text></Pressable></View>
          </View>
        )}
      </ScrollView>
    </WebShell>
  );
}

function ResultSection({ title, icon, items, colors, warning = false }: { title: string; icon: string; items: string[]; colors: any; warning?: boolean }) {
  if (!items.length) return null;
  return <View style={styles.resultSection}><View style={styles.sectionHeading}><AppIcon name={icon} size={16} color={warning ? colors.warning : colors.primary} /><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text></View><View style={styles.itemList}>{items.map((item, index) => <View key={`${title}-${index}`} style={[styles.item, { borderColor: colors.border }]}><Text style={[styles.itemIndex, { color: warning ? colors.warning : colors.primary }]}>0{index + 1}</Text><Text style={[styles.itemText, { color: colors.foregroundMuted }]}>{item}</Text></View>)}</View></View>;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 60, gap: 18 },
  hero: { borderWidth: 1, borderRadius: 22, padding: 26, flexDirection: "row", gap: 22, justifyContent: "space-between", flexWrap: "wrap" },
  heroCopy: { flex: 1, minWidth: 280, maxWidth: 700, gap: 12 },
  darkKicker: { color: "rgba(6,17,29,0.62)", fontFamily: "monospace", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  heroTitle: { color: "#06111D", fontSize: 29, lineHeight: 33, fontWeight: "900", letterSpacing: -0.8 },
  heroText: { color: "rgba(6,17,29,0.72)", fontSize: 14, lineHeight: 21, maxWidth: 650 },
  contextCard: { minWidth: 190, borderWidth: 1, borderRadius: 15, padding: 16, gap: 6, justifyContent: "center" },
  contextLabel: { color: "rgba(6,17,29,0.58)", fontFamily: "monospace", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  contextValue: { color: "#06111D", fontSize: 22, fontWeight: "900", marginTop: 4 },
  contextHint: { color: "rgba(6,17,29,0.68)", fontSize: 11, fontWeight: "700" },
  notice: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 9 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  noticeAction: { fontSize: 12, fontWeight: "900" },
  empty: { borderWidth: 1, borderRadius: 20, padding: 28, alignItems: "flex-start", gap: 13 },
  emptyIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "900" },
  emptyText: { maxWidth: 740, fontSize: 14, lineHeight: 22 },
  primaryButton: { minHeight: 46, borderRadius: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 4 },
  primaryButtonText: { color: "#06111D", fontSize: 12, fontWeight: "900" },
  limit: { fontSize: 11, fontWeight: "700" },
  result: { borderWidth: 1, borderRadius: 20, padding: 24, gap: 22 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  resultKicker: { fontFamily: "monospace", fontSize: 9, fontWeight: "900", letterSpacing: 1.3, marginBottom: 7 },
  resultTitle: { fontSize: 22, fontWeight: "900" },
  mode: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6 },
  modeDot: { width: 6, height: 6, borderRadius: 6 },
  modeText: { fontSize: 10, fontWeight: "800" },
  summary: { fontSize: 16, lineHeight: 25, fontWeight: "700", maxWidth: 850 },
  resultSection: { gap: 10 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "900" },
  itemList: { gap: 8 },
  item: { borderWidth: 1, borderRadius: 12, padding: 13, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  itemIndex: { fontFamily: "monospace", fontSize: 10, fontWeight: "900", marginTop: 2 },
  itemText: { flex: 1, fontSize: 13, lineHeight: 20 },
  resultFooter: { borderTopWidth: 1, paddingTop: 16, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  feedbackLabel: { fontSize: 11, fontWeight: "800", marginRight: 4 },
  feedbackButton: { width: 32, height: 32, borderWidth: 1, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  newReading: { marginLeft: "auto" as any, paddingVertical: 8, paddingHorizontal: 6 },
  newReadingText: { fontSize: 11, fontWeight: "900" },
});
