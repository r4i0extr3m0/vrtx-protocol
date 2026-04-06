import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

const supportsHaptics = Platform.OS === 'ios' || Platform.OS === 'android';

export const HapticFeedback = {
  light: () => {
    if (!supportsHaptics) return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (!supportsHaptics) return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    if (!supportsHaptics) return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    if (!supportsHaptics) return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    if (!supportsHaptics) return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    if (!supportsHaptics) return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  selection: () => {
    if (!supportsHaptics) return;
    if (!useSettingsStore.getState().hapticFeedbackEnabled) return;
    Haptics.selectionAsync();
  },
};
