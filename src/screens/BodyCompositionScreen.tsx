import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { BodyCompositionFigure } from "@/src/components/BodyCompositionFigure";
import { useTheme } from "@/src/hooks";
import { useBodyCompositionStore } from "@/src/store/bodyCompositionStore";
import { radius, spacing, typography, shadows } from "@/src/theme";
import type { BodyCompositionEntry, BodyCompositionSegments } from "@/src/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function toNumberOrUndefined(value: string): number | undefined {
  const v = value.trim().replace(",", ".");
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

interface FormState {
  date: string;
  weightKg: string;
  bodyFatPercent: string;
  leanMassKg: string;
  muscleMassKg: string;
  leftArmKg: string;
  rightArmKg: string;
  leftLegKg: string;
  rightLegKg: string;
  trunkKg: string;
  notes: string;
}

const emptyForm: FormState = {
  date: today(),
  weightKg: "",
  bodyFatPercent: "",
  leanMassKg: "",
  muscleMassKg: "",
  leftArmKg: "",
  rightArmKg: "",
  leftLegKg: "",
  rightLegKg: "",
  trunkKg: "",
  notes: "",
};

export function BodyCompositionScreen() {
  const { colors } = useTheme();
  const { entries, addEntry, deleteEntry } = useBodyCompositionStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const latest = entries[0] ?? null;

  const latestSegments = useMemo<BodyCompositionSegments | undefined>(() => latest?.segments, [latest]);

  const openAdd = () => {
    setForm({ ...emptyForm, date: today() });
    setModalVisible(true);
  };

  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      Alert.alert("Data inválida", "Use o formato YYYY-MM-DD.");
      return;
    }

    const segments: BodyCompositionSegments = {
      leftArmKg: toNumberOrUndefined(form.leftArmKg),
      rightArmKg: toNumberOrUndefined(form.rightArmKg),
      leftLegKg: toNumberOrUndefined(form.leftLegKg),
      rightLegKg: toNumberOrUndefined(form.rightLegKg),
      trunkKg: toNumberOrUndefined(form.trunkKg),
    };

    const hasAnySegment = Object.values(segments).some((v) => typeof v === "number");

    addEntry({
      date: form.date,
      weightKg: toNumberOrUndefined(form.weightKg),
      bodyFatPercent: toNumberOrUndefined(form.bodyFatPercent),
      leanMassKg: toNumberOrUndefined(form.leanMassKg),
      muscleMassKg: toNumberOrUndefined(form.muscleMassKg),
      segments: hasAnySegment ? segments : undefined,
      notes: form.notes.trim() || undefined,
    });

    setModalVisible(false);
  };

  const confirmDelete = (entry: BodyCompositionEntry) => {
    Alert.alert("Excluir registro", `Excluir registro de ${entry.date}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <ScreenContainer className="px-5 py-4">
      <Animated.View entering={FadeInDown.delay(80)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Bioimpedância</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Registre medições e visualize o equilíbrio por segmentos (corpo humano).
          </Text>
        </View>
        <AppButton label="Voltar" variant="ghost" onPress={() => router.back()} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BodyCompositionFigure segments={latestSegments} />

        <View style={styles.actions}>
          <AppButton label="+ Adicionar medição" onPress={openAdd} />
        </View>

        <View style={{ gap: spacing.md }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Histórico</Text>
          {entries.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>
              Nenhuma medição ainda. Adicione a primeira para acompanhar evolução.
            </Text>
          ) : (
            entries.map((e) => (
              <View
                key={e.id}
                style={[
                  styles.row,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  shadows.card,
                ]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "900" }}>{e.date}</Text>
                  <Text style={{ color: colors.muted, fontWeight: "700" }}>
                    {typeof e.weightKg === "number" ? `Peso: ${e.weightKg.toFixed(1)} kg  · ` : ""}
                    {typeof e.bodyFatPercent === "number" ? `Gordura: ${e.bodyFatPercent.toFixed(1)}%` : ""}
                  </Text>
                </View>
                <AppButton label="Excluir" variant="ghost" onPress={() => confirmDelete(e)} />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
        <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nova medição</Text>

          <TextInput
            placeholder="Data (YYYY-MM-DD)"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={form.date}
            onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
          />

          <View style={styles.grid2}>
            <TextInput
              placeholder="Peso (kg)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[...inputStyle, styles.gridItem]}
              value={form.weightKg}
              onChangeText={(v) => setForm((f) => ({ ...f, weightKg: v }))}
            />
            <TextInput
              placeholder="% Gordura"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[...inputStyle, styles.gridItem]}
              value={form.bodyFatPercent}
              onChangeText={(v) => setForm((f) => ({ ...f, bodyFatPercent: v }))}
            />
          </View>

          <View style={styles.grid2}>
            <TextInput
              placeholder="Massa magra (kg)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[...inputStyle, styles.gridItem]}
              value={form.leanMassKg}
              onChangeText={(v) => setForm((f) => ({ ...f, leanMassKg: v }))}
            />
            <TextInput
              placeholder="Massa muscular (kg)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[...inputStyle, styles.gridItem]}
              value={form.muscleMassKg}
              onChangeText={(v) => setForm((f) => ({ ...f, muscleMassKg: v }))}
            />
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Segmentos (kg de massa muscular)</Text>
          <View style={styles.grid2}>
            <TextInput
              placeholder="Braço esq (kg)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[...inputStyle, styles.gridItem]}
              value={form.leftArmKg}
              onChangeText={(v) => setForm((f) => ({ ...f, leftArmKg: v }))}
            />
            <TextInput
              placeholder="Braço dir (kg)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[...inputStyle, styles.gridItem]}
              value={form.rightArmKg}
              onChangeText={(v) => setForm((f) => ({ ...f, rightArmKg: v }))}
            />
          </View>
          <View style={styles.grid2}>
            <TextInput
              placeholder="Perna esq (kg)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[...inputStyle, styles.gridItem]}
              value={form.leftLegKg}
              onChangeText={(v) => setForm((f) => ({ ...f, leftLegKg: v }))}
            />
            <TextInput
              placeholder="Perna dir (kg)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[...inputStyle, styles.gridItem]}
              value={form.rightLegKg}
              onChangeText={(v) => setForm((f) => ({ ...f, rightLegKg: v }))}
            />
          </View>
          <TextInput
            placeholder="Tronco (kg)"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            style={inputStyle}
            value={form.trunkKg}
            onChangeText={(v) => setForm((f) => ({ ...f, trunkKg: v }))}
          />

          <TextInput
            placeholder="Observações (opcional)"
            placeholderTextColor={colors.muted}
            style={[...inputStyle, { height: 80, textAlignVertical: "top" }]}
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            multiline
          />

          <View style={styles.modalActions}>
            <AppButton label="Cancelar" variant="secondary" onPress={() => setModalVisible(false)} />
            <AppButton label="Salvar" onPress={save} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  actions: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.section,
    fontWeight: "900",
  },
  empty: {
    fontSize: 13,
    fontWeight: "700",
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.section,
    fontWeight: "900",
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontWeight: "700",
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  grid2: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
});

