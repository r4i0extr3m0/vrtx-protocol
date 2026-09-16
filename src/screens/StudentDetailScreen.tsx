import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon } from "@/src/components/AppIcon";
import { SectionCard } from "@/src/components/SectionCard";
import {
  getCoachClientNutritionPlan,
  listCoachCheckins,
  listCoachClientMeasurements,
  listCoachClientPrescriptions,
} from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useI18n } from "@/src/i18n";
import { useTabBarInset, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import type {
  BodyMeasurement,
  CoachCheckin,
  CoachNutritionPlan,
  CoachPrescription,
} from "@/src/types";

function daysSince(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now.getTime() - target.getTime()) / (24 * 60 * 60 * 1000)));
}

interface SummaryRowProps {
  icon: string;
  iconColor: string;
  title: string;
  hint: string;
  children: ReactNode;
}

function SummaryRow({ icon, iconColor, title, hint, children }: SummaryRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + "18" }]}>
        <AppIcon name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowHint, { color: colors.muted }]}>{hint}</Text>
        {children}
      </View>
    </View>
  );
}

export function StudentDetailScreen() {
  const params = useLocalSearchParams<{
    clientId?: string;
    clientName?: string;
    clientEmail?: string;
  }>();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const clientName = typeof params.clientName === "string" ? params.clientName : "";
  const clientEmail = typeof params.clientEmail === "string" ? params.clientEmail : "";

  const { colors } = useTheme();
  const { t } = useI18n();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();

  const [checkins, setCheckins] = useState<CoachCheckin[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [prescriptions, setPrescriptions] = useState<CoachPrescription[]>([]);
  const [nutritionPlan, setNutritionPlan] = useState<CoachNutritionPlan | null>(null);
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
    const [checkinResult, measurementResult, prescriptionResult] = await Promise.all([
      listCoachCheckins(clientId),
      listCoachClientMeasurements(clientId),
      listCoachClientPrescriptions(clientId),
    ]);
    if (checkinResult.error) {
      setError(checkinResult.error);
    } else if (measurementResult.error) {
      setError(measurementResult.error);
    } else if (prescriptionResult.error) {
      setError(prescriptionResult.error);
    }
    setCheckins(checkinResult.data ?? []);
    setMeasurements(measurementResult.data ?? []);
    setPrescriptions(prescriptionResult.data ?? []);

    const nutritionResult = await getCoachClientNutritionPlan(clientId);
    if (nutritionResult.error) {
      setError(nutritionResult.error);
    } else {
      setNutritionPlan(nutritionResult.data ?? null);
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

  const weekCount = useMemo(() => {
    const windowStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return checkins.filter((item) => {
      const timestamp = new Date(`${item.happenedOn}T00:00:00`).getTime();
      return Number.isFinite(timestamp) && timestamp >= windowStart;
    }).length;
  }, [checkins]);

  const latestCheckin = checkins[0] ?? null;
  const latestMeasurement = measurements[0] ?? null;

  const adherenceValue = latestCheckin
    ? daysSince(latestCheckin.happenedOn) === 0
      ? t("adherence.lastToday")
      : daysSince(latestCheckin.happenedOn) === 1
        ? t("adherence.lastYesterday")
        : t("adherence.lastDaysAgo", { days: daysSince(latestCheckin.happenedOn) })
    : t("adherence.noCheckins");

  const measurementValue = latestMeasurement
    ? latestMeasurement.weightKg !== null && latestMeasurement.weightKg !== undefined
      ? t("studentDetail.lastWeight", { value: `${latestMeasurement.weightKg} kg` })
      : t("measurements.latestTitle")
    : t("studentDetail.noMeasurements");

  const navigate = (pathname: string) =>
    router.push({
      pathname,
      params: { clientId, clientName },
    } as never);

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
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
            <AppIcon name="User" size={22} color={colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            {clientEmail ? (
              <Text numberOfLines={1} style={[styles.email, { color: colors.muted }]}>
                {clientEmail}
              </Text>
            ) : null}
          </View>
        </View>

        {!online ? (
          <View style={[styles.notice, { backgroundColor: colors.warning + "15" }]}>
            <Text style={[styles.noticeText, { color: colors.warning }]}>
              {t("studentDetail.offline")}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.notice, { backgroundColor: colors.error + "15" }]}>
            <Text style={[styles.noticeText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          <SummaryRow
            icon="TrendingUp"
            iconColor={colors.success}
            title={t("studentDetail.adherenceCard")}
            hint={adherenceValue}
          >
            <View style={styles.rowFooter}>
              <Text style={[styles.rowMeta, { color: colors.muted }]}>
                {t("adherence.weekCount", { count: weekCount })}
              </Text>
              <AppButton
                label={t("studentDetail.open")}
                variant="secondary"
                onPress={() => navigate("/coach/adherence/[clientId]")}
              />
            </View>
          </SummaryRow>

          <SummaryRow
            icon="Ruler"
            iconColor={colors.primary}
            title={t("studentDetail.measurementsCard")}
            hint={measurementValue}
          >
            <View style={styles.rowFooter}>
              <Text style={[styles.rowMeta, { color: colors.muted }]}>
                {measurements.length > 0 ? t("measurements.historyTitle") : t("studentDetail.noMeasurements")}
              </Text>
              <AppButton
                label={t("studentDetail.open")}
                variant="secondary"
                onPress={() => navigate("/coach/measurements/[clientId]")}
              />
            </View>
          </SummaryRow>

          <SummaryRow
            icon="ClipboardList"
            iconColor={colors.primary}
            title={t("studentDetail.prescriptionsCard")}
            hint={t("studentDetail.activePrescriptions", { count: prescriptions.length })}
          >
            <View style={styles.rowFooter}>
              <Text numberOfLines={1} style={[styles.rowMeta, { color: colors.muted }]}>
                {prescriptions[0]?.name ?? t("studentDetail.prescriptionsHint")}
              </Text>
              <AppButton
                label={t("studentDetail.prescribe")}
                variant="brand"
                onPress={() => navigate("/prescribe/[clientId]")}
              />
            </View>
          </SummaryRow>

          <SummaryRow
            icon="Utensils"
            iconColor={colors.warning}
            title={t("nutrition.coachTitle")}
            hint={
              nutritionPlan
                ? `${nutritionPlan.trainingDay.calories} / ${nutritionPlan.restDay.calories} kcal`
                : t("nutrition.coachEmpty")
            }
          >
            <View style={styles.rowFooter}>
              <Text numberOfLines={1} style={[styles.rowMeta, { color: colors.muted }]}>
                {nutritionPlan
                  ? `${t("nutrition.trainingDay")} · ${t("nutrition.restDay")}`
                  : t("nutrition.coachEmpty")}
              </Text>
              <AppButton
                label={t("studentDetail.open")}
                variant="secondary"
                onPress={() => navigate("/coach/nutrition/[clientId]")}
              />
            </View>
          </SummaryRow>
        </View>

        <SectionCard title={title} subtitle={t("studentDetail.prescriptionsHint")} delay={120}>
          {prescriptions.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>
              {t("studentDetail.prescriptionsHint")}
            </Text>
          ) : (
            <View style={styles.prescriptionList}>
              {prescriptions.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.prescriptionRow}>
                  <AppIcon name="ClipboardList" size={16} color={colors.primary} />
                  <Text numberOfLines={1} style={[styles.prescriptionName, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.prescriptionMeta, { color: colors.muted }]}>
                    {t("prescription.exercisesCount", { count: item.exercises.length })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        {loading ? (
          <Text style={[styles.empty, { color: colors.muted }]}>{t("studentDetail.loading")}</Text>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  email: {
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
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  rowHint: {
    fontSize: typography.bodySm,
    fontWeight: "600",
  },
  rowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rowMeta: {
    flex: 1,
    fontSize: typography.bodySm,
    fontWeight: "700",
  },
  prescriptionList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  prescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  prescriptionName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  prescriptionMeta: {
    fontSize: typography.bodySm,
    fontWeight: "600",
  },
  empty: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.md,
  },
});
