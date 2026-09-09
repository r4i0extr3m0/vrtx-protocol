import "react-native-url-polyfill/auto";

import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

import { env, hasSupabaseEnv } from "@/src/constants/env";
import { storage } from "@/src/infra/mmkv";
import type { ClaimInviteResult, CoachClientLink, CoachClientListItem } from "@/src/types";

const AUTH_TOKEN_KEY = "vrtxprotocol.supabase.auth.token";

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
        "x-vrtxprotocol-mode": "offline-fallback",
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

export function getSupabaseFunctionUrl(functionName: string): string | null {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const baseUrl = env.supabaseUrl.replace(/\/+$/, "");
  const sanitizedName = functionName.replace(/^\/+/, "");
  return `${baseUrl}/functions/v1/${sanitizedName}`;
}

export function getSupabaseAnonKey(): string {
  return env.supabaseAnonKey;
}

export function clearPersistedAuthSession(): void {
  storage.remove(AUTH_TOKEN_KEY);
  cachedClient = null;
}

export function getPersistedAccessToken(): string | null {
  const raw = storage.getString(AUTH_TOKEN_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      access_token?: string;
      currentSession?: { access_token?: string };
    };

    if (typeof parsed.access_token === "string") {
      return parsed.access_token;
    }

    if (typeof parsed.currentSession?.access_token === "string") {
      return parsed.currentSession.access_token;
    }
  } catch (error) {
    console.warn("[supabase] Não foi possível ler o token persistido.", error);
  }

  return null;
}

// ------------------------------------------------------------------
// VRTX Coach: vínculo personal <-> aluno
// ------------------------------------------------------------------

export async function listCoachClients(): Promise<{ data?: CoachClientListItem[]; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("coach_clients")
      .select("id, client_id, invite_code, status, accepted_at, created_at")
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    const rows = (data ?? []) as {
      id: string;
      client_id?: string | null;
      invite_code: string;
      status: CoachClientLink["status"];
      accepted_at?: string | null;
      created_at: string;
    }[];
    const clientIds = rows
      .map((row) => row.client_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    let profiles: { id: string; name?: string | null; email?: string | null }[] = [];
    if (clientIds.length > 0) {
      const profileQuery = await client
        .from("profiles")
        .select("id, name, email")
        .in("id", clientIds);
      if (!profileQuery.error) {
        profiles = profileQuery.data ?? [];
      }
    }

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const items: CoachClientListItem[] = rows.map((row) => {
      const linkedProfile = row.client_id ? profileById.get(row.client_id) : undefined;
      return {
        linkId: row.id,
        clientId: row.client_id ?? null,
        name: linkedProfile?.name ?? "",
        email: linkedProfile?.email ?? "",
        status: row.status,
        inviteCode: row.invite_code,
        acceptedAt: row.accepted_at ?? null,
      };
    });

    return { data: items };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createCoachInvite(): Promise<{ code?: string; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc("b2b_create_invite");
    if (error) {
      return { error: error.message };
    }
    return { code: typeof data === "string" ? data : undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function claimCoachInvite(code: string): Promise<{ data?: ClaimInviteResult; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { error: "Informe o código do seu personal." };
    }

    const { data, error } = await client.rpc("b2b_claim_invite", { p_code: normalized });
    if (error) {
      return { error: error.message };
    }

    const raw = data as { coach_id?: string; coach_name?: string } | null;
    if (!raw?.coach_id) {
      return { error: "Não foi possível concluir o vínculo. Tente novamente." };
    }

    return {
      data: {
        coachId: raw.coach_id,
        coachName: raw.coach_name,
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function removeCoachClient(clientId: string): Promise<{ success?: boolean; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.rpc("b2b_remove_client", { p_client_id: clientId });
    if (error) {
      return { error: error.message };
    }
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function fetchMyCoach(): Promise<{ coachId?: string; coachName?: string; error?: string }> {
  if (!hasSupabaseEnv()) {
    return { error: "Supabase não configurado." };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("coach_clients")
      .select("id, coach_id, status")
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (!data?.coach_id) {
      return { coachId: undefined, coachName: undefined };
    }

    const profileQuery = await client
      .from("profiles")
      .select("name")
      .eq("id", data.coach_id as string)
      .maybeSingle();

    return {
      coachId: data.coach_id as string,
      coachName: profileQuery.error ? undefined : (profileQuery.data?.name as string | undefined),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
