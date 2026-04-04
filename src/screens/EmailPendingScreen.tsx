import React, { useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { useTheme } from "@/src/hooks";
import { useAuthStore } from "@/src/store/authStore";
import { spacing, typography } from "@/src/theme";

export function EmailPendingScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";

  const resendConfirmation = useAuthStore((s) => s.resendConfirmation);
  const [loading, setLoading] = useState(false);

  const handleOpenMail = async () => {
    try {
      await Linking.openURL("mailto:");
    } catch {
      Alert.alert("E-mail", "Não foi possível abrir seu app de e-mail automaticamente.");
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("E-mail", "Informe o e-mail usado no cadastro.");
      return;
    }
    setLoading(true);
    const res = await resendConfirmation(email);
    setLoading(false);
    if (!res.success) {
      Alert.alert("Reenviar", res.message ?? "Não foi possível reenviar agora.");
      return;
    }
    Alert.alert("Enviado", "Reenviamos o e-mail de confirmação. Verifique sua caixa de entrada e spam.");
  };

  return (
    <ScreenContainer className="px-6 py-8">
      <View style={styles.hero}>
        <Text style={[styles.kicker, { color: colors.primary }]}>Quase lá</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Confirme seu e-mail</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Enviamos um link de confirmação para {email || "o seu e-mail"}. Assim que confirmar, volte para iniciar sessão.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton label="Abrir e-mail" onPress={handleOpenMail} />
        <AppButton
          label={loading ? "Reenviando..." : "Reenviar confirmação"}
          onPress={() => void handleResend()}
          variant="secondary"
          disabled={loading}
        />
        <AppButton label="Voltar ao login" onPress={() => router.replace("/login")} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  kicker: {
    fontSize: typography.caption,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: typography.hero,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: typography.body,
    fontWeight: "600",
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
  },
});

