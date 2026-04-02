import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

export const HapticFeedback = {
  light: () => {
    if (Platform.OS === 'web') return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (Platform.OS === 'web') return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    if (Platform.OS === 'web') return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    if (Platform.OS === 'web') return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    if (Platform.OS === 'web') return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    if (Platform.OS === 'web') return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  selection: () => {
    if (Platform.OS === 'web') return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.selectionAsync();
  },
};
