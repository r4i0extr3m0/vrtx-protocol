import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TextInput } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useTheme } from "@/src/hooks";
import { spacing, radius, typography } from "@/src/theme";

interface Measurement {
  left: number;
  right: number;
}

interface BodyMeasurements {
  arms: Measurement;
  thighs: Measurement;
  calves: Measurement;
  shoulders: number;
  chest: number;
  waist: number;
}

export function AsymmetryScreen() {
  const { colors } = useTheme();
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    arms: { left: 35, right: 35.5 },
    thighs: { left: 58, right: 58 },
    calves: { left: 38, right: 37.5 },
    shoulders: 120,
    chest: 105,
    waist: 82,
  });

  const calculateDiff = (m: Measurement) => {
    const diff = Math.abs(m.left - m.right);
    const percent = (diff / Math.max(m.left, m.right)) * 100;
    return { diff: diff.toFixed(1), percent: percent.toFixed(1) };
  };

  const renderMeasurementRow = (label: string, key: keyof BodyMeasurements, isPair: boolean = true) => {
    if (!isPair) return null;
    const m = measurements[key] as Measurement;
    const { percent } = calculateDiff(m);
    const isAsymmetric = parseFloat(percent) > 2;

    return (
      <Animated.View entering={FadeInDown} style={[styles.row, { borderBottomColor: colors.border }]}>
        <View style={styles.labelCol}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.rowSub, { color: isAsymmetric ? colors.error : colors.success }]}>
            {isAsymmetric ? `Assimetria: ${percent}%` : "Equilibrado"}
          </Text>
        </View>
        <View style={styles.inputGroup}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.sideLabel, { color: colors.muted }]}>ESQ</Text>
            <TextInput
              keyboardType="decimal-pad"
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceAlt }]}
              value={String(m.left)}
              onChangeText={(v) => setMeasurements(prev => ({
                ...prev,
                [key]: { ...m, left: parseFloat(v) || 0 }
              }))}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.sideLabel, { color: colors.muted }]}>DIR</Text>
            <TextInput
              keyboardType="decimal-pad"
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceAlt }]}
              value={String(m.right)}
              onChangeText={(v) => setMeasurements(prev => ({
                ...prev,
                [key]: { ...m, right: parseFloat(v) || 0 }
              }))}
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScreenContainer className="px-5 py-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Equilíbrio Muscular</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Monitore assimetrias corporais e garanta um desenvolvimento estético e funcional simétrico.
          </Text>
        </View>

        <SectionCard title="Medidas de Perímetro" subtitle="Compare os lados esquerdo e direito (cm).">
          {renderMeasurementRow("Braços", "arms")}
          {renderMeasurementRow("Coxas", "thighs")}
          {renderMeasurementRow("Panturrilhas", "calves")}
        </SectionCard>

        <SectionCard title="Tronco e Cintura" subtitle="Medidas de largura e circunferência.">
          <View style={styles.simpleRow}>
            <View style={styles.simpleInput}>
              <Text style={[styles.label, { color: colors.muted }]}>Ombros</Text>
              <TextInput
                keyboardType="decimal-pad"
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceAlt }]}
                value={String(measurements.shoulders)}
                onChangeText={(v) => setMeasurements(prev => ({ ...prev, shoulders: parseFloat(v) || 0 }))}
              />
            </View>
            <View style={styles.simpleInput}>
              <Text style={[styles.label, { color: colors.muted }]}>Peitoral</Text>
              <TextInput
                keyboardType="decimal-pad"
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceAlt }]}
                value={String(measurements.chest)}
                onChangeText={(v) => setMeasurements(prev => ({ ...prev, chest: parseFloat(v) || 0 }))}
              />
            </View>
            <View style={styles.simpleInput}>
              <Text style={[styles.label, { color: colors.muted }]}>Cintura</Text>
              <TextInput
                keyboardType="decimal-pad"
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.surfaceAlt }]}
                value={String(measurements.waist)}
                onChangeText={(v) => setMeasurements(prev => ({ ...prev, waist: parseFloat(v) || 0 }))}
              />
            </View>
          </View>
        </SectionCard>

        <AppButton label="Salvar Medidas" onPress={() => {}} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.sm },
  title: { fontSize: typography.title, fontWeight: "900", letterSpacing: -1 },
  subtitle: { fontSize: typography.body, fontWeight: "500", lineHeight: 22 },
  row: { flexDirection: "row", paddingVertical: spacing.md, borderBottomWidth: 1, alignItems: "center" },
  labelCol: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: "800" },
  rowSub: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  inputGroup: { flexDirection: "row", gap: spacing.md },
  inputWrapper: { alignItems: "center", gap: 4 },
  sideLabel: { fontSize: 9, fontWeight: "900" },
  input: { width: 65, height: 40, borderRadius: radius.md, textAlign: "center", fontWeight: "800", fontSize: 15 },
  simpleRow: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  simpleInput: { flex: 1, gap: 6 },
  label: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
});
