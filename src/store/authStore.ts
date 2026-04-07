import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { clearPersistedAuthSession, getCurrentSession, getCurrentUser, getSupabaseClient } from "@/src/api/supabase";
import { getSupabaseEnvError, hasSupabaseEnv } from "@/src/constants/env";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import type { AuthSession, UserProfile } from "@/src/types";
import { usePremiumStore } from "@/src/store/premiumStore";
import { translateAuthError } from "@/src/utils";

let profilesTableUnavailable = false;

interface AuthStoreState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: AuthSession | null;
  status: "idle" | "loading" | "authenticated" | "guest";
  hasHydrated: boolean;
  setGuestMode: () => void;
  hydrateAuth: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; message?: string; code?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string; code?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  enableBiometrics: (enabled: boolean) => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  deleteAccount: () => Promise<{ success: boolean; message?: string }>;
}

function mapSession(session: any): AuthSession | null {
  if (!session) {
    return null;
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? 0,
  };
}

type ProfileRecord = Partial<UserProfile> & {
  email_verified?: boolean;
  biometrics_enabled?: boolean;
  onboarding_completed?: boolean;
  activity_level?: UserProfile["activityLevel"];
};

function isMissingProfilesTableError(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error ? String((error as any).code) : "";
  const message =
    typeof error === "object" && error && "message" in error ? String((error as any).message).toLowerCase() : "";

  return code === "PGRST205" || message.includes("could not find the table 'public.profiles'");
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function getOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getOptionalGoal(value: unknown): UserProfile["goal"] | undefined {
  return value === "gain" || value === "lose" || value === "maintain" ? value : undefined;
}

function getOptionalActivityLevel(value: unknown): UserProfile["activityLevel"] | undefined {
  return value === "sedentary" ||
    value === "light" ||
    value === "moderate" ||
    value === "active" ||
    value === "very_active"
    ? value
    : undefined;
}

function normalizeProfile(profile: any): Partial<UserProfile> {
  if (!profile) {
    return {};
  }

  return {
    email: getOptionalString(profile.email),
    name: getOptionalString(profile.name),
    emailVerified: getOptionalBoolean(profile.emailVerified ?? profile.email_verified),
    biometricsEnabled: getOptionalBoolean(profile.biometricsEnabled ?? profile.biometrics_enabled),
    onboardingCompleted: getOptionalBoolean(profile.onboardingCompleted ?? profile.onboarding_completed),
    weight: getOptionalNumber(profile.weight),
    height: getOptionalNumber(profile.height),
    goal: getOptionalGoal(profile.goal),
    activityLevel: getOptionalActivityLevel(profile.activityLevel ?? profile.activity_level),
  };
}

function serializeAuthMetadata(updates: Partial<UserProfile>): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  if ("name" in updates) metadata.name = updates.name ?? null;
  if ("biometricsEnabled" in updates) metadata.biometricsEnabled = updates.biometricsEnabled ?? null;
  if ("onboardingCompleted" in updates) metadata.onboardingCompleted = updates.onboardingCompleted ?? null;
  if ("weight" in updates) metadata.weight = updates.weight ?? null;
  if ("height" in updates) metadata.height = updates.height ?? null;
  if ("goal" in updates) metadata.goal = updates.goal ?? null;
  if ("activityLevel" in updates) metadata.activityLevel = updates.activityLevel ?? null;

  return metadata;
}

function getAuthErrorInput(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error) {
    const code = "code" in error ? String((error as any).code ?? "") : "";
    const message = "message" in error ? String((error as any).message ?? "") : "";
    return `${code} ${message}`.trim();
  }

  return "unknown";
}

function mapUser(user: any, profile?: ProfileRecord | null): UserProfile | null {
  if (!user || !user.email) {
    return null;
  }

  const normalizedProfile = normalizeProfile(profile);
  const normalizedMetadata = normalizeProfile(user.user_metadata ?? {});
  const emailVerified =
    normalizedProfile.emailVerified ??
    normalizedMetadata.emailVerified ??
    Boolean(user.email_confirmed_at ?? user.confirmed_at);

  return {
    id: user.id,
    email: normalizedProfile.email ?? user.email,
    name: normalizedProfile.name ?? normalizedMetadata.name,
    emailVerified,
    biometricsEnabled: normalizedProfile.biometricsEnabled ?? normalizedMetadata.biometricsEnabled,
    onboardingCompleted: normalizedProfile.onboardingCompleted ?? normalizedMetadata.onboardingCompleted,
    weight: normalizedProfile.weight ?? normalizedMetadata.weight,
    height: normalizedProfile.height ?? normalizedMetadata.height,
    goal: normalizedProfile.goal ?? normalizedMetadata.goal,
    activityLevel: normalizedProfile.activityLevel ?? normalizedMetadata.activityLevel,
  };
}

