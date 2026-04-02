import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useAuth, useTheme } from "@/src/hooks";
import { spacing, typography, radius } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export function BiometricAuth() {
  const { colors } = useTheme();
  const { user, enableBiometrics } = useAuth();

  const handleBiometricAuth = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    enableBiometrics(true);
    Alert.alert("Sucesso", "Biometria ativada com sucesso!");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.info}>
        <Ionicons name="finger-print" size={24} color={colors.primary} />
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Biometria</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {user?.biometricsEnabled ? "Ativada" : "Desativada"}
          </Text>
        </View>
      </View>
      
      <Pressable
        onPress={handleBiometricAuth}
        style={[
          styles.button,
          { 
            backgroundColor: user?.biometricsEnabled ? colors.error + "20" : colors.primary + "20",
            borderColor: user?.biometricsEnabled ? colors.error : colors.primary
          }
        ]}
      >
        <Text style={[styles.buttonText, { color: user?.biometricsEnabled ? colors.error : colors.primary }]}>
          {user?.biometricsEnabled ? "Desativar" : "Ativar"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginVertical: spacing.md,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: typography.caption,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
});
