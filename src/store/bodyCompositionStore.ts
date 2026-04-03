import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvJsonStorage } from "@/src/infra/mmkv";
import type { BodyCompositionEntry, BodyCompositionSegments } from "@/src/types";
import { createId, toIsoTimestamp } from "@/src/utils";
import { useSyncStore } from "@/src/store/syncStore";

interface BodyCompositionStoreState {
  entries: BodyCompositionEntry[];
  hydrated: boolean;
  addEntry: (data: {
    date: string;
    weightKg?: number;
    bodyFatPercent?: number;
    leanMassKg?: number;
    muscleMassKg?: number;
    segments?: BodyCompositionSegments;
    notes?: string;
  }) => BodyCompositionEntry;
  deleteEntry: (id: string) => void;
  setHydrated: (value: boolean) => void;
}

function enqueueBodyOperation(type: "create" | "delete", entry: BodyCompositionEntry): void {
  // Mantém a filosofia offline-first: enfileira para sincronizar depois.
  // Para produção, criar tabela 'body_composition' no Supabase e integrar ao ApiClient.
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entity: "body_composition",
    type: type === "create" ? "create" : "delete",
    table: "body_composition",
    data: entry as unknown as object,
    timestamp: Date.now(),
    retries: 0,
  });
}

export const useBodyCompositionStore = create<BodyCompositionStoreState>()(
  persist(
    (set, get) => ({
      entries: [],
      hydrated: false,
      addEntry: (data) => {
        const entry: BodyCompositionEntry = {
          id: createId("body"),
          date: data.date,
          weightKg: data.weightKg,
          bodyFatPercent: data.bodyFatPercent,
          leanMassKg: data.leanMassKg,
          muscleMassKg: data.muscleMassKg,
          segments: data.segments,
          notes: data.notes,
          createdAt: toIsoTimestamp(new Date()),
          syncStatus: "pending",
        };

        set((state) => ({
          entries: [entry, ...state.entries].sort((a, b) => b.date.localeCompare(a.date)),
        }));
        enqueueBodyOperation("create", entry);
        return entry;
      },
      deleteEntry: (id) => {
        const target = get().entries.find((e) => e.id === id);
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
        if (target) enqueueBodyOperation("delete", target);
      },
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "vrtxprotocol-body-composition-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
