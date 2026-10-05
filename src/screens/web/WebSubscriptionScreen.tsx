import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { WebShell } from "./WebChrome";
import { AppIcon } from "@/src/components/AppIcon";
import { useAuth, useTheme } from "@/src/hooks";
import { usePremiumStore } from "@/src/store/premiumStore";
import { createCoachCheckoutSession } from "@/src/api/supabase";

const plans = [
  { id: "basic" as const, title: "Basic", price: "R$ 59/mês", copy: "Para começar sua carteira", limit: "Até 5 alunos", features: ["Carteira de alunos", "Prescrição de treinos", "Check-ins básicos"] },
  { id: "plus" as const, title: "Plus", price: "R$ 75/mês", copy: "Para coaches em crescimento", limit: "Até 10 alunos", features: ["Tudo do Basic", "Planos nutricionais", "Medidas e aderência"] },
  { id: "premier" as const, title: "Premier", price: "R$ 100/mês", copy: "Para uma operação completa", limit: "Até 20 alunos", features: ["Tudo do Plus", "Coach IA contextual", "Suporte prioritário"] },
];

export function WebSubscriptionScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isPremium, subscriptionType, expiryDate } = usePremiumStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isCoach = user?.role === "coach";

  const checkout = async (plan: (typeof plans)[number]["id"]) => {
    setLoading(plan);
    setError(null);
    const result = await createCoachCheckoutSession(plan);
    setLoading(null);
    if (result.error || !result.url) {
      setError(result.error ?? "O checkout não retornou uma URL válida. Tente novamente.");
      return;
    }
    await Linking.openURL(result.url);
  };

  return (
    <WebShell backRoute="/profile" eyebrow="VRTX Pro" title="Assinatura que acompanha sua evolução.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: colors.primary + "16", borderColor: colors.primary + "55" }]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.kicker, { color: colors.primary }]}>MEMBRESIA VRTX</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Mais contexto. Menos ruído.</Text>
            <Text style={[styles.description, { color: colors.foregroundMuted }]}>Escolha o plano que acompanha o tamanho da sua operação e centralize treino, nutrição, aderência e evolução dos seus alunos.</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statusLabel, { color: colors.muted }]}>SEU PLANO ATUAL</Text>
            <Text style={[styles.statusValue, { color: colors.foreground }]}>{isPremium ? "VRTX PRO" : "PLANO GRATUITO"}</Text>
            <Text style={[styles.statusHint, { color: colors.foregroundMuted }]}>{isPremium ? `${subscriptionType === "none" ? "Ativo" : subscriptionType} · ${expiryDate ? `até ${expiryDate.slice(0, 10)}` : "sem expiração informada"}` : "Comece quando estiver pronto"}</Text>
          </View>
        </View>

        {!isCoach ? <View style={[styles.notice, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "55" }]}><AppIcon name="Circle" size={18} color={colors.warning} /><Text style={[styles.noticeText, { color: colors.foregroundMuted }]}>Os planos de assinatura são voltados para contas de coach. Você pode continuar usando o plano gratuito de atleta normalmente.</Text></View> : null}
        {error ? <View style={[styles.notice, { backgroundColor: colors.error + "12", borderColor: colors.error + "55" }]}><AppIcon name="AlertTriangle" size={18} color={colors.error} /><Text style={[styles.noticeText, { color: colors.error }]}>{error}</Text></View> : null}

        <View style={styles.plans}>
          {plans.map((plan, index) => <PlanCard key={plan.id} plan={plan} colors={colors} featured={index === 1} disabled={!isCoach || loading !== null} loading={loading === plan.id} current={isPremium && String(subscriptionType) === plan.id} onPress={() => void checkout(plan.id)} />)}
        </View>
        <View style={[styles.note, { borderColor: colors.border, backgroundColor: colors.surface }]}><View style={[styles.noteIcon, { backgroundColor: colors.primary + "18" }]}><AppIcon name="Shield" size={18} color={colors.primary} /></View><View style={styles.noteCopy}><Text style={[styles.noteTitle, { color: colors.foreground }]}>Checkout seguro e transparente</Text><Text style={[styles.noteText, { color: colors.foregroundMuted }]}>Você será levado ao Stripe para confirmar a assinatura. O VRTX não armazena os dados do cartão. O plano só é atualizado após a confirmação do webhook.</Text></View></View>
      </ScrollView>
    </WebShell>
  );
}

