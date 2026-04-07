import "react-native-url-polyfill/auto";

import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

import { env, hasSupabaseEnv } from "@/src/constants/env";
import { storage } from "@/src/infra/mmkv";

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
