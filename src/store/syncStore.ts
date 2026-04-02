import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getSyncQueueService } from "@/src/infra/SyncQueueService";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { isInternetReachable } from "@/src/infra/network";
import type { SyncQueueOperation } from "@/src/types";

interface SyncStoreState {
  queue: SyncQueueOperation[];
  lastSyncedAt: string | null;
  isProcessing: boolean;
  lastError: string | null;
  networkReachable: boolean;
  enqueue: (operation: SyncQueueOperation) => void;
  processPending: () => Promise<void>;
  refreshReachability: () => Promise<void>;
  markFailure: (message: string | null) => void;
}

export const useSyncStore = create<SyncStoreState>()(
  persist(
    (set, get) => ({
      queue: [],
      lastSyncedAt: null,
      isProcessing: false,
      lastError: null,
      networkReachable: false,
      enqueue: (operation) => {
        const syncQueueService = getSyncQueueService();
        syncQueueService.enqueue(operation);
        set({ queue: syncQueueService.getQueue() });
      },
      processPending: async () => {
        set({ isProcessing: true, lastError: null });
        try {
          const syncQueueService = getSyncQueueService();
          await syncQueueService.processQueue();
          set({
            queue: syncQueueService.getQueue(),
            isProcessing: false,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Falha ao sincronizar a fila.";
          set({ isProcessing: false, lastError: message, queue: get().queue });
        }
      },
      refreshReachability: async () => {
        const reachable = await isInternetReachable();
        set({ networkReachable: reachable });
      },
      markFailure: (message) => {
        set({ lastError: message });
      },
    }),
    {
      name: "ironlog-sync-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      partialize: (state) => ({
        queue: state.queue,
        lastSyncedAt: state.lastSyncedAt,
        lastError: state.lastError,
        networkReachable: state.networkReachable,
      }),
    },
  ),
);
