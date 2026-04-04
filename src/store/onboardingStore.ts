import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";

interface OnboardingState {
  hasSeenOnboarding: boolean;
  hasHydrated: boolean;
  markOnboardingComplete: () => void;
  resetOnboarding: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      hasHydrated: false,
      markOnboardingComplete: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
