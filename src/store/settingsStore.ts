import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";

export type ThemeMode = "light" | "dark" | "system";
export type UnitSystem = "kg" | "lb";
export type AccentColor = "blue" | "purple" | "orange" | "green" | "pink";

interface SettingsState {
  theme: ThemeMode;
  accentColor: AccentColor;
  units: UnitSystem;
  restTimerDefault: number; // em segundos
  notificationsEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  hydrated: boolean;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setUnits: (units: UnitSystem) => void;
  setRestTimerDefault: (seconds: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setHapticFeedbackEnabled: (enabled: boolean) => void;
  setHydrated: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      accentColor: "blue",
      units: "kg",
      restTimerDefault: 60,
      notificationsEnabled: true,
      hapticFeedbackEnabled: true,
      hydrated: false,
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setUnits: (units) => set({ units }),
      setRestTimerDefault: (restTimerDefault) => set({ restTimerDefault }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setHapticFeedbackEnabled: (hapticFeedbackEnabled) => set({ hapticFeedbackEnabled }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "ironlog-settings-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
