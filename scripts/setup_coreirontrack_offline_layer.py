from pathlib import Path

ROOT = Path('/home/ubuntu/ironlog')

files = {
    'src/api/supabase.ts': '''import "react-native-url-polyfill/auto";

import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

import { env, hasSupabaseEnv } from "@/src/constants/env";
import { storage } from "@/src/infra/mmkv";

const AUTH_TOKEN_KEY = "ironlog.supabase.auth.token";

const storageAdapter = {
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};

let cachedClient: SupabaseClient | null = null;

function createFallbackClient(): SupabaseClient {
  return createClient("https://placeholder.supabase.co", "placeholder-anon-key", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-ironlog-mode": "offline-fallback",
      },
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = hasSupabaseEnv()
    ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          storage: storageAdapter,
          storageKey: AUTH_TOKEN_KEY,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : createFallbackClient();

  return cachedClient;
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const client = getSupabaseClient();
  const result = await client.auth.getSession();
  return result.data.session ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const client = getSupabaseClient();
  const result = await client.auth.getUser();
  return result.data.user ?? null;
}
''',
    'src/api/ApiClient.ts': '''import type { PostgrestError } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/src/api/supabase";
import type { ApiError, ApiResult } from "@/src/types";

function normalizeError(error: unknown, fallbackCode: string): ApiError {
  if (!error) {
    return {
      code: fallbackCode,
      message: "Erro desconhecido ao processar a requisição.",
    };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const maybePostgrest = error as PostgrestError;

    return {
      code: typeof maybePostgrest.code === "string" ? maybePostgrest.code : fallbackCode,
      message: maybePostgrest.message,
      status:
        typeof maybePostgrest.details === "string" && maybePostgrest.details.length > 0
          ? 400
          : undefined,
    };
  }

  return {
    code: fallbackCode,
    message: "Falha inesperada de comunicação.",
  };
}

export class ApiClient {
  async selectMany<TRecord>(table: string): Promise<ApiResult<TRecord[]>> {
    try {
      const client = getSupabaseClient();
      const result = await client.from(table).select("*");

      if (result.error) {
        return { data: null, error: normalizeError(result.error, "SUPABASE_SELECT_FAILED") };
      }

      return { data: (result.data ?? []) as TRecord[], error: null };
    } catch (error) {
      console.error("[ApiClient.selectMany]", error);
      return { data: null, error: normalizeError(error, "SUPABASE_SELECT_EXCEPTION") };
    }
  }

  async insertOne<TRecord extends Record<string, unknown>>(
    table: string,
    payload: TRecord,
  ): Promise<ApiResult<TRecord>> {
    try {
      const client = getSupabaseClient();
      const result = await client.from(table).insert(payload).select("*").single();

      if (result.error) {
        return { data: null, error: normalizeError(result.error, "SUPABASE_INSERT_FAILED") };
      }

      return { data: result.data as TRecord, error: null };
    } catch (error) {
      console.error("[ApiClient.insertOne]", error);
      return { data: null, error: normalizeError(error, "SUPABASE_INSERT_EXCEPTION") };
    }
  }

  async updateOne<TRecord extends Record<string, unknown>>(
    table: string,
    id: string,
    payload: Partial<TRecord>,
  ): Promise<ApiResult<TRecord>> {
    try {
      const client = getSupabaseClient();
      const result = await client.from(table).update(payload).eq("id", id).select("*").single();

      if (result.error) {
        return { data: null, error: normalizeError(result.error, "SUPABASE_UPDATE_FAILED") };
      }

      return { data: result.data as TRecord, error: null };
    } catch (error) {
      console.error("[ApiClient.updateOne]", error);
      return { data: null, error: normalizeError(error, "SUPABASE_UPDATE_EXCEPTION") };
    }
  }

  async deleteOne(table: string, id: string): Promise<ApiResult<{ id: string }>> {
    try {
      const client = getSupabaseClient();
      const result = await client.from(table).delete().eq("id", id);

      if (result.error) {
        return { data: null, error: normalizeError(result.error, "SUPABASE_DELETE_FAILED") };
      }

      return { data: { id }, error: null };
    } catch (error) {
      console.error("[ApiClient.deleteOne]", error);
      return { data: null, error: normalizeError(error, "SUPABASE_DELETE_EXCEPTION") };
    }
  }
}

export const apiClient = new ApiClient();
''',
    'src/infra/SyncQueueService.ts': '''import { apiClient } from "@/src/api/ApiClient";
import { storage } from "@/src/infra/mmkv";
import { isInternetReachable, subscribeToNetworkState } from "@/src/infra/network";
import type { SyncQueueOperation } from "@/src/types";

const QUEUE_KEY = "ironlog.sync.queue";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1200;

type QueueListener = (queue: SyncQueueOperation[]) => void;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class SyncQueueService {
  private queue: SyncQueueOperation[] = [];
  private listeners = new Set<QueueListener>();
  private isProcessing = false;
  private unsubscribeNetwork?: () => void;

  constructor() {
    this.loadQueue();
    this.unsubscribeNetwork = subscribeToNetworkState((reachable) => {
      if (reachable) {
        void this.processQueue();
      }
    });
  }

  dispose(): void {
    this.unsubscribeNetwork?.();
  }

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.queue);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getQueue(): SyncQueueOperation[] {
    return [...this.queue];
  }

  enqueue(operation: SyncQueueOperation): void {
    this.queue.push(operation);
    this.saveQueue();
    void this.processQueue();
  }

  replaceQueue(nextQueue: SyncQueueOperation[]): void {
    this.queue = [...nextQueue];
    this.saveQueue();
  }

  private loadQueue(): void {
    const raw = storage.getString(QUEUE_KEY);
    if (!raw) {
      this.queue = [];
      return;
    }

    try {
      this.queue = JSON.parse(raw) as SyncQueueOperation[];
    } catch (error) {
      console.error("[SyncQueueService.loadQueue]", error);
      this.queue = [];
    }
  }

  private saveQueue(): void {
    storage.set(QUEUE_KEY, JSON.stringify(this.queue));
    this.listeners.forEach((listener) => listener(this.getQueue()));
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    const reachable = await isInternetReachable();
    if (!reachable) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const current = this.queue[0];
        const result = await this.executeOperation(current);

        if (!result) {
          current.retries += 1;

          if (current.retries >= MAX_RETRIES) {
            this.queue.shift();
          } else {
            this.queue.push(this.queue.shift() as SyncQueueOperation);
            await wait(BASE_DELAY_MS * current.retries);
          }

          this.saveQueue();
          continue;
        }

        this.queue.shift();
        this.saveQueue();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeOperation(operation: SyncQueueOperation): Promise<boolean> {
    try {
      if (operation.type === "create") {
        const result = await apiClient.insertOne(operation.table, operation.data);
        return result.error === null;
      }

      const entityId = typeof operation.data.id === "string" ? operation.data.id : operation.id;

      if (operation.type === "update") {
        const result = await apiClient.updateOne(operation.table, entityId, operation.data);
        return result.error === null;
      }

      const result = await apiClient.deleteOne(operation.table, entityId);
      return result.error === null;
    } catch (error) {
      console.error("[SyncQueueService.executeOperation]", error);
      return false;
    }
  }
}

export const syncQueueService = new SyncQueueService();
''',
    'src/store/authStore.ts': '''import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getCurrentSession, getCurrentUser, getSupabaseClient } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import type { AuthSession, UserProfile } from "@/src/types";

interface AuthStoreState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: AuthSession | null;
  status: "idle" | "loading" | "authenticated" | "guest";
  setGuestMode: () => void;
  hydrateAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
}

function mapSession(session: Awaited<ReturnType<typeof getCurrentSession>>): AuthSession | null {
  if (!session) {
    return null;
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? 0,
  };
}

function mapUser(user: Awaited<ReturnType<typeof getCurrentUser>>): UserProfile | null {
  if (!user || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: typeof user.user_metadata.name === "string" ? user.user_metadata.name : undefined,
  };
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      session: null,
      status: "idle",
      setGuestMode: () => {
        set({ isAuthenticated: false, user: null, session: null, status: "guest" });
      },
      hydrateAuth: async () => {
        set({ status: "loading" });

        if (!hasSupabaseEnv()) {
          set({ isAuthenticated: false, user: null, session: null, status: "guest" });
          return;
        }

        const [session, user] = await Promise.all([getCurrentSession(), getCurrentUser()]);
        set({
          isAuthenticated: Boolean(session && user),
          session: mapSession(session),
          user: mapUser(user),
          status: session && user ? "authenticated" : "guest",
        });
      },
      signIn: async (email: string, password: string) => {
        if (!hasSupabaseEnv()) {
          set({ isAuthenticated: false, user: null, session: null, status: "guest" });
          return { success: false, message: "Credenciais Supabase ainda não configuradas." };
        }

        const client = getSupabaseClient();
        const result = await client.auth.signInWithPassword({ email, password });

        if (result.error) {
          return { success: false, message: result.error.message };
        }

        set({
          isAuthenticated: Boolean(result.data.session && result.data.user),
          session: mapSession(result.data.session),
          user: mapUser(result.data.user),
          status: result.data.session && result.data.user ? "authenticated" : "guest",
        });

        return { success: true };
      },
      signOut: async () => {
        if (hasSupabaseEnv()) {
          const client = getSupabaseClient();
          await client.auth.signOut();
        }

        set({ isAuthenticated: false, user: null, session: null, status: "guest" });
      },
    }),
    {
      name: "ironlog-auth-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        session: state.session,
        status: state.status,
      }),
    },
  ),
);
''',
    'src/store/syncStore.ts': '''import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { isInternetReachable } from "@/src/infra/network";
import { syncQueueService } from "@/src/infra/SyncQueueService";
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
      queue: syncQueueService.getQueue(),
      lastSyncedAt: null,
      isProcessing: false,
      lastError: null,
      networkReachable: false,
      enqueue: (operation) => {
        syncQueueService.enqueue(operation);
        set({ queue: syncQueueService.getQueue() });
      },
      processPending: async () => {
        set({ isProcessing: true, lastError: null });
        try {
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
''',
    'src/store/workoutStore.ts': '''import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createWorkoutDraft, summarizeWorkout } from "@/src/domain/workout";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { useSyncStore } from "@/src/store/syncStore";
import type { ExerciseEntry, Workout } from "@/src/types";
import { createId, toIsoTimestamp } from "@/src/utils";

interface WorkoutStoreState {
  workouts: Workout[];
  activeWorkoutId: string | null;
  hydrated: boolean;
  createWorkout: (name?: string) => Workout;
  updateWorkout: (id: string, partial: Partial<Workout>) => void;
  addExercise: (workoutId: string, exercise: ExerciseEntry) => void;
  completeWorkout: (workoutId: string) => void;
  setHydrated: (value: boolean) => void;
}

function enqueueWorkoutOperation(type: "create" | "update" | "delete", workout: Workout): void {
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entity: "workout",
    type,
    table: "workouts",
    data: workout,
    timestamp: Date.now(),
    retries: 0,
  });
}

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      workouts: [],
      activeWorkoutId: null,
      hydrated: false,
      createWorkout: (name) => {
        const draft = createWorkoutDraft({
          name: name ?? "Novo treino",
          syncStatus: "pending",
        });

        set((state) => ({
          workouts: [draft, ...state.workouts],
          activeWorkoutId: draft.id,
        }));

        enqueueWorkoutOperation("create", draft);
        return draft;
      },
      updateWorkout: (id, partial) => {
        const nextWorkouts = get().workouts.map((workout) =>
          workout.id === id ? { ...workout, ...partial, syncStatus: "pending" as const } : workout,
        );
        const updatedWorkout = nextWorkouts.find((workout) => workout.id === id);

        set({ workouts: nextWorkouts });

        if (updatedWorkout) {
          enqueueWorkoutOperation("update", updatedWorkout);
        }
      },
      addExercise: (workoutId, exercise) => {
        const nextWorkouts = get().workouts.map((workout) => {
          if (workout.id !== workoutId) {
            return workout;
          }

          return {
            ...workout,
            exercises: [...workout.exercises, exercise],
            syncStatus: "pending" as const,
          };
        });
        const updatedWorkout = nextWorkouts.find((workout) => workout.id == workoutId);

        set({ workouts: nextWorkouts });

        if (updatedWorkout) {
          enqueueWorkoutOperation("update", updatedWorkout);
        }
      },
      completeWorkout: (workoutId) => {
        const nextWorkouts = get().workouts.map((workout) => {
          if (workout.id !== workoutId) {
            return workout;
          }

          return {
            ...workout,
            completedAt: toIsoTimestamp(new Date()),
            syncStatus: "pending" as const,
          };
        });
        const updatedWorkout = nextWorkouts.find((workout) => workout.id === workoutId);

        set({
          workouts: nextWorkouts,
          activeWorkoutId: null,
        });

        if (updatedWorkout) {
          enqueueWorkoutOperation("update", updatedWorkout);
        }
      },
      setHydrated: (value) => {
        set({ hydrated: value });
      },
    }),
    {
      name: "ironlog-workout-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function selectWorkoutSummary(workoutId: string): ReturnType<typeof summarizeWorkout> | null {
  const workout = useWorkoutStore.getState().workouts.find((entry) => entry.id === workoutId);
  return workout ? summarizeWorkout(workout) : null;
}
''',
    'src/hooks/useAuth.ts': '''import { useMemo } from "react";

import { useAuthStore } from "@/src/store/authStore";

export function useAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const setGuestMode = useAuthStore((state) => state.setGuestMode);

  return useMemo(
    () => ({
      isAuthenticated,
      user,
      session,
      status,
      hydrateAuth,
      signIn,
      signOut,
      setGuestMode,
    }),
    [hydrateAuth, isAuthenticated, session, setGuestMode, signIn, signOut, status, user],
  );
}
''',
    'src/hooks/useWorkout.ts': '''import { useMemo } from "react";

import { useWorkoutStore } from "@/src/store/workoutStore";

export function useWorkout() {
  const workouts = useWorkoutStore((state) => state.workouts);
  const activeWorkoutId = useWorkoutStore((state) => state.activeWorkoutId);
  const hydrated = useWorkoutStore((state) => state.hydrated);
  const createWorkout = useWorkoutStore((state) => state.createWorkout);
  const updateWorkout = useWorkoutStore((state) => state.updateWorkout);
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const completeWorkout = useWorkoutStore((state) => state.completeWorkout);

  return useMemo(
    () => ({
      workouts,
      activeWorkoutId,
      hydrated,
      createWorkout,
      updateWorkout,
      addExercise,
      completeWorkout,
    }),
    [activeWorkoutId, addExercise, completeWorkout, createWorkout, hydrated, updateWorkout, workouts],
  );
}
''',
    'src/hooks/useSync.ts': '''import { useEffect, useMemo } from "react";

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
''',
    'src/store/index.ts': '''export * from "./authStore";
export * from "./syncStore";
export * from "./workoutStore";
''',
    'src/hooks/index.ts': '''export * from "./useAuth";
export * from "./useSync";
export * from "./useTheme";
export * from "./useWorkout";
''',
    'src/api/index.ts': '''export * from "./ApiClient";
export * from "./supabase";
''',
}

for relative_path, content in files.items():
    file_path = ROOT / relative_path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content.strip() + "\n", encoding="utf-8")

print('Offline layer files prepared successfully.')
