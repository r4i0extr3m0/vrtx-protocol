import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { SectionCard } from "@/src/components/SectionCard";
import { useAuth, useTheme } from "@/src/hooks";
import { spacing, typography } from "@/src/theme";

export function SettingsScreen() {
  const { colors, scheme } = useTheme();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    Alert.alert("Sessao encerrada", "Os dados locais continuam disponiveis no dispositivo.");
    router.replace("/onboarding");
  };

  return (
    <ScreenContainer className="px-5 py-5">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Ajustes</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Controles essenciais do ambiente local, do tema e da sessão sincronizada.</Text>
        </View>

        <SectionCard title="Perfil" subtitle="Informações disponíveis na sessão atual.">
          <Text style={[styles.body, { color: colors.foreground }]}>Conta: {user?.email ?? "modo local"}</Text>
          <Text style={[styles.body, { color: colors.foreground }]}>Tema ativo: {scheme}</Text>
        </SectionCard>

        <AppButton label="Encerrar sessão" onPress={() => { void handleLogout(); }} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  body: {
    fontSize: typography.body,
    lineHeight: 22,
  },
});
