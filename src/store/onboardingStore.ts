import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";

interface OnboardingState {
  hasSeenOnboarding: boolean;
  markOnboardingComplete: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      markOnboardingComplete: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
    }
  )
);
