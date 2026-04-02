import React, { useState } from "react";
import { View, Text, Switch, StyleSheet, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useTheme } from "@/src/hooks";
import { spacing, typography, radius } from "@/src/theme";
import { useNotificationStore } from "@/src/store/notificationStore";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const { preferences, setPreference } = useNotificationStore();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'trainingReminderTime' | 'mealReminderTime' | null>(null);

  const requestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert(
        "Permissão Negada",
        "Para receber notificações, por favor, habilite as permissões nas configurações do seu dispositivo."
      );
      return false;
    }
    return true;
  };

  const scheduleTrainingReminder = async (time: string) => {
    console.log('[Notifications] Training reminder scheduled for', time);
  };

  const scheduleMealReminder = async (time: string) => {
    console.log('[Notifications] Meal reminder scheduled for', time);
  };

  const handleToggle = async (key: keyof typeof preferences) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !preferences[key];
    setPreference(key, newValue);

    if (key === 'trainingReminder') {
      if (newValue) {
        const granted = await requestPermissions();
        if (granted) {
          await scheduleTrainingReminder(preferences.trainingReminderTime);
        } else {
          setPreference(key, false); // Reverter se a permissão não for concedida
        }
      } else {
        await Notifications.cancelScheduledNotificationAsync('trainingReminder');
      }
    } else if (key === 'mealReminder') {
      if (newValue) {
        const granted = await requestPermissions();
        if (granted) {
          await scheduleMealReminder(preferences.mealReminderTime);
        } else {
          setPreference(key, false); // Reverter se a permissão não for concedida
        }
      } else {
        await Notifications.cancelScheduledNotificationAsync('mealReminder');
      }
    }
    // TODO: Implementar lógica para streak e PR notifications (serão acionadas por eventos, não agendamento fixo)
  };

  const showTimePickerModal = (mode: 'trainingReminderTime' | 'mealReminderTime') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Horário', `Horário de ${mode === 'trainingReminderTime' ? 'treino' : 'refeição'} definido como ${preferences[mode]}`);
  };

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.header, { color: colors.foreground }]}>Configurações de Notificações</Text>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Lembretes</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Lembrete de Treino</Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>Receba um lembrete para treinar.</Text>
            </View>
            <Switch
              onValueChange={() => handleToggle("trainingReminder")}
              value={preferences.trainingReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {preferences.trainingReminder && (
            <View style={styles.timePickerRow}>
              <Text style={[styles.timeLabel, { color: colors.muted }]}>Horário:</Text>
              <Pressable 
                onPress={() => showTimePickerModal('trainingReminderTime')}
                style={[styles.timeButton, { borderColor: colors.border }]} 
              >
                <Text style={[styles.timeButtonText, { color: colors.foreground }]}>{preferences.trainingReminderTime}</Text>
                <Ionicons name="time-outline" size={20} color={colors.muted} />
              </Pressable>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Lembrete de Refeição</Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>Não se esqueça de suas refeições.</Text>
            </View>
            <Switch
              onValueChange={() => handleToggle("mealReminder")}
              value={preferences.mealReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {preferences.mealReminder && (
            <View style={styles.timePickerRow}>
              <Text style={[styles.timeLabel, { color: colors.muted }]}>Horário:</Text>
              <Pressable 
                onPress={() => showTimePickerModal('mealReminderTime')}
                style={[styles.timeButton, { borderColor: colors.border }]} 
              >
                <Text style={[styles.timeButtonText, { color: colors.foreground }]}>{preferences.mealReminderTime}</Text>
                <Ionicons name="time-outline" size={20} color={colors.muted} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Alertas</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Notificação de Streak</Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>Mantenha sua sequência de treinos.</Text>
            </View>
            <Switch
              onValueChange={() => handleToggle("streakNotification")}
              value={preferences.streakNotification}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Alerta de Novo Recorde Pessoal (PR)</Text>
              <Text style={[styles.settingDesc, { color: colors.muted }]}>Celebre suas conquistas!</Text>
            </View>
            <Switch
              onValueChange={() => handleToggle("prNotification")}
              value={preferences.prNotification}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    fontSize: typography.section,
    fontWeight: "800",
    marginBottom: spacing.lg,
  },
  section: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.body,
    fontWeight: "600",
  },
  settingDesc: {
    fontSize: typography.caption,
    color: "#888",
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: "100%",
    opacity: 0.1,
    marginVertical: spacing.sm,
  },
  timePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  timeLabel: {
    fontSize: typography.body,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  timeButtonText: {
    fontSize: typography.body,
    fontWeight: "600",
  },
});
