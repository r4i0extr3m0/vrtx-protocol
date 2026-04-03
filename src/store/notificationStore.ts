import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";

interface NotificationPreferences {
  trainingReminder: boolean;
  trainingReminderTime: string; // HH:mm
  mealReminder: boolean;
  mealReminderTime: string; // HH:mm
  streakNotification: boolean;
  prNotification: boolean;
}

interface NotificationStoreState {
  preferences: NotificationPreferences;
  setPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set) => ({
      preferences: {
        trainingReminder: false,
        trainingReminderTime: "18:00",
        mealReminder: false,
        mealReminderTime: "12:00",
        streakNotification: true,
        prNotification: true,
      },
      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),
    }),
    {
      name: "vrtxprotocol-notification-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
    }
  )
);
