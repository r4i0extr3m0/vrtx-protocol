from pathlib import Path
import json

ROOT = Path('/home/ubuntu/ironlog')

files = {
    'src/theme/colors.ts': '''export const colors = {
  dark: {
    background: "#0B0D10",
    surface: "#151A20",
    surfaceAlt: "#1B2129",
    foreground: "#F4F7FB",
    muted: "#97A6B5",
    border: "#28313B",
    primary: "#7CC6FF",
    primaryStrong: "#4AA8F0",
    success: "#39D98A",
    warning: "#F5B942",
    error: "#FF6B6B",
    info: "#7CC6FF",
  },
  light: {
    background: "#F3F6F9",
    surface: "#FFFFFF",
    surfaceAlt: "#E8EEF4",
    foreground: "#0F1720",
    muted: "#5E6C79",
    border: "#D5DEE8",
    primary: "#2376B7",
    primaryStrong: "#145A91",
    success: "#1FA764",
    warning: "#BA7A12",
    error: "#CF4B4B",
    info: "#2376B7",
  },
} as const;

export type ThemeScheme = keyof typeof colors;
export type ThemeColors = typeof colors.dark;
''',
    'src/theme/spacing.ts': '''export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;
''',
    'src/theme/typography.ts': '''export const typography = {
  hero: 30,
  title: 24,
  section: 18,
  body: 15,
  caption: 12,
  metric: 28,
} as const;
''',
    'src/theme/radius.ts': '''export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;
''',
    'src/theme/index.ts': '''export * from "./colors";
export * from "./spacing";
export * from "./typography";
export * from "./radius";
''',
    'src/types/database.ts': '''export interface ExerciseSet {
  id: string;
  reps: number;
  weightKg: number;
  completed: boolean;
  notes?: string;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  userId?: string;
  name: string;
  date: string;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  exercises: ExerciseEntry[];
  syncStatus: "local" | "pending" | "synced" | "failed";
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

export interface SyncQueueOperation<TData = Record<string, unknown>> {
  id: string;
  entity: "workout" | "auth";
  type: "create" | "update" | "delete";
  table: string;
  data: TData;
  timestamp: number;
  retries: number;
  lastError?: string;
}
''',
    'src/types/api.ts': '''export interface ApiError {
  code: string;
  message: string;
  status?: number;
}

export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
}
''',
    'src/types/store.ts': '''import type { AuthSession, SyncQueueOperation, UserProfile, Workout } from "./database";

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: AuthSession | null;
  status: "idle" | "loading" | "authenticated" | "guest";
}

export interface WorkoutState {
  workouts: Workout[];
  activeWorkoutId: string | null;
  hydrated: boolean;
}

export interface SyncState {
  queue: SyncQueueOperation[];
  lastSyncedAt: string | null;
  isProcessing: boolean;
  lastError: string | null;
  networkReachable: boolean;
}
''',
    'src/types/index.ts': '''export * from "./api";
export * from "./database";
export * from "./store";
''',
    'src/utils/id.ts': '''export function createId(prefix: string = "ironlog"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
''',
    'src/utils/date.ts': '''export function toIsoDate(value: Date = new Date()): string {
  return value.toISOString().slice(0, 10);
}

export function toIsoTimestamp(value: Date = new Date()): string {
  return value.toISOString();
}
''',
    'src/utils/format.ts': '''export function formatKg(value: number): string {
  return `${value.toFixed(1)} kg`;
}

export function formatVolume(value: number): string {
  return `${Math.round(value).toLocaleString("pt-BR")} kg`;
}
''',
    'src/utils/index.ts': '''export * from "./date";
export * from "./format";
export * from "./id";
''',
    'src/domain/strength.ts': '''export interface LoadSetInput {
  reps: number;
  weightKg: number;
  completed?: boolean;
}

/**
 * Calcula o volume total de treino somando carga x repetições das séries concluídas.
 */
export function calculateWorkoutVolume(sets: LoadSetInput[]): number {
  return sets.reduce((total, current) => {
    if (current.completed === false) {
      return total;
    }

    return total + current.reps * current.weightKg;
  }, 0);
}

/**
 * Calcula a estimativa de 1RM pela fórmula de Brzycki.
 */
export function calculateOneRM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) {
    return 0;
  }

  if (reps === 1) {
    return weightKg;
  }

  const divisor = 1.0278 - 0.0278 * reps;
  if (divisor <= 0) {
    return weightKg;
  }

  return Number((weightKg / divisor).toFixed(2));
}

export function findBestEstimatedOneRM(sets: LoadSetInput[]): number {
  return sets.reduce((best, current) => {
    if (current.completed === false) {
      return best;
    }

    return Math.max(best, calculateOneRM(current.weightKg, current.reps));
  }, 0);
}
''',
    'src/domain/workout.ts': '''import type { ExerciseEntry, ExerciseSet, Workout } from "@/src/types";
import { calculateWorkoutVolume, findBestEstimatedOneRM } from "./strength";
import { createId, toIsoDate, toIsoTimestamp } from "@/src/utils";

export interface WorkoutSummary {
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
  bestOneRM: number;
}

export function createExerciseSet(partial?: Partial<ExerciseSet>): ExerciseSet {
  return {
    id: partial?.id ?? createId("set"),
    reps: partial?.reps ?? 0,
    weightKg: partial?.weightKg ?? 0,
    completed: partial?.completed ?? true,
    notes: partial?.notes,
  };
}

export function createExerciseEntry(partial?: Partial<ExerciseEntry>): ExerciseEntry {
  return {
    id: partial?.id ?? createId("exercise"),
    name: partial?.name ?? "Novo exercício",
    muscleGroup: partial?.muscleGroup ?? "Geral",
    sets: partial?.sets ?? [createExerciseSet()],
    notes: partial?.notes,
  };
}

export function createWorkoutDraft(partial?: Partial<Workout>): Workout {
  const now = new Date();

  return {
    id: partial?.id ?? createId("workout"),
    userId: partial?.userId,
    name: partial?.name ?? "Treino do dia",
    date: partial?.date ?? toIsoDate(now),
    startedAt: partial?.startedAt ?? toIsoTimestamp(now),
    completedAt: partial?.completedAt,
    notes: partial?.notes,
    exercises: partial?.exercises ?? [],
    syncStatus: partial?.syncStatus ?? "local",
  };
}

export function summarizeWorkout(workout: Workout): WorkoutSummary {
  const allSets = workout.exercises.flatMap((exercise) => exercise.sets);

  return {
    exerciseCount: workout.exercises.length,
    setCount: allSets.length,
    totalVolume: calculateWorkoutVolume(allSets),
    bestOneRM: findBestEstimatedOneRM(allSets),
  };
}
''',
    'src/constants/env.ts': '''export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function hasSupabaseEnv(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
''',
    'src/infra/mmkv.ts': '''import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "ironlog-storage" });

export function initializeMMKV(): void {
  storage.getAllKeys();
}

export const mmkvJsonStorage = {
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};
''',
    'src/infra/network.ts': '''import * as Network from "expo-network";

export async function isInternetReachable(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function subscribeToNetworkState(listener: (reachable: boolean) => void): () => void {
  const subscription = Network.addNetworkStateListener((state) => {
    listener(Boolean(state.isConnected && state.isInternetReachable !== false));
  });

  return () => {
    subscription.remove();
  };
}
''',
    'src/services/index.ts': '''export {};
''',
    'src/api/index.ts': '''export {};
''',
    'src/hooks/index.ts': '''export {};
''',
    'src/store/index.ts': '''export {};
''',
    'src/navigation/index.ts': '''export {};
''',
    'src/screens/index.ts': '''export {};
''',
    'src/components/index.ts': '''export {};
''',
    'src/test-utils/index.ts': '''export {};
''',
}

for relative_path, content in files.items():
    file_path = ROOT / relative_path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content.strip() + "\n", encoding="utf-8")

package_json_path = ROOT / 'package.json'
package_json = json.loads(package_json_path.read_text(encoding='utf-8'))
package_json.setdefault('scripts', {})
package_json['scripts']['typecheck'] = 'tsc --noEmit'
package_json['scripts']['test:watch'] = 'vitest'
package_json['scripts']['lint:fix'] = 'expo lint --fix'
package_json_path.write_text(json.dumps(package_json, indent=2) + "\n", encoding='utf-8')

print('Foundation files prepared successfully.')
