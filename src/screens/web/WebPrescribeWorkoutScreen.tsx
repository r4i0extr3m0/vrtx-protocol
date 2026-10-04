import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppIcon } from "@/src/components/AppIcon";
import { createCoachPrescription } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useExerciseStore } from "@/src/store/exerciseStore";
import { useTheme } from "@/src/hooks";
import { createId } from "@/src/utils";
import type { PrescriptionExerciseInput } from "@/src/types";
import { WebShell } from "./WebChrome";

type ScheduledOption = "today" | "tomorrow" | "none";
interface DraftExercise { key: string; name: string; muscleGroup?: string | null; sets: string; reps: string; weight: string; }
function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function scheduledDate(option: ScheduledOption) { if (option === "none") return null; const date = new Date(); if (option === "tomorrow") date.setDate(date.getDate() + 1); return isoDate(date); }

export function WebPrescribeWorkoutScreen() {
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string }>();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const clientName = typeof params.clientName === "string" ? params.clientName : "aluno";
  const { colors } = useTheme();
  const { exercises, ensureSeedExercises } = useExerciseStore();
  const [name, setName] = useState("Treino de força");
  const [when, setWhen] = useState<ScheduledOption>("none");
  const [draft, setDraft] = useState<DraftExercise[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const online = hasSupabaseEnv();
  useEffect(() => { ensureSeedExercises(); }, [ensureSeedExercises]);
  const addExercise = (exercise: { name: string; muscleGroup?: string | null }) => {
    setDraft((items) => [...items, { key: createId("draft"), name: exercise.name, muscleGroup: exercise.muscleGroup, sets: "3", reps: "10", weight: "" }]);
    setLibraryOpen(false);
  };
  const update = (key: string, partial: Partial<DraftExercise>) => setDraft((items) => items.map((item) => item.key === key ? { ...item, ...partial } : item));
  const save = async () => {
    if (!online) { setFeedback("Conecte o Supabase para salvar uma prescrição real."); return; }
    if (!clientId) { setFeedback("Aluno não identificado. Volte para a carteira e tente novamente."); return; }
    if (!name.trim()) { setFeedback("Dê um nome para o treino."); return; }
    if (draft.length === 0) { setFeedback("Adicione pelo menos um exercício."); return; }
    setSaving(true); setFeedback(null);
    const payload: PrescriptionExerciseInput[] = draft.map((item) => ({ name: item.name, muscleGroup: item.muscleGroup ?? null, sets: Math.max(1, Number.parseInt(item.sets, 10) || 3), repsTarget: Math.max(1, Number.parseInt(item.reps, 10) || 10), weightKg: item.weight.trim() ? Number(item.weight.replace(",", ".")) : null }));
    const result = await createCoachPrescription({ clientId, name: name.trim(), scheduledFor: scheduledDate(when), exercises: payload });
    setSaving(false);
    if (result.error) { setFeedback(result.error); return; }
    setFeedback("Prescrição salva e vinculada ao aluno.");
    setTimeout(() => router.back(), 700);
  };
  return <WebShell backRoute="/students" eyebrow="Prescrição de treino" title={`Montar sessão para ${clientName}`}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={[styles.intro, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "45" }]}><View style={styles.introCopy}><Text style={[styles.eyebrow, { color: colors.primary }]}>PROGRAM BUILDER</Text><Text style={[styles.introTitle, { color: colors.foreground }]}>Uma sessão clara para executar sem pensar.</Text><Text style={[styles.introText, { color: colors.foregroundMuted }]}>Adicione exercícios, defina séries, repetições e carga. O aluno receberá a prescrição no app.</Text></View><View style={[styles.counter, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.counterValue, { color: colors.foreground }]}>{draft.length}</Text><Text style={[styles.counterLabel, { color: colors.muted }]}>exercícios</Text></View></View>
      <View style={styles.layout}>
        <View style={styles.mainColumn}>
          <Section title="Identidade da sessão" hint="Como o aluno verá este treino" colors={colors}><Text style={[styles.label, { color: colors.muted }]}>NOME DO TREINO</Text><TextInput value={name} onChangeText={setName} placeholder="Ex.: Lower A · força" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} /><Text style={[styles.label, { color: colors.muted, marginTop: 14 }]}>ENTREGA</Text><View style={styles.chips}>{([['today','Hoje'],['tomorrow','Amanhã'],['none','Sem data']] as [ScheduledOption,string][]).map(([value,label]) => <Pressable key={value} onPress={() => setWhen(value)} style={[styles.chip, { backgroundColor: when === value ? colors.primary + "18" : colors.surface, borderColor: when === value ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: when === value ? colors.primary : colors.foreground }]}>{label}</Text></Pressable>)}</View></Section>
          <Section title="Exercícios da sessão" hint="Ajuste o estímulo por exercício" colors={colors}>{draft.length === 0 ? <Text style={[styles.empty, { color: colors.muted }]}>A sessão ainda está vazia. Escolha exercícios na biblioteca ao lado.</Text> : draft.map((item, index) => <View key={item.key} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.exerciseHead}><View style={[styles.number, { backgroundColor: colors.primary + "18" }]}><Text style={[styles.numberText, { color: colors.primary }]}>{String(index + 1).padStart(2, "0")}</Text></View><View style={styles.exerciseCopy}><Text style={[styles.exerciseName, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.exerciseMeta, { color: colors.muted }]}>{item.muscleGroup || "Grupo não definido"}</Text></View><Pressable onPress={() => setDraft((items) => items.filter((draftItem) => draftItem.key !== item.key))}><AppIcon name="Trash2" size={17} color={colors.muted} /></Pressable></View><View style={styles.fields}>{[['sets','Séries',item.sets],['reps','Reps',item.reps],['weight','Carga kg',item.weight]] .map(([key,label,value]) => <View key={key} style={styles.field}><Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text><TextInput value={value as string} onChangeText={(text) => update(item.key, { [key]: text.replace(key === 'weight' ? /[^0-9.,]/g : /[^0-9]/g, "") })} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted} style={[styles.smallInput, { color: colors.foreground, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} /></View>)}</View></View>)}</Section>
        </View>
        <View style={styles.sideColumn}><Section title="Biblioteca" hint="Clique para adicionar" colors={colors}><Pressable onPress={() => setLibraryOpen((value) => !value)} style={[styles.libraryToggle, { borderColor: colors.primary + "60" }]}><AppIcon name={libraryOpen ? "ChevronUp" : "Plus"} size={16} color={colors.primary} /><Text style={[styles.libraryToggleText, { color: colors.primary }]}>{libraryOpen ? "Ocultar biblioteca" : "Adicionar exercício"}</Text></Pressable>{libraryOpen ? <View style={styles.library}>{exercises.map((exercise) => <Pressable key={exercise.id} onPress={() => addExercise(exercise)} style={[styles.libraryItem, { borderBottomColor: colors.border }]}><View style={styles.exerciseCopy}><Text style={[styles.libraryName, { color: colors.foreground }]}>{exercise.name}</Text><Text style={[styles.exerciseMeta, { color: colors.muted }]}>{exercise.muscleGroup} · {exercise.equipment}</Text></View><AppIcon name="Plus" size={16} color={colors.primary} /></Pressable>)}</View> : null}</Section><View style={[styles.saveCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.saveTitle, { color: colors.foreground }]}>Pronto para enviar?</Text><Text style={[styles.saveCopy, { color: colors.muted }]}>{draft.length ? `${draft.length} exercícios configurados para ${clientName}.` : "Adicione exercícios para liberar a prescrição."}</Text>{feedback ? <Text style={[styles.feedback, { color: feedback.includes("salva") ? colors.success : colors.error }]}>{feedback}</Text> : null}<Pressable disabled={saving} onPress={save} style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.65 : 1 }]}><Text style={styles.saveButtonText}>{saving ? "Salvando..." : "Salvar prescrição"}</Text><AppIcon name="ArrowRight" size={16} color="#06111D" /></Pressable></View></View>
      </View>
    </ScrollView>
  </WebShell>;
}
function Section({ title, hint, colors, children }: any) { return <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.sectionHead}><View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>{hint}</Text></View><AppIcon name="MoreHoriz" size={17} color={colors.muted} /></View>{children}</View>; }
const styles = StyleSheet.create({ scroll: { gap: 18, paddingBottom: 64 }, intro: { borderWidth: 1, borderRadius: 20, padding: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }, introCopy: { flex: 1, minWidth: 220 }, eyebrow: { fontFamily: "monospace", fontSize: 9, letterSpacing: 1.3, fontWeight: "800" }, introTitle: { fontSize: 25, lineHeight: 30, fontWeight: "900", marginTop: 7 }, introText: { fontSize: 13, lineHeight: 20, marginTop: 8 }, counter: { minWidth: 100, borderWidth: 1, borderRadius: 16, alignItems: "center", padding: 16 }, counterValue: { fontSize: 30, fontWeight: "900" }, counterLabel: { fontSize: 11, fontWeight: "700" }, layout: { flexDirection: "row", flexWrap: "wrap", gap: 18, alignItems: "flex-start" }, mainColumn: { flex: 1, minWidth: 430, gap: 18 }, sideColumn: { width: 330, maxWidth: "100%" }, section: { borderWidth: 1, borderRadius: 18, padding: 19, gap: 16, marginBottom: 18 }, sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, sectionTitle: { fontSize: 18, fontWeight: "900" }, sectionHint: { fontSize: 11, marginTop: 4 }, label: { fontFamily: "monospace", fontSize: 9, fontWeight: "800", letterSpacing: 1.1 }, input: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, marginTop: 8 }, chips: { flexDirection: "row", gap: 8, marginTop: 8 }, chip: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" }, chipText: { fontSize: 12, fontWeight: "800" }, empty: { fontSize: 13, lineHeight: 20 }, exerciseCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 14 }, exerciseHead: { flexDirection: "row", alignItems: "center", gap: 10 }, number: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" }, numberText: { fontFamily: "monospace", fontSize: 10, fontWeight: "900" }, exerciseCopy: { flex: 1, gap: 3 }, exerciseName: { fontSize: 14, fontWeight: "800" }, exerciseMeta: { fontSize: 11 }, fields: { flexDirection: "row", gap: 8 }, field: { flex: 1, gap: 5 }, fieldLabel: { fontFamily: "monospace", fontSize: 9, fontWeight: "800", letterSpacing: 0.7 }, smallInput: { height: 42, borderWidth: 1, borderRadius: 9, textAlign: "center", fontWeight: "800" }, libraryToggle: { borderWidth: 1, borderRadius: 11, borderStyle: "dashed", minHeight: 42, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 }, libraryToggleText: { fontSize: 12, fontWeight: "800" }, library: { gap: 0 }, libraryItem: { minHeight: 56, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 8 }, libraryName: { fontSize: 12, fontWeight: "800" }, saveCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 10 }, saveTitle: { fontSize: 18, fontWeight: "900" }, saveCopy: { fontSize: 12, lineHeight: 18 }, feedback: { fontSize: 12, fontWeight: "800", lineHeight: 18 }, saveButton: { minHeight: 46, borderRadius: 11, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 4 }, saveButtonText: { color: "#06111D", fontSize: 12, fontWeight: "900" } });
