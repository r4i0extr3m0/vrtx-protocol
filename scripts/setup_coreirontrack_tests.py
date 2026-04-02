from pathlib import Path
from textwrap import dedent

ROOT = Path('/home/ubuntu/ironlog')

files = {
    'vitest.config.ts': dedent('''
        import { defineConfig } from "vitest/config";
        import path from "node:path";

        export default defineConfig({
          test: {
            environment: "node",
            globals: true,
            clearMocks: true,
            restoreMocks: true,
            mockReset: true,
          },
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "."),
            },
          },
        });
    '''),
    'src/test-utils/index.ts': dedent('''
        import type { ExerciseEntry, ExerciseSet, SyncQueueOperation, Workout } from "@/src/types";

        type StorageShape = {
          getItem: (name: string) => string | null;
          setItem: (name: string, value: string) => void;
          removeItem: (name: string) => void;
        };

        export function createMemoryJsonStorage(): StorageShape {
          const map = new Map<string, string>();

          return {
            getItem: (name) => map.get(name) ?? null,
            setItem: (name, value) => {
              map.set(name, value);
            },
            removeItem: (name) => {
              map.delete(name);
            },
          };
        }

        export function createSetFixture(partial?: Partial<ExerciseSet>): ExerciseSet {
          return {
            id: partial?.id ?? "set-1",
            reps: partial?.reps ?? 5,
            weightKg: partial?.weightKg ?? 100,
            completed: partial?.completed ?? true,
            notes: partial?.notes,
          };
        }

        export function createExerciseFixture(partial?: Partial<ExerciseEntry>): ExerciseEntry {
          return {
            id: partial?.id ?? "exercise-1",
            name: partial?.name ?? "Supino reto",
            muscleGroup: partial?.muscleGroup ?? "Peito",
            sets: partial?.sets ?? [createSetFixture()],
            notes: partial?.notes,
          };
        }

        export function createWorkoutFixture(partial?: Partial<Workout>): Workout {
          return {
            id: partial?.id ?? "workout-1",
            userId: partial?.userId,
            name: partial?.name ?? "Treino A",
            date: partial?.date ?? "2026-03-26",
            startedAt: partial?.startedAt ?? "2026-03-26T10:00:00.000Z",
            completedAt: partial?.completedAt,
            notes: partial?.notes,
            exercises: partial?.exercises ?? [createExerciseFixture()],
            syncStatus: partial?.syncStatus ?? "local",
          };
        }

        export function createSyncOperationFixture(
          partial?: Partial<SyncQueueOperation<Workout>>,
        ): SyncQueueOperation<Workout> {
          return {
            id: partial?.id ?? "sync-1",
            entity: partial?.entity ?? "workout",
            type: partial?.type ?? "create",
            table: partial?.table ?? "workouts",
            data: partial?.data ?? createWorkoutFixture(),
            timestamp: partial?.timestamp ?? Date.now(),
            retries: partial?.retries ?? 0,
            lastError: partial?.lastError,
          };
        }
    '''),
    'tests/domain-workout.test.ts': dedent('''
        import { describe, expect, it } from "vitest";

        import { calculateOneRM, calculateWorkoutVolume, findBestEstimatedOneRM } from "../src/domain/strength";
        import {
          createExerciseEntry,
          createExerciseSet,
          createWorkoutDraft,
          summarizeWorkout,
        } from "../src/domain/workout";

        describe("workout domain", () => {
          it("creates default draft and summarizes volume and 1RM", () => {
            const bench = createExerciseEntry({
              name: "Supino reto",
              sets: [
                createExerciseSet({ reps: 5, weightKg: 100 }),
                createExerciseSet({ reps: 8, weightKg: 80 }),
              ],
            });
            const squat = createExerciseEntry({
              name: "Agachamento",
              sets: [createExerciseSet({ reps: 3, weightKg: 140 })],
            });

            const workout = createWorkoutDraft({
              name: "Treino de força",
              exercises: [bench, squat],
            });

            const summary = summarizeWorkout(workout);

            expect(workout.name).toBe("Treino de força");
            expect(summary.exerciseCount).toBe(2);
            expect(summary.setCount).toBe(3);
            expect(summary.totalVolume).toBe(1320);
            expect(summary.bestOneRM).toBeCloseTo(152.73, 2);
          });

          it("ignores incomplete sets in volume and estimated 1RM", () => {
            const sets = [
              createExerciseSet({ reps: 5, weightKg: 100, completed: true }),
              createExerciseSet({ reps: 10, weightKg: 60, completed: false }),
            ];

            expect(calculateWorkoutVolume(sets)).toBe(500);
            expect(findBestEstimatedOneRM(sets)).toBeCloseTo(calculateOneRM(100, 5), 5);
          });

          it("creates fallback defaults for exercise and set factories", () => {
            const setEntry = createExerciseSet();
            const exercise = createExerciseEntry();
            const workout = createWorkoutDraft();

            expect(setEntry.completed).toBe(true);
            expect(exercise.sets).toHaveLength(1);
            expect(workout.exercises).toEqual([]);
            expect(workout.syncStatus).toBe("local");
          });
        });
    '''),
    'tests/sync-queue.test.ts': dedent('''
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

        vi.mock("@/src/api", () => ({
          apiClient,
        }));

        vi.mock("@/src/infra/network", () => ({
          isInternetReachable,
          subscribeToNetworkState,
        }));

        describe("SyncQueueService", () => {
          beforeEach(() => {
            storageState.clear();
            vi.clearAllMocks();
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
    '''),
    'tests/stores.test.ts': dedent('''
        import { beforeEach, describe, expect, it, vi } from "vitest";

        import { createExerciseFixture, createMemoryJsonStorage } from "../src/test-utils";

        describe("authStore", () => {
          beforeEach(() => {
            vi.resetModules();
            vi.clearAllMocks();
          });

          it("falls back to guest mode when Supabase env is missing", async () => {
            const storage = createMemoryJsonStorage();

            vi.doMock("@/src/infra/mmkv", () => ({
              mmkvJsonStorage: storage,
            }));
            vi.doMock("@/src/constants/env", () => ({
              hasSupabaseEnv: () => false,
            }));
            vi.doMock("@/src/api/supabase", () => ({
              getCurrentSession: vi.fn(),
              getCurrentUser: vi.fn(),
              getSupabaseClient: vi.fn(),
            }));

            const { useAuthStore } = await import("../src/store/authStore");
            await useAuthStore.getState().hydrateAuth();

            expect(useAuthStore.getState().status).toBe("guest");
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
          });
        });

        describe("workoutStore", () => {
          beforeEach(() => {
            vi.resetModules();
            vi.clearAllMocks();
          });

          it("creates workouts and enqueues sync operations", async () => {
            const storage = createMemoryJsonStorage();
            const enqueue = vi.fn();

            vi.doMock("@/src/infra/mmkv", () => ({
              mmkvJsonStorage: storage,
            }));
            vi.doMock("@/src/store/syncStore", () => ({
              useSyncStore: {
                getState: () => ({ enqueue }),
              },
            }));

            const { useWorkoutStore } = await import("../src/store/workoutStore");
            const workout = useWorkoutStore.getState().createWorkout("Treino A");

            expect(workout.name).toBe("Treino A");
            expect(useWorkoutStore.getState().activeWorkoutId).toBe(workout.id);
            expect(useWorkoutStore.getState().workouts[0].syncStatus).toBe("pending");
            expect(enqueue).toHaveBeenCalledTimes(1);
          });

          it("adds exercises and completes the active workout", async () => {
            const storage = createMemoryJsonStorage();
            const enqueue = vi.fn();

            vi.doMock("@/src/infra/mmkv", () => ({
              mmkvJsonStorage: storage,
            }));
            vi.doMock("@/src/store/syncStore", () => ({
              useSyncStore: {
                getState: () => ({ enqueue }),
              },
            }));

            const { useWorkoutStore } = await import("../src/store/workoutStore");
            const store = useWorkoutStore.getState();
            const workout = store.createWorkout("Treino B");
            store.addExercise(workout.id, createExerciseFixture());
            store.completeWorkout(workout.id);

            const updated = useWorkoutStore.getState().workouts.find((entry) => entry.id === workout.id);

            expect(updated?.exercises).toHaveLength(1);
            expect(updated?.completedAt).toBeTruthy();
            expect(useWorkoutStore.getState().activeWorkoutId).toBeNull();
            expect(enqueue).toHaveBeenCalledTimes(3);
          });
        });
    '''),
}

for relative_path, content in files.items():
    file_path = ROOT / relative_path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content.strip() + "\n", encoding='utf-8')

print('IronLog test scaffold written.')