async function fetchProfile(userId: string): Promise<Partial<UserProfile> | null> {
  if (!hasSupabaseEnv() || profilesTableUnavailable) {
    return null;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (error) {
      if (isMissingProfilesTableError(error)) {
        profilesTableUnavailable = true;
      }
      console.warn("[authStore.fetchProfile]", error.message);
      return null;
    }

    return normalizeProfile(data);
  } catch (error) {
    console.warn("[authStore.fetchProfile]", error);
    return null;
  }
}

async function resolveMappedUser(user: any, shouldFetchProfile = true): Promise<UserProfile | null> {
  const baseUser = mapUser(user);
  if (!baseUser?.id || !shouldFetchProfile) {
    return baseUser;
  }

  const profile = await fetchProfile(baseUser.id);
  return mapUser(user, profile);
}

async function syncProfileRecord(client: any, payload: Record<string, unknown>) {
  if (profilesTableUnavailable) {
    return { success: false, missingTable: true, error: null as any };
  }

  const { error } = await client.from("profiles").upsert(payload);

  if (!error) {
    return { success: true, missingTable: false, error: null as any };
  }

  if (isMissingProfilesTableError(error)) {
    profilesTableUnavailable = true;
    console.warn("[authStore.syncProfileRecord]", error.message);
    return { success: false, missingTable: true, error };
  }

  return { success: false, missingTable: false, error };
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      session: null,
      status: "loading",
      hasHydrated: false,
      setGuestMode: () => {
        set({ isAuthenticated: false, user: null, session: null, status: "guest", hasHydrated: true });
      },
      signUp: async (email: string, password: string, name?: string) => {
        try {
          if (!hasSupabaseEnv()) {
            return {
              success: false,
              message: getSupabaseEnvError() ?? "Login indisponível neste build.",
            };
          }
          const client = getSupabaseClient();
          const result = await client.auth.signUp({
            email,
            password,
            options: {
              data: { name: name ?? "" },
            },
          });
          if (result.error) {
            const t = translateAuthError(getAuthErrorInput(result.error));
            return { success: false, message: t.message, code: t.code };
          }
          
          if (result.data.user) {
            const profileSync = await syncProfileRecord(client, {
              id: result.data.user.id,
              email,
              name: name ?? "",
              created_at: new Date().toISOString(),
            });

            if (!profileSync.success && !profileSync.missingTable) {
              console.warn("[authStore.signUp.profile]", profileSync.error?.message ?? profileSync.error);
            }
          }

          const mappedUser = mapUser(result.data.user);
          const hasSession = Boolean(result.data.session && result.data.user);
          set({
            isAuthenticated: hasSession,
            session: mapSession(result.data.session),
            user: hasSession ? mappedUser : null,
            status: hasSession ? "authenticated" : "idle",
            hasHydrated: true,
          });

          if (!hasSession) {
            return {
              success: false,
              message:
                "A conta foi criada, mas a sessão não iniciou automaticamente. Tente entrar com seu e-mail e senha.",
            };
          }

          return {
            success: true,
          };
        } catch (error) {
          console.error("[authStore.signUp]", error);
          const t = translateAuthError(getAuthErrorInput(error));
          return { success: false, message: t.message, code: t.code };
        }
      },
      hydrateAuth: async () => {
        set({ status: "loading" });

        try {
          if (!hasSupabaseEnv()) {
            // Preserve the explicit "continuar offline" path instead of auto-entering guest mode.
            set({ isAuthenticated: false, user: null, session: null, status: "idle", hasHydrated: true });
            return;
          }

          const [session, user] = await Promise.all([getCurrentSession(), getCurrentUser()]);
          const mappedUser = session && user ? await resolveMappedUser(user) : mapUser(user);
          set({
            isAuthenticated: Boolean(session && user),
            session: mapSession(session),
            user: mappedUser,
            status: session && user ? "authenticated" : "idle",
            hasHydrated: true,
          });

          if (mappedUser?.id) {
            void usePremiumStore.getState().refreshAIUsage(mappedUser.id);
          }
        } catch (error) {
          console.error("[authStore.hydrateAuth]", error);
          set({ isAuthenticated: false, user: null, session: null, status: "idle", hasHydrated: true });
        }
      },
      signIn: async (email: string, password: string) => {
        try {
          if (!hasSupabaseEnv()) {
            set({ isAuthenticated: false, user: null, session: null, status: "idle", hasHydrated: true });
            return {
              success: false,
              message: getSupabaseEnvError() ?? "Login indisponível neste build.",
            };
          }

          const client = getSupabaseClient();
          const result = await client.auth.signInWithPassword({ email, password });

          if (result.error) {
            const t = translateAuthError(getAuthErrorInput(result.error));
            return { success: false, message: t.message, code: t.code };
          }

          if (result.data.user) {
            const profileSync = await syncProfileRecord(client, {
              id: result.data.user.id,
              email: result.data.user.email ?? email,
              name: result.data.user.user_metadata?.name ?? "",
              updated_at: new Date().toISOString(),
            });

            if (!profileSync.success && !profileSync.missingTable) {
              console.warn("[authStore.signIn.profile]", profileSync.error?.message ?? profileSync.error);
            }
          }
          const mappedUser = await resolveMappedUser(result.data.user, Boolean(result.data.session));
          set({
            isAuthenticated: Boolean(result.data.session && result.data.user),
            session: mapSession(result.data.session),
            user: mappedUser,
            status: result.data.session && result.data.user ? "authenticated" : "idle",
            hasHydrated: true,
          });

          if (mappedUser?.id) {
            void usePremiumStore.getState().refreshAIUsage(mappedUser.id);
          }

          return { success: true };
        } catch (error) {
          console.error("[authStore.signIn]", error);
          set({ isAuthenticated: false, user: null, session: null, status: "idle", hasHydrated: true });
          const t = translateAuthError(getAuthErrorInput(error));
          return { success: false, message: t.message, code: t.code };
        }
      },
      signOut: async () => {
        try {
          if (hasSupabaseEnv()) {
            const client = getSupabaseClient();
            await client.auth.signOut();
          }
        } catch (error) {
          console.error("[authStore.signOut]", error);
        } finally {
          clearPersistedAuthSession();
        }

        // Sign-out should return to the public auth/onboarding flow.
        // "guest" is reserved for the explicit offline path chosen by the user.
        set({ isAuthenticated: false, user: null, session: null, status: "idle", hasHydrated: true });
        usePremiumStore.getState().resetPremium();
      },
      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) return { success: false, message: "Usuário não autenticado." };

        const updatedUser = { ...user, ...updates };
        set({ user: updatedUser });

        try {
          if (hasSupabaseEnv()) {
            const client = getSupabaseClient();
            const metadata = serializeAuthMetadata(updates);
            let authMetadataError: any = null;

            if (Object.keys(metadata).length > 0) {
              const { error } = await client.auth.updateUser({ data: metadata });
              authMetadataError = error;
            }

            const profileSync = await syncProfileRecord(client, {
              id: user.id,
              ...updates,
              updated_at: new Date().toISOString(),
            });

            if (authMetadataError && !profileSync.success) {
              throw authMetadataError;
            }

            if (!profileSync.success && !profileSync.missingTable) {
              console.warn("[authStore.updateProfile.profile]", profileSync.error?.message ?? profileSync.error);
            }
          }
          return { success: true };
        } catch (error) {
          console.error("[authStore.updateProfile]", error);
          return { success: false, message: "Erro ao sincronizar perfil." };
        }
      },
      enableBiometrics: (enabled: boolean) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, biometricsEnabled: enabled } });
        }
      },
      resetPassword: async (email: string) => {
        try {
          if (!hasSupabaseEnv()) return { success: false, message: "Supabase não configurado." };
          const client = getSupabaseClient();
          const { error } = await client.auth.resetPasswordForEmail(email);
          if (error) return { success: false, message: error.message };
          return { success: true };
        } catch {
          return { success: false, message: "Erro ao solicitar recuperação." };
        }
      },
      deleteAccount: async () => {
        try {
          if (!hasSupabaseEnv()) return { success: false, message: "Supabase não configurado." };
          const client = getSupabaseClient();
          // Nota: deleteUser geralmente requer privilégios de admin ou uma Edge Function.
          // Aqui chamamos uma RPC ou assumimos que o cliente tem permissão via RLS/Função.
          const { error } = await client.rpc('delete_user_account');
          if (error) {
            // Fallback: Tentar deletar o perfil e deslogar se a RPC falhar
            const { user } = get();
            if (user) {
              await client.from('profiles').delete().eq('id', user.id);
            }
            await get().signOut();
            return { success: true, message: "Conta desativada localmente. Entre em contato para exclusão total." };
          }
          await get().signOut();
          return { success: true };
        } catch {
          return { success: false, message: "Erro ao excluir conta." };
        }
      }
    }),
    {
      name: "vrtxprotocol-auth-store",
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
