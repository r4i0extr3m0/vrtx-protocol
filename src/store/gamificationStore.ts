import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { useSyncStore } from "@/src/store/syncStore";
import type { GamificationData } from "@/src/types";
import { createId, toIsoDate } from "@/src/utils";

interface GamificationState {
  streak: number;
  totalXP: number;
  level: number;
  badges: string[];
  lastActivityDate?: string;
  hydrated: boolean;
  addXP: (amount: number) => void;
  checkBadges: (context?: { type: 'workout' | 'diet', data?: any }) => void;
  updateStreak: () => void;
  setHydrated: (value: boolean) => void;
}

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function enqueueGamificationOperation(data: GamificationData): void {
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entity: "gamification",
    type: "update",
    table: "gamification",
    data,
    timestamp: Date.now(),
    retries: 0,
  });
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      streak: 0,
      totalXP: 0,
      level: 1,
      badges: [],
      lastActivityDate: undefined,
      hydrated: false,

      addXP: (amount) => {
        const { totalXP } = get();
        const newXP = totalXP + amount;
        const newLevel = calculateLevel(newXP);
        
        set({ totalXP: newXP, level: newLevel });
        get().updateStreak();
        get().checkBadges();
        
        enqueueGamificationOperation({
          streak: get().streak,
          totalXP: newXP,
          level: newLevel,
          badges: get().badges,
          lastActivityDate: get().lastActivityDate,
        });
      },

      updateStreak: () => {
        const today = toIsoDate(new Date());
        const { lastActivityDate, streak } = get();

        if (lastActivityDate === today) return;

        const yesterday = toIsoDate(new Date(Date.now() - 86400000));
        if (lastActivityDate === yesterday) {
          set({ streak: streak + 1, lastActivityDate: today });
        } else {
          set({ streak: 1, lastActivityDate: today });
        }
      },

      checkBadges: (context) => {
        const { totalXP, streak, badges } = get();
        const newBadges = [...badges];
        let changed = false;

        const check = (id: string) => {
          if (!newBadges.includes(id)) {
            newBadges.push(id);
            changed = true;
          }
        };

        // Badges de XP e Streak
        if (totalXP >= 100) check("xp_100");
        if (totalXP >= 1000) check("xp_1000");
        if (streak >= 7) check("streak_7");
        if (streak >= 30) check("streak_30");

        // Novas Badges da Fase 3
        if (context?.type === 'workout') {
          check("first_set"); // Primeira série
          
          const workoutData = context.data;
          if (workoutData?.totalVolume >= 1000) {
            check("ton_club"); // Volume de 1 tonelada
          }
          
          if (workoutData?.muscleGroups?.some((mg: string) => mg.toLowerCase().includes('perna'))) {
            check("leg_day_warrior");
          }
        }

        if (context?.type === 'diet') {
          if (streak >= 7) {
            check("diet_7_days"); // 7 dias de dieta (considerando streak combinado)
          }
        }

        if (changed) {
          set({ badges: newBadges });
        }
      },

      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "vrtxprotocol-gamification-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
