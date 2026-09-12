import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { BiometricAuth } from "@/src/components/BiometricAuth";
import { AppIcon, IconName } from "@/src/components/AppIcon";
import { ThemeSelector } from "@/src/components/ThemeSelector";
import { useAuth, useTabBarInset, useTheme, useWorkout } from "@/src/hooks";
import { useI18n } from "@/src/i18n";
import { exportToJSON } from "@/src/utils/exportData";
import { useSettingsStore } from "@/src/store/settingsStore";
import { usePremiumStore } from "@/src/store/premiumStore";
import { useGamificationStore } from "@/src/store/gamificationStore";
import { radius, spacing, shadows } from "@/src/theme";

export function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { workouts } = useWorkout();
  const { contentPaddingBottom, scrollIndicatorBottom } = useTabBarInset();
  const { streak, totalXP } = useGamificationStore();
  const { isPremium, subscriptionType } = usePremiumStore();
  const { theme,
    setTheme,
    units,
    setUnits,
    hapticFeedbackEnabled,
    setHapticFeedbackEnabled,
  } = useSettingsStore();

  const isCoach = user?.role === "coach";
  const { t } = useI18n();

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/onboarding");
        },
      },
    ]);
  };

  const stats = [
    { label: "Treinos", value: workouts.length, icon: "Dumbbell" as IconName, color: colors.primary },
    { label: "Streak", value: streak, icon: "Flame" as IconName, color: colors.warning },
    { label: "Total XP", value: totalXP, icon: "Star" as IconName, color: colors.info },
  ];

  return (
    <ScreenContainer className="px-5">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ bottom: scrollIndicatorBottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={colors.brandGradient}
              style={[styles.avatarGradient, shadows.card]}
            >
              <Text style={styles.avatarText}>{user?.email?.[0].toUpperCase() || "U"}</Text>
            </LinearGradient>
            <View style={[styles.onlineBadge, { backgroundColor: colors.success, borderColor: colors.background }]} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: colors.foreground }]}>{user?.email?.split('@')[0] || "Usuário"}</Text>
            {isCoach ? (
              <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
                <AppIcon name="Users" size={12} color={colors.primary} strokeWidth={3} />
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{t("profile.roleCoach")}</Text>
              </View>
            ) : null}
            <Pressable onPress={() => router.push("/premium")}>
              <View style={styles.premiumBadge}>
                 <AppIcon name="Zap" size={12} color={isPremium ? colors.primary : colors.muted} strokeWidth={3} />
                 <Text style={[styles.subtitle, { color: isPremium ? colors.primary : colors.muted }]}>
                    {isPremium ? `Membro ${subscriptionType.toUpperCase()}` : "Plano Free"}
                 </Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <Animated.View 
              key={stat.label}
              entering={FadeInDown.delay(index * 90).duration(450)}
              style={[styles.statItem, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}
            >
              <View style={[styles.statIconWrapper, { backgroundColor: stat.color + '15' }]}>
                <AppIcon name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        <SectionCard title="Personalização" subtitle="Deixe o VRTX Protocol com a sua cara." delay={300}>
          <ThemeSelector />
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Tema Escuro</Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>Otimizado para telas OLED</Text>
            </View>
            <Switch
              onValueChange={(v) => setTheme(v ? "dark" : "light")}
              value={theme === "dark"}
              trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </SectionCard>

        <SectionCard title="Preferências" subtitle="Ajustes técnicos e de interface." delay={400}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Unidades de Medida</Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>Peso e medidas corporais</Text>
            </View>
            <View style={[styles.unitToggle, { backgroundColor: colors.surfaceAlt }]}>
              <Pressable
                onPress={() => setUnits("kg")}
                style={[styles.unitBtn, units === "kg" && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.unitText, { color: units === "kg" ? "#000" : colors.muted }]}>KG</Text>
              </Pressable>
              <Pressable
                onPress={() => setUnits("lb")}
                style={[styles.unitBtn, units === "lb" && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.unitText, { color: units === "lb" ? "#000" : colors.muted }]}>LB</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Feedback Tátil</Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>Resposta física ao interagir</Text>
            </View>
            <Switch
              onValueChange={setHapticFeedbackEnabled}
              value={hapticFeedbackEnabled}
              trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </SectionCard>

        <SectionCard title="Conta e Dados" subtitle="Gerenciamento e segurança." delay={500}>
          <BiometricAuth />
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {isCoach ? (
              <AppButton
                label={t("profile.studentsCta")}
                onPress={() => router.push("/students" as never)}
                variant="brand"
              />
            ) : (
              <>
                <AppButton
                  label={t("profile.joinCoachCta")}
                  onPress={() => router.push("/join-coach" as never)}
                  variant="secondary"
                />
                <AppButton
                  label={t("measurements.title")}
                  onPress={() => router.push("/measurements" as never)}
                  variant="secondary"
                />
              </>
            )}
            <AppButton
              label="Bioimpedância e Corpo"
              onPress={() => router.push("/body-composition" as never)}
              variant="secondary"
            />
            <AppButton 
              label="Exportar Dados (JSON)" 
              onPress={() => exportToJSON(workouts, `vrtxprotocol_backup`)} 
              variant="secondary" 
            />
            <AppButton 
              label="Sair da Conta" 
              onPress={handleLogout} 
              variant="secondary" 
            />
          </View>
          <AppButton 
            label="Apagar Conta" 
            onPress={() => router.push("/delete-account" as never)} 
            variant="ghost" 
            style={{ marginTop: spacing.md }}
          />
        </SectionCard>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.muted }]}>VRTX Protocol v2.1.0 Premium</Text>
          <Text style={[styles.copyright, { color: colors.muted }]}>© 2026 VRTX Protocol Team</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarGradient: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#000",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 4,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  settingDesc: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: spacing.md,
    opacity: 0.5,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: radius.xl,
    padding: 4,
    width: 110,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  unitText: {
    fontSize: 13,
    fontWeight: "900",
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.xl,
    gap: 4,
  },
  version: {
    fontSize: 12,
    fontWeight: "800",
  },
  copyright: {
    fontSize: 10,
    fontWeight: "600",
  },
});
