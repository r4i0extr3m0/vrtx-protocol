import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { useSyncStore } from "@/src/store/syncStore";
import type { GamificationData } from "@/src/types";
import { createId, toIsoDate, toIsoTimestamp } from "@/src/utils";

interface GamificationState {
  streak: number;
  totalXP: number;
  level: number;
  badges: string[];
  lastActivityDate?: string;
  dailyId?: string;
  dailyMissions: NonNullable<GamificationData["dailyMissions"]>;
  weekId?: string;
  league: NonNullable<GamificationData["league"]>;
  hydrated: boolean;
  addXP: (amount: number, meta?: { source?: "workout" | "diet" | "mission" | "other" }) => void;
  recordActivity: (kind: "workout" | "diet" | "water" | "checkin", amount?: number) => void;
  claimMission: (missionId: string) => { ok: boolean; message?: string };
  checkBadges: (context?: { type: 'workout' | 'diet', data?: any }) => void;
  updateStreak: () => void;
  setHydrated: (value: boolean) => void;
}

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getWeekId(date: Date = new Date()): string {
  // Week id simples (UTC): YYYY-Www
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const LEAGUE_ORDER: NonNullable<GamificationData["league"]>["tier"][] = [
  "Bronze",
  "Prata",
  "Ouro",
  "Safira",
  "Rubi",
  "Esmeralda",
  "Diamante",
];

function defaultDailyMissions(): NonNullable<GamificationData["dailyMissions"]> {
  return [
    {
      id: "m_workout_1",
      kind: "workout",
      title: "Sessão concluída",
      description: "Finalize 1 treino hoje.",
      target: 1,
      progress: 0,
      rewardXp: 80,
    },
    {
      id: "m_diet_3",
      kind: "diet",
      title: "Consistência nutricional",
      description: "Registre 3 refeições hoje.",
      target: 3,
      progress: 0,
      rewardXp: 50,
    },
    {
      id: "m_checkin",
      kind: "checkin",
      title: "Check‑in",
      description: "Abra o app e mantenha o ritmo.",
      target: 1,
      progress: 0,
      rewardXp: 20,
    },
  ];
}

function ensureDaily(state: Pick<GamificationState, "dailyId" | "dailyMissions">): Pick<GamificationState, "dailyId" | "dailyMissions"> {
  const today = toIsoDate(new Date());
  if (state.dailyId === today && state.dailyMissions?.length) return state;
  return { dailyId: today, dailyMissions: defaultDailyMissions() };
}

function ensureWeekly(state: Pick<GamificationState, "weekId" | "league">): Pick<GamificationState, "weekId" | "league"> {
  const wid = getWeekId();
  if (state.weekId === wid && state.league) return state;

  // Nova semana: decide promoção/rebaixamento usando a liga anterior (heurística MVP)
  const prev = state.league;
  let tier: NonNullable<GamificationData["league"]>["tier"] = prev?.tier ?? "Bronze";
  const prevRank = prev?.rank ?? 999;

  if (prev) {
    if (prevRank <= prev.promotionCutoff) {
      const idx = LEAGUE_ORDER.indexOf(prev.tier);
      tier = LEAGUE_ORDER[Math.min(LEAGUE_ORDER.length - 1, idx + 1)];
    } else if (prevRank >= prev.demotionCutoff) {
      const idx = LEAGUE_ORDER.indexOf(prev.tier);
      tier = LEAGUE_ORDER[Math.max(0, idx - 1)];
    }
  }

  return {
    weekId: wid,
    league: {
      tier,
      xpThisWeek: 0,
      rank: 1,
      promotionCutoff: 5,
      demotionCutoff: 20,
    },
  };
}

function recomputeLeagueRank(tier: NonNullable<GamificationData["league"]>["tier"], xpThisWeek: number, weekId: string): number {
  // Simula “rivais” (Duolingo-like) de forma determinística (sem backend).
  // Distribuição por tier: quanto maior o tier, maior a base de XP.
  const base = {
    Bronze: 120,
    Prata: 220,
    Ouro: 380,
    Safira: 520,
    Rubi: 700,
    Esmeralda: 900,
    Diamante: 1200,
  }[tier];

  // PRNG simples (seed pelo weekId)
  let seed = 0;
  for (let i = 0; i < weekId.length; i++) seed = (seed * 31 + weekId.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };

  const rivals = 25;
  let higher = 0;
  for (let i = 0; i < rivals; i++) {
    const jitter = (rand() - 0.5) * base * 0.9;
    const rivalXp = Math.max(0, Math.round(base + jitter));
    if (rivalXp > xpThisWeek) higher++;
  }
  return higher + 1;
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
      dailyId: undefined,
      dailyMissions: defaultDailyMissions(),
      weekId: undefined,
      league: {
        tier: "Bronze",
        xpThisWeek: 0,
        rank: 1,
        promotionCutoff: 5,
        demotionCutoff: 20,
      },
      hydrated: false,

      addXP: (amount, meta) => {
        // garante estruturas diárias/semanais
        const daily = ensureDaily({ dailyId: get().dailyId, dailyMissions: get().dailyMissions });
        const weekly = ensureWeekly({ weekId: get().weekId, league: get().league });
        if (daily.dailyId !== get().dailyId || weekly.weekId !== get().weekId) {
          set({ ...daily, ...weekly } as Partial<GamificationState>);
        }

        const { totalXP } = get();
        const newXP = totalXP + amount;
        const newLevel = calculateLevel(newXP);

        const league = get().league;
        const nextXpThisWeek = (league?.xpThisWeek ?? 0) + amount;
        const wid = get().weekId ?? getWeekId();
        const tier = league?.tier ?? "Bronze";
        const rank = recomputeLeagueRank(tier, nextXpThisWeek, wid);

        set({
          totalXP: newXP,
          level: newLevel,
          league: { ...league, xpThisWeek: nextXpThisWeek, rank },
        });
        get().updateStreak();
        get().checkBadges();
        
        enqueueGamificationOperation({
          streak: get().streak,
          totalXP: newXP,
          level: newLevel,
          badges: get().badges,
          lastActivityDate: get().lastActivityDate,
          dailyId: get().dailyId,
          dailyMissions: get().dailyMissions,
          weekId: get().weekId,
          league: get().league,
        });
      },

      recordActivity: (kind, amount = 1) => {
        // Check-in: no máximo 1x por dia (evita farm de XP)
        if (kind === "checkin") {
          const existing = (get().dailyMissions || []).find((m) => m.kind === "checkin");
          if (existing && existing.progress >= existing.target) return;
        }

        // Atualiza missões do dia
        const { dailyId, dailyMissions } = ensureDaily({ dailyId: get().dailyId, dailyMissions: get().dailyMissions });
        if (dailyId !== get().dailyId) {
          set({ dailyId, dailyMissions });
        }

        const nowIso = toIsoTimestamp(new Date());
        const updated = get().dailyMissions.map((m) => {
          if (m.kind !== kind) return m;
          const nextProgress = Math.min(m.target, m.progress + amount);
          const completedAt = nextProgress >= m.target ? (m.completedAt ?? nowIso) : undefined;
          return { ...m, progress: nextProgress, completedAt };
        });
        set({ dailyMissions: updated });

        // XP base por atividade (Duolingo-like, mas fitness)
        if (kind === "workout") get().addXP(120, { source: "workout" });
        if (kind === "diet") get().addXP(20, { source: "diet" });
        if (kind === "water") get().addXP(10, { source: "diet" });
        if (kind === "checkin") get().addXP(5, { source: "other" });
      },

      claimMission: (missionId) => {
        const { dailyMissions } = ensureDaily({ dailyId: get().dailyId, dailyMissions: get().dailyMissions });
        const mission = dailyMissions.find((m) => m.id === missionId);
        if (!mission) return { ok: false, message: "Missão não encontrada." };
        if (mission.claimedAt) return { ok: false, message: "Recompensa já coletada." };
        if (mission.progress < mission.target) return { ok: false, message: "Complete a missão para coletar." };

        const nowIso = toIsoTimestamp(new Date());
        set({
          dailyMissions: dailyMissions.map((m) => (m.id === missionId ? { ...m, claimedAt: nowIso } : m)),
        });

        get().addXP(mission.rewardXp, { source: "mission" });
        return { ok: true };
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
