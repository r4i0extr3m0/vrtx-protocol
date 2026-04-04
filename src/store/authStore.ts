import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getCurrentSession, getCurrentUser, getSupabaseClient } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import type { AuthSession, UserProfile } from "@/src/types";
import { usePremiumStore } from "@/src/store/premiumStore";
import { translateAuthError } from "@/src/utils";

interface AuthStoreState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: AuthSession | null;
  status: "idle" | "loading" | "authenticated" | "guest" | "pending_confirmation";
  setGuestMode: () => void;
  hydrateAuth: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; message?: string; code?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string; code?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; message?: string }>;
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

function mapUser(user: any): UserProfile | null {
  if (!user || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : undefined,
  };
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      session: null,
      status: "idle",
      setGuestMode: () => {
        set({ isAuthenticated: false, user: null, session: null, status: "idle" });
      },
      signUp: async (email: string, password: string, name?: string) => {
        try {
          if (!hasSupabaseEnv()) {
            return { success: false, message: "Credenciais Supabase ainda não configuradas." };
          }
          const client = getSupabaseClient();
          const result = await client.auth.signUp({
            email,
            password,
            options: { data: { name: name ?? "" } },
          });
          if (result.error) {
            const t = translateAuthError(result.error.message);
            return { success: false, message: t.message, code: t.code };
          }
          
          const isPending = !result.data.session && result.data.user;

          if (result.data.user) {
            await client.from("profiles").upsert({
              id: result.data.user.id,
              email,
              name: name ?? "",
              created_at: new Date().toISOString(),
            });
          }
          
          set({
            isAuthenticated: Boolean(result.data.session && result.data.user),
            session: mapSession(result.data.session),
            user: mapUser(result.data.user),
            status: isPending ? "pending_confirmation" : (result.data.session ? "authenticated" : "idle"),
          });
          return { success: true };
        } catch (error) {
          console.error("[authStore.signUp]", error);
          return { success: false, message: "Não foi possível criar a conta agora." };
        }
      },
      hydrateAuth: async () => {
        set({ status: "loading" });

        try {
          if (!hasSupabaseEnv()) {
            set({ isAuthenticated: false, user: null, session: null, status: "idle" });
            return;
          }

          const [session, user] = await Promise.all([getCurrentSession(), getCurrentUser()]);
          set({
            isAuthenticated: Boolean(session && user),
            session: mapSession(session),
            user: mapUser(user),
            status: session && user ? "authenticated" : "idle",
          });

          const mapped = mapUser(user);
          if (mapped?.id) {
            void usePremiumStore.getState().refreshAIUsage(mapped.id);
          }
        } catch (error) {
          console.error("[authStore.hydrateAuth]", error);
          set({ isAuthenticated: false, user: null, session: null, status: "idle" });
        }
      },
      signIn: async (email: string, password: string) => {
        try {
          if (!hasSupabaseEnv()) {
            set({ isAuthenticated: false, user: null, session: null, status: "idle" });
            return { success: false, message: "Login indisponível neste build. Configure Supabase e gere um novo Dev Build." };
          }

          const client = getSupabaseClient();
          const result = await client.auth.signInWithPassword({ email, password });

          if (result.error) {
            const t = translateAuthError(result.error.message);
            return { success: false, message: t.message, code: t.code };
          }

          if (result.data.user) {
            await client.from("profiles").upsert({
              id: result.data.user.id,
              email: result.data.user.email ?? email,
              name: result.data.user.user_metadata?.name ?? "",
              updated_at: new Date().toISOString(),
            });
          }
          set({
            isAuthenticated: Boolean(result.data.session && result.data.user),
            session: mapSession(result.data.session),
            user: mapUser(result.data.user),
            status: result.data.session && result.data.user ? "authenticated" : "idle",
          });

          const mapped = mapUser(result.data.user);
          if (mapped?.id) {
            void usePremiumStore.getState().refreshAIUsage(mapped.id);
          }

          return { success: true };
        } catch (error) {
          console.error("[authStore.signIn]", error);
          set({ isAuthenticated: false, user: null, session: null, status: "idle" });
          const t = translateAuthError(String((error as any)?.message ?? "network"));
          return { success: false, message: t.message, code: t.code };
        }
      },
      resendConfirmation: async (email: string) => {
        try {
          if (!hasSupabaseEnv()) return { success: false, message: "Supabase não configurado." };
          const client = getSupabaseClient();
          const { error } = await client.auth.resend({ type: "signup", email });
          if (error) {
            const t = translateAuthError(error.message);
            return { success: false, message: t.message };
          }
          return { success: true };
        } catch {
          return { success: false, message: "Não foi possível reenviar agora." };
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
        }

        set({ isAuthenticated: false, user: null, session: null, status: "guest" });
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
            const { error } = await client.from("profiles").upsert({
              id: user.id,
              ...updates,
              updated_at: new Date().toISOString(),
            });
            if (error) throw error;
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
        } catch (error) {
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
        } catch (error) {
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
