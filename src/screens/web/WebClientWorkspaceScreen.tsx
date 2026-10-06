import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppIcon } from "@/src/components/AppIcon";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useTheme } from "@/src/hooks";
import {
  archiveCoachPrescription,
  getCoachClientNutritionPlan,
  listCoachCheckins,
  listCoachClientMeasurements,
  listCoachClientPrescriptions,
} from "@/src/api/supabase";
import type { BodyMeasurement, CoachCheckin, CoachNutritionPlan, CoachPrescription } from "@/src/types";
import { WebShell } from "./WebChrome";

function daysSince(date: string) {
  const value = new Date(`${date}T00:00:00`).getTime();
  return Number.isFinite(value) ? Math.max(0, Math.floor((Date.now() - value) / 86400000)) : null;
}
function formatDate(date?: string | null) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}
export function WebClientWorkspaceScreen() {
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string; clientEmail?: string }>();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const clientName = typeof params.clientName === "string" && params.clientName ? params.clientName : "Aluno VRTX";
  const clientEmail = typeof params.clientEmail === "string" ? params.clientEmail : "";
  const { colors } = useTheme();
  const [checkins, setCheckins] = useState<CoachCheckin[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [prescriptions, setPrescriptions] = useState<CoachPrescription[]>([]);
  const [nutrition, setNutrition] = useState<CoachNutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const online = hasSupabaseEnv();
  const load = useCallback(async () => {
    if (!clientId || !online) { setLoading(false); return; }
    setLoading(true); setError(null);
    const [checks, measures, workouts, plan] = await Promise.all([
      listCoachCheckins(clientId),
      listCoachClientMeasurements(clientId),
      listCoachClientPrescriptions(clientId),
      getCoachClientNutritionPlan(clientId),
    ]);
    const firstError = checks.error ?? measures.error ?? workouts.error ?? plan.error;
    if (firstError) setError(firstError);
    setCheckins(checks.data ?? []);
    setMeasurements(measures.data ?? []);
    setPrescriptions(workouts.data ?? []);
    setNutrition(plan.data ?? null);
    setLoading(false);
  }, [clientId, online]);
  useEffect(() => { void load(); }, [load]);
  const recentCheckins = useMemo(() => checkins.slice(0, 5), [checkins]);
  const activePrescriptions = prescriptions.filter((item) => item.status === "active");
  const lastMeasurement = measurements[0];
  const go = (pathname: string) => router.push({ pathname, params: { clientId, clientName, clientEmail } } as never);
  const archive = async (workoutId: string) => {
    if (archiving) return;
    setArchiving(workoutId);
    const result = await archiveCoachPrescription(workoutId);
    if (result.error || !result.success) {
      setError(result.error ?? "Não foi possível arquivar a prescrição.");
    } else {
      setPrescriptions((items) => items.map((item) => item.id === workoutId ? { ...item, status: "archived" as const } : item));
    }
    setArchiving(null);
  };
  if (!clientId) {
    return <WebShell backRoute="/students" eyebrow="Workspace do coach" title="Aluno não encontrado"><EmptyState text="Volte para a carteira e selecione um aluno ativo." colors={colors} /></WebShell>;
  }
  return (
    <WebShell backRoute="/students" eyebrow="Workspace do coach" title={clientName}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "55" }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{clientName.slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.heroCopy}><Text style={[styles.kicker, { color: colors.primary }]}>CLIENT WORKSPACE</Text><Text style={[styles.heroTitle, { color: colors.foreground }]}>{clientName}</Text><Text style={[styles.heroMeta, { color: colors.foregroundMuted }]}>{clientEmail || "Acompanhamento individual"}</Text></View>
          <Pressable onPress={() => go("/prescribe/[clientId]")} style={[styles.primary, { backgroundColor: colors.primary }]}><AppIcon name="Plus" size={15} color="#06111D" /><Text style={styles.primaryText}>Prescrever treino</Text></Pressable>
        </View>
        {!online ? <Notice text="Modo demonstração: conecte o Supabase para carregar os dados do aluno." color={colors.warning} /> : null}
        {error ? <Notice text={error} color={colors.error} /> : null}
        <View style={styles.metrics}>
          <Metric label="SESSÕES · 7 DIAS" value={String(checkins.filter((item) => (daysSince(item.happenedOn) ?? 99) <= 7).length)} hint="treinos concluídos" colors={colors} />
          <Metric label="TREINOS ATIVOS" value={String(activePrescriptions.length)} hint="prescrições vigentes" colors={colors} />
          <Metric label="ÚLTIMA MEDIDA" value={lastMeasurement?.weightKg ? `${lastMeasurement.weightKg} kg` : "—"} hint={lastMeasurement ? formatDate(lastMeasurement.measuredOn) : "sem registro"} colors={colors} />
          <Metric label="NUTRIÇÃO" value={nutrition ? `${nutrition.trainingDay.calories}` : "—"} hint={nutrition ? "kcal em treino" : "plano não criado"} colors={colors} />
        </View>
        <View style={styles.actions}>
          <Action label="Prescrever treino" copy="Monte exercícios, séries e agenda" icon="Dumbbell" onPress={() => go("/prescribe/[clientId]")} colors={colors} />
          <Action label="Plano de nutrição" copy={nutrition ? "Editar metas e refeições" : "Criar primeiro plano"} icon="Apple" onPress={() => go("/coach/nutrition/[clientId]")} colors={colors} />
          <Action label="Medidas corporais" copy="Veja evolução e histórico" icon="Ruler" onPress={() => go("/coach/measurements/[clientId]")} colors={colors} />
          <Action label="Aderência" copy="Treinos e check-ins recentes" icon="TrendingUp" onPress={() => go("/coach/adherence/[clientId]")} colors={colors} />
        </View>
        <View style={styles.columns}>
          <Panel title="Prescrições ativas" eyebrow="TREINO" colors={colors} action="Ver todas" onAction={() => go("/prescribe/[clientId]")}>
            {loading ? <Loading colors={colors} /> : activePrescriptions.length === 0 ? <EmptyState text="Nenhum treino prescrito ainda." colors={colors} /> : activePrescriptions.slice(0, 5).map((item) => <PrescriptionRow key={item.id} title={item.name} copy={`${item.exercises.length} exercícios · ${item.scheduledFor ? `agendado para ${formatDate(item.scheduledFor)}` : "sem data"}`} icon="Dumbbell" colors={colors} busy={archiving === item.id} onArchive={() => archive(item.id)} />)}
          </Panel>
          <Panel title="Últimos check-ins" eyebrow="ADERÊNCIA" colors={colors} action="Abrir aderência" onAction={() => go("/coach/adherence/[clientId]")}>
            {loading ? <Loading colors={colors} /> : recentCheckins.length === 0 ? <EmptyState text="Os check-ins aparecerão aqui quando o aluno concluir uma sessão." colors={colors} /> : recentCheckins.map((item) => <ListRow key={item.id} title={item.workoutName} copy={`${formatDate(item.happenedOn)} · ${item.exerciseCount} exercícios · ${Math.round(item.totalVolume)} kg`} icon="Check" colors={colors} />)}
          </Panel>
        </View>
      </ScrollView>
    </WebShell>
  );
}
function Notice({ text, color }: { text: string; color: string }) { return <View style={[styles.notice, { backgroundColor: color + "14", borderColor: color + "45" }]}><Text style={[styles.noticeText, { color }]}>{text}</Text></View>; }
function Metric({ label, value, hint, colors }: any) { return <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.eyebrow, { color: colors.muted }]}>{label}</Text><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.metricHint, { color: colors.primary }]}>{hint}</Text></View>; }
function Action({ label, copy, icon, onPress, colors }: any) { return <Pressable onPress={onPress} style={[styles.action, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.actionIcon, { backgroundColor: colors.primary + "18" }]}><AppIcon name={icon} size={17} color={colors.primary} /></View><View style={styles.actionCopy}><Text style={[styles.actionLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.actionMeta, { color: colors.muted }]}>{copy}</Text></View><AppIcon name="ChevronRight" size={14} color={colors.muted} /></Pressable>; }
function Panel({ title, eyebrow, action, onAction, colors, children }: any) { return <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.panelHead}><View><Text style={[styles.eyebrow, { color: colors.muted }]}>{eyebrow}</Text><Text style={[styles.panelTitle, { color: colors.foreground }]}>{title}</Text></View>{action ? <Pressable onPress={onAction}><Text style={[styles.panelAction, { color: colors.primary }]}>{action}</Text></Pressable> : null}</View>{children}</View>; }
function ListRow({ title, copy, icon, colors }: any) { return <View style={[styles.listRow, { borderTopColor: colors.border }]}><View style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}><AppIcon name={icon} size={15} color={colors.primary} /></View><View style={styles.actionCopy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowMeta, { color: colors.muted }]}>{copy}</Text></View></View>; }
function PrescriptionRow({ title, copy, icon, colors, onArchive, busy }: any) { return <View style={[styles.listRow, { borderTopColor: colors.border }]}><View style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}><AppIcon name={icon} size={15} color={colors.primary} /></View><View style={styles.actionCopy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowMeta, { color: colors.muted }]}>{copy}</Text></View><Pressable disabled={busy} onPress={onArchive} accessibilityLabel="Arquivar prescrição" style={[styles.archiveButton, { borderColor: colors.border, opacity: busy ? 0.5 : 1 }]}><AppIcon name="Archive" size={14} color={colors.muted} /><Text style={[styles.archiveText, { color: colors.muted }]}>{busy ? "..." : "Arquivar"}</Text></Pressable></View>; }
function EmptyState({ text, colors }: any) { return <Text style={[styles.empty, { color: colors.muted }]}>{text}</Text>; }
function Loading({ colors }: any) { return <Text style={[styles.empty, { color: colors.muted }]}>Carregando dados...</Text>; }
const styles = StyleSheet.create({ scroll: { gap: 16, paddingBottom: 60 }, hero: { borderWidth: 1, borderRadius: 21, padding: 22, flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" }, avatar: { width: 54, height: 54, borderRadius: 17, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#06111D", fontSize: 23, fontWeight: "900" }, heroCopy: { flex: 1, minWidth: 220 }, kicker: { fontFamily: "monospace", fontSize: 10, letterSpacing: 1.4, fontWeight: "800" }, heroTitle: { fontSize: 27, fontWeight: "900", marginTop: 5 }, heroMeta: { fontSize: 13, marginTop: 4 }, primary: { minHeight: 44, borderRadius: 11, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 }, primaryText: { color: "#06111D", fontSize: 12, fontWeight: "900" }, notice: { borderWidth: 1, borderRadius: 14, padding: 13 }, noticeText: { fontSize: 12, fontWeight: "700" }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, metric: { flex: 1, minWidth: 180, borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 }, eyebrow: { fontFamily: "monospace", fontSize: 9, letterSpacing: 1.2, fontWeight: "800" }, metricValue: { fontSize: 25, fontWeight: "900" }, metricHint: { fontSize: 11, fontWeight: "800" }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, action: { flex: 1, minWidth: 245, borderWidth: 1, borderRadius: 15, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }, actionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" }, actionCopy: { flex: 1, gap: 3 }, actionLabel: { fontSize: 13, fontWeight: "800" }, actionMeta: { fontSize: 11 }, columns: { flexDirection: "row", flexWrap: "wrap", gap: 16 }, panel: { flex: 1, minWidth: 330, borderWidth: 1, borderRadius: 18, padding: 19, gap: 12 }, panelHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }, panelTitle: { fontSize: 19, fontWeight: "900", marginTop: 6 }, panelAction: { fontSize: 11, fontWeight: "800" }, listRow: { minHeight: 58, borderTopWidth: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 }, rowIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" }, rowTitle: { fontSize: 13, fontWeight: "800" }, archiveButton: { minHeight: 30, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", gap: 4 }, archiveText: { fontSize: 9, fontWeight: "800" }, rowMeta: { fontSize: 11 }, empty: { fontSize: 13, lineHeight: 20, paddingVertical: 6 } });
