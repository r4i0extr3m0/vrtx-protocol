import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { AppIcon } from "@/src/components/AppIcon";
import { claimCoachInvite, fetchMyCoach } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { useAuth, useTheme } from "@/src/hooks";
import { useI18n } from "@/src/i18n";
import { radius, spacing, typography } from "@/src/theme";

export function JoinCoachScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<{ coachId?: string; coachName?: string } | null>(null);
  const online = hasSupabaseEnv();

  const refresh = useCallback(async () => {
    if (!online || !user) return;
    setChecking(true);
    const result = await fetchMyCoach();
    setChecking(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.coachId) {
      setLinked({ coachId: result.coachId, coachName: result.coachName });
    }
  }, [online, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isCoach = user?.role === "coach";

  const handleClaim = async () => {
    if (!online) return;
    setLoading(true);
    setError(null);
    const result = await claimCoachInvite(code);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      Alert.alert(t("join.invalidCodeTitle"), result.error);
      return;
    }

    if (result.data) {
      setLinked({ coachId: result.data.coachId, coachName: result.data.coachName });
      setCode("");
      Alert.alert(
        t("join.linkedOkTitle"),
        t("join.linkedOkBody", { coach: result.data.coachName || "" }).trim(),
      );
    }
  };

  if (isCoach) {
    return (
      <ScreenContainer className="px-5">
        <View style={styles.centerCard}>
          <AppIcon name="Users" size={40} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>{t("join.coachOnlyTitle")}</Text>
          <Text style={[styles.bodyText, { color: colors.muted }]}>
            {t("join.coachOnlyBody")}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "18" }]}>
            <AppIcon name="UserPlus" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("join.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {t("join.subtitle")}
          </Text>
        </View>

        {!online ? (
          <View style={[styles.infoCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
            <Text style={[styles.infoText, { color: colors.warning }]}>
              {t("join.offline")}
            </Text>
          </View>
        ) : checking ? (
          <Text style={[styles.infoText, { color: colors.muted, textAlign: "center" }]}>{t("join.checking")}</Text>
        ) : linked?.coachId ? (
          <View style={[styles.linkedCard, { backgroundColor: colors.success + "12", borderColor: colors.success }]}>
            <AppIcon name="Check" size={28} color={colors.success} />
            <Text style={[styles.linkedTitle, { color: colors.foreground }]}>
              {t("join.linkedTitle", { coach: linked.coachName || "" })}
            </Text>
            <Text style={[styles.linkedSub, { color: colors.muted }]}>
              {t("join.linkedSub")}
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              placeholder={t("join.placeholder")}
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.foreground, borderColor: colors.border }]}
              value={code}
              onChangeText={(value) => setCode(value.replace(/[^A-Za-z0-9-]/g, "").toUpperCase())}
            />
            <AppButton
              label={loading ? t("join.actioning") : t("join.action")}
              onPress={handleClaim}
              disabled={!code.trim() || loading}
              loading={loading}
              variant="brand"
            />
            {error ? (
              <Text style={[styles.infoText, { color: colors.error, textAlign: "center" }]}>{error}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  bodyText: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  centerCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  infoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.bodySm,
    fontWeight: "700",
  },
  linkedCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  linkedTitle: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  linkedSub: {
    fontSize: typography.bodySm,
    fontWeight: "600",
    textAlign: "center",
  },
  form: {
    gap: spacing.md,
  },
  input: {
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    textAlign: "center",
    letterSpacing: 1,
  },
});
