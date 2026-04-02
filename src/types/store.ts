import type { AuthSession, SyncQueueOperation, UserProfile, Workout } from "./database";

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

export interface NotificationStoreState {
  preferences: NotificationPreferences;
  setPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
}

export interface NotificationPreferences {
  trainingReminder: boolean;
  trainingReminderTime: string; // HH:mm
  mealReminder: boolean;
  mealReminderTime: string; // HH:mm
  streakNotification: boolean;
  prNotification: boolean;
}
