import React, { useEffect, useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppInput } from "@/src/components/AppInput";
import { useDietStore } from "@/src/store/dietStore";
import { useWorkout, useTheme } from "@/src/hooks";
import { storage } from "@/src/infra/mmkv";
import { spacing, radius, typography } from "@/src/theme";
import { sendAIChatMessage } from "@/src/services/AIInsights";
import type { AIChatMessage, FitnessObjective, TrainingLevel } from "@/src/types/ai";

const CHAT_KEY = "coreirontrack.ai.chat.history";

function safeParseHistory(raw: string | undefined): AIChatMessage[] {
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

  const [objective] = useState<FitnessObjective>("hypertrophy");
  const [level] = useState<TrainingLevel>("intermediate");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>(() => safeParseHistory(storage.getString(CHAT_KEY)));

  useEffect(() => {
    storage.set(CHAT_KEY, JSON.stringify(messages.slice(-60)));
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

    setMessage("");
    const nextMessages: AIChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed, createdAt: Date.now() },
    ];
    setMessages(nextMessages);
    setSending(true);

    try {
      const res = await sendAIChatMessage({
        objective,
        level,
        context: last7Summary,
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply, createdAt: Date.now() }]);
    } catch (e) {
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

      <FlatList
        data={messages}
        keyExtractor={(item) => `${item.role}-${item.createdAt}`}
        contentContainerStyle={styles.list}
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
          <AppButton label={sending ? "Enviando..." : "Enviar"} onPress={() => void handleSend()} disabled={sending} />
        </View>
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
});

