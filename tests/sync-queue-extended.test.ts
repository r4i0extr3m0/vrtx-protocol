import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSyncOperationFixture, createWorkoutFixture } from "../src/test-utils";

describe("SyncQueueService (extended)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deduplicates consecutive update operations on the same entity", async () => {
    const storageMock = { getString: vi.fn().mockReturnValue(null), set: vi.fn() };
    const insertOne = vi.fn().mockResolvedValue({ error: null });
    const updateOne = vi.fn().mockResolvedValue({ error: null });
    const deleteOne = vi.fn().mockResolvedValue({ error: null });
    const isInternetReachable = vi.fn().mockResolvedValue(true);
    const subscribeToNetworkState = vi.fn().mockReturnValue(() => {});

    vi.doMock("@/src/infra/mmkv", () => ({ storage: storageMock }));
    vi.doMock("@/src/api/ApiClient", () => ({ apiClient: { insertOne, updateOne, deleteOne } }));
    vi.doMock("@/src/infra/network", () => ({ isInternetReachable, subscribeToNetworkState }));

    const { SyncQueueService } = await import("../src/infra/SyncQueueService");
    const service = new SyncQueueService();

    const workout = createWorkoutFixture({ id: "w-dedup" });
    const op1 = createSyncOperationFixture({ id: "sync-1", type: "update", data: { ...workout, name: "Treino A" } });
    const op2 = createSyncOperationFixture({ id: "sync-2", type: "update", data: { ...workout, name: "Treino B" } });

    service.enqueue(op1);
    service.enqueue(op2);

    // After deduplication, only one update should remain
    const queue = service.getQueue();
    expect(queue).toHaveLength(1);
    // The merged data should have the latest name
    expect((queue[0].data as typeof workout).name).toBe("Treino B");
  });

  it("processes create operations successfully", async () => {
    const storageMock = { getString: vi.fn().mockReturnValue(null), set: vi.fn() };
    const insertOne = vi.fn().mockResolvedValue({ error: null });
    const updateOne = vi.fn().mockResolvedValue({ error: null });
    const deleteOne = vi.fn().mockResolvedValue({ error: null });
    const isInternetReachable = vi.fn().mockResolvedValue(true);
    const subscribeToNetworkState = vi.fn().mockReturnValue(() => {});

    vi.doMock("@/src/infra/mmkv", () => ({ storage: storageMock }));
    vi.doMock("@/src/api/ApiClient", () => ({ apiClient: { insertOne, updateOne, deleteOne } }));
    vi.doMock("@/src/infra/network", () => ({ isInternetReachable, subscribeToNetworkState }));

    const { SyncQueueService } = await import("../src/infra/SyncQueueService");
    const service = new SyncQueueService();
    const op = createSyncOperationFixture({ type: "create" });

    service.enqueue(op);
    await vi.runAllTimersAsync();
    await service.processQueue();

    expect(insertOne).toHaveBeenCalledTimes(1);
    expect(service.getQueue()).toHaveLength(0);
  });

  it("leaves queue intact when offline", async () => {
    const storageMock = { getString: vi.fn().mockReturnValue(null), set: vi.fn() };
    const insertOne = vi.fn();
    const updateOne = vi.fn();
    const deleteOne = vi.fn();
    const isInternetReachable = vi.fn().mockResolvedValue(false);
    const subscribeToNetworkState = vi.fn().mockReturnValue(() => {});

    vi.doMock("@/src/infra/mmkv", () => ({ storage: storageMock }));
    vi.doMock("@/src/api/ApiClient", () => ({ apiClient: { insertOne, updateOne, deleteOne } }));
    vi.doMock("@/src/infra/network", () => ({ isInternetReachable, subscribeToNetworkState }));

    const { SyncQueueService } = await import("../src/infra/SyncQueueService");
    const service = new SyncQueueService();
    const op = createSyncOperationFixture({ type: "create" });

    service.enqueue(op);
    await service.processQueue();

    expect(insertOne).not.toHaveBeenCalled();
    expect(service.getQueue()).toHaveLength(1);
  });

  it("retries failed operations with exponential backoff", async () => {
    const storageMock = { getString: vi.fn().mockReturnValue(null), set: vi.fn() };
    const insertOne = vi
      .fn()
      .mockResolvedValueOnce({ error: new Error("Network error") })
      .mockResolvedValueOnce({ error: null });
    const updateOne = vi.fn();
    const deleteOne = vi.fn();
    const isInternetReachable = vi.fn().mockResolvedValue(true);
    const subscribeToNetworkState = vi.fn().mockReturnValue(() => {});

    vi.doMock("@/src/infra/mmkv", () => ({ storage: storageMock }));
    vi.doMock("@/src/api/ApiClient", () => ({ apiClient: { insertOne, updateOne, deleteOne } }));
    vi.doMock("@/src/infra/network", () => ({ isInternetReachable, subscribeToNetworkState }));

    const { SyncQueueService } = await import("../src/infra/SyncQueueService");
    const service = new SyncQueueService();
    const op = createSyncOperationFixture({ type: "create" });

    service.enqueue(op);

    const processPromise = service.processQueue();
    await vi.runAllTimersAsync();
    await processPromise;

    expect(insertOne).toHaveBeenCalledTimes(2);
    expect(service.getQueue()).toHaveLength(0);
  });
});
