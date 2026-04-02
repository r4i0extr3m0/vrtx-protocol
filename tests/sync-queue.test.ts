import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSyncOperationFixture, createWorkoutFixture } from "../src/test-utils";

const storageState = new Map<string, string>();
const storage = {
  getString: vi.fn((key: string) => storageState.get(key)),
  set: vi.fn((key: string, value: string) => {
    storageState.set(key, value);
  }),
  delete: vi.fn((key: string) => {
    storageState.delete(key);
  }),
};

const apiClient = {
  insertOne: vi.fn(),
  updateOne: vi.fn(),
  deleteOne: vi.fn(),
};

const isInternetReachable = vi.fn();
const subscribeToNetworkState = vi.fn(() => () => undefined);

vi.mock("@/src/infra/mmkv", () => ({
  storage,
}));

vi.mock("@/src/api/ApiClient", () => ({
  apiClient,
}));

vi.mock("@/src/infra/network", () => ({
  isInternetReachable,
  subscribeToNetworkState,
}));

describe("SyncQueueService", () => {
  beforeEach(() => {
    storageState.clear();
    vi.resetModules();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("processes a successful create operation and clears the queue", async () => {
    isInternetReachable.mockResolvedValue(true);
    apiClient.insertOne.mockResolvedValue({ data: { id: "workout-1" }, error: null });

    const { SyncQueueService } = await import("../src/infra/SyncQueueService");
    const service = new SyncQueueService();
    service.replaceQueue([createSyncOperationFixture()]);

    await service.processQueue();

    expect(apiClient.insertOne).toHaveBeenCalledTimes(1);
    expect(service.getQueue()).toEqual([]);
  });

  it("keeps the queue untouched when internet is unavailable", async () => {
    isInternetReachable.mockResolvedValue(false);

    const { SyncQueueService } = await import("../src/infra/SyncQueueService");
    const service = new SyncQueueService();
    const operation = createSyncOperationFixture();
    service.replaceQueue([operation]);

    await service.processQueue();

    expect(apiClient.insertOne).not.toHaveBeenCalled();
    expect(service.getQueue()).toHaveLength(1);
    expect(service.getQueue()[0].id).toBe(operation.id);
  });

  it("retries failed operations and removes them after succeeding", async () => {
    vi.useFakeTimers();
    isInternetReachable.mockResolvedValue(true);
    apiClient.insertOne
      .mockResolvedValueOnce({ data: null, error: { message: "offline" } })
      .mockResolvedValueOnce({ data: createWorkoutFixture(), error: null });

    const { SyncQueueService } = await import("../src/infra/SyncQueueService");
    const service = new SyncQueueService();
    service.replaceQueue([createSyncOperationFixture()]);

    const promise = service.processQueue();
    await vi.runAllTimersAsync();
    await promise;

    expect(apiClient.insertOne).toHaveBeenCalledTimes(2);
    expect(service.getQueue()).toEqual([]);
    vi.useRealTimers();
  });
});
