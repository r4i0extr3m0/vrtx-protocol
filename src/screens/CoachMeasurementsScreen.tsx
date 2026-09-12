import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppIcon } from "@/src/components/AppIcon";
import { SectionCard } from "@/src/components/SectionCard";
import { listCoachClientMeasurements } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useI18n } from "@/src/i18n";
import { useTabBarInset, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import type { BodyMeasurement } from "@/src/types";

function formatDay(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatMetric(value: number | null | undefined, suffix: string): string | null {
  if (value === null || value === undefined) return null;
  return `${value}${suffix}`;
}

export function CoachMeasurementsScreen() {
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string }>();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const clientName = typeof params.clientName === "string" ? params.clientName : "";
  const { colors } = useTheme();
  const { t } = useI18n();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const online = hasSupabaseEnv();
  const title = clientName || t("adherence.clientFallback");

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await listCoachClientMeasurements(clientId);
    if (result.error) {
      setError(result.error);
    } else {
      setMeasurements(result.data ?? []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    if (online) {
      void load();
    } else {
      setLoading(false);
    }
  }, [online, load]);

  const latest = measurements[0] ?? null;
  const previous = measurements[1] ?? null;

  const rows = useMemo(() => {
    if (!latest) return [];
    return [
      { label: t("measurements.weight"), value: formatMetric(latest.weightKg, " kg") },
      { label: t("measurements.bodyFat"), value: formatMetric(latest.bodyFatPct, "%") },
      { label: t("measurements.chest"), value: formatMetric(latest.chestCm, " cm") },
      { label: t("measurements.waist"), value: formatMetric(latest.waistCm, " cm") },
      { label: t("measurements.hip"), value: formatMetric(latest.hipCm, " cm") },
      { label: t("measurements.arm"), value: formatMetric(latest.armCm, " cm") },
      { label: t("measurements.thigh"), value: formatMetric(latest.thighCm, " cm") },
      { label: t("measurements.calf"), value: formatMetric(latest.calfCm, " cm") },
    ].filter((row) => row.value !== null);
  }, [latest, t]);

  const weightDelta = useMemo(() => {
    if (
      latest?.weightKg === null ||
      latest?.weightKg === undefined ||
      previous?.weightKg === null ||
      previous?.weightKg === undefined
    ) {
      return null;
    }
    const diff = Number((latest.weightKg - previous.weightKg).toFixed(2));
    return diff === 0 ? null : diff;
  }, [latest, previous]);

  const renderHistory = (item: BodyMeasurement) => {
    const parts: string[] = [];
    const weight = formatMetric(item.weightKg, " kg");
    const bodyFat = formatMetric(item.bodyFatPct, "%");
    const waist = formatMetric(item.waistCm, " cm");
    if (weight) parts.push(weight);
    if (bodyFat) parts.push(bodyFat);
    if (waist) parts.push(`${t("measurements.waist")} ${waist}`);

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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentPaddingBottom + spacing.xxl },
        ]}
        scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("measurements.coachTitle")}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {t("measurements.coachSubtitle", { client: title })}
          </Text>
        </View>

        {!online ? (
          <View style={[styles.notice, { backgroundColor: colors.warning + "15" }]}>
            <Text style={[styles.noticeText, { color: colors.warning }]}>
              {t("measurements.offline")}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.notice, { backgroundColor: colors.error + "15" }]}>
            <Text style={[styles.noticeText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {latest ? (
          <SectionCard
            title={t("measurements.latestTitle")}
            subtitle={formatDay(latest.measuredOn)}
            delay={80}
          >
            <View style={styles.grid}>
              {rows.map((row) => (
                <View key={row.label} style={styles.metric}>
                  <Text style={[styles.metricValue, { color: colors.foreground }]}>{row.value}</Text>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>{row.label}</Text>
                </View>
              ))}
            </View>
            {weightDelta !== null ? (
              <Text
                style={[
                  styles.delta,
                  { color: weightDelta < 0 ? colors.success : colors.warning },
                ]}
              >
                {t("measurements.delta")}: {weightDelta > 0 ? "+" : ""}
                {weightDelta} kg
              </Text>
            ) : null}
          </SectionCard>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t("measurements.historyTitle")}
        </Text>

        {loading ? (
          <Text style={[styles.empty, { color: colors.muted }]}>{t("measurements.loading")}</Text>
        ) : measurements.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>{t("measurements.coachEmpty")}</Text>
        ) : (
          <View style={styles.historyList}>{measurements.map(renderHistory)}</View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metric: {
    width: "46%",
    gap: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  metricLabel: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  delta: {
    fontSize: typography.bodySm,
    fontWeight: "800",
    marginTop: spacing.md,
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
