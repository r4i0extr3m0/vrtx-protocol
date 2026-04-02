import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";

export type ThemeMode = "light" | "dark" | "amoled" | "auto";
export type ThemeScheme = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  scheme: ThemeScheme;
  setMode: (mode: ThemeMode) => void;
  setScheme: (scheme: ThemeScheme) => void;
  getEffectiveMode: () => ThemeMode;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "auto",
      scheme: "dark",
      setMode: (mode: ThemeMode) => set({ mode }),
      setScheme: (scheme: ThemeScheme) => set({ scheme }),
      getEffectiveMode: () => {
        const { mode, scheme } = get();
        if (mode === "auto") {
          return scheme === "dark" ? "dark" : "light";
        }
        return mode;
      },
    }),
    {
      name: "theme-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
    }
  )
);
