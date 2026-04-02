import { useEffect, useMemo } from "react";

import { useSyncStore } from "@/src/store/syncStore";

export function useSync() {
  const queue = useSyncStore((state) => state.queue);
  const isProcessing = useSyncStore((state) => state.isProcessing);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const lastError = useSyncStore((state) => state.lastError);
  const networkReachable = useSyncStore((state) => state.networkReachable);
  const processPending = useSyncStore((state) => state.processPending);
  const refreshReachability = useSyncStore((state) => state.refreshReachability);

  useEffect(() => {
    void refreshReachability();
  }, [refreshReachability]);

  return useMemo(
    () => ({
      queue,
      pendingCount: queue.length,
      isProcessing,
      lastSyncedAt,
      lastError,
      networkReachable,
      processPending,
      refreshReachability,
    }),
    [isProcessing, lastError, lastSyncedAt, networkReachable, processPending, queue, refreshReachability],
  );
}