function PlanCard({ plan, colors, featured, disabled, loading, current, onPress }: { plan: (typeof plans)[number]; colors: any; featured: boolean; disabled: boolean; loading: boolean; current: boolean; onPress: () => void }) {
  return <View style={[styles.plan, { backgroundColor: colors.surface, borderColor: featured ? colors.primary : colors.border }, featured && { borderWidth: 2 }]}>{featured ? <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={styles.badgeText}>RECOMENDADO</Text></View> : null}<Text style={[styles.planTitle, { color: colors.foreground }]}>{plan.title}</Text><Text style={[styles.planPrice, { color: featured ? colors.primary : colors.foreground }]}>{plan.price}</Text><Text style={[styles.planCopy, { color: colors.muted }]}>{plan.copy} · {plan.limit}</Text><View style={styles.featureList}>{plan.features.map((feature) => <View key={feature} style={styles.feature}><AppIcon name="Check" size={14} color={colors.primary} /><Text style={[styles.featureText, { color: colors.foregroundMuted }]}>{feature}</Text></View>)}</View><Pressable disabled={disabled || current} onPress={onPress} style={[styles.planButton, { backgroundColor: featured ? colors.primary : colors.background, borderColor: featured ? colors.primary : colors.border, opacity: disabled && !current ? 0.55 : 1 }]}><Text style={[styles.planButtonText, { color: featured ? "#06111D" : colors.foreground }]}>{current ? "Plano atual" : loading ? "Abrindo checkout..." : "Assinar com Stripe"}</Text>{!current && !loading ? <AppIcon name="ArrowRight" size={15} color={featured ? "#06111D" : colors.primary} /> : null}</Pressable></View>;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 60, gap: 18 }, hero: { borderWidth: 1, borderRadius: 22, padding: 26, flexDirection: "row", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }, heroCopy: { flex: 1, minWidth: 280, maxWidth: 680 }, kicker: { fontFamily: "monospace", fontSize: 10, letterSpacing: 1.6, fontWeight: "800" }, heroTitle: { fontSize: 31, fontWeight: "900", letterSpacing: -1, marginTop: 8 }, description: { fontSize: 14, lineHeight: 22, marginTop: 10 }, statusCard: { minWidth: 210, borderWidth: 1, borderRadius: 15, padding: 16, justifyContent: "center", gap: 6 }, statusLabel: { fontFamily: "monospace", fontSize: 9, letterSpacing: 1.2 }, statusValue: { fontSize: 17, fontWeight: "900" }, statusHint: { fontSize: 11, lineHeight: 16 }, notice: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 9 }, noticeText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700" }, plans: { flexDirection: "row", gap: 16, flexWrap: "wrap" }, plan: { flex: 1, minWidth: 260, borderWidth: 1, borderRadius: 20, padding: 22, gap: 10, position: "relative" }, badge: { position: "absolute", top: -11, right: 18, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 }, badgeText: { color: "#06111D", fontSize: 9, fontWeight: "900", letterSpacing: 0.6 }, planTitle: { fontSize: 21, fontWeight: "900" }, planPrice: { fontSize: 19, fontWeight: "900", marginTop: 4 }, planCopy: { fontSize: 12, lineHeight: 18 }, featureList: { gap: 10, marginTop: 12, minHeight: 140 }, feature: { flexDirection: "row", alignItems: "flex-start", gap: 8 }, featureText: { flex: 1, fontSize: 12, lineHeight: 18 }, planButton: { minHeight: 44, borderWidth: 1, borderRadius: 11, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 8 }, planButtonText: { fontSize: 12, fontWeight: "900" }, note: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: "row", gap: 12 }, noteIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" }, noteCopy: { flex: 1, gap: 4 }, noteTitle: { fontSize: 13, fontWeight: "900" }, noteText: { fontSize: 12, lineHeight: 18 },
});
