import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon } from "@/src/components/AppIcon";
import { SectionCard } from "@/src/components/SectionCard";
import { fetchMyCoach, listMyMeasurements, submitMeasurement } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useI18n } from "@/src/i18n";
import { useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import type { BodyMeasurement, BodyMeasurementInput } from "@/src/types";

interface NumericFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

function NumericField({ label, value, onChangeText, placeholder }: NumericFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
      />
    </View>
  );
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDay(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function MeasurementScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const [measuredOn, setMeasuredOn] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [arm, setArm] = useState("");
  const [thigh, setThigh] = useState("");
  const [calf, setCalf] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCoach, setHasCoach] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const online = hasSupabaseEnv();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [coachResult, measurementsResult] = await Promise.all([
      fetchMyCoach(),
      listMyMeasurements(),
    ]);
    setHasCoach(Boolean(coachResult.coachId));
    if (measurementsResult.error) {
      setError(measurementsResult.error);
    } else {
      setHistory(measurementsResult.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (online) {
      void load();
    } else {
      setLoading(false);
    }
  }, [online, load]);

  const resetForm = () => {
    setWeight("");
    setBodyFat("");
    setChest("");
    setWaist("");
    setHip("");
    setArm("");
    setThigh("");
    setCalf("");
    setNotes("");
    setMeasuredOn(new Date().toISOString().slice(0, 10));
  };

  const handleSave = async () => {
    if (!online || saving) return;

    const input: BodyMeasurementInput = {
      measuredOn,
      weightKg: parseNumber(weight),
      bodyFatPct: parseNumber(bodyFat),
      chestCm: parseNumber(chest),
      waistCm: parseNumber(waist),
      hipCm: parseNumber(hip),
      armCm: parseNumber(arm),
      thighCm: parseNumber(thigh),
      calfCm: parseNumber(calf),
      notes: notes.trim() || null,
    };

    const hasAny = [
      input.weightKg,
      input.bodyFatPct,
      input.chestCm,
      input.waistCm,
      input.hipCm,
      input.armCm,
      input.thighCm,
      input.calfCm,
    ].some((value) => value !== null);

    if (!hasAny) {
      setError(t("measurements.requiredField"));
      return;
    }

    setSaving(true);
    setError(null);
    const result = await submitMeasurement(input);
    setSaving(false);

    if (result.error) {
      Alert.alert(t("measurements.saveErrorTitle"), result.error);
      return;
    }

    Alert.alert(t("measurements.savedTitle"), t("measurements.savedBody"));
    resetForm();
    void load();
  };

  const renderHistory = (item: BodyMeasurement) => {
    const parts: string[] = [];
    if (item.weightKg !== null && item.weightKg !== undefined) parts.push(`${item.weightKg} kg`);
    if (item.bodyFatPct !== null && item.bodyFatPct !== undefined) parts.push(`${item.bodyFatPct}%`);
    if (item.waistCm !== null && item.waistCm !== undefined) parts.push(`${t("measurements.waist")} ${item.waistCm}`);

    return (
      <View
        key={item.id}
        style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.historyIcon, { backgroundColor: colors.primary + "15" }]}>
          <AppIcon name="Ruler" size={18} color={colors.primary} />
        </View>
        <View style={styles.historyBody}>
          <Text style={[styles.historyDate, { color: colors.foreground }]}>
            {formatDay(item.measuredOn)}
          </Text>
          <Text numberOfLines={1} style={[styles.historyMeta, { color: colors.muted }]}>
            {parts.length > 0 ? parts.join(" · ") : t("measurements.notes")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="px-5">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>{t("measurements.title")}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{t("measurements.subtitle")}</Text>
          </View>

          {!online ? (
            <View style={[styles.notice, { backgroundColor: colors.warning + "15" }]}>
              <Text style={[styles.noticeText, { color: colors.warning }]}>
                {t("measurements.offline")}
              </Text>
            </View>
          ) : null}

          {online && hasCoach === false ? (
            <View style={[styles.notice, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.noticeText, { color: colors.primary }]}>
                {t("measurements.noCoach")}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.notice, { backgroundColor: colors.error + "15" }]}>
              <Text style={[styles.noticeText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <SectionCard title={t("measurements.latestTitle")} subtitle={t("measurements.dateLabel")} delay={80}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t("measurements.dateLabel")}</Text>
              <TextInput
                value={measuredOn}
                onChangeText={setMeasuredOn}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                style={[
                  styles.input,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              />
            </View>

            <View style={styles.grid}>
              <NumericField label={t("measurements.weight")} value={weight} onChangeText={setWeight} placeholder="0" />
              <NumericField label={t("measurements.bodyFat")} value={bodyFat} onChangeText={setBodyFat} placeholder="0" />
              <NumericField label={t("measurements.chest")} value={chest} onChangeText={setChest} placeholder="0" />
              <NumericField label={t("measurements.waist")} value={waist} onChangeText={setWaist} placeholder="0" />
              <NumericField label={t("measurements.hip")} value={hip} onChangeText={setHip} placeholder="0" />
              <NumericField label={t("measurements.arm")} value={arm} onChangeText={setArm} placeholder="0" />
              <NumericField label={t("measurements.thigh")} value={thigh} onChangeText={setThigh} placeholder="0" />
              <NumericField label={t("measurements.calf")} value={calf} onChangeText={setCalf} placeholder="0" />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t("measurements.notes")}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t("measurements.notesPlaceholder")}
                placeholderTextColor={colors.muted}
                multiline
                style={[
                  styles.input,
                  styles.notesInput,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              />
            </View>

            <AppButton
              label={saving ? t("measurements.saving") : t("measurements.save")}
              onPress={handleSave}
              disabled={!online || hasCoach === false || saving}
              loading={saving}
              variant="brand"
              style={{ marginTop: spacing.md }}
            />
          </SectionCard>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("measurements.historyTitle")}
          </Text>

          {loading ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t("measurements.loading")}</Text>
          ) : history.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>{t("measurements.emptyHistory")}</Text>
          ) : (
            <View style={styles.historyList}>{history.map(renderHistory)}</View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  header: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.bodySm,
    fontWeight: "600",
  },
  notice: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  noticeText: {
    fontSize: typography.bodySm,
    fontWeight: "700",
    textAlign: "center",
  },
  field: {
    gap: 6,
    marginTop: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontWeight: "700",
    minHeight: 48,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: spacing.sm,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  historyBody: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: "800",
  },
  historyMeta: {
    fontSize: typography.bodySm,
    fontWeight: "600",
  },
  empty: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
