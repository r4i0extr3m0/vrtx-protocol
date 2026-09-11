import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon } from "@/src/components/AppIcon";
import { SectionCard } from "@/src/components/SectionCard";
import {
  createCoachInvite,
  listCoachClients,
  removeCoachClient,
} from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { getCoachPlanMeta } from "@/src/coach/plans";
import { useAuth, useTabBarInset, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import type { CoachClientListItem } from "@/src/types";

function StatusPill({ status, colors }: { status: CoachClientListItem["status"]; colors: any }) {
  const { t } = useI18n();
  const isPending = status === "pending";
  const isActive = status === "active";
  const bg = isActive ? colors.success + "18" : isPending ? colors.warning + "18" : colors.muted + "18";
  const fg = isActive ? colors.success : isPending ? colors.warning : colors.muted;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>
        {isActive ? t("coach.active") : t("coach.pending")}
      </Text>
    </View>
  );
}

export function CoachStudentsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();
  const [clients, setClients] = useState<CoachClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const planMeta = getCoachPlanMeta(user?.coachPlan);
  const planId = user?.coachPlan ?? "free";
  const { t } = useI18n();
  const activeCount = clients.filter((client) => client.status === "active").length;
  const online = hasSupabaseEnv();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listCoachClients();
    if (result.error) {
      setError(result.error);
    } else {
      setClients(result.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (online) {
      void reload();
    } else {
      setLoading(false);
    }
  }, [online, reload]);

  const handleCreateInvite = async () => {
    if (!online || creating) return;
    setCreating(true);
    setError(null);
    const result = await createCoachInvite();
    setCreating(false);

    if (result.error) {
      Alert.alert(t("coach.inviteFailTitle"), result.error);
      return;
    }

    if (result.code) {
      setPendingCode(result.code);
    }
    void reload();
  };

  const handleShareCode = (code: string) => {
    void Share.share({
      message: t("coach.shareInviteBody", { code }),
    });
  };

  const handleRemove = (item: CoachClientListItem) => {
    if (!item.clientId) return;
    Alert.alert(
      t("coach.removeTitle"),
      t("coach.removeBody", { name: item.name || t("coach.student") }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("coach.remove"),
          style: "destructive",
          onPress: async () => {
            const result = await removeCoachClient(item.clientId as string);
            if (result.error) {
              Alert.alert(t("coach.removeFailTitle"), result.error);
              return;
            }
            void reload();
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: CoachClientListItem }) => {
    const isPending = item.status === "pending";
    const title = item.name || (isPending ? t("coach.awaitingStudent") : t("coach.student"));

    return (
      <View style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
          <AppIcon name={isPending ? "Clock" : "User"} size={18} color={isPending ? colors.warning : colors.primary} />
        </View>
        <View style={styles.studentInfo}>
          <Text numberOfLines={1} style={[styles.studentName, { color: colors.foreground }]}>
            {title}
          </Text>
          {!isPending ? (
            <Text numberOfLines={1} style={[styles.studentEmail, { color: colors.muted }]}>
              {item.email}
            </Text>
          ) : (
            <Pressable onPress={() => handleShareCode(item.inviteCode)}>
              <Text style={[styles.inviteCode, { color: colors.primary }]}>
                {t("coach.codeTap", { code: item.inviteCode })}
              </Text>
            </Pressable>
          )}
        </View>
        <View style={styles.studentActions}>
          <StatusPill status={item.status} colors={colors} />
          {!isPending ? (
            <View style={styles.rowIcons}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/prescribe/[clientId]",
                    params: { clientId: item.clientId as string, clientName: item.name },
                  } as never)
                }
                style={styles.iconButton}
                hitSlop={10}
              >
                <AppIcon name="ClipboardList" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => handleRemove(item)} style={styles.iconButton} hitSlop={10}>
                <AppIcon name="Trash2" size={18} color={colors.muted} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="px-5">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t("coach.myStudents")}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {online ? t("coach.subtitleOnline") : t("coach.subtitleOffline")}
        </Text>
      </View>

      <SectionCard
        title={t("coach.planOf", { plan: t(`coach.plans.${planId}`) })}
        subtitle={t("coach.seats", {
          used: activeCount,
          cap: planMeta.cap,
          price: planMeta.price,
        })}
        delay={100}
      >
        <View style={[styles.planBar, { backgroundColor: colors.surfaceAlt }]}>
          <View
            style={[
              styles.planBarFill,
              {
                backgroundColor: activeCount >= planMeta.cap ? colors.warning : colors.primary,
                width: `${Math.min(100, (activeCount / Math.max(1, planMeta.cap)) * 100)}%`,
              },
            ]}
          />
        </View>
        <AppButton
          label={creating ? t("coach.generating") : t("coach.newStudent")}
          onPress={handleCreateInvite}
          disabled={!online || creating || activeCount >= planMeta.cap}
          loading={creating}
          variant="brand"
          style={{ marginTop: spacing.md }}
        />
        {pendingCode ? (
          <View style={[styles.codeCard, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.codeLabel, { color: colors.muted }]}>{t("coach.codeLabel")}</Text>
            <Text style={[styles.codeValue, { color: colors.foreground }]}>{pendingCode}</Text>
            <View style={styles.codeActions}>
              <AppButton label={t("coach.share")} onPress={() => handleShareCode(pendingCode)} variant="secondary" />
              <AppButton label={t("coach.close")} onPress={() => setPendingCode(null)} variant="ghost" />
            </View>
          </View>
        ) : null}
      </SectionCard>

      {error ? (
        <View style={[styles.errorCard, { backgroundColor: colors.error + "15" }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={clients}
        keyExtractor={(item) => item.linkId}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: contentPaddingBottom + spacing.xxl },
        ]}
        scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>{t("coach.emptyLoading")}</Text>
          ) : (
            <Text style={[styles.emptyText, { color: colors.muted }]}>{t("coach.empty")}</Text>
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
    gap: 4,
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
  planBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  planBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  codeCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  codeLabel: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },
  codeActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    width: "100%",
  },
  listContent: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  list: {
    flex: 1,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  studentEmail: {
    fontSize: typography.bodySm,
    fontWeight: "600",
  },
  inviteCode: {
    fontSize: typography.bodySm,
    fontWeight: "800",
  },
  studentActions: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  rowIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconButton: {
    padding: 4,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  errorCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: typography.bodySm,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
