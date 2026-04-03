import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppInput } from "@/src/components/AppInput";
import { useDietStore } from "@/src/store/dietStore";
import { useWorkout, useTheme } from "@/src/hooks";
import { spacing, radius, typography } from "@/src/theme";
import { AIApiError, sendAIChatMessage } from "@/src/services/AIInsights";
import type { AIChatMessage, FitnessObjective, TrainingLevel } from "@/src/types/ai";
import { secureStorage } from "@/src/infra/secureStorage";
import { useAuthStore } from "@/src/store/authStore";
import { usePremiumStore } from "@/src/store/premiumStore";

const CHAT_KEY = "vrtxprotocol.ai.chat.history.v1";
const DAILY_LIMIT = 30;

function todayId(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailyCountKey(dateId: string): string {
  return `vrtxprotocol.ai.chat.daily.count.${dateId}`;
}

function safeParseHistory(raw: string | null): AIChatMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m): m is AIChatMessage => {
        const obj = m as Record<string, unknown>;
        return (
          (obj.role === "user" || obj.role === "assistant") &&
          typeof obj.content === "string" &&
          typeof obj.createdAt === "number"
        );
      })
      .slice(-60);
  } catch {
    return [];
  }
}

export function AICoachScreen() {
  const { colors } = useTheme();
  const { workouts } = useWorkout();
  const meals = useDietStore((s) => s.meals);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const aiUsage = usePremiumStore((s) => s.aiUsage);
  const refreshAIUsage = usePremiumStore((s) => s.refreshAIUsage);

  const [objective] = useState<FitnessObjective>("hypertrophy");
  const [level] = useState<TrainingLevel>("intermediate");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    void (async () => {
      const historyRaw = await secureStorage.getString(CHAT_KEY);
      setMessages(safeParseHistory(historyRaw));

      const key = dailyCountKey(todayId());
      const countRaw = await secureStorage.getString(key);
      const count = countRaw ? Number(countRaw) : 0;
      setDailyCount(Number.isFinite(count) ? count : 0);
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    void refreshAIUsage(userId);
  }, [isAuthenticated, userId]);

  useEffect(() => {
    void (async () => {
      try {
        await secureStorage.setString(CHAT_KEY, JSON.stringify(messages.slice(-60)));
      } catch {
        // ignore
      }
    })();
  }, [messages]);

  const last7Summary = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const lastWorkouts = workouts.filter((w) => {
      const ts = Date.parse(w.startedAt || w.date);
      return Number.isFinite(ts) && ts >= sevenDaysAgo;
    });

    const totalVolumeKg = lastWorkouts.reduce((acc, w) => {
      const workoutVolume = w.exercises.reduce((wAcc, ex) => {
        const exVol = ex.sets.reduce((sAcc, set) => sAcc + set.reps * set.weightKg, 0);
        return wAcc + exVol;
      }, 0);
      return acc + workoutVolume;
    }, 0);

    const lastMeals = meals.filter((m) => Date.parse(m.createdAt) >= sevenDaysAgo);
    const caloriesAvg = Math.round(lastMeals.reduce((acc, m) => acc + m.totalCalories, 0) / 7);
    const proteinGAvg = Math.round(lastMeals.reduce((acc, m) => acc + m.totalProtein, 0) / 7);

    return {
      workoutCount: lastWorkouts.length,
      totalVolumeKg,
      caloriesAvg: Number.isFinite(caloriesAvg) ? caloriesAvg : undefined,
      proteinGAvg: Number.isFinite(proteinGAvg) ? proteinGAvg : undefined,
    };
  }, [meals, workouts]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    if (!isAuthenticated || !userId) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Faça login para usar o AI Coach.", createdAt: Date.now() },
      ]);
      return;
    }

    // Gate proativo com base no /usage
    const latestUsage = usePremiumStore.getState().aiUsage;
    const remaining = latestUsage?.chat?.remaining ?? 0;
    const isPremium = latestUsage?.is_premium ?? false;
    if (!isPremium && remaining <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "O AI Coach está disponível no Premium. Assine para desbloquear o chat.",
          createdAt: Date.now(),
        },
      ]);
      router.push("/premium" as never);
      return;
    }

    setMessage("");
    const nextMessages: AIChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed, createdAt: Date.now() },
    ];
    setMessages(nextMessages);
    setSending(true);

    try {
      const newCount = dailyCount + 1;
      setDailyCount(newCount);
      void secureStorage.setString(dailyCountKey(todayId()), String(newCount));

      const res = await sendAIChatMessage({
        userId,
        objective,
        level,
        context: last7Summary,
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply, createdAt: Date.now() }]);

      void refreshAIUsage(userId);
    } catch (e) {
      if (e instanceof AIApiError && e.status === 403 && e.code === "daily_limit") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Limite diário atingido. Assine o Premium para continuar.",
            createdAt: Date.now(),
          },
        ]);
        router.push("/premium" as never);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Não consegui acessar o AI agora. Confira se o EXPO_PUBLIC_AI_API_URL está configurado e se a API está rodando.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const suggestions = [
    "Como melhorar meu supino?",
    "O que comer pós-treino?",
    "Como montar um deload?",
    "Quanto de proteína por dia?",
  ];

  return (
    <ScreenContainer className="px-5 py-4">
      <View style={styles.header}>
        <View style={{ gap: 2 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>AI Coach</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Recomendações preditivas (beta) com base no seu histórico.
          </Text>
        </View>
        <AppButton label="Voltar" variant="ghost" onPress={() => router.back()} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
        {suggestions.map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              if (!sending) setMessage(s);
            }}
            style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={messages}
        keyExtractor={(item) => `${item.role}-${item.createdAt}`}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          sending ? (
            <View
              style={[
                styles.bubble,
                { alignSelf: "flex-start", backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <ActivityIndicator />
                <Text style={{ color: colors.muted, fontWeight: "700" }}>Digitando...</Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isUser = item.role === "user";
          return (
            <View
              style={[
                styles.bubble,
                {
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  backgroundColor: isUser ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: isUser ? "#0B0D10" : colors.foreground, fontWeight: "600" }}>
                {item.content}
              </Text>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.composer}>
          <View style={{ flex: 1 }}>
            <AppInput
              placeholder="Pergunte sobre treino, dieta, deload, macros..."
              value={message}
              onChangeText={setMessage}
              editable={!sending}
              accessibilityHint="Digite uma pergunta para o AI Coach"
            />
          </View>
          <AppButton
            label={sending ? "Enviando..." : "Enviar"}
            onPress={() => void handleSend()}
            disabled={sending}
          />
        </View>
        <Text style={[styles.limitText, { color: colors.muted }]}>
          {aiUsage ? `${aiUsage.chat.used}/${aiUsage.chat.limit} mensagens (reset: ${aiUsage.reset_at.slice(0, 10)})` : `${dailyCount}/${DAILY_LIMIT} mensagens hoje`}
        </Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.section,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  bubble: {
    maxWidth: "90%",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  composer: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-end",
    paddingBottom: spacing.md,
  },
  suggestions: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  suggestionChip: {
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
  limitText: {
    fontSize: 12,
    fontWeight: "700",
    paddingBottom: spacing.md,
  },
});
