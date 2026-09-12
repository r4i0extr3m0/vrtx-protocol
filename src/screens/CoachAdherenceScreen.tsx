import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppIcon } from "@/src/components/AppIcon";
import { SectionCard } from "@/src/components/SectionCard";
import { listCoachCheckins } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useI18n } from "@/src/i18n";
import { useTabBarInset, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import { formatVolume } from "@/src/utils";
import type { CoachCheckin } from "@/src/types";

function formatDay(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

function daysAgo(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = now.getTime() - target.getTime();
  return Math.max(0, Math.round(diff / (24 * 60 * 60 * 1000)));
}

export function CoachAdherenceScreen() {
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string }>();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const clientName = typeof params.clientName === "string" ? params.clientName : "";
  const { colors } = useTheme();
  const { t } = useI18n();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();

  const [checkins, setCheckins] = useState<CoachCheckin[]>([]);
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
    const result = await listCoachCheckins(clientId);
    if (result.error) {
      setError(result.error);
    } else {
      setCheckins(result.data ?? []);
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

  const weekStats = useMemo(() => {
    const windowStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return checkins.reduce(
      (acc, item) => {
        const timestamp = new Date(`${item.happenedOn}T00:00:00`).getTime();
        if (Number.isFinite(timestamp) && timestamp >= windowStart) {
          acc.count += 1;
          acc.volume += item.totalVolume;
        }
        return acc;
      },
      { count: 0, volume: 0 },
    );
  }, [checkins]);

  const renderCheckin = (item: CoachCheckin) => {
    const days = daysAgo(item.happenedOn);
    const relative =
      days === 0
        ? t("adherence.lastToday")
        : days === 1
          ? t("adherence.lastYesterday")
          : t("adherence.lastDaysAgo", { days });

    return (
      <View
        key={item.id}
        style={[styles.checkinCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.checkinIcon, { backgroundColor: colors.success + "18" }]}>
          <AppIcon name="Check" size={18} color={colors.success} />
        </View>
        <View style={styles.checkinBody}>
          <View style={styles.checkinTop}>
            <Text numberOfLines={1} style={[styles.checkinName, { color: colors.foreground }]}>
              {item.workoutName}
            </Text>
            <Text style={[styles.checkinDate, { color: colors.muted }]}>{formatDay(item.happenedOn)}</Text>
          </View>
          <Text style={[styles.checkinMeta, { color: colors.muted }]}>
            {relative} · {t("adherence.exercises", { count: item.exerciseCount })} ·{" "}
            {t("adherence.sets", { count: item.setCount })}
          </Text>
          {item.totalVolume > 0 ? (
            <Text style={[styles.checkinVolume, { color: colors.primary }]}>
              {formatVolume(item.totalVolume)}
            </Text>
          ) : null}
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
          <Text style={[styles.title, { color: colors.foreground }]}>{t("adherence.detailTitle")}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {t("adherence.detailSubtitle", { client: title })}
          </Text>
        </View>

        {!online ? (
          <View style={[styles.notice, { backgroundColor: colors.warning + "15" }]}>
            <Text style={[styles.noticeText, { color: colors.warning }]}>
              {t("adherence.offline")}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.notice, { backgroundColor: colors.error + "15" }]}>
            <Text style={[styles.noticeText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <SectionCard
          title={t("adherence.weekSummary")}
          subtitle={t("adherence.weekCount", { count: weekStats.count })}
          delay={80}
        >
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{weekStats.count}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                {t("adherence.statSessions")}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {formatVolume(weekStats.volume)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                {t("adherence.statVolume")}
              </Text>
            </View>
          </View>
        </SectionCard>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t("adherence.sessionsTitle")}
        </Text>

        {loading ? (
          <Text style={[styles.empty, { color: colors.muted }]}>{t("adherence.loading")}</Text>
        ) : checkins.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>{t("adherence.empty")}</Text>
        ) : (
          <View style={styles.list}>{checkins.map(renderCheckin)}</View>
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  checkinCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  checkinIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  checkinBody: {
    flex: 1,
    gap: 2,
  },
  checkinTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  checkinName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  checkinDate: {
    fontSize: typography.bodySm,
    fontWeight: "700",
  },
  checkinMeta: {
    fontSize: typography.bodySm,
    fontWeight: "600",
  },
  checkinVolume: {
    fontSize: typography.bodySm,
    fontWeight: "800",
    marginTop: 2,
  },
  empty: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
