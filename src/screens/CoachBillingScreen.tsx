import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { createCoachCheckoutSession } from "@/src/api/supabase";
import { useAuthStore } from "@/src/store/authStore";
import { useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

const plans = [
  { id: "basic" as const, name: "Basic", price: "R$ 59/mês", limit: "Até 5 alunos" },
  { id: "plus" as const, name: "Plus", price: "R$ 75/mês", limit: "Até 10 alunos" },
  { id: "premier" as const, name: "Premier", price: "R$ 100/mês", limit: "Até 20 alunos" },
];

export function CoachBillingScreen() {
  const { colors } = useTheme();
  const role = useAuthStore((state) => state.user?.role);
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (plan: (typeof plans)[number]["id"]) => {
    setLoading(plan);
    const result = await createCoachCheckoutSession(plan);
    setLoading(null);
    if (result.error || !result.url) {
      Alert.alert("Não foi possível abrir o checkout", result.error ?? "Tente novamente.");
      return;
    }
    await WebBrowser.openBrowserAsync(result.url);
  };

  if (role !== "coach") {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.foreground }]}>Área exclusiva do coach</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>Voltar</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Plano do coach</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Escolha o limite de alunos que você precisa.</Text>
        {plans.map((plan) => (
          <Pressable
            key={plan.id}
            disabled={loading !== null}
            onPress={() => void checkout(plan.id)}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View>
              <Text style={[styles.plan, { color: colors.foreground }]}>{plan.name}</Text>
              <Text style={[styles.price, { color: colors.primary }]}>{plan.price}</Text>
              <Text style={[styles.limit, { color: colors.muted }]}>{plan.limit}</Text>
            </View>
            <Text style={[styles.action, { color: colors.primary }]}>{loading === plan.id ? "Abrindo..." : "Assinar"}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  back: { fontSize: typography.body, fontWeight: "700" },
  title: { fontSize: typography.title, fontWeight: "900" },
  subtitle: { fontSize: typography.body, lineHeight: 24 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  plan: { fontSize: typography.body, fontWeight: "800" },
  price: { fontSize: typography.body, fontWeight: "800", marginTop: spacing.xs },
  limit: { fontSize: typography.bodySm, marginTop: spacing.xs },
  action: { fontSize: typography.body, fontWeight: "800" },
});